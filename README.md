# AuthPortal — Full-Stack Authentication & User Management App

A full-stack authentication and account management web application built with **React (Vite)**, **Node.js/Express**, and **PostgreSQL** (containerized with **Podman**).

## Tech Stack
* **Frontend:** React, Vite, CSS3 (Glassmorphism, Light/Dark themes)
* **Backend:** Node.js, Express, `jsonwebtoken` (JWT), `bcrypt`, `cors`, `pg`
* **Database:** PostgreSQL running in a Podman container (`Postgres_db`)

## Key Features

### Security & Authentication
* **Bcrypt Password Hashing:** Passwords are salted and hashed (10 rounds) before storing in PostgreSQL (`password_hash`).
* **JWT Session Management:** Issues signed tokens with a 2-hour expiry; protected routes (`/me`, `/users`, `/change-password`, `/delete-account`) require valid Bearer tokens.
* **Brute-Force Protection:** Enforces a 30-second lockout with a live countdown button after 5 consecutive failed login attempts.
* **Remember Me:** Stores JWT in `localStorage` when checked, or `sessionStorage` when unchecked.

### Dashboard & Database Tools
* **Account CRUD:** Sign Up, Sign In, Forgot/Reset Password, Change Password, and Delete Account with confirmation modal.
* **Live PostgreSQL Inspector:** View registered accounts, search by email, export records to CSV, and delete test users inline.
* **JWT Inspector & Stats:** View decoded token payload (`id`, `email`, `iat`, `exp`), live session countdown, account creation date, and total user count.

### UI & UX
* **Theme Controls:** Full-page Light/Dark mode toggle and an Auto-Switch / Lock Colour toggle cycling through 4 palettes (Indigo, Emerald, Sunset, Ocean).
* **Smart Form Controls:** Show/hide password toggle, live Caps Lock indicator, strong password generator with clipboard copy, password strength meter, and real-time match validation.

## Local Setup

1. **Start PostgreSQL (Podman):**
   ```bash
   podman start Postgres_db
   ```
2. **Start the Express Backend (Port `3000`):**
   ```bash
   cd ~/login_app
   npm install
   node server.js
   ```
3. **Start the React Frontend (Port `5173`):**
   ```bash
   cd ~/login_app/client
   npm install
   npm run dev
   ```
4. Open `http://localhost:5173/` in your browser.
