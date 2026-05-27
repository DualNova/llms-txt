/**
 * @dualnova/llms-txt — parse, validate and build /llms.txt files.
 *
 * The llms.txt standard (https://llmstxt.org) is an emerging convention that
 * publishes a Markdown summary of a site at /llms.txt, helping AI crawlers
 * and assistants (ChatGPT, Perplexity, Claude, Gemini) discover the most
 * important content quickly.
 *
 * NOTE on impact: as of 2026-05, primary sources (Google's Mueller & Illyes,
 * SE Ranking 300k-domain study, OtterlyAI server-log audit) report that no
 * major AI search engine currently uses llms.txt as a citation-ranking
 * signal. The file is still worth publishing as a low-cost, declarative
 * statement of intent that may be adopted as the standard matures.
 */

export { parseLlmsTxt } from './parser.js';
export type { ParsedLlmsTxt, LlmsSection, LlmsLink } from './parser.js';

export { validateLlmsTxt } from './validator.js';
export type { ValidationIssue, ValidationResult } from './validator.js';

export { buildLlmsTxt } from './builder.js';
export type { BuildOptions } from './builder.js';
