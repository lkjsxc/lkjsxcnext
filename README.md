# lkjsxcnext

A simple yet powerful web application for creating, viewing, and managing memos, built with Next.js, Prisma, and NextAuth. Features user authentication, public/private memo visibility, real-time updates via polling, and robust automatic saving with conflict resolution.

*[Optional: Add a screenshot or GIF of the application here]*
`[Screenshot/Demo GIF]`

## Table of Contents

-   [Features](#features)
-   [Technical Stack](#technical-stack)
-   [Core Concepts](#core-concepts)
-   [Code Quality & Philosophy](#code-quality--philosophy)
-   [Project Structure](#project-structure)
-   [API Endpoints](#api-endpoints)
-   [Data Model](#data-model)
-   [Getting Started](#getting-started)
    -   [Prerequisites](#prerequisites)
    -   [Installation](#installation)
    -   [Environment Variables](#environment-variables)
    -   [Database Setup](#database-setup)
-   [Running the Application](#running-the-application)
-   [Known Issues & Future Enhancements](#known-issues--future-enhancements)
-   [Contributing](#contributing)
-   [License](#license)

## Features

-   **Google Authentication:** Secure sign-in/sign-up using NextAuth.js with the Google Provider.
-   **Memo CRUD Operations:** Create, Read, Update, and Delete memos seamlessly.
-   **Visibility Control:** Mark memos as `public` (visible to everyone) or `private` (visible only to the author).
-   **Automatic Saving:** Edits are saved automatically in the background at regular intervals.
-   **Optimistic Updates & Conflict Resolution:**
    -   UI updates instantly when changes are made (optimistic).
    -   Changes are queued and sent sequentially to the server.
    -   Server-side timestamp (`clientUpdatedAt`) validation prevents older edits from overwriting newer ones, ensuring data integrity during concurrent access attempts (though simultaneous multi-user editing of the *same* memo isn't explicitly designed in the UI).
-   **Real-time Updates via Centralized Polling:**
    -   A global polling mechanism (`PollingContext`) checks for updates every 5 seconds.
    -   The memo list automatically refreshes to show new or modified memos.
    -   When viewing a memo you don't own, its content is periodically polled for updates from the owner.
    -   Polling for a specific memo is paused while you are actively editing it to prevent server data from overwriting local edits.
-   **Responsive Design:** Adapts to various screen sizes (built with Tailwind CSS).

## Technical Stack

-   **Framework:** Next.js 13+ (App Router)
-   **Authentication:** NextAuth.js
-   **Database ORM:** Prisma
-   **Database:** SQLite (Note: Getting Started assumes PostgreSQL, update if using SQLite)
-   **Styling:** Tailwind CSS
-   **UI:** React
-   **Language:** TypeScript

## Core Concepts

-   **Centralized Polling (`PollingContext`, `usePolling`):** Instead of scattering `setInterval` calls, a single global timer ("tick") runs every 5 seconds. Components use the `usePolling` hook to register tasks (functions) that should run on each tick. This provides a manageable way to handle periodic data fetching for real-time updates without overwhelming the server or client. Polling is intelligently paused for memos being actively edited by the current user.
-   **Auto-Save Queue (`useAutoSave`, `useMemoUpdateQueue`):** To handle potentially rapid edits, the `useAutoSave` hook doesn't send an API request directly on every change. Instead, it debounces edits and adds update requests to a queue managed by `useMemoUpdateQueue`. This queue processes one update at a time, ensuring sequential consistency and preventing race conditions from the client-side.
-   **Optimistic Concurrency Control (OCC):** The `PUT /api/memo/[id]` endpoint implements a basic form of OCC. The client sends its last known update timestamp (`clientUpdatedAt`) along with the new content. The server compares this timestamp with the one stored in the database. If the client's timestamp is older, it means someone else updated the memo since the client last fetched it, so the server rejects the update (HTTP 409 Conflict) to prevent data loss.

## Code Quality & Philosophy

This project strives for maintainable, performant, and type-safe code by adhering to the following principles when working with Next.js (App Router) and TypeScript:

-   **Prioritize React Server Components (RSC):** Default to RSCs for improved performance (smaller client bundles, closer data fetching). Use Client Components (`"use client"`) only where necessary for interactivity (hooks like `useState`, `useEffect`, event handlers). Understand the limitations of RSCs (no browser APIs, props must be serializable).
-   **Strategic Data Fetching:**
    -   **RSC:** Fetch data directly within components using `async/await`. Leverage Next.js's extended `fetch` options for caching and revalidation.
    -   **Client Components:** For client-side fetching, caching, and mutations, prefer libraries like SWR or TanStack Query (React Query) over manual `useEffect` fetching for better state management, caching, and developer experience.
    -   **Mutations:** Use Server Actions for form submissions and server mutations where possible, reducing the need for manual API route handling.
-   **Effective State Management:**
    -   Start with local state (`useState`, `useReducer`).
    -   Use React Context for slowly changing global UI state, avoiding excessive prop drilling.
    -   Consider lightweight state libraries (e.g., Zustand, Jotai) for complex client-side state if Context becomes unwieldy.
    -   Distinguish between client state and server cache state (managed by SWR/TanStack Query).
-   **TypeScript Rigor:**
    -   Enforce strong typing throughout the application. Avoid `any`.
    -   Define clear `interface` or `type` definitions for props, API responses, and data structures.
    -   Utilize TypeScript's utility types and generics for reusable, type-safe code.
    -   Enable `strict` mode in `tsconfig.json`.
-   **Functional Programming Influences:**
    -   Favor immutability for state updates.
    -   Write pure functions where possible.
    -   Minimize side effects. Manage necessary side effects explicitly, often within custom hooks or event handlers, limiting the reliance on `useEffect` for complex logic flows.
-   **Component Design:**
    -   Break down components into smaller, reusable units with clear responsibilities.
    -   Extract complex logic and stateful behavior into custom hooks (`use...`).
    -   Favor component composition.
-   **Leverage Next.js Conventions:** Utilize App Router file conventions (`layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`), Route Handlers, and built-in optimizations like `next/image` and `next/dynamic`.

## Project Structure

```
.
├── prisma/                  # Prisma schema, migrations, seeds
│   └── schema.prisma
├── public/                  # Static assets (images, fonts, etc.)
├── src/
│   ├── app/                 # Next.js App Router: Routing, Layouts, Pages, API Handlers
│   │   ├── (main)/          # Route Group for main application layout/pages
│   │   │   ├── layout.tsx   # Main layout (incl. Header, possibly sidebar structure)
│   │   │   └── page.tsx     # Main dashboard/entry page component (renders Memo features)
│   │   ├── api/             # Serverless API endpoints (Route Handlers)
│   │   │   ├── auth/[...nextauth]/route.ts # NextAuth catch-all route
│   │   │   ├── memos/                      # Grouped Memo API routes
│   │   │   │   ├── route.ts                # GET (list), POST (create)
│   │   │   │   └── [id]/                   # Operations on a specific memo
│   │   │   │       ├── route.ts            # GET (detail), PUT (update), DELETE
│   │   │   │       └── utils.ts            # (Optional) Utility functions specific to this API endpoint
│   │   │   └── _lib/           # (Optional) Shared utilities/middleware for API routes (e.g., auth checks)
│   │   ├── layout.tsx       # Root application layout (providers, global styles)
│   │   └── global-error.tsx # Optional: Global error boundary for app/
│   │   └── loading.tsx      # Optional: Root loading state
│   ├── components/          # Shared, reusable React components (UI Primitives & Layouts)
│   │   ├── layout/          # Components defining page structure (Header, SidebarWrapper etc.)
│   │   │   └── Header.tsx
│   │   └── ui/              # Generic, context-agnostic UI elements (Button, Input, Spinner, Card etc.)
│   │       └── Spinner.tsx
│   │       └── Button.tsx     # Example
│   │       └── ...
│   ├── features/            # Feature-specific modules (UI, Hooks, Logic)
│   │   ├── auth/
│   │   │   └── components/
│   │   │       └── AuthButtons.tsx
│   │   ├── memos/
│   │   │   ├── components/    # Components specific to the Memo feature
│   │   │   │   ├── MemoEditor.tsx
│   │   │   │   ├── MemoViewer.tsx
│   │   │   │   ├── MemoList.tsx    # Renamed/Refactored from Explorer?
│   │   │   │   └── MemoListItem.tsx # Extracted item for the list
│   │   │   ├── hooks/         # Hooks specific to the Memo feature logic
│   │   │   │   ├── useMemoDetail.ts
│   │   │   │   ├── useMemosList.ts # Renamed from useMemos for clarity
│   │   │   │   └── useMemoAutoSave.ts # Combines auto-save & queue logic? Or keeps separate
│   │   │   │   └── useMemoUpdateQueue.ts # (If kept separate from useMemoAutoSave)
│   │   │   └── services/      # (Optional but recommended) Logic for memo data operations (called by API/Server Actions)
│   │   │       └── memoService.ts # Functions like getMemo, createMemo, updateMemo, deleteMemo
│   │   └── polling/
│   │       ├── context/       # Context definitions
│   │       │   └── PollingContext.tsx
│   │       └── hooks/         # Hooks related to polling
│   │           └── usePolling.ts
│   ├── contexts/            # Application-wide contexts (can also live in features if specific)
│   │   └── Providers.tsx    # Component to aggregate all context providers (Polling, SessionProvider, etc.)
│   ├── hooks/               # Shared, cross-cutting custom hooks (if any)
│   │   └── (e.g., useDebounce.ts, useLocalStorage.ts)
│   ├── lib/                 # Core utilities, clients, configurations, constants
│   │   ├── auth.ts          # NextAuth configuration options
│   │   ├── constants.ts     # Application constants (e.g., polling interval, API paths)
│   │   ├── prisma.ts        # Prisma client singleton instance
│   │   └── utils.ts         # General utility functions (date formatting, etc.)
│   ├── services/            # Abstracted backend interaction logic (alternative to feature-specific services)
│   │   └── (e.g., memoService.ts if not in features/memos) - Choose one location pattern
│   └── types/               # Shared TypeScript type definitions & augmentations
│       ├── index.ts         # Maybe export grouped types
│       ├── api.ts           # Types for API request/response payloads
│       ├── db.ts            # Types related to Prisma models (can re-export generated types)
│       ├── memo.ts          # Specific types for the Memo domain object
│       └── next-auth.d.ts   # Augmenting NextAuth types (e.g., Session user)
├── .env                     # environment variables file (GITIGNORED!)
├── .env.example             # Example environment variables
├── next.config.js           # Next.js configuration
├── package.json             # Project dependencies and scripts
├── tailwind.config.ts       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## API Endpoints

-   `GET /api/memo`: Fetch list of memos.
    -   Defaults to public memos.
    -   `?scope=private`: Fetches authenticated user's private memos (requires auth).
    -   `?scope=all`: Fetches public memos + authenticated user's private memos (requires auth).
-   `POST /api/memo`: Create a new memo (requires auth).
    -   *Body:* `{ title: string, content: string, isPublic: boolean }`
-   `GET /api/memo/[id]`: Fetch a specific memo by ID.
    -   Returns memo details and `isOwner: boolean` flag (requires auth to determine ownership accurately, accessible publicly if memo `isPublic`).
-   `PUT /api/memo/[id]`: Update a specific memo (requires auth & ownership).
    -   *Body:* `{ title?: string, content?: string, isPublic?: boolean, clientUpdatedAt: string (ISO Date) }`
    -   Uses `clientUpdatedAt` for conflict detection. Returns 409 Conflict if the server has a newer `clientUpdatedAt`.
-   `DELETE /api/memo/[id]`: Delete a specific memo (requires auth & ownership).

## Data Model (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // Or your chosen DB provider
  url      = env("DATABASE_URL")
}

model Memo {
  id              String   @id @default(cuid())
  title           String
  content         String?  @db.Text
  isPublic        Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt // Managed by Prisma/DB
  clientUpdatedAt DateTime @default(now()) // Timestamp from client for conflict resolution

  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId String

  @@index([authorId])
}

// Default NextAuth models (User, Account, Session, VerificationToken)
// Needed for Prisma Adapter
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  memos         Memo[] // Relation to memos created by the user
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

```

## Getting Started

### Prerequisites

-   Node.js (v18.x or later recommended for Next.js 13+)
-   npm, yarn, or pnpm
-   Git
-   A PostgreSQL database instance (or modify `prisma/schema.prisma` and `.env` for a different database like SQLite)
-   Google Cloud Platform project with OAuth 2.0 Credentials (Client ID and Client Secret)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

### Environment Variables

1.  Create a `.env` file in the root of the project by copying the example file:
    ```bash
    cp .env.example .env
    ```

2.  Fill in the required environment variables in the `.env` file:

    ```dotenv
    # Database connection string (Prisma)
    # Example for PostgreSQL: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
    # Example for SQLite: file:./dev.db (place it in the prisma folder or adjust path)
    DATABASE_URL="postgresql://..."

    # NextAuth Configuration
    # Generate a strong secret: `openssl rand -base64 32` on Linux/macOS
    NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET"
    # Your application's base URL for development
    NEXTAUTH_URL="http://localhost:3000" # IMPORTANT: Change for deployment

    # Google OAuth Credentials
    # Get these from Google Cloud Console -> APIs & Services -> Credentials -> Create Credentials -> OAuth client ID
    # Ensure Authorized JavaScript origins include http://localhost:3000
    # Ensure Authorized redirect URIs include http://localhost:3000/api/auth/callback/google
    GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

    ```

### Database Setup

1.  **Apply database migrations:** This command creates the database (if it doesn't exist for some providers like SQLite) and applies all pending migrations to create the schema defined in `prisma/schema.prisma`.
    ```bash
    npx prisma migrate dev --name init
    ```
    *(You might be prompted to reset the database if changes are detected. Use `init` for the very first migration name, or choose a descriptive name for subsequent migrations.)*

2.  **Generate Prisma Client:** Ensure the Prisma Client code (`@prisma/client`) is generated and up-to-date with your schema. This usually happens automatically after `migrate dev`, but running it manually doesn't hurt.
    ```bash
    npx prisma generate
    ```

## Running the Application

1.  **Start the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```
    The application should now be running at `http://localhost:3000` (or the `NEXTAUTH_URL` you configured).

2.  **Build for production:**
    ```bash
    npm run build
    ```

3.  **Run production build:**
    ```bash
    npm start
    ```

## Known Issues & Future Enhancements

-   **UI Feedback:** Improve visual feedback during async operations like saving, polling updates, and handling save conflicts (e.g., subtle loading indicators, toast notifications for errors/conflicts).
-   **Real-time:** Replace polling with WebSockets (e.g., Pusher, Socket.IO, or Ably) for truly instant updates, especially for collaboration scenarios.
-   **Editor Features:** Add Markdown support or a richer text editor for memo content.
-   **Organization:** Implement folders, tags, or categories for better memo organization.
-   **Search:** Add full-text search capabilities across memos.
-   **Error Handling:** Enhance client-side and server-side error handling and reporting.

## Contributing

Contributions are welcome! Please feel free to open an issue to discuss potential changes or features, or submit a pull request. For major changes, please open an issue first.

*(Optional: Add more specific contribution guidelines: coding style, commit message format, etc.)*

## License

This project is licensed under the [MIT License](LICENSE). *(Remember to create a LICENSE file containing the MIT license text)*