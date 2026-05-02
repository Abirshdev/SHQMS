# Smart Hospital Queue Management System

MERN stack web app for managing patient queues across hospital departments with real-time updates and SMS notifications.

## Roles
- **Patient** — register, join department queues, track status
- **Doctor** — call next patient, view department queue
- **Admin** — manage departments, staff accounts, monitor all queues

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend
```bash
cd backend
cp .env.example .env        # fill in MONGO_URI and JWT_SECRET
npm install
node seed.js                # creates admin + sample departments
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Default Admin Login
- Phone: `0900000000`
- Password: `admin123`

## Workflow
1. Admin creates departments and doctor accounts (assigns each doctor a department)
2. Patients register and join queues by department
3. Doctor dashboard shows live queue; clicking "Call Next" advances the queue
4. Patients receive SMS notifications when it's their turn (configure SMS gateway in `routes/queue.js`)

## SMS Integration
The `sendSMS` function in `backend/routes/queue.js` is a stub. Replace it with your preferred gateway:
- [Africa's Talking](https://africastalking.com) (recommended for Ethiopia)
- Twilio

## Tech Stack
- MongoDB + Mongoose
- Express.js
- React 18 + Vite
- Node.js
- Socket.IO (real-time queue updates)
