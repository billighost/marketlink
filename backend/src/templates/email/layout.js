/**
 * Shared email layout and plain-text extractor.
 * Adheres strictly to HTML email compatibility standards (tables, inline styles, Outlook-safe).
 */

import { env } from '../../config/env.js';

/**
 * Strips HTML tags and normalizes whitespace for clean plain-text email fallbacks.
 *
 * @param {string} html
 * @returns {string}
 */
export function htmlToPlainText(html) {
  if (!html || typeof html !== 'string') return '';

  return html
    // Convert links: <a href="url">text</a> -> text (url)
    .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    // Convert line breaks and paragraph breaks
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    // Remove all remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode common entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Collapse multi-newlines into at most two
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Wraps body HTML inside the standard MarketLink branded email container.
 *
 * @param {object} params
 * @param {string} params.title - Preheader / headline
 * @param {string} params.bodyHtml - Inner content markup
 * @returns {string} Fully structured HTML document
 */
export function wrapLayout({ title, bodyHtml }) {
  const baseUrl = env.APP_BASE_URL || 'http://localhost:3000';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'MarketLink'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5EFE3; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F5EFE3; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container (max-width 480px) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: #FFFFFF; border-radius: 8px; border: 1px solid #E3D3B8; overflow: hidden; box-shadow: 0 2px 6px rgba(46, 43, 38, 0.06);">
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background-color: #7A2E3B; padding: 28px 24px; border-bottom: 2px solid #5E212B;">
              <a href="${baseUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 400; color: #FFF7F2; letter-spacing: 0.5px; line-height: 1.2;">MarketLink</span>
              </a>
              <div style="font-size: 12px; color: #F7EEF0; margin-top: 6px; letter-spacing: 0.2px;">Local harvests & community pre-orders</div>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 32px 28px; color: #2E2B26; font-size: 15px; line-height: 1.6;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 20px 24px; background-color: #FAF7F0; border-top: 1px solid #E3D3B8; font-size: 12px; color: #6B6259; line-height: 1.5;">
              <p style="margin: 0 0 8px 0;">MarketLink &bull; Fresh harvests from local growers you trust.</p>
              <p style="margin: 0;">Need help? <a href="${baseUrl}/contact" target="_blank" style="color: #7A2E3B; font-weight: 500; text-decoration: underline;">Contact support</a> or visit <a href="${baseUrl}" target="_blank" style="color: #7A2E3B; font-weight: 500; text-decoration: underline;">MarketLink</a>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
