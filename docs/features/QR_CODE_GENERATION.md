# QR Code Generation Guide

This guide covers how to generate QR codes for She Sharp deployment pages, supporting both web display and high-resolution print output.

## Architecture

| Component | Purpose |
|-----------|---------|
| `lib/data/qr-codes.ts` | Predefined QR code targets config |
| `app/api/qr/route.ts` | Server-side QR image generation API |
| `components/ui/qr-code.tsx` | Reusable React component for web display |

## Dependencies

- **`qrcode.react`** — Client-side SVG rendering (web display)
- **`qrcode`** — Server-side PNG/SVG generation (API + scripts)
- **`@resvg/resvg-js`** — SVG-to-PNG conversion (dev dependency, for branded print assets)

## 1. Using the React Component

For embedding QR codes in web pages:

```tsx
import { QRCodeDisplay } from '@/components/ui/qr-code';

<QRCodeDisplay
  url="https://she-sharp-zeta.vercel.app/mentorship/mentee/apply?programme=her-waka"
  size={256}
  label="Scan to apply"
  showDownload
  downloadFilename="she-sharp-her-waka-apply"
  logoSrc="/logos/she-sharp-logo-purple-dark-500x500.png"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `url` | `string` | required | Full URL to encode |
| `size` | `number` | `200` | Display size in pixels |
| `label` | `string` | — | Text below the QR code |
| `showDownload` | `boolean` | `false` | Show PNG/SVG download buttons |
| `downloadFilename` | `string` | `"qr-code"` | Download filename (no extension) |
| `logoSrc` | `string` | — | Center logo image path |
| `className` | `string` | — | Additional CSS classes |

The download buttons fetch high-resolution (1024px) images from `/api/qr`.

## 2. Using the API Endpoint

For programmatic QR code generation:

```
GET /api/qr?url=<encoded-url>&format=png|svg&size=256-2048&color=9b2e83
```

### Parameters

| Param | Default | Description |
|-------|---------|-------------|
| `url` | required | URL to encode (must be valid) |
| `format` | `png` | Output format: `png` or `svg` |
| `size` | `512` | Image size in pixels (256–2048) |
| `color` | `#9b2e83` | Foreground color (hex without `#` prefix) |

### Response

- `Content-Type: image/png` or `image/svg+xml`
- `Cache-Control: public, max-age=86400`
- Error correction level: H (30%, supports logo overlay)

## 3. Generating Branded Print Assets

For posters, flyers, and other print materials, use the Node.js script approach to create a branded SVG first, then convert to high-resolution PNG.

### Step 1: Generate branded SVG

