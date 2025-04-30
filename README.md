# lkjsxcnext

A simple yet powerful web application for creating, viewing, and managing memos, built with Next.js, Prisma, and NextAuth. Features user authentication, public/private memo visibility, real-time updates via polling, and robust automatic saving with conflict resolution.

*[Optional: Add a screenshot or GIF of the application here]*
`[Screenshot/Demo GIF]`

## Table of Contents

-   [Features](#features)
-   [Technical Stack](#technical-stack)
-   [Core Concepts](#core-concepts)
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
-   **Database:** PostgreSQL (or any Prisma-supported database)
-   **Styling:** Tailwind CSS
-   **UI:** React
-   **Language:** TypeScript

## Core Concepts

-   **Centralized Polling (`PollingContext`, `usePolling`):** Instead of scattering `setInterval` calls, a single global timer ("tick") runs every 5 seconds. Components use the `usePolling` hook to register tasks (functions) that should run on each tick. This provides a manageable way to handle periodic data fetching for real-time updates without overwhelming the server or client. Polling is intelligently paused for memos being actively edited by the current user.
-   **Auto-Save Queue (`useAutoSave`, `useMemoUpdateQueue`):** To handle potentially rapid edits, the `useAutoSave` hook doesn't send an API request directly on every change. Instead, it debounces edits and adds update requests to a queue managed by `useMemoUpdateQueue`. This queue processes one update at a time, ensuring sequential consistency and preventing race conditions from the client-side.
-   **Optimistic Concurrency Control (OCC):** The `PUT /api/memo/[id]` endpoint implements a basic form of OCC. The client sends its last known update timestamp (`clientUpdatedAt`) along with the new content. The server compares this timestamp with the one stored in the database. If the client's timestamp is older, it means someone else updated the memo since the client last fetched it, so the server rejects the update (HTTP 409 Conflict) to prevent data loss.

## Project Structure

```
.
├── prisma/                  # Prisma schema, migrations, seeds
│   └── schema.prisma
├── public/                  # Static assets (images, fonts, etc.)
├── src/
│   ├── app/                 # Next.js App Router (Pages & API Routes)
│   │   ├── api/             # Serverless API endpoints
│   │   │   ├── auth/[...nextauth]/route.ts # NextAuth catch-all route
│   │   │   ├── memo/                       # Memo API routes
│   │   │   │   ├── route.ts                # GET (list), POST (create)
│   │   │   │   └── [id]/route.ts           # GET (detail), PUT (update), DELETE
│   │   ├── layout.tsx       # Root application layout
│   │   └── page.tsx         # Main application page component (renders Explorer, MainWindow)
│   ├── components/          # Reusable React components
│   │   ├── AuthButtons.tsx  # Sign in/out buttons
│   │   ├── Explorer.tsx     # Left sidebar: Memo list, New Memo button
│   │   ├── Header.tsx       # Top navigation bar
│   │   ├── MainWindow.tsx   # Main content area (MemoViewer or MemoEditor)
│   │   ├── MemoEditor.tsx   # Editor view for a memo
│   │   ├── MemoViewer.tsx   # Read-only view for a memo
│   │   ├── PollingContext.tsx # Context and Provider for centralized polling
│   │   └── Spinner.tsx      # Loading indicator
│   ├── hooks/               # Custom React Hooks for logic reuse
│   │   ├── useAutoSave.ts        # Debounces input and triggers save action
│   │   ├── useMemoDetail.ts      # Fetches and manages single memo state
│   │   ├── useMemoUpdateQueue.ts # Manages sequential API updates for a memo
│   │   ├── useMemos.ts           # Fetches and manages the list of memos
│   │   └── usePolling.ts         # Hook to register/unregister tasks with PollingContext
│   ├── lib/                 # Core utilities, clients, configurations
│   │   ├── auth.ts          # NextAuth configuration options
│   │   ├── prisma.ts        # Prisma client singleton instance
│   │   └── utils.ts         # General utility functions (e.g., date formatting)
│   └── types/               # TypeScript type definitions
│       └── index.ts         # Shared types (Memo, User, etc.)
├── .env.example             # Example environment variables file
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

model Memo {
  id        String   @id @default(cuid())
  title     String
  content   String?  @db.Text // Assuming content can be long
  isPublic  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt // Managed by Prisma/DB
  clientUpdatedAt DateTime @default(now()) // Timestamp from client for conflict resolution

  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId String

  @@index([authorId])
}

// Default NextAuth models (User, Account, Session, VerificationToken)
// ... (Refer to NextAuth Prisma Adapter documentation)
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  memos         Memo[]    // Relation to memos created by the user
}

// ... other NextAuth models
```

## Getting Started

### Prerequisites

-   Node.js (v16.x or later recommended)
-   npm, yarn, or pnpm
-   Git
-   A PostgreSQL database (or modify `prisma/schema.prisma` and `.env` for a different database)
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
    # Example for PostgreSQL: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
    DATABASE_URL="postgresql://..."

    # NextAuth Configuration
    # Generate a strong secret: `openssl rand -base64 32`
    NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET"
    # Your application's base URL
    NEXTAUTH_URL="http://localhost:3000" # Change for deployment

    # Google OAuth Credentials
    # Get these from Google Cloud Console -> APIs & Services -> Credentials
    GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
    GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

    ```

### Database Setup

1.  **Apply database migrations:** This will create the necessary tables based on your `prisma/schema.prisma` file.
    ```bash
    npx prisma migrate dev --name init
    ```
    *(Follow prompts if any)*

2.  **Generate Prisma Client:** Ensure the Prisma client is up-to-date with your schema.
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

-   **~~Memo Selection Issue:~~** ~~When signed in, selecting a memo sometimes prevents selecting another.~~ *(Status: Believed Solved - The original issue description was unclear, but subsequent fixes likely addressed this. Re-verify if necessary).*
-   **~~Low Polling Rate:~~** *(Status: Solved)* Polling interval is now configurable and set to 5 seconds.
-   **~~Missing "Add Memo" Button:~~** *(Status: Solved)* An add button should now be present in the Explorer.
-   **~~Missing Public/Private Toggle:~~** *(Status: Solved)* A toggle switch for visibility should now be present in the Memo Editor.

**Potential Future Enhancements:**

-   Implement real-time collaboration using WebSockets (e.g., Pusher, Socket.IO) instead of polling for a more instant experience.
-   Add Markdown support to the memo content.
-   Implement folders or tags for organizing memos.
-   Add full-text search capabilities.
-   Improve UI/UX feedback during saving, polling, and conflict resolution states.

## Contributing

Contributions are welcome! Please follow standard Gitflow practices: open an issue to discuss proposed changes, then submit a pull request from a feature branch.

*(Optional: Add more specific contribution guidelines if needed)*

## License

This project is licensed under the [MIT License](LICENSE). *(Optional: Create a LICENSE file with the MIT license text)*