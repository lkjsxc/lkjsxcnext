
1.  **Setting up essential configurations earlier:** Environment variables and project structure are crucial foundations.
2.  **Ensuring backend prerequisites are met:** Defining the database schema and Prisma client before building API endpoints that depend on them.
3.  **Structuring backend implementation:** Defining shared service logic before specific API route handlers.
4.  **Structuring frontend implementation:** Building layout and providers first, then core components, and finally integrating CRUD logic.
5.  **Grouping advanced features:** Placing polling and auto-save after the core CRUD is functional.

Here is the reordered checklist:

**I. Project Setup & Foundational Configuration**

*   [ ] **Project Structure:**
    *   [ ] Create the specified folder structure (`prisma`, `public`, `src/app`, `src/components`, `src/features`, `src/contexts`, `src/hooks`, `src/lib`, `src/services`, `src/types`).
    *   [ ] Organize components into `layout`, `ui`, and feature-specific directories (initial setup).
    *   [ ] Organize hooks into shared and feature-specific directories (initial setup).
    *   [ ] Define shared types structure in `src/types` (e.g., folders for `api.ts`, `db.ts`, `memo.ts`, `next-auth.d.ts`).
*   [ ] **Install Core Dependencies:**
    *   [ ] `next`, `react`, `react-dom`
    *   [ ] `prisma`
    *   [ ] `next-auth`
    *   [ ] `tailwindcss`
    *   [ ] `@prisma/client`
*   [ ] **Configure TypeScript:**
    *   [ ] Set up `tsconfig.json`.
    *   [ ] Enable `strict` mode.
*   [ ] **Configure Tailwind CSS:**
    *   [ ] Set up `tailwind.config.ts` and `postcss.config.js`.
    *   [ ] Integrate Tailwind directives into global CSS (`src/app/globals.css`).
*   [ ] **Environment Variables:**
    *   [ ] Create `.env.example` file listing all required variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
    *   [ ] Create `.env` file (and add to `.gitignore`).
    *   [ ] Obtain Google OAuth 2.0 Credentials (Client ID & Secret) from Google Cloud Console.
    *   [ ] Configure Authorized JavaScript origins and redirect URIs in Google Cloud Console.
    *   [ ] Generate a strong `NEXTAUTH_SECRET`.
    *   [ ] Populate `.env` with initial values (placeholder for DB URL if needed, actual secrets).
*   [ ] **Set Up Prisma (Initial):**
    *   [ ] Initialize Prisma (`npx prisma init`).
    *   [ ] Configure `prisma/schema.prisma` with SQLite provider (`provider = "sqlite"`).
    *   [ ] Define database connection URL in `.env` (`DATABASE_URL="file:./dev.db"`) and ensure it's populated.

**II. Database Schema & Authentication Setup**

*   [ ] **Define Prisma Schema (`prisma/schema.prisma`):**
    *   [ ] Define required NextAuth models: `Account`, `Session`, `User`, `VerificationToken` (ensure compatibility with Prisma Adapter).
    *   [ ] Define `Memo` model with fields: `id`, `title`, `content`, `isPublic`, `createdAt`, `updatedAt`, `clientUpdatedAt`, `authorId`, and relation to `User`.
    *   [ ] Define relations between `User` and `Memo`, `User` and `Account`/`Session`.
    *   [ ] Add necessary indexes (`@@index([authorId])`, etc.).
*   [ ] **Database Migrations:**
    *   [ ] Run initial migration (`npx prisma migrate dev --name init`).
    *   [ ] *Note: Run subsequent migrations as the schema evolves.*
*   [ ] **Generate Prisma Client:**
    *   [ ] Run `npx prisma generate`.
*   [ ] **Create Prisma Client Singleton:**
    *   [ ] Implement `lib/prisma.ts` to provide a shared Prisma client instance.
*   [ ] **Set Up NextAuth:**
    *   [ ] Configure `lib/auth.ts` with NextAuth options.
    *   [ ] Implement the Prisma Adapter for NextAuth (using the singleton from `lib/prisma.ts`).
    *   [ ] Add Google Provider configuration (using Client ID/Secret from `.env`).
    *   [ ] Create the catch-all API route `src/app/api/auth/[...nextauth]/route.ts`.
    *   [ ] Define `next-auth.d.ts` types in `src/types/`.

**III. Backend API Endpoints (Route Handlers)**

*   [ ] **Authentication Layer Utility:**
    *   [ ] Implement shared utility/middleware (`src/app/api/_lib/` or similar) for checking authentication status in API routes (using `lib/auth.ts`).
