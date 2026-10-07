# Brand assets

Drop the supplied logo and mascot files here. Until then the app shows built-in placeholder
artwork.

## Files

Use transparent SVG (preferred) or PNG, so the artwork sits cleanly on light and dark themes.

| File (suggested name) | Used for |
|---|---|
| `duolingo-logo.svg` | Full logo: mark + wordmark (landing header, desktop sidebar) |
| `duo.svg` | Square mark (tablet icon rail) and the mascot's `idle` state |
| `duo-happy.svg`, `duo-celebrate.svg`, … | Optional mascot states |

## Switching them on

Edit `src/lib/brand.ts` — the only file that names brand assets:

```ts
export const BRAND: Brand = {
  name: "Duolingo",
  wordmark: "duolingo",
  logoSrc: "/brand/duolingo-logo.svg",
  markSrc: "/brand/duo.svg",
  mascot: {
    idle: "/brand/duo.svg",
    happy: "/brand/duo-happy.svg",
    celebrating: "/brand/duo-celebrate.svg",
    "lesson-success": null, // null falls back to `idle`
    "lesson-failure": null,
    guidebook: null,
    achievement: null,
    sleeping: null,
  },
};
```

Nothing else changes: every screen renders the brand through `<BrandLogo>` and `<DuoMascot>`.
The logo is height-locked and takes its width from the file's own proportions, and the mascot
fills a fixed box, so new artwork cannot stretch or shift the layout.

Only add assets you have the right to use.
