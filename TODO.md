
1.  **Setup First:** Environment, core configurations, and project structure are foundational.
2.  **Backend Before Frontend:** The data layer (DB schema, migrations) and API need to exist before the frontend can interact with them.
3.  **Core Features Before Advanced:** Basic CRUD functionality should work before adding enhancements like polling or auto-save.
4.  **Build Incrementally:** Start with the essentials (auth, basic display) and build outwards.

Here is the reordered and slightly more granular checklist:

**I. Project Setup & Foundational Configuration**

*   [ ] **Clone Repository & Basic Setup:**
    *   [ ] Clone the repository (if applicable, otherwise initialize git).
    *   [ ] Navigate into the project directory.
    *   [ ] Initialize npm/yarn/pnpm (`npm init -y` or similar if starting from scratch).
*   [ ] **Install Core Dependencies:**
    *   [ ] `next`, `react`, `react-dom`
    *   [ ] `prisma` (as dev dependency)
    *   [ ] `@prisma/client`
    *   [ ] `next-auth`
    *   [ ] `tailwindcss`, `postcss`, `autoprefixer` (dev dependencies)
*   [ ] **Configure TypeScript:**
    *   [ ] Set up `tsconfig.json` (often done via `npx tsc --init` or Next.js setup).
    *   [ ] Enable `strict` mode and other desired compiler options.
*   [ ] **Configure Tailwind CSS:**
    *   [ ] Create `tailwind.config.ts` and `postcss.config.js`.
    *   [ ] Configure `tailwind.config.ts` (content paths, theme, etc.).
    *   [ ] Integrate Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`) into global CSS (`src/app/globals.css`).
*   [ ] **Establish Project Structure:**
    *   [ ] Create the core directories: `prisma`, `public`, `src/app`, `src/components`, `src/lib`, `src/types`.
    *   [ ] Create placeholder files/folders within `src` as needed (e.g., `src/app/layout.tsx`, `src/app/page.tsx`, `src/lib/prisma.ts`, `src/lib/auth.ts`).
*   [ ] **Environment Variables:**
    *   [ ] Create `.env` file.
    *   [ ] Add `.env` to `.gitignore`.
    *   [ ] **Obtain Google OAuth Credentials:**
        *   [ ] Set up a project in Google Cloud Console.
        *   [ ] Create OAuth 2.0 Client ID credentials (Web application type).
        *   [ ] Configure Authorized JavaScript origins (e.g., `http://localhost:3000`).
        *   [ ] Configure Authorized redirect URIs (e.g., `http://localhost:3000/api/auth/callback/google`).
    *   [ ] **Generate Secrets & URLs:**
        *   [ ] Generate a strong `NEXTAUTH_SECRET` (e.g., `openssl rand -base64 32`).
        *   [ ] Define `NEXTAUTH_URL` (e.g., `http://localhost:3000`).
        *   [ ] Define `DATABASE_URL` (e.g., `file:./dev.db` for SQLite).
    *   [ ] Populate `.env` with all obtained/generated values.
*   [ ] **Set Up Prisma (Initial):**
    *   [ ] Initialize Prisma if not done (`npx prisma init` - might have created `prisma/schema.prisma` and `.env` stub).
    *   [ ] Configure the `datasource db` block in `prisma/schema.prisma` to use SQLite and reference `env("DATABASE_URL")`.
    *   [ ] Configure the `generator client` block.

**II. Database Schema & Authentication Backend**

*   [ ] **Define Prisma Schema (`prisma/schema.prisma`):**
    *   [ ] Define required NextAuth models: `Account`, `Session`, `User`, `VerificationToken`. Ensure field names match adapter expectations.
    *   [ ] Define `Memo` model with fields: `id`, `title`, `content` (optional `String?`), `isPublic` (`Boolean @default(false)`), `createdAt` (`@default(now())`), `updatedAt` (`@updatedAt`), `clientUpdatedAt` (`DateTime @default(now())`), `authorId` (`String`).
    *   [ ] Define relation: `author User @relation(fields: [authorId], references: [id], onDelete: Cascade)`.
    *   [ ] Define relation on `User`: `memos Memo[]`.
    *   [ ] Add necessary indexes: `@@index([authorId])` on Memo, `@@unique([provider, providerAccountId])` on Account, `@@index([userId])` on Account/Session, `@@unique([identifier, token])` on VerificationToken.
