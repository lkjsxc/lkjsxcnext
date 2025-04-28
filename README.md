# lkjsxcnext

## Description
A simple memo application built with Next.js, featuring Google login and the ability to create, view, update, and delete memos. Users can view public memos or, after logging in, manage their own private memos.

## Technologies Used
- **Framework:** Next.js
- **Styling:** Tailwind CSS
- **Authentication:** NextAuth.js with Google Provider
- **Database/ORM:** Prisma

## Features
- User authentication via Google Sign-in.
- Public memo explorer to view memos shared by others.
- Private memo list and editor for logged-in users to manage their own memos.
- Toggle functionality to switch between viewing public memos and personal memos.
- API endpoints for fetching, creating, updating, and deleting memos.

## Page
- **Navbar**
    - Logo (lkjsxcnext)
    - Account
    - Sign Out button (preliminary)
- **Explorer** 
    - Create new memo button (Will be implemented later)
    - Filter title (Will be implemented later)
    - Public everyone memos
- **MainWindow**
    - EditorTab
        - Delete memo button
        - Toggle public/private
        - Tittle textbox
        - Content text editor
    - ViewerTab
        - Title
        - Content

## Explorer
- show other user public memo and mine all memo.
- Only the title is displayed.
- clicking memo will take you to the MainWindow for more details.

## MainWindow
- When other user memo, Show title and content.
- When selected mine memo, edit the selected memo.
- On the right side of the page.
- Toggle public/private.