```js
const QRCode = require('qrcode');
const fs = require('fs');

const url = 'https://she-sharp-zeta.vercel.app/mentorship/mentee/apply?programme=her-waka';
const logoSvg = fs.readFileSync('public/logos/she-sharp-logo-purple-dark-130x130.svg', 'utf8');
const logoContent = logoSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');

QRCode.toString(url, {
  type: 'svg',
  errorCorrectionLevel: 'H',
  margin: 0,
  width: 300,
  color: { dark: '#9b2e83', light: '#ffffff' }
}).then(qrSvg => {
  const qrContent = qrSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
  const viewBoxMatch = qrSvg.match(/viewBox="([^"]+)"/);
  const qrModules = parseInt(viewBoxMatch[1].split(' ')[2]);

  // Canvas layout constants
  const canvasW = 480, canvasH = 600;
  const qrSize = 340, qrX = (canvasW - qrSize) / 2, qrY = 100;
  const logoSize = 64;
  const logoCenterX = qrX + qrSize / 2, logoCenterY = qrY + qrSize / 2;

  const finalSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}">
  <!-- Background -->
  <rect width="${canvasW}" height="${canvasH}" rx="24" fill="#ffffff"/>
  <!-- Top accent bar -->
  <rect width="${canvasW}" height="6" rx="3" fill="#9b2e83"/>
  <!-- Title -->
  <text x="${canvasW / 2}" y="52" text-anchor="middle"
        font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="700"
        fill="#9b2e83">YOUR TITLE HERE</text>
  <!-- Subtitle -->
  <text x="${canvasW / 2}" y="78" text-anchor="middle"
        font-family="Inter, system-ui, sans-serif" font-size="14"
        fill="#64748b">Your subtitle here</text>
  <!-- QR code container -->
  <rect x="${qrX - 12}" y="${qrY - 12}" width="${qrSize + 24}" height="${qrSize + 24}"
        rx="16" fill="white" stroke="#f1e6ef"/>
  <!-- QR code (use nested svg, NOT g with clip-path + transform) -->
  <svg x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}"
       viewBox="0 0 ${qrModules} ${qrModules}" overflow="hidden">
    ${qrContent}
  </svg>
  <!-- Logo background circle -->
  <circle cx="${logoCenterX}" cy="${logoCenterY}" r="${logoSize / 2 + 6}" fill="white"/>
  <!-- Logo -->
  <g transform="translate(${logoCenterX - logoSize / 2}, ${logoCenterY - logoSize / 2}) scale(${logoSize / 130})">
    ${logoContent}
  </g>
  <!-- Call to action -->
  <text x="${canvasW / 2}" y="${qrY + qrSize + 42}" text-anchor="middle"
        font-family="Inter, system-ui, sans-serif" font-size="17" font-weight="600"
        fill="#1e293b">Scan to Apply Now</text>
  <!-- URL hint -->
  <text x="${canvasW / 2}" y="${qrY + qrSize + 72}" text-anchor="middle"
        font-family="Inter, system-ui, sans-serif" font-size="11"
        fill="#94a3b8">she-sharp-zeta.vercel.app/your/path</text>
  <!-- Bottom branding -->
  <line x1="140" y1="${canvasH - 52}" x2="${canvasW - 140}" y2="${canvasH - 52}" stroke="#f1e6ef"/>
  <text x="${canvasW / 2}" y="${canvasH - 24}" text-anchor="middle"
        font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="600"
        fill="#9b2e83">She Sharp</text>
  <text x="${canvasW / 2}" y="${canvasH - 9}" text-anchor="middle"
        font-family="Inter, system-ui, sans-serif" font-size="10"
        fill="#94a3b8">Bridging the gender gap in STEM</text>
</svg>`;

  fs.writeFileSync('public/qr-output.svg', finalSvg);
});
```

### Step 2: Convert SVG to high-resolution PNG

```js
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');

const svg = fs.readFileSync('public/qr-output.svg', 'utf8');
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 2048 },
  font: { loadSystemFonts: true },
});
const pngBuffer = resvg.render().asPng();
fs.writeFileSync('public/qr-output.png', pngBuffer);
```

## 4. Adding New QR Code Targets

Edit `lib/data/qr-codes.ts` to add predefined targets:

```ts
{
  id: 'your-target-id',
  label: 'Display Label',
  path: '/your/page/path',
  queryParams: { key: 'value' },       // optional
  defaultFilename: 'she-sharp-your-target',
}
```

Use `buildTargetUrl(baseUrl, target)` to construct the full URL from a target config.

## Important Notes

- **Error correction level H** (30%): Required for center logo overlay while maintaining scan reliability.
- **Brand color `#9b2e83`**: Sufficient contrast on white background for reliable scanning.
- **Nested `<svg>` for QR embedding**: Always use `<svg x y width height viewBox>` instead of `<g transform clip-path>` when embedding QR paths in a composed SVG. The `clip-path` + `transform` combination causes rendering issues in browsers.
- **URL construction**: The component accepts full URLs directly. Callers should use `getBaseUrl()` from `lib/email/service.ts` when building URLs programmatically.
- **Print assets**: For print use, generate at 2048px+ width. The API endpoint caps at 2048px; use the `@resvg/resvg-js` script approach for larger sizes.

## Existing Assets

| File | Format | Size | Target |
|------|--------|------|--------|
| `public/qr-her-waka-apply.svg` | SVG | 480x600 | HER WAKA mentee application |
| `public/qr-her-waka-apply.png` | PNG | 2048x2560 | HER WAKA mentee application (print) |
