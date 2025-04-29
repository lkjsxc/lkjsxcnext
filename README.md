# lkjsxcnext

## Description
A simple memo application built with Next.js, Tailwind CSS, NextAuth.js, and Prisma.

## Technologies Used
- **Framework:** Next.js
- **Styling:** Tailwind CSS
- **Authentication:** NextAuth.js with Google Provider
- **Database/ORM:** Prisma

## Features
- User authentication via Google Sign-in.
- Public memo explorer to view memo shared by others.
- Private memo list and editor for logged-in users to manage their own memo.
- Toggle functionality to switch between viewing public memo and personal memo.
- API endpoints for fetching, creating, updating, and deleting memo.

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd lkjsxcnext
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    Create a `.env.local` file in the root directory and add the following:
    ```env
    DATABASE_URL="your_database_connection_string"
    NEXTAUTH_URL="http://localhost:3000" # Or your deployment URL
    NEXTAUTH_SECRET="your_nextauth_secret" # Generate a strong secret
    GOOGLE_CLIENT_ID="your_google_client_id"
    GOOGLE_CLIENT_SECRET="your_google_client_secret"
    ```
    *   `DATABASE_URL`: Your Prisma database connection string (e.g., for PostgreSQL, MySQL, SQLite).
    *   `NEXTAUTH_SECRET`: Generate a random string (e.g., using `openssl rand -base64 32`).
    *   `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: Obtain these from the Google Cloud Console for your OAuth 2.0 credentials.
4.  **Set up the database:**
    Run Prisma migrations to create the necessary tables:
    ```bash
    npx prisma migrate dev --name init
    ```
5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## Page Structure

- **Navbar**
    - Logo (lkjsxcnext)
    - Account (Displays user info if logged in)
    - Sign Out button (Visible when logged in)
- **Explorer**
    - Create new memo button
    - Filter title (Future implementation)
    - Displays a list of memo (public or private based on toggle/authentication)
- **MainWindow**
    - Located on the right side of the page.
    - **EditorTab:** (Visible when editing a personal memo)
        - Delete memo button
        - Toggle public/private status
        - Title textbox
        - Content text editor
    - **ViewerTab:** (Visible when viewing a public memo or a personal memo in view mode)
        - Displays memo title
        - Displays memo content

## Explorer Functionality

- Shows a list of memo. Can display public memo from all users or all memo belonging to the logged-in user.
- Only the memo title is displayed in the list.
- Clicking a memo in the list opens it in the MainWindow for viewing or editing.

## MainWindow Functionality

- Displays the details of a selected memo.
- If the selected memo belongs to the logged-in user, it opens in the EditorTab, allowing modifications.
- If the selected memo is public and does not belong to the logged-in user, it opens in the ViewerTab for read-only display.
- Includes a toggle to change the public/private status of a personal memo.

## API Endpoints

The application provides the following REST API endpoints for managing memo:

### `GET /api/memo`

*   **Description:** Fetches a list of memo.
*   **Query Parameters:**
    *   `scope`: (Optional) Specifies the scope of memo to fetch.
        *   `'public'`: Fetches all public memo (default if not specified or user is not authenticated).
        *   `'private'`: Fetches all memo belonging to the authenticated user. Requires authentication.
*   **Authentication:** Required for `scope='private'`.
*   **Responses:**
    *   `200 OK`: Returns an array of memo objects.
        ```json
        [
          {
            "id": "string",
            "title": "string",
            "content": "string",
            "isPublic": boolean,
            "createdAt": "string (ISO 8601 date)",
            "updatedAt": "string (ISO 8601 date)",
            "authorId": "string"
          },
          // ... more memo
        ]
        ```
    *   `401 Unauthorized`: If `scope='private'` is requested without authentication.
        ```json
        {
          "message": "Unauthorized"
        }
        ```

### `POST /api/memo`

*   **Description:** Creates a new memo for the authenticated user.
*   **Authentication:** Required.
*   **Request Body (JSON):**
    ```json
    {
      "title": "string",
      "content": "string",
      "isPublic": boolean (optional, defaults to false)
    }
    ```
*   **Responses:**
    *   `201 Created`: Returns the newly created memo object.
        ```json
        {
          "id": "string",
          "title": "string",
          "content": "string",
          "isPublic": boolean,
          "createdAt": "string (ISO 8601 date)",
          "updatedAt": "string (ISO 8601 date)",
          "authorId": "string"
        }
        ```
    *   `401 Unauthorized`: If the user is not authenticated.
        ```json
        {
          "message": "Unauthorized"
        }
        ```

### `GET /api/memo/{id}`

*   **Description:** Fetches a specific memo by its ID.
*   **URL Parameters:**
    *   `id`: The ID of the memo to fetch.
*   **Authentication:** Not required (can fetch public memo).
*   **Responses:**
    *   `200 OK`: Returns the memo object.
        ```json
        {
          "id": "string",
          "title": "string",
          "content": "string",
          "isPublic": boolean,
          "createdAt": "string (ISO 8601 date)",
          "updatedAt": "string (ISO 8601 date)",
          "authorId": "string"
        }
        ```
    *   `404 Not Found`: If the memo with the given ID does not exist.
        ```json
        {
          "message": "Memo not found"
        }
        ```

### `PUT /api/memo/{id}`

*   **Description:** Updates a specific memo belonging to the authenticated user.
*   **Authentication:** Required. The authenticated user must be the author of the memo.
*   **URL Parameters:**
    *   `id`: The ID of the memo to update.
*   **Request Body (JSON):**
    ```json
    {
      "title": "string",
      "content": "string",
      "isPublic": boolean
    }
    ```
*   **Responses:**
    *   `200 OK`: Returns the updated memo object.
        ```json
        {
          "id": "string",
          "title": "string",
          "content": "string",
          "isPublic": boolean,
          "createdAt": "string (ISO 8601 date)",
          "updatedAt": "string (ISO 8601 date)",
          "authorId": "string"
        }
        ```
    *   `401 Unauthorized`: If the user is not authenticated or is not the author of the memo.
        ```json
        {
          "message": "Unauthorized"
        }
        ```

### `DELETE /api/memo/{id}`

*   **Description:** Deletes a specific memo belonging to the authenticated user.
*   **Authentication:** Required. The authenticated user must be the author of the memo.
*   **URL Parameters:**
    *   `id`: The ID of the memo to delete.
*   **Responses:**
    *   `200 OK`: Returns a success message.
        ```json
        {
          "message": "Memo deleted successfully"
        }
        ```
    *   `401 Unauthorized`: If the user is not authenticated or is not the author of the memo.
        ```json
        {
          "message": "Unauthorized"
        }
