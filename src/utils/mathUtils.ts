import katex from 'katex';

/**
 * Parses a HTML string and replaces LaTeX delimiters with rendered KaTeX HTML.
 * Supports:
 * - Block math: $$ ... $$
 * - Inline math: \( ... \)
 */
export function renderMathInHtml(html: string): string {
    if (!html) return '';

    // Replace block math $$...$$
    let processed = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
        try {
            return katex.renderToString(latex, { displayMode: true, throwOnError: false });
        } catch (e) {
            console.error('KaTeX error:', e);
            return match;
        }
    });

    // Replace inline math \(...\)
    processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (match, latex) => {
        try {
            return katex.renderToString(latex, { displayMode: false, throwOnError: false });
        } catch (e) {
            return match;
        }
    });

    return processed;
}
