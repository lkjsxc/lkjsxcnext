# Memo Application

This is a simple web application for creating, viewing, and managing memos. It supports user authentication, public and private memos, and automatic saving with conflict resolution.

## Features

- **User Authentication:** Sign in using Google (via NextAuth).
- **Memo Management:**
  - Create new memos.
  - View existing memos.
  - Edit your own memos.
  - Delete your own memos.
- **Public and Private Memos:**
  - Memos can be marked as public or private.
  - Public memos are visible to all users (authenticated or not).
  - Private memos are only visible to the authenticated author.
- **Automatic Saving:** Memo content is automatically saved periodically while editing.
- **Optimistic Updates & Conflict Resolution:**
  - Memo updates are queued and processed sequentially.
  - The server uses a client-provided timestamp (`clientUpdatedAt`) to detect and reject older updates, preventing data loss from concurrent edits (though concurrent editing by multiple users is not explicitly supported or prevented in the UI).
- **Centralized Polling:**
 - Polling logic is now centralized within the `PollingContext.tsx` component.
 - A global tick runs every 5 seconds, triggering all registered polling tasks.
 - The `usePolling` hook allows components to register and unregister their specific polling needs.
 - The list of memos is periodically polled to show new or updated memos.
 - When viewing a memo that you do *not* own, the memo details are periodically polled to show updates made by the owner.
 - When editing your own memo, polling for that specific memo's details is disabled to prevent server changes from overwriting your current edits in the editor.
- **Responsive Design:** (Inferred from Tailwind usage and component structure, but not explicitly detailed in code snippets read).

## Structure

The project follows a standard Next.js App Router structure. Key directories and files include:
```
.
├── prisma/                  # Prisma schema and migrations
│   └── schema.prisma
├── public/                  # Static assets
├── src/
│   ├── app/                 # Next.js App Router directory
│   │   ├── api/             # API Routes
│   │   │   ├── auth/[...nextauth]/route.ts # NextAuth handler
│   │   │   ├── memo/
│   │   │   │   ├── route.ts          # Handles GET (list), POST (create)
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # Handles GET (detail), PUT (update), DELETE
│   │   ├── layout.tsx       # Root layout (includes SessionProvider)
│   │   └── page.tsx         # Main application page component
│   ├── components/          # Reusable UI Components
│   │   ├── AuthButtons.tsx
│   │   ├── Explorer.tsx
│   │   ├── Header.tsx
│   │   ├── MainWindow.tsx
│   │   ├── MemoEditor.tsx
│   │   ├── MemoViewer.tsx
│   │   ├── Polling.tsx      # global polling tick with Queue
│   │   └── Spinner.tsx      # Simple loading spinner
│   ├── hooks/               # Custom React Hooks
│   │   ├── useAutoSave.ts
│   │   ├── useMemoDetail.ts
│   │   ├── useMemoUpdateQueue.ts
│   │   ├── useMemos.ts
│   │   └── usePolling.ts    # Generic polling hook
│   ├── lib/                 # Utility functions, Prisma client, Auth options
│   │   ├── auth.ts          # NextAuth configuration options
│   │   ├── prisma.ts        # Prisma client instance
│   │   └── utils.ts         # Helper functions (e.g., date formatting)
│   └── types/               # TypeScript type definitions
│       └── index.ts         # Main types (e.g., Memo)
├── .env                     # Environment variables (DB URL, Google creds, NEXTAUTH_SECRET)
├── next.config.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Layout
- **Header** 
  - left: lkjsxcnext(this project name)
  - right: google signin button (or display account name and signout button)
- **Explorer**
  - Show public all user memo and my private memo
  **MainWindow** 
  - editor mode: when (I) changed, add send queue (polling).
    - title text box
    - content text box
    - public / private toggle.
    - delete button
  - viewer mode: when (other user) changed, add recv queue (polling).
    - title text 
    - content text

## Known issues
- When signed, Once I select a memo, I cannot select another memo. There seems to be a problem other than Explorer.tsx.
- Polling rate is too low. 5 seconds is ideal. (Solved)
- There is no button to add a memo in Explorer. (Solved)
- There is no switch to toggle private/public in Editor. A green and gray toggle is preferable. (Solved)

## Technical Stack

- **Framework:** Next.js (App Router)
- **Authentication:** NextAuth.js (with Google Provider)
- **Database/ORM:** Prisma
- **Frontend:** React, Tailwind CSS
- **API:** Next.js API Routes

## API Endpoints

- `GET /api/memo`: Fetch a list of memos. Supports `?scope=private` (requires authentication) to fetch user's private memos, or defaults to public memos.
- `POST /api/memo`: Create a new memo (requires authentication).
- `GET /api/memo/[id]`: Fetch a specific memo by ID. Returns memo details and an `isOwner` flag.
- `PUT /api/memo/[id]`: Update a specific memo by ID (requires authentication and ownership). Includes `clientUpdatedAt` for conflict detection.
- `DELETE /api/memo/[id]`: Delete a specific memo by ID (requires authentication and ownership).

## Data Model

Based on Prisma schema (inferred from code usage):

- **Memo:**
  - `id`: Unique identifier
  - `title`: Memo title
  - `content`: Memo content
  - `isPublic`: Boolean indicating if the memo is public
  - `authorId`: ID of the user who created the memo
  - `createdAt`: Timestamp of creation
  - `updatedAt`: Timestamp of last update (server-side)
  - `clientUpdatedAt`: Timestamp of last update from the client (used for conflict resolution)

- **User:** (Managed by NextAuth/Prisma Adapter)
  - `id`: Unique identifier
  - `email`: User's email
  - `name`: User's name
  - `image`: User's profile image URL
  - (Other fields managed by NextAuth adapter)

## Specifications Derived from Code

- **Server-Side Conflict Resolution:** The `PUT /api/memo/[id]` endpoint checks the `clientUpdatedAt` timestamp provided by the client against the `clientUpdatedAt` stored in the database. If the incoming timestamp is older, the update is rejected with a 409 Conflict status. This is a basic form of optimistic concurrency control.
- **Client-Side Auto-Save Behavior:** The `useAutoSave` hook triggers saves periodically. The `use_memo_auto_save` hook queues these updates using `useMemoUpdateQueue`. This queue processes updates sequentially.
- **Authentication Requirement:** API endpoints for creating, updating, and deleting memos, as well as fetching private memos, require an authenticated session.
- **Ownership Check:** Update and delete operations on memos are restricted to the authenticated author of the memo.

## Setup and Usage

(Instructions for setting up the project, including environment variables for NextAuth and Prisma, database setup, and running the development server, would go here. This information is not available from the code snippets read.)