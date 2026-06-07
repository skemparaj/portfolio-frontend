# Kemparaj's Full-Stack Portfolio

A production-ready full-stack portfolio application built with **Node.js, Express, MySQL, and Socket.io**. Features include admin dashboard, analytics tracking, contact management, project showcase, and real-time notifications.

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- **Node.js** v16+ ([Download](https://nodejs.org))
- **MySQL** 5.7+ ([Download](https://dev.mysql.com/downloads/mysql/))
- **Git** (optional, for cloning)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Create a `.env` file in the project root with these values:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=portfolio_db
PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_kemparaj_portfolio_key_12345
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
ADMIN_RECEIVER_EMAIL=your_email@gmail.com
```

**Note:** Adjust `DB_PASSWORD`, `EMAIL_USER`, and `EMAIL_PASS` to your actual MySQL password and Gmail credentials.

### Step 3: Initialize the Database
```bash
npm run apply-schema
```
This creates the `portfolio_db` database and all required tables (admins, visitors, contact_messages, projects, resume_downloads).

### Step 4: Create Admin User (Optional)
```bash
npm run add-admin
```
Follow the prompts to create an admin account. Default example:
- Username: `anyone`
- Password: `admin123`

### Step 5: Start the Application

**Option A: Run Frontend + Backend Together (RECOMMENDED)**
```bash
npm run dev:all
```
This launches:
- **Backend**: http://localhost:5000 (Node.js server)
- **Frontend**: http://127.0.0.1:3000 (Live server with auto-refresh)

**Option B: Run Backend Only**
```bash
npm run dev:backend
```
Backend runs at http://localhost:5000 only. Frontend files served at root.

**Option C: Run Frontend Only** (for testing)
```bash
npm run dev:frontend
```
Frontend runs at http://127.0.0.1:3000 only (requires backend to be running separately).

**Option D: Run Production Build**
```bash
npm start
```
Serves both frontend and backend from port 5000.

---

## 📋 Key Features

- **📊 Admin Dashboard** (http://localhost:5000/admin/index.html)
  - Real-time visitor analytics
  - Contact message management
  - Export data as CSV & PDF
  - Live visitor count via Socket.io

- **🔐 Secure Admin Panel**
  - JWT authentication
  - CSRF token protection on state-changing routes
  - Password hashing with bcryptjs

- **📧 Contact Form**
  - Form validation via express-validator
  - Email notifications (Nodemailer with fallback)
  - Database storage with XSS protection

- **🎯 Project Showcase**
  - Seed projects from database
  - REST API for fetching projects

- **📈 Analytics Tracking**
  - Visitor tracking (IP, location, device, browser)
  - Session management
  - Resume download tracking
  - Heatmap click logging support

- **🔒 Security Features**
  - Helmet.js for HTTP headers
  - Rate limiting (IP-based)
  - CORS protection
  - Input sanitization (xss-clean)
  - CSRF protection (csurf)
  - SQL injection prevention (parameterized queries)

---

## 📁 Project Structure

```
portfolio/
├── src/
│   ├── server.js                 # Express app entry point
│   ├── config/
│   │   ├── db.js                 # MySQL connection pool
│   │   └── mail.js               # Nodemailer transporter
│   ├── controllers/
│   │   ├── authController.js     # Admin login/verify/password
│   │   ├── projectController.js  # Project CRUD
│   │   ├── contactController.js  # Contact form submission
│   │   └── analyticsController.js # Analytics endpoints
│   ├── routes/
│   │   ├── auth.js               # Auth endpoints
│   │   ├── projects.js           # Project routes
│   │   ├── contact.js            # Contact form routes
│   │   └── analytics.js          # Analytics routes
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   ├── errorHandler.js       # Global error handler
│   │   ├── rateLimiter.js        # Rate limiting
│   │   └── validators.js         # Input validation
│   └── utils/
│       └── logger.js             # Winston logger
├── public/
│   ├── index.html                # Main portfolio page
│   ├── script.js                 # Frontend JS
│   ├── styles.css                # Styling
│   └── admin/
│       ├── index.html            # Admin dashboard
│       ├── admin.js              # Admin JS
│       └── admin.css             # Admin styling
├── scripts/
│   ├── applySchema.js            # Initialize database
│   ├── addAdmin.js               # Create admin user
│   ├── listTables.js             # List DB tables
│   ├── showVisitors.js           # Show visitor data
│   ├── checkConnections.js       # Test endpoints
│   └── testContactPost.js        # Test POST flow
├── schema.sql                    # Database schema
├── .env                          # Environment variables (create manually)
├── package.json                  # Dependencies
└── README.md                     # This file
```

---

## 🧪 Testing & Verification

### Check Database Tables
```bash
node scripts/listTables.js
```

### View Recent Visitors
```bash
node scripts/showVisitors.js
```

### Verify API Connectivity
```bash
node scripts/checkConnections.js
```

### Test Contact Form (POST with CSRF)
```bash
node scripts/testContactPost.js
```

---

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` — Admin login (returns JWT)
- `GET /api/auth/verify` — Verify JWT token
- `GET /api/auth/csrf-token` — Get CSRF token
- `POST /api/auth/change-password` — Change admin password

### Projects
- `GET /api/projects` — Fetch all projects
- `POST /api/projects` — Create project (admin only)
- `PUT /api/projects/:id` — Update project (admin only)
- `DELETE /api/projects/:id` — Delete project (admin only)

### Contact
- `GET /api/contact` — Fetch all messages (admin only)
- `POST /api/contact` — Submit contact form

### Analytics
- `POST /api/analytics/track-visit` — Track visitor
- `POST /api/analytics/heartbeat` — Track session activity
- `POST /api/analytics/download-resume` — Log resume download
- `GET /api/analytics/visitors` — Get visitor stats (admin only)
- `GET /api/analytics/export-visitors` — Export visitors as CSV (admin only)
- `POST /api/analytics/export-visitors-pdf` — Export visitors as PDF (admin only)
- `GET /api/analytics/export-messages` — Export messages as CSV (admin only)
- `POST /api/analytics/export-messages-pdf` — Export messages as PDF (admin only)

---

## 📊 Database Schema

### Tables
1. **admins** — Admin user accounts
2. **visitors** — Visitor session tracking
3. **contact_messages** — Contact form submissions
4. **resume_downloads** — Resume download logs
5. **projects** — Portfolio projects

### View Tables in MySQL Workbench
1. Open MySQL Workbench and create connection:
   - Host: `localhost`, Port: `3306`, User: `root`, Password: (from `.env`)
   - Default Schema: `portfolio_db`
2. Expand `portfolio_db` → `Tables` to see all tables
3. Run queries:
   ```sql
   SELECT * FROM visitors LIMIT 10;
   SELECT * FROM contact_messages;
   SELECT * FROM projects;
   ```

---

## 🛡️ Security Configuration

### CSRF Protection
- All POST/PUT/DELETE requests require CSRF token (via `x-csrf-token` header or form field).
- Token fetched from `/api/auth/csrf-token` endpoint.
- Cookie-based CSRF validation enabled.

### Rate Limiting
- IP-based rate limiting: 15 requests/15 min for contact form, 100 requests/15 min for general API.
- Configurable in `src/middleware/rateLimiter.js`.

### Password Security
- Admin passwords hashed with bcryptjs (12 salt rounds).
- JWT tokens expire after 7 days.

### Input Validation
- Contact form: name, email, subject, message validated.
- Login form: username/password required and sanitized.
- All inputs XSS-protected via xss-clean middleware.

---

## 🚨 Troubleshooting

### "Cannot find module" Error
```bash
npm install
```

### Port Already in Use (EADDRINUSE 5000 or 3000)
```bash
# Windows: Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux: 
lsof -i :5000
kill -9 <PID>
```

### Database Connection Failed
- Ensure MySQL is running.
- Check `.env` credentials (DB_HOST, DB_USER, DB_PASSWORD, DB_PORT).
- Verify `portfolio_db` exists:
  ```bash
  npm run apply-schema
  ```

### Admin Dashboard Not Loading
- Ensure backend is running on port 5000.
- Check browser console for CORS errors.
- Verify JWT stored in localStorage (dev tools → Application tab).

### Contact Form Returns 403 (CSRF)
- Admin UI must fetch `/api/auth/csrf-token` and include token in POST headers.
- Token expires when browser session ends; fetch fresh token on page load.

---

## 📦 Dependencies

- **express** — Web framework
- **mysql2/promise** — MySQL driver
- **socket.io** — Real-time communication
- **jsonwebtoken** — JWT authentication
- **bcryptjs** — Password hashing
- **nodemailer** — Email sending
- **pdfkit** — PDF generation
- **express-validator** — Input validation
- **express-rate-limit** — Rate limiting
- **helmet** — HTTP security headers
- **xss-clean** — XSS protection
- **csurf** — CSRF protection
- **winston** — Logging
- **dotenv** — Environment variables

**Dev Dependencies:**
- **nodemon** — Auto-restart on file changes
- **concurrently** — Run multiple commands
- **live-server** — Live-reload server

---

## 🚀 Deployment

### Deploy Backend to Render
1. Push code to GitHub.
2. Create new Web Service on Render, connect GitHub repo.
3. Set environment variables in Render dashboard (DB_HOST, DB_USER, DB_PASSWORD, etc.).
4. Deploy.

### Deploy Frontend to Vercel
1. Push code to GitHub.
2. Import project into Vercel.
3. Set build output directory to `public/`.
4. Deploy.

### Environment Variables for Production
Update `.env` before deploying:
```
NODE_ENV=production
DB_HOST=your-production-db-host
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
JWT_SECRET=generate-a-random-long-string-here
EMAIL_USER=your-smtp-email
EMAIL_PASS=your-smtp-password
```

---

## 📄 License

ISC © 2024 Kemparaj S

---

## 🤝 Support

For issues or questions:
1. Check the Troubleshooting section above.
2. Review server logs: `npm run dev:all` output.
3. Check MySQL Workbench for database state.
4. Verify `.env` file configuration.

---

**Happy coding! 🎉**
