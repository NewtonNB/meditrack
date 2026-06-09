# MediTrack Frontend

Standalone React application for MediTrack Pharmacy Management System.

## Tech Stack

- React 19 + React Router v7
- Tailwind CSS
- Axios (API calls)
- Recharts (charts)
- React Toastify (notifications)
- Vite (build tool)

## Setup

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Edit .env — set your backend URL
VITE_API_URL=http://localhost:8000/api

# Start development server
npm run dev

# Build for production
npm run build
```

## Development

The app runs on `http://localhost:3000` and proxies all `/api` requests to Laravel on `http://localhost:8000`.

Run both servers simultaneously:
- **Backend:** `php artisan serve` (in the meditrack root)
- **Frontend:** `npm run dev` (in this folder)

## Authentication

Uses Sanctum token-based auth. The token is stored in `localStorage` as `auth_token` and sent as `Authorization: Bearer <token>` on every API request.

## Project Structure

```
src/
├── api/            # API client & endpoint modules
├── context/        # AuthContext (login, logout, user state)
├── hooks/          # useApi (generic data fetching hook)
├── layouts/        # AuthenticatedLayout (sidebar + header)
├── pages/          # One file per page/route
│   ├── Auth/       # Login, Register
│   ├── Dashboard.jsx
│   ├── Medicines.jsx
│   ├── Sales.jsx
│   └── ...
└── main.jsx        # App entry point
```
