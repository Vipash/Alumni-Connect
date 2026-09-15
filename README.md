```markdown
# 🎓 University & Alumni Management Portal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/vite-%5E5.0.0-646CFF.svg)](https://vitejs.dev/)
[![React Version](https://img.shields.io/badge/react-%5E18.0.0-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/database-MongoDB-green.svg)](https://www.mongodb.com/)

A full-stack web application designed for our university to bridge the gap between students, faculty, and alumni. The portal provides identity verification, event management, job opportunity boards, media management, and role-based administrative control.

---

## 📸 Overview

The platform provides a centralized hub to streamline institutional activities:
* **Students & Alumni**: Access verified accounts, apply for mentorship, browse job boards, register for university events, and update professional profiles.
* **Faculty & Admins**: Role-based administrative dashboard (`Standard`, `Moderator`, `GodMode`) to review support tickets, verify credentials, manage platform users, and publish official notices.

---

## 🛠 Tech Stack

### **Frontend**
* **Framework:** React.js + Vite
* **Styling:** CSS3, Tailwind CSS
* **Icons & UI:** Lucide React / FontAwesome

### **Backend**
* **Runtime:** Node.js
* **Framework:** Express.js (RESTful API architecture)
* **Authentication:** JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
* **File Processing:** `multer`, `multer-storage-cloudinary`

### **Database & Cloud Services**
* **Database:** MongoDB Atlas (Mongoose ODM)
* **Media Storage:** Cloudinary CDN (Image and PDF document processing)
* **Email Gateway:** Nodemailer (SMTP integration for support ticket notifications)

---

## 🚀 Key Features

* 🔐 **Authentication & RBAC:** Secure JWT-based access control supporting multi-tiered administration (`GodMode`, `Moderator`, `Standard Admin`).
* 📁 **Cloud Asset Pipeline:** Direct multi-format file uploads (PDF resumes, image avatars, banner media) to Cloudinary.
* 🎫 **Support Ticket Engine:** Real-time ticketing system for student queries with automated SMTP email dispatching.
* 📊 **Institutional Dashboard:** High-level metrics tracking active users, alumni verifications, job listings, and support resolution.
* 💼 **Career Hub:** Alumni-posted job openings and mentorship query dispatch.

---

## 📂 Project Structure

```text
Alumni-Connect/
├── .eslintrc.config.js       # ESLint configuration
├── .gitignore                # Files and folders ignored by Git
├── Admin.js                  # Mongoose Model: Admin
├── Announcement.js           # Mongoose Model: Announcement
├── Connection.js             # Mongoose Model: Connection
├── LICENSE                   # Project license
├── Media.js                  # Mongoose Model: Media
├── Notice.js                 # Mongoose Model: Notice
├── Notification.js           # Mongoose Model: Notification
├── README.md                 # Project documentation
├── SecurityLog.js            # Mongoose Model: SecurityLog
├── Support.js                # Mongoose Model: Support
├── Ticker.js                 # Mongoose Model: Ticker
├── alumni.js                 # Mongoose Model: Alumni
├── connectionRoutes.js       # Express Route: Connection management
├── emailservice.js           # Service: Nodemailer / Email handling
├── index.html                # Entry HTML for Vite/React
├── mediaRoutes.js            # Express Route: Media uploads & handling
├── multer.js                 # Middleware: File upload configuration
├── noticeRoutes.js           # Express Route: Notices management
├── package-lock.json         # Locked dependency tree
├── package.json              # Project dependencies and npm scripts
├── public/                   # Static public assets
├── server.js                 # Express server entry point
├── src/                      # React frontend application
│   ├── App.css               # Global application styles
│   ├── App.jsx               # Main React component
│   ├── index.css             # Base CSS
│   └── main.jsx              # React DOM render entry point
└── vite.config.js            # Vite build and server configuration

```

---

## 📦 Getting Started

### **Prerequisites**

* Node.js v18.x or higher
* npm v9.x or higher
* MongoDB Atlas Cluster account
* Cloudinary account (for API credentials)

---

### **1. Environment Configuration**

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Connection
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/university_portal?retryWrites=true&w=majority

# Security & Authentication
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d

# Cloudinary Storage Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# SMTP Email Dispatcher Setup
EMAIL_USER=your_email@domain.com
EMAIL_PASS=your_email_app_password

```

---

### **2. Installation & Running**

#### **Clone the Repository & Install Dependencies**

```bash
git clone [https://github.com/Vipash/Alumni-Connect.git](https://github.com/Vipash/Alumni-Connect.git)
cd Alumni-Connect
npm install

```

#### **Start the Application**

Run the backend Express server:

```bash
node server.js

```

In a separate terminal, run the frontend Vite dev server:

```bash
npm run dev

```

---

## 🔌 API Reference Overview

### **Authentication & Accounts**

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Register new Student/Alumni user |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT |
| `POST` | `/api/admin/login` | Public | Authenticate admin user & return Admin JWT |

### **Administration**

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/admin/create-new` | Admin (`GodMode`) | Register new administrative user account |
| `GET` | `/api/admin/support-tickets` | Admin | Retrieve all support and inquiry tickets |
| `GET` | `/api/admin/list` | Admin (`GodMode`) | View all registered admin accounts |

### **Media & Uploads**

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/upload` | Authenticated | Upload PDF/Image asset to Cloudinary |

---

## 🔒 Security Practices Implemented

1. **Environment Separation**: Sensitive credentials (database URIs, secret keys, API credentials) are managed strictly via environment variables (`.env`).
2. **Password Hashing**: User and admin passwords are hashed using salted `bcryptjs` hashing prior to persistence.
3. **Role-Based Authorization**: Middleware functions (`verifyToken`, `isAdmin`) validate JWT payload claims to protect sensitive management routes.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
