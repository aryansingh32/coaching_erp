
# Frontend Complete Architecture Report (Volume 1)

## Overall Frontend Architecture
- **Framework**: Next.js (React).
- **Folder Structure**: App Router (`app/`), UI Components (`components/`), Hooks (`hooks/`), Utils (`lib/`).
- **Rendering**: Hybrid (SSR for SEO/Public pages, CSR for dashboard interactivity).
- **Routing**: Next.js App Router (file-system based).
- **State Management**: React Query (for server state, caching API responses), Zustand (for local UI state like themes/sidebars).
- **Theme**: Tailwind CSS integrated with a robust Design System.
- **Responsive System**: Mobile-first Tailwind breakpoints (`sm`, `md`, `lg`, `xl`).

## Design System
- **Typography**: Inter (Sans-serif) for readable interfaces.
- **Colors**:
  - Primary: Indigo/Blue suite.
  - Success: Green-500.
  - Warning: Yellow-500.
  - Danger: Red-500.
  - Dark Mode: Neutral-900 backgrounds with Neutral-100 text.
- **CSS Architecture**: Utility-first via Tailwind.

## UI Analysis
- **Dashboards**: Highly interactive, leveraging Metabase iframe embeddings or Superset React components for heavy analytics.
- **Navigation Flow**: Role-based routing. Admin sees ERP config, Student sees Moodle courses & BBB meetings.
- **Loaders**: Skeleton screens used extensively to mask the Gateway -> ERPNext latency.

---
[Proceed to Volume 2](./Frontend_Report_Part_02.md)
