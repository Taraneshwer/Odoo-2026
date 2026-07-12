
 # TransitOps

 Smart Transport Operations Platform

 TransitOps provides a centralized interface for managing vehicles, drivers, trip dispatch, maintenance, fuel and expense tracking, and operational reporting. It is a frontend application that consolidates fleet operations into a structured, rule-driven system to reduce manual errors and improve visibility.

 ## Overview

 Many transport organisations still rely on spreadsheets and manual records for fleet operations. That approach commonly causes:

 - scheduling conflicts
 - vehicle double assignments
 - driver compliance issues
 - missed maintenance
 - inaccurate expense tracking
 - limited fleet visibility

 TransitOps centralises these workflows into a single web application and enforces business rules around dispatch, maintenance, and driver eligibility.

 ## Core features

 - Operations Dashboard
 - Vehicle Registry
 - Driver Management
 - Trip Management
 - Dispatch Validation
 - Automatic Status Transitions
 - Maintenance Management
 - Fuel Logging
 - Expense Tracking
 - Reports and Analytics
 - Role-Based Access Control

 ## Business rules

 - Vehicle registration numbers must be unique.
 - Vehicles with status `IN_SHOP` cannot be dispatched.
 - `RETIRED` vehicles cannot be dispatched.
 - Vehicles already `ON_TRIP` cannot be assigned again.
 - Drivers with expired licences cannot be assigned.
 - `SUSPENDED` drivers cannot be assigned.
 - Drivers already `ON_TRIP` cannot be assigned again.
 - Cargo weight cannot exceed the vehicle's capacity.

 Automatic state transitions (examples):

 - Dispatch:
   - Vehicle: `Available` → `On Trip`
   - Driver:  `Available` → `On Trip`
 - Trip completion:
   - Vehicle: `On Trip` → `Available`
   - Driver:  `On Trip` → `Available`
 - Maintenance creation:
   - Vehicle: `Available` → `In Shop`
 - Maintenance closure:
   - Vehicle: `In Shop` → `Available`

 ## Tech stack

 The repository contains a frontend application with the following core technologies (as used in source files and package.json):

 - React (UI)
 - TypeScript (source files use .tsx)
 - Vite (build / dev)
 - Tailwind CSS (styling)
 - React Router (routing)
 - Lucide Icons (icons)
 - Recharts (charts)

 > Note: The project uses React/TypeScript. Other stacks (SolidJS, Apache ECharts, etc.) are not used in this repository.

 ## Project structure

 A concise view of the repository (relevant files/folders):

 ```
 .
 ├─ index.html
 ├─ package.json
 ├─ package-lock.json
 ├─ vite.config.ts
 ├─ postcss.config.mjs
 ├─ pnpm-workspace.yaml
 ├─ src/
 │  ├─ main.tsx
 │  ├─ app/
 │  │  ├─ App.tsx                # Application root, pages and UI shell
 │  │  ├─ components/
 │  │  │  ├─ ui/                 # Re-usable UI primitives (buttons, inputs, drawers, etc.)
 │  │  │  └─ figma/
 │  │  └─ settings/
 │  │     ├─ UsersTab.tsx        # Users listing + actions
 │  │     └─ AddUserDrawer.tsx   # Drawer for creating users
 │  ├─ services/
 │  │  └─ userService.ts         # Service-layer API abstraction for users
 │  ├─ imports/
 │  └─ styles/
 ├─ dist/                        # build output (generated)
 ```

 ### Major folders

 - `src/app/components/ui` — contains reusable UI components and wrappers around primitives (Radix, Vaul, etc.).
 - `src/app/settings` — feature module for settings-related screens (including Users management).
 - `src/services` — service-layer code and typed domain models for API interactions.

 ## Getting started

 ### Prerequisites

 - Node.js (recommended active LTS). The repository includes `package-lock.json`, so npm is the primary package manager used here.

 ### Installation

 ```bash
 npm install
 ```

 ### Development server

 ```bash
 npm run dev
 ```

 The dev server starts with Vite (default port 5173; Vite may auto-pick another port if 5173 is in use).

 ### Production build

 ```bash
 npm run build
 ```

 ### Preview (serve built files)

 Vite provides a preview server. You can run it via `npx` after building:

 ```bash
 npx vite preview
 ```

 ## Environment variables

 The application references environment variables using Vite's `import.meta.env` API. Currently the repository references:

 - `VITE_API_BASE_URL` — base URL for backend API requests used by the service layer (e.g., `src/services/userService.ts`).

 Example `.env.example` snippet:

 ```
 VITE_API_BASE_URL=https://api.example.com
 ```

 Do not commit secrets or real credentials to source control.

 ## Application modules (brief)

 - Overview — operations dashboard and high-level metrics.
 - Vehicles — registry and status tracking for fleet vehicles.
 - Drivers — driver profiles and licence/eligibility information.
 - Trips — trip creation, dispatch, and lifecycle management.
 - Maintenance — create/track maintenance and service records.
 - Fuel & Expenses — log fuel purchases and related expenses.
 - Reports — charts and operational analytics (Recharts used for charts).
 - Settings — configuration, roles & permissions, and user management (UsersTab + AddUserDrawer).

 ## Dispatch workflow

 Core dispatch flow:

 1. Route & cargo are planned.
 2. A vehicle is selected and validated for availability and capacity.
 3. A driver is selected and validated for licence validity and status.
 4. System performs validation checks (vehicle not `IN_SHOP`/`RETIRED`/`ON_TRIP`, driver not `SUSPENDED` or expired, cargo within capacity).
 5. On success, the trip is dispatched and state transitions are applied (vehicle and driver move to `On Trip`).

 The app enforces business rules listed in the Business rules section above prior to dispatch.

 ## Development notes

 - UI primitives are centralized under `src/app/components/ui` so views can compose consistent controls.
 - Feature code is organised by module (e.g., `src/app/settings`), keeping implementation grouped by domain.
 - Service-layer abstractions live in `src/services` and handle fetch/fallback behaviour for APIs.
 - TypeScript is used in source files (`.tsx`) and typed domain models are defined in service files (for example, `userService.ts`).

 ## License

 No `LICENSE` file was found in this repository. License information has not yet been specified.

 ---

 If you want, I can also add a short CONTRIBUTING section and a `.env.example` file — tell me which you'd prefer next.
  