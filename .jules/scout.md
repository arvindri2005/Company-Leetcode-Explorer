## SCOUT'S FIELD NOTES - CRITICAL LEARNINGS ONLY

## 2025-02-23 - JSON-LD in Next.js App Router Metadata
**Observation:** Found `script[type="application/ld+json"]` injected via `metadata.other` in `page.tsx`. Next.js App Router renders `other` properties as `<meta>` tags (e.g., `<meta name="script..." content="...">`), making the JSON-LD invalid and unreadable by search engines.
**Strategy:** JSON-LD must be injected using a `<script>` tag within the component body or using a dedicated client/server component (like `StructuredData`). Never use `metadata.other` for script injection.

## 2025-01-01 - List Page Schema Strategy
**Observation:** List pages (e.g., `/problems`, `/companies`) often lack `ItemList` schema, relying only on generic `CollectionPage` type. This misses the opportunity to explicitly signal the "list" nature of the content to search engines.
**Strategy:** Implement `ItemList` schema in the server-side container component (e.g., `ProblemListContainer`) where the initial data is fetched. This ensures the first page of results is indexed as a structured list, even if subsequent pages are client-side loaded.

## 2025-02-23 - Company Page ItemList Schema
**Observation:** Individual company pages (`/company/[slug]`) list problems but lacked `ItemList` schema, only having `Organization` and `BreadcrumbList`.
**Strategy:** Added `ItemList` schema to `src/app/company/[companySlug]/page.tsx` to explicitly list the problems associated with the company, helping search engines understand the relationship between the company and the problems.
