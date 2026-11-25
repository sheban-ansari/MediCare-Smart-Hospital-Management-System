# MediCare – Smart Hospital Management System

A full-stack hospital management application built using the MERN Stack (MongoDB, Express.js, React.js, and Node.js) with Tailwind CSS.

MediCare helps hospitals manage patients, doctors, appointments, prescriptions, medical records, billing, and reports through a centralized digital platform.

## Features

### Admin Portal
- Admin dashboard with live statistics
- Doctor management
- Patient management
- Receptionist management
- Appointment management
- Prescription management
- Medical records management
- Billing and payment management
- Reports and analytics
- Hospital settings and profile management

### Doctor Portal
- Doctor dashboard
- View appointments
- Access patient information
- Manage prescriptions
- Manage medical records

### Receptionist Portal
- Receptionist dashboard
- Appointment desk
- Patient support
- Role-based access restrictions

### Additional Features
- Secure authentication using JWT
- Role-based authorization
- MongoDB database integration
- PDF prescription downloads
- Billing receipt downloads
- CSV report export
- Responsive user interface
- Custom MediCare browser favicon

## Technologies Used

**Frontend**
- React.js
- Tailwind CSS
- React Router DOM
- Axios
- Lucide React
- Vite

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcryptjs

## Project Structure

```text
MediCare/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── .gitignore
└── README.md
```

## Installation and Setup

### Prerequisites
- Node.js
- npm
- MongoDB
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/sheban-ansari/MediCare-Smart-Hospital-Management-System.git
```

### 2. Setup Backend

```bash
cd MediCare-Smart-Hospital-Management-System/backend
npm install
```

Create a `.env` file inside the backend folder and configure:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Start the backend server:

```bash
npm run dev
```

### 3. Setup Frontend

Open another terminal:

```bash
cd MediCare-Smart-Hospital-Management-System/frontend
npm install
npm run dev
```

Open the frontend URL displayed by Vite, usually:

http://localhost:5173

## Security

- Environment variables are stored in `.env`.
- Sensitive configuration files are excluded through `.gitignore`.
- Passwords are hashed using bcryptjs.
- Protected routes use JWT authentication and role-based authorization.

**Never upload actual database credentials, passwords, or JWT secrets to GitHub.**

## GitHub Repository

https://github.com/sheban-ansari/MediCare-Smart-Hospital-Management-System

## Project Information

**Project Name:** MediCare – Smart Hospital Management System

**Project Type:** Full Stack Web Application

**Technology Stack:** MERN Stack

**Purpose:** Academic College Project

---

Developed as a college project using modern web technologies.
