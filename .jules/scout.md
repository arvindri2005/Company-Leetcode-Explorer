## SCOUT'S FIELD NOTES - CRITICAL LEARNINGS ONLY

## 2025-02-23 - JSON-LD in Next.js App Router Metadata
**Observation:** Found `script[type="application/ld+json"]` injected via `metadata.other` in `page.tsx`. Next.js App Router renders `other` properties as `<meta>` tags (e.g., `<meta name="script..." content="...">`), making the JSON-LD invalid and unreadable by search engines.
**Strategy:** JSON-LD must be injected using a `<script>` tag within the component body or using a dedicated client/server component (like `StructuredData`). Never use `metadata.other` for script injection.

## 2025-02-23 - Duplicate Open Graph Metadata
**Observation:** `layout.tsx` contained hardcoded `og:image` tags pointing to a static `/og-image.png` that conflicted with the dynamic `opengraph-image.tsx` file. Next.js automatically handles `og:image` generation when `opengraph-image.tsx` is present, so the manual tags were redundant and potentially pointing to non-existent or stale assets.
**Strategy:** Remove manual `images` properties from `metadata.openGraph` and `metadata.twitter` in `layout.tsx` when using `opengraph-image.tsx` to let Next.js manage the tags and cache busting automatically.
