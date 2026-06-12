# MockMaster - Exam Preparation App

A modern exam preparation platform for Indian government exams (SSC, Banking, Railways, etc.) built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4. Includes a Capacitor-based Android app.

## Features

- **Multi-Exam Support** — SSC CGL, Banking PO, Railways, and 21+ exams
- **Mock Tests** — Full-length and topic-wise practice tests with timer
- **Leaderboard** — Compete with other students
- **Multi-Language** — English, Hindi, and Bangla support
- **Offline Mode** — Download tests for offline practice (coming soon)
- **Admin Panel** — Manage exams, tests, users, and announcements
- **Android App** — Capacitor-based native Android app

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** SQLite (local), Firebase Firestore (cloud)
- **Authentication:** Firebase Auth (email + guest login)
- **Mobile:** Capacitor (Android)
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm or bun package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/mockmaster.git
cd mockmaster

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Set up the database
npx prisma db push

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Firebase Setup (Optional)

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Add your Firebase config to `.env` file

See `FIREBASE_SETUP_GUIDE.txt` for detailed instructions.

### Android Build

```bash
# Sync web assets to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── admin/              # Admin panel
│   ├── components/
│   │   ├── ExamPrepApp.tsx     # Main app component
│   │   ├── LoginModal.tsx      # Login/signup modal
│   │   ├── ui/                 # shadcn/ui components
│   │   └── admin/              # Admin panel components
│   ├── hooks/                  # Custom React hooks
│   └── lib/
│       ├── i18n.ts             # Internationalization (en/hi/bn)
│       ├── firebase.ts         # Firebase configuration
│       ├── firestore-service.ts # Firestore data layer
│       ├── use-firebase-auth.ts # Firebase auth hook
│       ├── db.ts               # Local SQLite database
│       └── utils.ts            # Utility functions
├── prisma/
│   └── schema.prisma           # Database schema
├── public/                     # Static assets
├── android/                    # Capacitor Android project
├── capacitor.config.ts         # Capacitor configuration
├── firebase.json               # Firebase deployment config
└── firestore.rules             # Firestore security rules
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma db push` | Push schema to database |
| `npx cap sync android` | Sync to Android |

## License

This project is private and proprietary.
