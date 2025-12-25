## SCOUT'S FIELD NOTES - CRITICAL LEARNINGS ONLY

## 2025-02-23 - JSON-LD in Next.js App Router Metadata
**Observation:** Found `script[type="application/ld+json"]` injected via `metadata.other` in `page.tsx`. Next.js App Router renders `other` properties as `<meta>` tags (e.g., `<meta name="script..." content="...">`), making the JSON-LD invalid and unreadable by search engines.
**Strategy:** JSON-LD must be injected using a `<script>` tag within the component body or using a dedicated client/server component (like `StructuredData`). Never use `metadata.other` for script injection.
