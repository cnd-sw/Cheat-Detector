#  Anti-Cheat SAS (Secure Assessment Services)

An enterprise-grade, AI-powered online examination platform designed for modern educational institutions and corporate training. **Anti-Cheat SAS** provides a "hardened" testing environment to ensure academic integrity through real-time proctoring and behavioral analysis.

---

##  Premium Features

###  AI-Powered Proctoring
- **Face Detection**: Real-time monitoring using `face-api.js` to detect missing or multiple faces.
- **Biometric Identity**: Automated verification of student identity during exam entry.
- **Snaphot Auditing**: Periodic webcam snapshots streamed and stored for proctor review.

###  Browser Lockdown (Guard System)
- **Tab Tracking**: Immediate flagging if the student switches tabs or windows.
- **Fullscreen Enforcement**: Forces the exam into fullscreen and flags any attempt to exit.
- **Clipboard & Navigation Blocking**: Disables right-click, text selection, and copy/paste shortcuts.
- **DevTools Detection**: Detects if browser developer tools are opened.

###  Proctor Command Center
- **Real-time Dashboard**: Live "God-view" of all active sessions.
- **Suspicion Scoring Engine**: Proprietary algorithm that weights violations and labels students as `Clean`, `Review`, or `High Risk`.
- **Integrity Pulse**: Visual heatmaps and real-time event logs of all cheating attempts.

###  Enterprise Architecture
- **Multi-Tenant Ready**: DB-level isolation using `organizationId`.
- **Next.js 14 Frontend**: Modern, dark-themed, and highly responsive UI.
- **NestJS & WebSockets**: Scalable backend with real-time bidirectional communication via Socket.io.

---

##  Setup Instructions

### Prerequisites
- **Node.js**: v20 or higher
- **Docker**: For running PostgreSQL and Redis
- **npm**: v10 or higher

### 1. Database & Infrastructure
Start the infrastructure services using Docker:
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npm run seed     # Hydrates the DB with an organization, admin, and student account
npm run start:dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

##  Usage & Demo Credentials

Once everything is running, visit `http://localhost:3000`.

### Roles & Logins
| Role | Email | Password | Access |
|---|---|---|---|
| **Admin/Proctor** | `admin@git.edu` | `password123` | Control Center, Live Monitoring |
| **Student** | `student@git.edu` | `password123` | Exam Portal, Active Guard |

---

##  Project Structure

- `/frontend`: Next.js 14 Web App (App Router + Tailwind)
- `/backend`: NestJS API & WebSocket Server
- `/docker-compose.yml`: Local infrastructure (PostgreSQL, Redis)
- `/project_idea.md`: Original concept and roadmap

---

##  Scaling for Production
To turn this into a million-dollar project:
1. **S3 Integration**: Connect the snapshot system to AWS S3/Cloudflare R2 for long-term audit storage.
2. **Gaze Tracking**: Enhance the AI proctor to detect if the student is looking off-screen.
3. **LMS Integration**: Build LTI support for Canvas, Blackboard, and Moodle.
4. **IP/VPN Detection**: Integrate Cloudflare or MaxMind for location-based security.

---

*Built with  for High-Stakes Integrity.*
