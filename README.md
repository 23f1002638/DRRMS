# DRRMS - Disaster Relief Resource Management System

A full-stack, role-based web application designed to coordinate disaster relief operations among four distinct user groups: Administrators, Volunteers, Victims, and Donors. It provides real-time aid request tracking, inventory management, geolocation-based resource discovery, analytics, and an AI-powered assistant — all within a single unified portal.

---

## Features

- **Role-Based Access Control**: Specialized dashboards for Admins, Volunteers, Victims, and Donors
- **Real-Time Aid Request Tracking**: Victims submit SOS requests that are instantly visible to admins and volunteers, with live status polling every 5 seconds
- **Geolocation Mapping**: Interactive Leaflet map displaying active requests, shelters, and relief resources with Haversine-based distance calculations
- **Inventory Management**: Comprehensive tracking of supplies with quantity thresholds, stock status, and restock operations
- **Volunteer Task Management**: Volunteers browse, claim, and complete assigned tasks; admins oversee all volunteers and their progress
- **Donations Module**: Donors can submit monetary, supplies, or service donations with impact statistics
- **Analytics Dashboard**: Charts and KPIs including request category distributions, urgency breakdowns, and resolution rates
- **AI Assistant**: Floating context-aware chatbot with intent-based keyword matching, quick actions per view, and action triggers (navigate, call)
- **Notification System**: Bell icon with unread count, polling every 10 seconds, with mark-read and mark-all-read support

---

## Tech Stack

**Frontend**
- React 18, TypeScript, Vite
- Tailwind CSS v4, Radix UI (shadcn/ui), Lucide React
- Recharts (Charts and Analytics)
- React-Leaflet + Leaflet (Interactive Maps)
- Motion (Animations)
- React Hook Form
- Sonner (Toast Notifications)

**Backend**
- Node.js, Express.js (REST API)
- SQLite3 via `sqlite3` driver
- JWT (jsonwebtoken) for authentication
- bcryptjs for password hashing

---

## Prerequisites

- Node.js 18+ and npm

---

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/23f1002638/DRRMS.git
   cd DRRMS
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Start the backend server**
   ```bash
   npm run dev:server
   ```
   The API server will start at `http://localhost:3000`. An admin account is automatically seeded:
   - Email: `admin@example.com`
   - Password: `admin123`

5. **Start the frontend development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to `http://localhost:5173` (or the port shown in your terminal)

---

## User Roles

### Victim
- Submit aid requests with category, urgency level (1-5), GPS location, and people count
- Track the live status of submitted requests (pending, in_progress, resolved)
- Discover nearby emergency resources and shelters sorted by distance

### Volunteer
- Browse all available tasks (derived from pending aid requests)
- Claim tasks to accept responsibility, update status to in-progress, and mark as completed
- View personal task history and impact

### Donor
- Submit monetary, supplies, or service donations with category tagging
- View personal donation history and impact statistics
- Track ongoing relief projects

### Administrator
- Monitor system-wide KPIs: active requests, pending vs resolved counts, resolution rate
- Manage volunteer roster and task assignments
- Full inventory control: add items, restock quantities, set minimum thresholds
- Manage relief resources (shelters, distribution centers, medical centers)
- Access analytics dashboard

---

## Project Structure

```
DRRMS/
├── server/               # Node.js Express backend
│   ├── index.js          # All API routes and auth logic
│   ├── db.js             # SQLite database initialization and seeding
│   └── database.sqlite   # Auto-generated SQLite database file
├── src/
│   ├── components/       # All React UI components and dashboards
│   ├── hooks/            # Custom data-fetching hooks with polling
│   ├── lib/              # api.ts (REST client), ai-knowledge.ts, geolocation.ts
│   ├── types.ts          # Shared TypeScript interfaces
│   └── App.tsx           # Root router and session management
├── database_schema.sql   # Full production-grade schema (PostgreSQL / Supabase)
└── system_architecture.md
```

---

## Security Notes

- Passwords are never stored in plain text. bcryptjs hashes all passwords with a cost factor of 8-10 rounds.
- All protected API routes require a valid `Authorization: Bearer <JWT>` header.
- JWTs expire after 24 hours.
- The admin account is seeded automatically only if it does not already exist.
- Never commit your `.env` file. It is excluded by `.gitignore`.

---

## License

This project is licensed under the MIT License.

---

Built for communities in need.
