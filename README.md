# TTZ Gym Management Software

## Project Overview
The Transformation Zone (TTZ) Gym Management Software is a premium, enterprise-ready commercial SaaS application. It manages memberships, trainers, attendance, workouts, diets, billing, leads, and automations with a modern, sleek interface.

## Features
- **Member Management**: Track memberships, renewals, body measurements, and attendance.
- **Billing & Payments**: Integrated payment tracking with automated invoices and receipts.
- **WhatsApp Hub**: Direct integration for automated expiration reminders, attendance alerts, and promotional broadcasts.
- **Automation Center**: Real-time notifications and automated triggers via Supabase Realtime.
- **Business Insights**: Beautiful, interactive charts showing revenue, attendance trends, and retention rates.
- **Trainer Management**: Assign members, track progress, and manage trainers.
- **Security & RBAC**: Fully integrated with Supabase Auth for strict Row Level Security.

## Tech Stack
- **Frontend**: React, Vite, Zustand, Tailwind CSS, Lucide Icons, Radix UI.
- **Backend**: Node.js, Express, Socket.IO, @supabase/supabase-js.
- **Database**: Supabase (PostgreSQL) with RLS.
- **Styling**: Premium Matte Black & Rich Yellow Accent theme (Vanilla CSS & Tailwind).

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/adityakittad1/gym-management-system-software.git
   cd gym-management-system-software
   ```

2. **Install dependencies:**
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd server
   npm install
   ```

## Environment Variables
Copy `.env.example` to `.env` in both the root directory and the `server` directory and fill in your keys.

**Root `.env` (Frontend):**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Server `.env` (Backend):**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SECRET_KEY=your_supabase_service_role_key
SUPABASE_JWKS_URL=your_supabase_jwks_url
PORT=5000
```

## Running Frontend
From the root directory:
```bash
npm run dev
```

## Running Backend
From the `server` directory:
```bash
npm run dev
```

## Supabase Setup
1. Create a new Supabase project.
2. Go to the SQL Editor and run the contents of `supabase_migration.sql` or `supabase_migration_v3.sql`.
3. This creates all necessary tables, views, and RLS policies.

## WhatsApp Setup
1. Open the WhatsApp Hub on the dashboard.
2. Scan the generated QR Code with your WhatsApp app (Linked Devices).
3. The session is cached locally. Restarting the server restores the session automatically.

## Production Deployment
- **Frontend**: Build using `npm run build` and deploy the `dist` folder to Vercel, Netlify, or AWS.
- **Backend**: Deploy the `server` directory to a Node.js hosting provider (Render, Railway, DigitalOcean).

## License
Proprietary software. All rights reserved.

## Developer Credits
**Engineered & Developed by Rexora**  
Founder & Lead Developer  
**Aditya Kittad**