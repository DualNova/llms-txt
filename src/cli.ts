#!/usr/bin/env node
/**
 * CLI for @dualnova/llms-txt.
 *
 *   llms-txt validate [path]           Validate a local file or a URL.
 *   llms-txt validate --url <url>      Validate a remote llms.txt.
 *   llms-txt --help
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateLlmsTxt } from './validator.js';

const HELP = `@dualnova/llms-txt — parse, validate and build /llms.txt files

Usage:
  llms-txt validate [path]          Validate a local llms.txt file (default: ./llms.txt)
  llms-txt validate --url <url>     Fetch and validate a remote llms.txt
  llms-txt --help                   Show this help
  llms-txt --version                Show the installed version

Exit codes:
  0  No errors. Warnings may still be printed.
  1  Validation errors found, or invalid CLI arguments.
  2  Could not read the file or fetch the URL.

Built by DualNova — https://dualnova.org
`;

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  dim: '\x1b[2m',
};

function colorize(severity: 'error' | 'warning' | 'info'): string {
  switch (severity) {
    case 'error':
      return `${COLORS.red}ERROR${COLORS.reset}`;
    case 'warning':
      return `${COLORS.yellow}WARN${COLORS.reset}`;
    case 'info':
      return `${COLORS.blue}INFO${COLORS.reset}`;
  }
}

async function loadSource(args: string[]): Promise<{ source: string; origin: string }> {
  const urlFlag = args.indexOf('--url');
  if (urlFlag !== -1) {
    const url = args[urlFlag + 1];
    if (!url) throw new Error('--url requires a value');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    return { source: await res.text(), origin: url };
  }

  const path = args.find((a) => !a.startsWith('-')) ?? './llms.txt';
  const resolved = resolve(process.cwd(), path);
  return { source: readFileSync(resolved, 'utf8'), origin: resolved };
}

async function cmdValidate(args: string[]): Promise<number> {
  let payload: { source: string; origin: string };
  try {
    payload = await loadSource(args);
  } catch (error: unknown) {
    process.stderr.write(`${COLORS.red}Could not read source:${COLORS.reset} ${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }

  const result = validateLlmsTxt(payload.source);

  process.stdout.write(`Validating ${COLORS.dim}${payload.origin}${COLORS.reset}\n`);
  process.stdout.write(`  Title:        ${result.parsed.title || COLORS.dim + '(missing)' + COLORS.reset}\n`);
  process.stdout.write(`  Description:  ${result.parsed.description || COLORS.dim + '(missing)' + COLORS.reset}\n`);
  process.stdout.write(`  Sections:     ${String(result.parsed.sections.length)}\n`);
  const totalLinks = result.parsed.sections.reduce((sum, s) => sum + s.links.length, 0);
  process.stdout.write(`  Links:        ${String(totalLinks)}\n\n`);

  if (result.issues.length === 0) {
    process.stdout.write(`${COLORS.green}✓ No issues.${COLORS.reset}\n`);
    return 0;
  }

  for (const issue of result.issues) {
    const loc = issue.at ? `${COLORS.dim} (${issue.at})${COLORS.reset}` : '';
    process.stdout.write(`  ${colorize(issue.severity)}  ${issue.message}${loc}\n`);
  }

  const errors = result.issues.filter((i) => i.severity === 'error').length;
  const warnings = result.issues.filter((i) => i.severity === 'warning').length;
  process.stdout.write(`\n${result.valid ? COLORS.green + '✓' : COLORS.red + '✗'} ${errors} error(s), ${warnings} warning(s)${COLORS.reset}\n`);

  return result.valid ? 0 : 1;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    process.stdout.write(HELP);
    process.exit(0);
  }

  if (args[0] === '--version' || args[0] === '-V') {
    // Lazily read package.json so the CLI does not bundle it.
    const pkgUrl = new URL('../package.json', import.meta.url);
    const pkg = JSON.parse(readFileSync(pkgUrl, 'utf8')) as { version: string };
    process.stdout.write(`${pkg.version}\n`);
    process.exit(0);
  }

  switch (args[0]) {
    case 'validate':
      process.exit(await cmdValidate(args.slice(1)));
      break;
    default:
      process.stderr.write(`Unknown command: ${args[0]}\n\n${HELP}`);
      process.exit(1);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${COLORS.red}Unexpected error:${COLORS.reset} ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(2);
});