*   [ ] **Database Migrations:**
    *   [ ] Run initial migration: `npx prisma migrate dev --name init`. Verify schema creation in `dev.db` (or chosen DB).
*   [ ] **Generate Prisma Client:**
    *   [ ] Run `npx prisma generate`.
*   [ ] **Create Prisma Client Singleton:**
    *   [ ] Implement `src/lib/prisma.ts` to export a single, shared instance of `PrismaClient`. Handle potential issues in development environments (globalThis).
*   [ ] **Set Up NextAuth Backend:**
    *   [ ] Configure `src/lib/auth.ts` with NextAuth options:
        *   [ ] Import `PrismaAdapter` and the Prisma client singleton.
        *   [ ] Set the adapter: `adapter: PrismaAdapter(prisma)`.
        *   [ ] Add `GoogleProvider` with `clientId` and `clientSecret` from `.env`.
        *   [ ] Configure session strategy (e.g., `strategy: "jwt"` or `"database"`).
        *   [ ] Set `secret: process.env.NEXTAUTH_SECRET`.
        *   [ ] Define callbacks if needed (e.g., `session` callback to add user ID to session).
    *   [ ] Create the catch-all API route `src/app/api/auth/[...nextauth]/route.ts` exporting `GET` and `POST` handlers from `lib/auth.ts`.
    *   [ ] Define `src/types/next-auth.d.ts` to augment the `Session` and `User` types if adding custom fields (like user ID).

**III. Core Backend API (Memos)**

*   [ ] **Define Core Types:**
    *   [ ] Define basic `Memo` type structure in `src/types/memo.ts`.
    *   [ ] Define basic API request/response types in `src/types/api.ts`.
*   [ ] **Implement Memo Service Logic (Optional but Recommended):**
    *   [ ] Create `src/features/memo/services/memoService.ts` (or `src/services/memoService.ts`).
    *   [ ] Implement functions using Prisma Client for:
        *   `getMemos(userId?: string, scope: 'public' | 'private' | 'all')`
        *   `getMemoById(memoId: string, userId?: string)` (check ownership/public status)
        *   `createMemo(data: { title: string; content: string; isPublic: boolean; authorId: string })`
        *   `updateMemo(memoId: string, userId: string, data: { title?: string; content?: string; isPublic?: boolean; clientUpdatedAt: Date }, currentDbTimestamp: Date)` (includes OCC check logic)
        *   `deleteMemo(memoId: string, userId: string)` (includes ownership check)
    *   *These functions encapsulate DB logic and authorization rules.*
*   [ ] **Implement Authentication Helper (for API Routes):**
    *   [ ] Create a helper function (e.g., in `src/app/api/_lib/auth.ts` or similar) to get the server session using `lib/auth.ts` and enforce authentication where needed.
