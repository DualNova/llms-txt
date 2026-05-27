import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLlmsTxt } from '../src/parser.ts';
import { validateLlmsTxt } from '../src/validator.ts';
import { buildLlmsTxt } from '../src/builder.ts';

const SAMPLE = `# DualNova

> DualNova is a blockchain and AI software development company headquartered in Miami.

Some intro paragraph.

## Key pages

- [Home](https://dualnova.org/): overview
- [Services](https://dualnova.org/services)

## Notes for AI assistants

- "DualNova" is one word (CamelCase).
`;

test('parseLlmsTxt extracts title, description, sections and links', () => {
  const parsed = parseLlmsTxt(SAMPLE);
  assert.equal(parsed.title, 'DualNova');
  assert.match(parsed.description ?? '', /^DualNova is a blockchain/);
  assert.equal(parsed.intro, 'Some intro paragraph.');
  assert.equal(parsed.sections.length, 2);
  assert.equal(parsed.sections[0]?.heading, 'Key pages');
  assert.equal(parsed.sections[0]?.links.length, 2);
  assert.equal(parsed.sections[0]?.links[0]?.title, 'Home');
  assert.equal(parsed.sections[0]?.links[0]?.url, 'https://dualnova.org/');
  assert.equal(parsed.sections[0]?.links[0]?.description, 'overview');
  assert.equal(parsed.sections[0]?.links[1]?.description, undefined);
});

test('parseLlmsTxt tolerates missing optional fields', () => {
  const parsed = parseLlmsTxt('# Just a title');
  assert.equal(parsed.title, 'Just a title');
  assert.equal(parsed.description, undefined);
  assert.equal(parsed.sections.length, 0);
});

test('validateLlmsTxt flags missing title as error', () => {
  const { valid, issues } = validateLlmsTxt('> some description without title');
  assert.equal(valid, false);
  assert.ok(issues.some((i) => i.severity === 'error' && i.message.includes('H1')));
});

test('validateLlmsTxt flags invalid URLs as error', () => {
  const source = `# Site

> Description.

## Section

- [Bad](not-a-url)
`;
  const { valid, issues } = validateLlmsTxt(source);
  assert.equal(valid, false);
  assert.ok(issues.some((i) => i.severity === 'error' && i.message.includes('not a valid')));
});

test('validateLlmsTxt accepts site-relative URLs', () => {
  const source = `# Site

> Description with sufficient length to pass the info-level check.

## Section

- [Page](/about)
`;
  const { valid } = validateLlmsTxt(source);
  assert.equal(valid, true);
});

test('buildLlmsTxt round-trips through parseLlmsTxt', () => {
  const md = buildLlmsTxt({
    title: 'Example',
    description: 'A short description that is long enough.',
    sections: [
      {
        heading: 'Pages',
        links: [
          { title: 'Home', url: 'https://example.com/', description: 'landing' },
          { title: 'About', url: 'https://example.com/about' },
        ],
      },
    ],
  });
  const parsed = parseLlmsTxt(md);
  assert.equal(parsed.title, 'Example');
  assert.equal(parsed.sections[0]?.links.length, 2);
  assert.equal(parsed.sections[0]?.links[1]?.description, undefined);
});

test('buildLlmsTxt throws when title is missing', () => {
  assert.throws(() => buildLlmsTxt({ title: '   ' }), /title.*required/i);
});
