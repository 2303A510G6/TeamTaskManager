# ⚡ TaskFlow – Team Task Manager

A full-stack web app for managing projects, assigning tasks, and tracking progress with **role-based access control** (Admin/Member).

---

## 🚀 Features

- 🔐 **Authentication** – JWT-based signup/login with role selection
- 📁 **Project Management** – Create, edit, delete projects with color labels & deadlines
- 👥 **Team Management** – Add/remove members per project by email
- ✅ **Task Tracking** – Create tasks with status, priority, due dates, tags & comments
- 📊 **Dashboard** – Stats for total tasks, overdue, in-progress, and more
- 🔒 **Role-Based Access** – Admin sees all; Members see only their projects

---

## 🗂️ Folder Structure

```
TeamTaskManager/
├── backend/              # Node.js + Express REST API
│   ├── config/           # MongoDB connection
│   ├── controllers/      # Auth, Projects, Tasks, Users logic
│   ├── middleware/        # JWT auth + role guard
│   ├── models/           # User, Project, Task schemas
│   ├── routes/           # Express route definitions
│   └── server.js         # App entry point
│
├── frontend/             # React app
│   ├── public/           # index.html
│   └── src/
│       ├── context/      # Auth context (global state)
│       ├── pages/        # Dashboard, Projects, Tasks, etc.
│       ├── components/   # Layout (sidebar + nav)
│       └── utils/        # Axios API helpers
│
└── README.md
```

---

## ⚙️ Local Setup

### 1. Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier): https://cloud.mongodb.com

### 2. Clone & Install
```bash
git clone <your-repo-url>
cd TeamTaskManager

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 3. Configure Environment

**Backend** – create `backend/.env` from `backend/.env.example`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/teamtaskmanager
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

**Frontend** – create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Run Locally

```bash
# Terminal 1 – Backend
cd backend
npm run dev      # runs on http://localhost:5000

# Terminal 2 – Frontend
cd frontend
npm start        # runs on http://localhost:3000
```

---

## 🌐 Deploy to Railway

### Step 1 – Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-url>
git push -u origin main
```

### Step 2 – Deploy Backend on Railway
1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select your repo → choose the `backend/` as root directory
3. Add environment variables in Railway dashboard:
   - `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `CLIENT_URL` (your frontend Railway URL)
4. Railway auto-detects Node.js and deploys

### Step 3 – Deploy Frontend on Railway
1. New Service → same repo → root directory = `frontend/`
2. Add env var: `REACT_APP_API_URL=https://your-backend.railway.app/api`
3. Build command: `npm run build`
4. Start command: `npx serve -s build -l 3000`

---

## 📡 API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/projects` | Get all projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get one project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### Tasks
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/tasks` | List tasks (filterable) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task detail |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/comments` | Add comment |
| GET | `/api/tasks/dashboard/stats` | Dashboard stats |

### Users (Admin only except search/profile)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/users` | All users (admin) |
| GET | `/api/users/search?email=` | Search users |
| PUT | `/api/users/profile` | Update profile |
| PUT | `/api/users/:id/role` | Change role (admin) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Deployment | Railway |

---

## 📝 Notes for Submission

- ✅ Live URL: `https://your-frontend.railway.app`
- ✅ GitHub Repo: `https://github.com/yourname/TeamTaskManager`
- ✅ README: This file
- 🎥 Demo Video: Record a 2–5 min walkthrough showing login, create project, add members, create tasks, update status, and admin panel
