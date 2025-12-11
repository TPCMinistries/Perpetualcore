import DOMPurify from "dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks.
 * This should only be called on the client side.
 *
 * @param dirty - The untrusted HTML string to sanitize
 * @param options - Optional DOMPurify configuration
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(
  dirty: string,
  options?: DOMPurify.Config
): string {
  // Return empty string for falsy values
  if (!dirty) return "";

  // Default config - allows common HTML tags but strips dangerous ones
  const defaultConfig: DOMPurify.Config = {
    // Allow common formatting tags
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "ul", "ol", "li",
      "strong", "em", "b", "i", "u", "s", "strike",
      "a", "img",
      "blockquote", "pre", "code",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span",
      "sup", "sub",
    ],
    // Allow safe attributes
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "class", "id",
      "target", "rel",
      "width", "height",
      "colspan", "rowspan",
    ],
    // Force all links to open in new tab with security measures
    ADD_ATTR: ["target", "rel"],
    // Forbid javascript: and data: URLs
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  };

  const config = options ? { ...defaultConfig, ...options } : defaultConfig;

  // Run DOMPurify sanitization
  const clean = DOMPurify.sanitize(dirty, config);

  return clean;
}

/**
 * Sanitize HTML and also ensure external links have proper security attributes.
 * Adds rel="noopener noreferrer" and target="_blank" to external links.
 */
export function sanitizeHtmlWithSafeLinks(dirty: string): string {
  const clean = sanitizeHtml(dirty);

  // Post-process to ensure all anchor tags have safe attributes
  // This is handled during sanitization but we double-check here
  if (typeof window !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(clean, "text/html");

    doc.querySelectorAll("a").forEach((link) => {
      const href = link.getAttribute("href");
      // Check if it's an external link
      if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    });

    return doc.body.innerHTML;
  }

  return clean;
}

/**
 * Strict sanitization - only allows text formatting, no links or images.
 * Use this for user-generated content where you want minimal HTML.
 */
export function sanitizeHtmlStrict(dirty: string): string {
  return sanitizeHtml(dirty, {
    ALLOWED_TAGS: [
      "p", "br",
      "strong", "em", "b", "i", "u",
      "ul", "ol", "li",
    ],
    ALLOWED_ATTR: [],
  });
}
