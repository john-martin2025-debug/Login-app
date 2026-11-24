# Login App

Full-stack authentication app built with Node.js, Express, PostgreSQL, and vanilla HTML/CSS/JS.

## Features
- User signup with salted `bcrypt` password hashing
- Login with unified error handling and loading transition
- Password reset via registered email (`POST /reset-password`)
- Responsive split-screen UI with light/dark mode, live password strength meter, confirm-password matching, password generator, Caps Lock detection, and keyboard shortcuts

## Setup
1. Install dependencies:
   ```bash
   npm install
cat << 'EOF' > .env.example
DB_USER=postgres
DB_HOST=localhost
DB_NAME=postgres
DB_PASSWORD=your_password_here
DB_PORT=5432
PORT=3000
