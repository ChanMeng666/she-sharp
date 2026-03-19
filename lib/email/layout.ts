/**
 * Shared email layout system with She Sharp brand identity.
 * All email templates should use brandedEmailLayout() for consistent styling.
 */

export const BRAND = {
  purpleDark: '#9b2e83',
  purpleMid: '#c846ab',
  purpleLight: '#f7e5f3',
  periwinkle: '#8982ff',
  navyDark: '#1f1e44',
  mint: '#b1f6e9',
  successGreen: '#2e7d32',
  successBg: '#e8f5e9',
  warningOrange: '#e65100',
  warningBg: '#fff3e0',
  errorRed: '#d72f40',
} as const;

/**
 * Publicly hosted logo URLs for email templates.
 * Local paths don't work in emails — must be absolute public URLs.
 */
const LOGO_WHITE_URL = 'https://6r3qs9uxjugyi2m1.public.blob.vercel-storage.com/she-sharp/she-sharp-logo-white.png';
const LOGO_PURPLE_URL = 'https://6r3qs9uxjugyi2m1.public.blob.vercel-storage.com/she-sharp/she-sharp-logo-purple-dark-500x500.png';

/** Default contact email for all She Sharp emails */
const DEFAULT_CONTACT_EMAIL = 'mentoring@shesharp.org.nz';

/**
 * Purple CTA button
 */
export function brandButton(text: string, url: string): string {
  return `<div style="text-align: center; margin: 24px 0;">
    <a href="${url}" style="display: inline-block; padding: 14px 32px; background: ${BRAND.purpleDark}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">${text}</a>
  </div>`;
}

/**
 * Light purple info box
 */
export function infoBox(html: string): string {
  return `<div style="background: ${BRAND.purpleLight}; border-left: 4px solid ${BRAND.purpleDark}; padding: 16px 20px; border-radius: 0 6px 6px 0; margin: 16px 0;">
    ${html}
  </div>`;
}

/**
 * Invitation code display box
 */
export function codeBox(code: string, label?: string): string {
  return `<div style="background: ${BRAND.purpleLight}; border: 2px dashed ${BRAND.purpleDark}; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
    ${label ? `<p style="margin: 0 0 10px 0; color: #666;">${label}</p>` : ''}
    <div style="font-size: 24px; font-weight: bold; color: ${BRAND.purpleDark}; letter-spacing: 2px; font-family: monospace;">${code}</div>
  </div>`;
}

/**
 * Success badge pill
 */
export function successBadge(text: string): string {
  return `<div style="text-align: center; margin-bottom: 20px;">
    <span style="background: ${BRAND.successGreen}; color: white; padding: 8px 20px; border-radius: 20px; display: inline-block; font-size: 14px; font-weight: bold;">${text}</span>
  </div>`;
}

/**
 * Warning/urgency box with orange theme
 */
export function warningBox(html: string): string {
  return `<div style="background: ${BRAND.warningBg}; border-left: 4px solid ${BRAND.warningOrange}; padding: 16px 20px; border-radius: 0 6px 6px 0; margin: 16px 0; color: #333;">
    ${html}
  </div>`;
}

/**
 * Link box for displaying URLs
 */
export function linkBox(url: string): string {
  return `<div style="background: ${BRAND.purpleLight}; padding: 12px; border-radius: 6px; word-break: break-all; margin: 10px 0;">
    <code style="font-size: 12px; color: ${BRAND.purpleDark};">${url}</code>
  </div>`;
}

/**
 * White card with border (for match details, membership details, etc.)
 */
export function detailsCard(html: string): string {
  return `<div style="background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
    ${html}
  </div>`;
}

/**
 * Score/position badge pill
 */
export function scoreBadge(text: string, color?: string): string {
  return `<span style="background: ${color || BRAND.successGreen}; color: white; padding: 5px 12px; border-radius: 15px; font-weight: bold; display: inline-block;">${text}</span>`;
}

/**
 * Shared branded email layout used by all She Sharp emails.
 *
 * Header: white logo text on purple gradient
 * Footer: navy background with purple circle logo + mint accent text
 */
export function brandedEmailLayout(options: {
  title: string;
  preheader?: string;
  bodyHtml: string;
  footerExtra?: string;
  contactEmail?: string;
}): string {
  const { title, preheader, bodyHtml, footerExtra, contactEmail = DEFAULT_CONTACT_EMAIL } = options;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - She Sharp</title>
  ${preheader ? `<!--[if !mso]><!--><div style="display:none;max-height:0;overflow:hidden;">${preheader}</div><!--<![endif]-->` : ''}
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${BRAND.purpleDark}, #6b1d5e); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <img src="${LOGO_WHITE_URL}" alt="She Sharp" width="140" style="display: block; margin: 0 auto 16px; border: 0; outline: none;" />
      <h1 style="margin: 0; font-size: 24px; font-weight: bold;">${title}</h1>
    </div>

    <!-- Body -->
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
      ${bodyHtml}
    </div>

    <!-- Footer -->
    <div style="background: ${BRAND.navyDark}; color: rgba(255,255,255,0.8); padding: 30px; text-align: center; border-radius: 0 0 10px 10px; font-size: 13px;">
      <img src="${LOGO_PURPLE_URL}" alt="She Sharp" width="48" height="48" style="display: block; margin: 0 auto 12px; border: 0; outline: none; border-radius: 50%;" />
      <p style="color: ${BRAND.mint}; font-weight: bold; margin: 0 0 8px 0; font-size: 14px;">Empowering women in STEM</p>
      <p style="margin: 0 0 4px 0;">&copy; ${year} She Sharp. All rights reserved.</p>
      <p style="margin: 0;">Questions? <a href="mailto:${contactEmail}" style="color: ${BRAND.mint}; text-decoration: underline;">${contactEmail}</a></p>
      ${footerExtra ? `<div style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 12px;">${footerExtra}</div>` : ''}
    </div>
  </div>
</body>
</html>`;
}
