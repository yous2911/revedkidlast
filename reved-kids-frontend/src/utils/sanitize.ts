import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * @param dirty The HTML content to sanitize.
 * @returns The sanitized HTML content.
 */
export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty);
};

/**
 * Sanitizes a string to remove any potentially malicious characters.
 * @param input The string to sanitize.
 * @returns The sanitized string.
 */
export const sanitizeString = (input: string): string => {
  const element = document.createElement('div');
  element.innerText = input;
  return element.innerHTML;
};
