/**
 * Parser for the llms.txt format (https://llmstxt.org).
 *
 * The format is intentionally simple Markdown:
 *
 *   # Title
 *   > Short description (one paragraph)
 *
 *   Optional free-form paragraphs.
 *
 *   ## Section heading
 *   - [Link title](url): optional description
 *   - [Another](url)
 *
 * Anything that does not match the above shape is preserved as freeform
 * markdown in the corresponding section.
 */

export interface LlmsLink {
  /** The visible text of the link. */
  title: string;
  /** The URL the link points to. */
  url: string;
  /** Optional description that followed `: ` on the same line. */
  description?: string;
}

export interface LlmsSection {
  /** The section heading text (without leading `##`). */
  heading: string;
  /** Markdown-style links found under this section. */
  links: LlmsLink[];
  /** Any non-link markdown content under the heading, joined with newlines. */
  freeform: string;
}

export interface ParsedLlmsTxt {
  /** The H1 title — typically the site/product name. */
  title: string;
  /** The blockquote description that appears right after the title. */
  description?: string;
  /** Free-form paragraphs between the description and the first section. */
  intro: string;
  /** H2 sections. */
  sections: LlmsSection[];
}

const LINK_RE = /^-\s*\[([^\]]+)\]\(([^)]+)\)(?::\s*(.+))?$/;

/**
 * Parse the contents of an llms.txt file.
 *
 * Whitespace and blank lines are normalized. The parser is tolerant: missing
 * title, description, or sections do not throw — the caller can use
 * {@link validateLlmsTxt} to surface issues.
 */
export function parseLlmsTxt(source: string): ParsedLlmsTxt {
  const lines = source.split(/\r?\n/);
  let title = '';
  let description: string | undefined;
  const introBuffer: string[] = [];
  const sections: LlmsSection[] = [];
  let current: LlmsSection | undefined;
  let titleSeen = false;
  let descriptionSeen = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // H1: site title (first one wins).
    if (!titleSeen && /^#\s+/.test(line)) {
      title = line.replace(/^#\s+/, '').trim();
      titleSeen = true;
      continue;
    }

    // Blockquote description (first one wins, must appear before any H2).
    if (!descriptionSeen && current === undefined && /^>\s*/.test(line)) {
      description = line.replace(/^>\s*/, '').trim();
      descriptionSeen = true;
      continue;
    }

    // H2: open a new section.
    if (/^##\s+/.test(line)) {
      current = {
        heading: line.replace(/^##\s+/, '').trim(),
        links: [],
        freeform: '',
      };
      sections.push(current);
      continue;
    }

    // Inside a section: try to parse a link line.
    if (current) {
      const match = line.match(LINK_RE);
      if (match) {
        const [, linkTitle, url, desc] = match;
        const link: LlmsLink = {
          title: linkTitle!.trim(),
          url: url!.trim(),
        };
        if (desc) link.description = desc.trim();
        current.links.push(link);
      } else if (line.length > 0) {
        current.freeform += (current.freeform ? '\n' : '') + line;
      }
      continue;
    }

    // Pre-section freeform (between description and first H2).
    if (line.length > 0) {
      introBuffer.push(line);
    }
  }

  return {
    title,
    description,
    intro: introBuffer.join('\n').trim(),
    sections,
  };
}
