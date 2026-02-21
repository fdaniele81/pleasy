import DOMPurify from 'dompurify';

DOMPurify.setConfig({
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'hr', 'a',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'class', 'style', 'colspan', 'rowspan',
    'colwidth', 'data-*'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
});

const sanitizeTiptapContent = (content) => {
  if (!content) return content;

  if (typeof content === 'object') {
    const sanitizeNode = (node) => {
      if (!node) return node;

      if (node.text && typeof node.text === 'string') {
        node.text = DOMPurify.sanitize(node.text, { ALLOWED_TAGS: [] });
      }

      if (node.marks) {
        node.marks = node.marks.map(mark => {
          if (mark.type === 'link' && mark.attrs?.href) {
            const sanitizedHref = DOMPurify.sanitize(mark.attrs.href);
            if (!sanitizedHref.match(/^(https?:|mailto:)/i)) {
              mark.attrs.href = '#';
            }
          }
          return mark;
        });
      }

      if (node.content && Array.isArray(node.content)) {
        node.content = node.content.map(sanitizeNode);
      }

      return node;
    };

    return sanitizeNode(JSON.parse(JSON.stringify(content)));
  }

  return content;
};

export { DOMPurify, sanitizeTiptapContent };
