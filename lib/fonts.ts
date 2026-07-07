/**
 * She Sharp Editorial — typography source of truth.
 *
 * - Bricolage Grotesque: display + headings (--font-heading)
 * - Instrument Sans: body / UI (--font-sans)
 * - Carattere: brand script accent (--font-brand-script)
 *
 * Applied as CSS variables on <html> in app/layout.tsx and mapped in
 * app/globals.css @theme.
 */
import { Bricolage_Grotesque, Instrument_Sans, Carattere } from 'next/font/google';

export const heading = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-heading',
  display: 'swap',
});

export const sans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

export const brandScript = Carattere({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-brand-script',
  display: 'swap',
});
