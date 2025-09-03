


# Mash-odoo_Team28 — RoadGuard (Users, Workers, Admin)

A full‑stack web app to discover roadside workshops and request services in real time, with role‑based access (User, Worker, Admin), live admin notifications, geolocation & map search, and Cloudinary image uploads.


## Features
- Authentication and roles
  - End‑users, Workers, and Admins with JWT auth and route guards
  - Separate login endpoints for each role; strict validation
  - Password reset and email verification ready (tokens logged in dev if mail not configured)
- Workshops
  - Public list and detail pages with ratings, reviews, distance and images
  - Worker‑owned workshop CRUD (single workshop per worker)
  - GeoJSON location with distance computing; search by name, status, and proximity
- Services
  - Users create service requests (instant or pre‑book with time window)
  - Direct image uploads to Cloudinary from the client (signed on backend)
  - Real‑time admin dashboard receives `service:new` via Socket.IO
- Reviews
  - Users can rate and review workshops (1–5 stars, single review per user/workshop)
  - Aggregates (ratingAvg, reviewsCount) kept on workshop
- Maps & Search
  - Google Maps view, current location pin, geocoding for free‑text searches
  - Homepage neon dark theme with list/card/map views


## Tech Stack
- Backend: Node.js, Express, Mongoose (MongoDB), JWT, bcrypt, Socket.IO, Helmet, CORS, express‑validator, Nodemailer, Cloudinary SDK
- Frontend: React (react‑scripts), React Router v6, @react-google-maps/api, socket.io‑client
- Infrastructure: Direct client → Cloudinary uploads (signed), GeoJSON 2dsphere indexes


## Monorepo Structure
```
backend/
  server.js
  Controllers/
  Middlewares/
  Models/
  Routes/
  Utils/
frontend/
  src/
  public/
```

Key models:
- User, Worker, Admin
- Workshop: workerId owner, images[], services[{name,imageUrl}], GeoJSON location, ratingAvg, reviewsCount
- Service: created by user; optional link to workshop; status; location; imageUrl
- Review: user↔workshop with rating/comment; unique per pair


## Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)
- Google Maps API key (Geocoding + Maps JavaScript API)


## Environment Variables
Create these files.

backend/.env
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/roadguard
JWT_SECRET=supersecret

# Cloudinary (used for signed direct uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=roadguard/uploads

# Optional email (dev logs to console if not configured)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=RoadGuard <no-reply@roadguard.local>

# Frontend URL for links in emails (optional)
FRONTEND_BASE_URL=http://localhost:3000
```

frontend/.env
```
REACT_APP_API_BASE=http://localhost:5000
REACT_APP_MAP_API_KEY=your_google_maps_api_key
```


## Install & Run (Windows PowerShell)
- Backend
```
cd backend
npm install
npm run dev
```
- Frontend
```
cd frontend
npm install
npm start
```
The frontend proxy (in frontend/package.json) points to http://localhost:5000.

Admin seeding (optional):
```
cd backend
npm run seed:admin
```


## Frontend Routes (protected)
- `/` Home (list/card/map), search and filters; requires login
- `/workshops/:id` Workshop detail with services, mini‑map, reviews
- `/workshops/:id/service/new` Create service (Cloudinary upload → imageUrl)
- `/services/:id/track` Track a service request
- `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`
- Worker: `/worker/workshop/new`, `/worker/dashboard`
- Admin: `/admin`

Auth guards ensure:
- Users see Home/Workshop/Service
- Workers see worker routes only
- Admins see admin dashboard only


## API Overview (selected)
Auth
- POST `/api/auth/admin/login` { username, password }
- POST `/api/auth/user/login` { email, password }
- POST `/api/auth/worker/login` { email, password }
- GET `/api/auth/validate` → user payload/role
- POST `/api/auth/forgot-password`, `/api/auth/reset-password`

Workshops
- GET `/api/workshops`
  - Query: `q` (name contains), `status` (open|closed), `sort` (nearby|rated), `lat`,`lng`, `radiusKm`
- GET `/api/workshops/:id` (optional `lat`,`lng` to compute distance)
- Worker (auth worker):
  - GET `/api/workshops/me/own`
  - POST `/api/workshops/me` (create once)
  - PATCH `/api/workshops/me` (update)

Services
- POST `/api/services` (auth user) — JSON only; client uploads image to Cloudinary and sends `imageUrl`
- GET `/api/services/:id` (auth: owner user, worker, or admin)
- Socket.IO: server emits `service:new` when a service is created

Cloudinary
- GET `/api/cloudinary/signature` (auth) → { cloudName, apiKey, timestamp, signature, folder }

Reviews
- GET `/api/reviews/workshops/:id` → list reviews for a workshop
- POST `/api/reviews` (auth user) → { workshopId, rating(1–5), comment? }
  - Upserts one review per user/workshop
  - Recomputes `ratingAvg` and `reviewsCount` on the workshop


## How Search Works
- Name search: typing in Home triggers a fetch to `/api/workshops?q=<text>`; backend uses case‑insensitive regex on `name`.
- Location search: pressing Enter/click Search geocodes the text via Google APIs, sets a map center, and includes `lat,lng` (and optional `radiusKm`) in subsequent backend requests for proximity sorting.


## Notable Files
- Backend
  - `server.js` — Express, Socket.IO init, routes mount, Helmet/CORS
  - `Controllers/*.js` — auth, workshops, services, cloudinary signature, reviews
  - `Models/*.js` — user, worker, admin, workshop, service, review, db
  - `Routes/*.js` — route groupings
  - `Utils/emailService.js` — nodemailer; logs tokens in dev if not configured
- Frontend
  - `src/Components/HomePage.js` — neon list/card/map, search, geocoding
  - `src/Components/WorkshopDetail.js` — services, mini‑map, reviews (submit & list)
  - `src/Components/ServiceNew.js` — create service + signed Cloudinary upload
  - `src/Components/AdminHome.js` — real‑time service requests via Socket.IO
  - `src/Components/WorkerAddWorkshop.js`, `WorkerDashboard.js` — worker portal


## Security & Production Notes
- Use strong `JWT_SECRET` and restrict CORS origins in production
- Store Cloudinary credentials only on backend; client receives only a short‑lived signature
- Set proper email credentials to actually send emails (dev logs tokens)
- Create indexes in Mongo (2dsphere on locations is defined by schema)


## Troubleshooting
- Maps not loading → ensure `REACT_APP_MAP_API_KEY`
- No workshops appearing by distance → check geolocation permissions or provide manual location
- Image upload errors → ensure backend signature endpoint is reachable and Cloudinary credentials are correct
- 401/403 on protected routes → verify JWT in `localStorage` and role guards.
