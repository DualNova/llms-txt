/**
 * Validator for parsed llms.txt files.
 *
 * The validator surfaces issues but never throws. Callers can decide whether
 * to treat warnings as fatal in their build pipelines.
 */

import { parseLlmsTxt, type ParsedLlmsTxt } from './parser.js';

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  /** Optional path-like locator (e.g. "sections[2].links[0]"). */
  at?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  parsed: ParsedLlmsTxt;
}

const URL_RE = /^https?:\/\/[^\s]+$/i;
// Allow site-relative URLs too — common in llms.txt examples.
const RELATIVE_URL_RE = /^\/[^\s]*$/;

/**
 * Validate an llms.txt source string. Returns the parsed structure along with
 * a list of issues. The function never throws on malformed input.
 */
export function validateLlmsTxt(source: string): ValidationResult {
  const parsed = parseLlmsTxt(source);
  const issues: ValidationIssue[] = [];

  if (!parsed.title) {
    issues.push({
      severity: 'error',
      message: 'Missing H1 title at the top of the file (expected "# Site name").',
    });
  } else if (parsed.title.length > 80) {
    issues.push({
      severity: 'warning',
      message: 'Title is unusually long (>80 chars) — consider shortening for citability.',
      at: 'title',
    });
  }

  if (!parsed.description) {
    issues.push({
      severity: 'warning',
      message:
        'Missing blockquote description (expected "> Short description") right after the H1. AI assistants use this line as the canonical summary.',
    });
  } else if (parsed.description.length < 40) {
    issues.push({
      severity: 'info',
      message: 'Description is short (<40 chars) — a one-sentence summary works better.',
      at: 'description',
    });
  }

  if (parsed.sections.length === 0) {
    issues.push({
      severity: 'warning',
      message: 'No H2 sections found. Even a single "## Key pages" list is useful to crawlers.',
    });
  }

  parsed.sections.forEach((section, sectionIdx) => {
    if (section.links.length === 0 && section.freeform.length === 0) {
      issues.push({
        severity: 'warning',
        message: `Section "${section.heading}" has no links and no content.`,
        at: `sections[${sectionIdx}]`,
      });
    }

    section.links.forEach((link, linkIdx) => {
      const at = `sections[${sectionIdx}].links[${linkIdx}]`;
      if (!link.title.trim()) {
        issues.push({ severity: 'error', message: 'Link title is empty.', at });
      }
      if (!URL_RE.test(link.url) && !RELATIVE_URL_RE.test(link.url)) {
        issues.push({
          severity: 'error',
          message: `Link URL is not a valid http(s) or site-relative URL: "${link.url}".`,
          at,
        });
      }
    });
  });

  const valid = issues.every((i) => i.severity !== 'error');
  return { valid, issues, parsed };
}