*   [ ] **Memo Service Logic (`src/features/memo/services/memoService.ts` or `src/services/memoService.ts`):**
    *   [ ] Create functions for database interactions (get, list, create, update, delete memos) using the Prisma Client Singleton.
    *   [ ] Incorporate authorization logic (checking user ownership/session) within these service functions.
*   [ ] **Implement API Routes:**
    *   [ ] **`GET /api/memo`:**
        *   [ ] Use Memo Service to fetch list based on `scope` query parameter (`public`, `private`, `all`).
        *   [ ] Use Auth Utility for checks on `private` and `all`.
        *   [ ] Default to `public` scope.
    *   [ ] **`POST /api/memo`:**
        *   [ ] Use Auth Utility to require authentication.
        *   [ ] Accept `{ title: string, content: string, isPublic: boolean }`.
        *   [ ] Use Memo Service to create a memo associated with the user.
        *   [ ] Initialize `clientUpdatedAt`.
    *   [ ] **`GET /api/memo/[id]`:**
        *   [ ] Use Memo Service to fetch a specific memo.
        *   [ ] Check if public or owner (requires auth check via Auth Utility/Service logic).
        *   [ ] Return memo details and `isOwner: boolean`.
        *   [ ] Handle not found/access denied.
    *   [ ] **`PUT /api/memo/[id]`:**
        *   [ ] Use Auth Utility/Service to require authentication and ownership.
        *   [ ] Accept `{ title?, content?, isPublic?, clientUpdatedAt: string (ISO Date) }`.
        *   [ ] **Implement Optimistic Concurrency Control (OCC) in Service/Route:**
            *   Retrieve memo.
            *   Compare incoming `clientUpdatedAt` with DB `clientUpdatedAt`.
            *   Return 409 Conflict if stale.
            *   If check passes, use Memo Service to update fields and `clientUpdatedAt`.
    *   [ ] **`DELETE /api/memo/[id]`:**
        *   [ ] Use Auth Utility/Service to require authentication and ownership.
        *   [ ] Use Memo Service to delete the memo.
        *   [ ] Return success status (e.g., 204).
*   [ ] **Error Handling:** Implement consistent error handling and responses across all API endpoints (e.g., 401, 403, 404, 409, 500).
*   [ ] **Define API Types:** Solidify request/response types in `src/types/api.ts`.

**IV. Frontend UI & Core Features**

*   [ ] **Global Layout & Providers:**
    *   [ ] Implement root `layout.tsx` (`src/app/layout.tsx`).
    *   [ ] Create `Providers.tsx` (`src/contexts/Providers.tsx`) to wrap children with `SessionProvider` (NextAuth). *Will add `PollingContext` later.*
    *   [ ] Implement main application layout (`src/app/(app)/layout.tsx` or similar) including the Header placeholder.
*   [ ] **Header Component & Auth Flow:**
    *   [ ] Create `Header.tsx` (`src/components/layout/Header.tsx`) displaying project name.
    *   [ ] Implement `AuthButtons.tsx` (`src/features/auth/components/AuthButtons.tsx`):
        *   [ ] Use NextAuth's `signIn`, `signOut`, `useSession`.
        *   [ ] Show "Sign In" / "Sign Out" + User Info conditionally.
    *   [ ] Integrate `AuthButtons` into the `Header`.
    *   [ ] Test sign-in/sign-out functionality.
*   [ ] **Memo List / Explorer:**
    *   [ ] Create `useMemosList.ts` hook (`src/features/memo/hooks/`) to fetch data from `GET /api/memo`.
    *   [ ] Implement `MemoListItem.tsx` (`src/features/memo/components/`).
    *   [ ] Implement `MemoList.tsx` (`src/features/memo/components/`) using the hook and list item component.
*   [ ] **Memo Viewing:**
    *   [ ] Create `useMemoDetail.ts` hook (`src/features/memo/hooks/`) to fetch data from `GET /api/memo/[id]`.
    *   [ ] Implement `MemoViewer.tsx` (`src/features/memo/components/`) using the hook to display title/content. Handle loading/error states.
*   [ ] **Memo Editing:**
    *   [ ] Implement `MemoEditor.tsx` (`src/features/memo/components/`):
        *   [ ] Input fields for `title`, `content`.
        *   [ ] Toggle/switch for `isPublic`.
        *   [ ] "Delete" button placeholder/UI.
*   [ ] **Main Window Logic (`src/app/page.tsx` or main app route):**
    *   [ ] Coordinate display of `MemoList` and `MemoViewer`/`MemoEditor`.
    *   [ ] Handle memo selection from the list to show in the viewer/editor.
    *   [ ] Implement a "New Memo" button/action (sets up state for creation).
    *   [ ] Implement logic to switch between Viewer and Editor based on ownership (`isOwner` from detail fetch) and user action.