*   [ ] **Implement API Route Handlers (`src/app/api/memo/...`):**
    *   [ ] **`GET /api/memo/route.ts`:**
        *   [ ] Handle query parameter `scope`.
        *   [ ] Get authenticated `userId` (if needed for `private`/`all`).
        *   [ ] Call `memoService.getMemos`.
        *   [ ] Return appropriate response/error.
    *   [ ] **`POST /api/memo/route.ts`:**
        *   [ ] Require authentication using the auth helper.
        *   [ ] Validate request body (`{ title, content, isPublic }`).
        *   [ ] Call `memoService.createMemo` with `authorId` from session.
        *   [ ] Return created memo (or success status).
    *   [ ] **`GET /api/memo/[id]/route.ts`:**
        *   [ ] Get `memoId` from params.
        *   [ ] Get authenticated `userId` (optional, for ownership check).
        *   [ ] Call `memoService.getMemoById`.
        *   [ ] Return memo details + `isOwner` flag based on result. Handle 404/403.
    *   [ ] **`PUT /api/memo/[id]/route.ts`:**
        *   [ ] Require authentication and get `userId`.
        *   [ ] Get `memoId` from params.
        *   [ ] Validate request body (`{ title?, content?, isPublic?, clientUpdatedAt }`).
        *   [ ] Fetch the current memo from DB *to get its `clientUpdatedAt`*.
        *   [ ] Call `memoService.updateMemo`, passing validated data, `userId`, and the current DB timestamp for OCC check within the service.
        *   [ ] Handle potential 409 Conflict response from the service.
        *   [ ] Return updated memo or success/error status.
    *   [ ] **`DELETE /api/memo/[id]/route.ts`:**
        *   [ ] Require authentication and get `userId`.
        *   [ ] Get `memoId` from params.
        *   [ ] Call `memoService.deleteMemo`.
        *   [ ] Return success status (e.g., 204) or error.
*   [ ] **API Error Handling:** Ensure consistent error responses (e.g., JSON with error messages, correct HTTP status codes: 400, 401, 403, 404, 409, 500).

**IV. Frontend UI & Core Feature Integration**

*   [ ] **Global Layout & Providers:**
    *   [ ] Implement root `src/app/layout.tsx` (basic HTML structure, include global CSS).
    *   [ ] Create `src/contexts/Providers.tsx`. Wrap children with `SessionProvider` from `next-auth/react`.
    *   [ ] Use `Providers` in `src/app/layout.tsx` to wrap the main content.
*   [ ] **Implement Header & Authentication UI:**
    *   [ ] Create `src/components/layout/Header.tsx` (display project name, layout structure).
    *   [ ] Create `src/features/auth/components/AuthButtons.tsx`:
        *   [ ] Use `useSession`, `signIn`, `signOut` from `next-auth/react`.
        *   [ ] Conditionally render "Sign In with Google" button or User info (name/image) + "Sign Out" button.
    *   [ ] Integrate `AuthButtons` into the `Header`.
    *   [ ] Add `Header` to a shared layout (e.g., create `src/app/(main)/layout.tsx` if needed, or add to root layout).
*   [ ] **Implement Basic UI Components (`src/components/ui/`):**
    *   [ ] `Button.tsx`
    *   [ ] `Input.tsx`
    *   [ ] `Textarea.tsx`
    *   [ ] `Spinner.tsx`
    *   [ ] `Card.tsx` (or similar container)
    *   [ ] `ToggleSwitch.tsx` (for public/private)
*   [ ] **Implement Memo List ("Explorer"):**
    *   [ ] Create `src/features/memo/hooks/useMemosList.ts`:
        *   [ ] Fetch data from `GET /api/memo` (initially fetch `all` or based on simple logic).
        *   [ ] Use SWR or React Query for data fetching, caching, revalidation (recommended over manual `fetch`/`useEffect`).
        *   [ ] Handle loading and error states.
    *   [ ] Create `src/features/memo/components/MemoListItem.tsx`:
        *   [ ] Display memo title, maybe snippet/date.
        *   [ ] Handle click event (to select memo).
    *   [ ] Create `src/features/memo/components/MemoList.tsx`:
        *   [ ] Use `useMemosList` hook.
        *   [ ] Map over data to render `MemoListItem` components.
        *   [ ] Handle loading/error display.
*   [ ] **Implement Memo Viewer:**
    *   [ ] Create `src/features/memo/hooks/useMemoDetail.ts`:
        *   [ ] Fetch data from `GET /api/memo/[id]` based on a selected memo ID.
        *   [ ] Use SWR/React Query. Include `isOwner` in fetched data.
        *   [ ] Handle loading/error/not found states.
    *   [ ] Create `src/features/memo/components/MemoViewer.tsx`:
        *   [ ] Use `useMemoDetail` hook.
        *   [ ] Display memo `title` and `content`.
        *   [ ] Handle loading/error display.
