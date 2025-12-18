# PWA Icons Required

To complete the PWA setup, you need to create the following icon files in this directory:

## Required Icons

| Filename | Size | Purpose |
|----------|------|---------|
| `icon-72.png` | 72x72 | Android splash |
| `icon-96.png` | 96x96 | Android splash |
| `icon-128.png` | 128x128 | Chrome Web Store |
| `icon-144.png` | 144x144 | MS tiles |
| `icon-152.png` | 152x152 | iOS |
| `icon-192.png` | 192x192 | Android home screen |
| `icon-384.png` | 384x384 | Android splash |
| `icon-512.png` | 512x512 | Android splash, PWA install |

## Optional Icons

| Filename | Size | Purpose |
|----------|------|---------|
| `shortcut-synth.png` | 96x96 | App shortcut |
| `shortcut-breath.png` | 96x96 | App shortcut |
| `shortcut-calc.png` | 96x96 | App shortcut |
| `badge-72.png` | 72x72 | Notification badge |

## Design Recommendations

- Use the brain emoji (🧠) or a custom logo
- Dark background (#050510) with cyan accent (#00f3ff)
- Ensure icons look good on both light and dark backgrounds
- Use "maskable" design for Android (important content in center 80%)

## Quick Generation Tools

1. **RealFaviconGenerator**: https://realfavicongenerator.net/
2. **PWA Asset Generator**: https://github.com/nickvdyck/pwa-asset-generator
3. **Maskable.app**: https://maskable.app/ (for testing maskable icons)

## Example Command (using pwa-asset-generator)

```bash
npx pwa-asset-generator logo.png icons/ --background "#050510" --padding "20%"
```