*   [ ] **CRUD Operations (Client-Side Integration):**
    *   [ ] **Create:** Implement UI action (e.g., after clicking "New Memo" and editing) to trigger `POST /api/memo`.
    *   [ ] **Read:** Ensure `useMemosList` and `useMemoDetail` are correctly fetching and displaying data.
    *   [ ] **Update:** Connect `MemoEditor` changes to trigger `PUT /api/memo/[id]` (initially manual save, auto-save comes later). Include `clientUpdatedAt` in the PUT request.
    *   [ ] **Delete:** Connect the "Delete" button in `MemoEditor` to trigger `DELETE /api/memo/[id]`. Handle UI updates after deletion.
*   [ ] **Responsive Design:**
    *   [ ] Apply Tailwind CSS utility classes throughout component implementation to ensure responsiveness.

**V. Advanced Features & Logic**

*   [ ] **Centralized Polling System:**
    *   [ ] Create `PollingContext.tsx` (`src/features/polling/context/PollingContext.tsx`).
    *   [ ] Implement `usePolling` hook (`src/features/polling/hooks/usePolling.ts`).
    *   [ ] Set up global interval in the context provider.
    *   [ ] Wrap application layout with `PollingProvider` in `src/contexts/Providers.tsx`.
    *   [ ] **Integrate Polling:**
        *   [ ] Use `usePolling` in `useMemosList` to periodically re-fetch.
        *   [ ] Use `usePolling` in `useMemoDetail` to re-fetch *only if not owner*.
        *   [ ] Implement logic in `MemoEditor` or related hook to pause polling for the *currently edited* memo when the user starts editing.
*   [ ] **Auto-Save & Update Queue:**
    *   [ ] Create `useMemoUpdateQueue.ts` hook (`src/features/memo/hooks/`) for sequential API calls.
    *   [ ] Create `useMemoAutoSave.ts` hook (`src/features/memo/hooks/`):
        *   [ ] Use debouncing.
        *   [ ] Add debounced update requests (with current `clientUpdatedAt`) to the queue.
    *   [ ] Integrate `useMemoAutoSave` into `MemoEditor.tsx`, replacing manual save logic for updates.
*   [ ] **Optimistic Updates & Conflict Handling (Client-Side):**
    *   [ ] Update UI immediately in `MemoEditor` on user input.
    *   [ ] Enhance the update logic (triggered by `useMemoAutoSave`/`useMemoUpdateQueue`):
        *   Handle successful (2xx) PUT response: confirm update.
        *   Handle conflict (409) PUT response: notify user, potentially revert optimistic UI or fetch latest state.
        *   Handle other errors: notify user.

**VI. Code Quality & Best Practices (Ongoing)**

*   [ ] **Adhere to Code Quality Philosophy:**
    *   [ ] Prioritize RSC where possible.
    *   [ ] Use Client Components (`"use client"`) only when necessary.
    *   [ ] Implement strategic data fetching.
    *   [ ] Manage state effectively.
    *   [ ] Maintain TypeScript rigor (`strict`, no `any`).
    *   [ ] Apply Functional Programming influences.
    *   [ ] Design small, reusable components/hooks.
    *   [ ] Leverage Next.js conventions.
*   [ ] **Type Definitions:** Maintain clear types in `src/types/` (e.g., `memo.ts`).
*   [ ] **Component Reusability:** Build generic UI components in `src/components/ui/`.
*   [ ] **Code Reviews:** (If applicable)
*   [ ] **Testing (Implied Requirement for Quality):**
    *   [ ] Unit tests (hooks, services).
    *   [ ] Integration tests (API endpoints).
    *   [ ] E2E tests (user flows).

**VII. Documentation & Finalization**

*   [ ] **README.md:**
    *   [ ] Update README with final details.
    *   [ ] Add screenshot/GIF.
    *   [ ] Ensure accuracy (Features, Tech Stack, Usage).
*   [ ] **Add `LICENSE` File:** (MIT License text).
*   [ ] **Contributing Guidelines:** Add `CONTRIBUTING.md` (optional).
*   [ ] **Document Running Commands:** Ensure clarity in README.

**VIII. Known Issues & Future Enhancements (Post-MVP)**

*   [ ] **UI Feedback:**
    *   [ ] Loading indicators (saving/polling).
    *   [ ] Toast notifications (save success, errors, conflicts).
*   [ ] **Real-time:** Investigate WebSockets.
*   [ ] **Editor Features:** Markdown/Rich Text Editor.
*   [ ] **Organization:** Folders/tags.
*   [ ] **Search:** Full-text search.
*   [ ] **Error Handling:** Robust client/server error reporting.