*   [ ] **Implement Memo Editor:**
    *   [ ] Create `src/features/memo/components/MemoEditor.tsx`:
        *   [ ] Use controlled components for `title` (Input) and `content` (Textarea).
        *   [ ] Include `ToggleSwitch` for `isPublic`.
        *   [ ] Include "Save" (initially), "Delete" buttons.
        *   [ ] Manage local component state for edits.
        *   [ ] Accept initial memo data as props (when editing an existing memo).
*   [ ] **Integrate Main Window Logic (`src/app/(main)/page.tsx` or similar):**
    *   [ ] Use state to manage the currently selected `memoId`.
    *   [ ] Render `MemoList` component. Pass a function to `MemoListItem`'s `onClick` to set the selected `memoId`.
    *   [ ] Conditionally render `MemoViewer` or `MemoEditor` based on selected `memoId` and `isOwner` flag (from `useMemoDetail`).
    *   [ ] Add a "New Memo" button: Clears selected `memoId`, sets editor to a "new" state.
*   [ ] **Wire Up CRUD Operations (Manual Save):**
    *   [ ] **Create:** When saving a "new" memo in `MemoEditor`, call `POST /api/memo`. Refresh the memo list on success (SWR/React Query can help automate this).
    *   [ ] **Read:** Ensure list and detail views fetch and display correctly.
    *   [ ] **Update:** When clicking "Save" in `MemoEditor` for an existing memo:
        *   [ ] Get the latest `clientUpdatedAt` timestamp from the data fetched by `useMemoDetail`.
        *   [ ] Call `PUT /api/memo/[id]` with current editor state and the `clientUpdatedAt`.
        *   [ ] Refresh memo list/detail view on success. Handle potential 409 Conflict (show error message for now).
    *   [ ] **Delete:** Wire up "Delete" button in `MemoEditor` to call `DELETE /api/memo/[id]`. On success, clear selection and refresh list.
*   [ ] **Responsive Design:** Apply Tailwind classes throughout UI components to ensure layout works on different screen sizes.

**V. Advanced Features & Logic**

