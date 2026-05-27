/**
 * Builder for llms.txt files — produces a well-formed Markdown string from a
 * typed input object. Use this in build pipelines to generate llms.txt from
 * site content (sitemap, CMS, MDX frontmatter, etc.) instead of hand-editing.
 */

import type { LlmsSection, LlmsLink } from './parser.js';

export interface BuildOptions {
  /** H1 title of the file (typically the brand or product name). */
  title: string;
  /** One-sentence summary that becomes the blockquote line. */
  description?: string;
  /** Free-form paragraphs between the description and the first section. */
  intro?: string;
  /** Ordered list of sections to render as H2 blocks. */
  sections?: Array<Partial<LlmsSection> & { heading: string }>;
}

function renderLink(link: LlmsLink): string {
  const base = `- [${link.title}](${link.url})`;
  return link.description ? `${base}: ${link.description}` : base;
}

/**
 * Build a Markdown string in the llms.txt format from the given options.
 * The output ends with a trailing newline.
 */
export function buildLlmsTxt(options: BuildOptions): string {
  const out: string[] = [];

  if (!options.title?.trim()) {
    throw new Error('buildLlmsTxt: "title" is required.');
  }

  out.push(`# ${options.title.trim()}`);

  if (options.description?.trim()) {
    out.push('');
    out.push(`> ${options.description.trim()}`);
  }

  if (options.intro?.trim()) {
    out.push('');
    out.push(options.intro.trim());
  }

  if (options.sections) {
    for (const section of options.sections) {
      out.push('');
      out.push(`## ${section.heading.trim()}`);

      if (section.freeform?.trim()) {
        out.push('');
        out.push(section.freeform.trim());
      }

      const links = section.links ?? [];
      if (links.length > 0) {
        out.push('');
        for (const link of links) {
          out.push(renderLink(link));
        }
      }
    }
  }

  return out.join('\n') + '\n';
}