*   [ ] **Implement Centralized Polling System:**
    *   [ ] Create `src/features/polling/context/PollingContext.tsx`:
        *   [ ] Set up `setInterval` for the global tick (e.g., 5 seconds from `constants.ts`).
        *   [ ] Maintain a list of registered callback functions.
        *   [ ] Provide `registerPollingTask` and `unregisterPollingTask` functions via context.
    *   [ ] Create `src/features/polling/hooks/usePolling.ts`:
        *   [ ] Hook that accepts a callback function and registers/unregisters it with the `PollingContext` using `useEffect`.
    *   [ ] Add `PollingProvider` to `src/contexts/Providers.tsx` (wrapping `SessionProvider` or vice-versa).
    *   [ ] **Integrate Polling:**
        *   [ ] Modify `useMemosList`: Use `usePolling` to trigger revalidation/refetch of the memo list (via SWR/React Query's mutate/refetch function).
        *   [ ] Modify `useMemoDetail`: Use `usePolling` to trigger revalidation/refetch *only if the current user is not the owner* (`!isOwner`).
*   [ ] **Implement Auto-Save & Update Queue:**
    *   [ ] Create `src/features/memo/hooks/useMemoUpdateQueue.ts`:
        *   [ ] Manages a queue of update requests (`{ memoId, data, clientUpdatedAt }`).
        *   [ ] Processes one request at a time sequentially, calling the `PUT /api/memo/[id]` endpoint.
        *   [ ] Handles responses (success, conflict, error) and potentially exposes status/callbacks.
    *   [ ] Create `src/features/memo/hooks/useMemoAutoSave.ts`:
        *   [ ] Takes the current memo state (`title`, `content`, `isPublic`), `memoId`, and the last fetched `clientUpdatedAt` as input.
        *   [ ] Uses `useDebounce` (either custom or from a library) on the memo state changes.
        *   [ ] When debounced value changes:
            *   Checks if changes are significant (optional).
            *   Adds an update task to the `useMemoUpdateQueue` hook with the necessary data.
    *   [ ] **Integrate Auto-Save:**
        *   [ ] Use `useMemoAutoSave` within `MemoEditor.tsx`.
        *   [ ] Remove the manual "Save" button (or repurpose it).
        *   [ ] Feed the current editor state and the `clientUpdatedAt` (from `useMemoDetail` data) to the hook.
    *   [ ] **Pause Polling During Edit:**
        *   [ ] Enhance `usePolling` or add logic in `MemoEditor`/`useMemoDetail` to temporarily disable/pause the polling re-fetch for the *specific memo being edited* when the editor has focus or changes are made. Re-enable when focus is lost or saving completes. (This prevents server data overwriting local edits while typing).
*   [ ] **Implement Client-Side Optimistic Updates & Conflict Handling:**
    *   [ ] **Optimistic UI:** Update the local state displayed in `MemoEditor` immediately on input change (already done via controlled components).
    *   [ ] **Conflict Handling:** Enhance `useMemoUpdateQueue` or the component using it:
        *   [ ] On successful PUT (2xx): Update the local `clientUpdatedAt` with the timestamp from the successful response (if returned) or assume success. Show subtle success indicator.
        *   [ ] On conflict (409):
            *   Notify the user clearly ("Changes couldn't be saved, someone else edited this memo.").
            *   *Strategy 1:* Revert optimistic updates in the editor to the last *known good state* before the failed save attempt.
            *   *Strategy 2:* Automatically re-fetch the latest data for that memo (`useMemoDetail` refetch) to show the conflicting server state.
            *   *Strategy 3:* Offer the user options (overwrite, view diff, etc. - more complex). Start with notification + re-fetch (Strategy 2).
        *   [ ] On other errors (5xx, network): Notify the user ("Failed to save changes"). Potentially keep the item in the queue for retry later.

**VI. Code Quality & Best Practices (Ongoing)**

*   [ ] **Adhere to Code Quality Philosophy:** Continuously review code against the principles outlined in the README (RSC vs Client Components, data fetching strategies, state management, TS rigor, functional influences, component design, Next.js conventions).
*   [ ] **Refine Type Definitions:** Ensure `src/types/` are accurate and comprehensive for API, DB, and domain models. Use generics and utility types where beneficial. Avoid `any`.
*   [ ] **Component Structure:** Refactor components into smaller, reusable units in `src/components/ui/` and feature folders (`src/features/.../components/`). Extract logic into custom hooks (`src/hooks/` or `src/features/.../hooks/`).
*   [ ] **Testing (Implement alongside features or dedicated phase):**
    *   [ ] Unit tests for utility functions, hooks, service logic.
    *   [ ] Integration tests for API endpoints (testing request/response/db interaction).
    *   [ ] E2E tests for key user flows (sign in, create memo, edit memo, view public memo, delete memo).

**VII. Documentation & Finalization**

*   [ ] **Update README.md:**
    *   [ ] Add a final screenshot/GIF.
    *   [ ] Verify all sections (Features, Stack, API, etc.) accurately reflect the final implementation.
    *   [ ] Ensure "Getting Started" and "Running the Application" instructions are correct.
*   [ ] **Create `LICENSE` File:** Add the MIT license text.
*   [ ] **(Optional) Create `CONTRIBUTING.md`:** Add contribution guidelines if desired.
*   [ ] **Clean Up:** Remove console logs, commented-out code, unused files.
*   [ ] **Build for Production:** Run `npm run build` to ensure no build errors.

**VIII. Address Known Issues & Future Enhancements (Post-MVP)**

*   [ ] **UI Feedback:** Add loading indicators, toast notifications for save/poll/conflict events.
*   [ ] *(Future)* Investigate replacing polling with WebSockets.
*   [ ] *(Future)* Add Markdown/Rich Text Editor.
*   [ ] *(Future)* Implement folders/tags.
*   [ ] *(Future)* Implement search.
*   [ ] *(Future)* Enhance error logging/reporting (e.g., Sentry).