# Event Registration System (MERN)

Students browse technical events and register. **Registration closes automatically when capacity is reached.** Organizers create/update/delete events and see the participant list.

Stack: Node.js, Express.js, MongoDB Atlas + Mongoose, JWT auth, React (Vite) + Axios.

## Run locally
```bash
# 1. Backend
cd backend
npm install
# edit .env -> put your MongoDB Atlas connection string in MONGO_URI
npm run seed      # optional: demo users + events
npm run dev       # http://localhost:5001

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev       # http://localhost:5173
```
Demo logins (after `npm run seed`): `organizer@demo.com / organizer123`, `student@demo.com / student123`.

## Folder structure (say this first in the viva)
```
backend/
  server.js               app entry: middleware + routes + DB connect
  config/db.js            MongoDB Atlas connection
  models/                 User, Event, Registration (Mongoose schemas)
  middleware/auth.js      protect (JWT) + authorize (role check)
  middleware/errorHandler.js   clean JSON errors
  controllers/            business logic (auth, events, registration)
  routes/                 URL -> controller mapping
  seed.js                 demo data
frontend/src/
  api.js                  Axios instance (base URL from env, adds token)
  AuthContext.jsx         stores logged-in user
  pages/                  Auth, Dashboard, EventForm (add/update), EventDetails
```

## API endpoints
| Method | URL | Who | Purpose |
|---|---|---|---|
| POST | /api/auth/register | public | Sign up (student/organizer) |
| POST | /api/auth/login | public | Login, returns JWT |
| GET | /api/events | logged in | List events |
| GET | /api/events/:id | logged in | Event details |
| POST | /api/events | organizer | Create event |
| PUT | /api/events/:id | organizer (owner) | Update event |
| DELETE | /api/events/:id | organizer (owner) | Delete event + its registrations |
| POST | /api/events/:id/register | student | Register (capacity enforced) |
| DELETE | /api/events/:id/register | student | Cancel registration |
| GET | /api/events/registrations/mine | student | My registrations |
| GET | /api/events/:id/participants | organizer (owner) | Participant list |

## Requirement checklist (map this to the problem statement)
| Requirement | Where |
|---|---|
| Event schema (title, date, maxCapacity, registeredCount) | `models/Event.js` |
| Registration schema referencing Event and Student | `models/Registration.js` (ObjectId refs) |
| CRUD for events | `controllers/eventController.js` |
| Max-capacity rule | `registerForEvent` (atomic `findOneAndUpdate`) |
| Beyond-capacity attempts rejected | returns 400 "event is full" |
| Role-based access | `middleware/auth.js` `authorize()` used in `routes/eventRoutes.js` |
| Validation of required fields | Mongoose validators + regex for phone/email |
| POST /events, GET /events, POST /events/:id/register | `routes/eventRoutes.js` |
| .env for PORT and DB string | `backend/.env.example` |
| Postman collection | `backend/EventRegistration.postman_collection.json` |
| React: login/register, list, add/update form, details | `frontend/src/pages/` |
| Frontend only calls APIs | all logic in backend |

## How the capacity rule works (the star of your presentation)
```js
Event.findOneAndUpdate(
  { _id: eventId, $expr: { $lt: ['$registeredCount', '$maxCapacity'] } },
  { $inc: { registeredCount: 1 } }
)
```
"Add one seat ONLY IF seats are still available", done in a single atomic database step. If it returns nothing, the event is full. A simple "read count, then check, then save" can go wrong when two students click at the same instant (race condition); this cannot. If saving the registration then fails, the seat is given back.

Extra safeguards: a unique index on (event, student) prevents double registration even in a race; past events cannot be registered for; organizers can only manage their own events; capacity cannot be reduced below current registrations.

## Deployment
**Backend (Render/Railway)**: push `backend/` to GitHub, create a Web Service, build `npm install`, start `npm start`. Add env vars: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your Vercel URL). In MongoDB Atlas > Network Access allow `0.0.0.0/0`.
**Frontend (Vercel/Netlify)**: import `frontend/`, build `npm run build`, output `dist`. Add env var `VITE_API_URL=https://<your-backend>.onrender.com/api`. For Netlify add a `_redirects` file containing `/* /index.html 200`; Vercel needs a `vercel.json` rewrite of all paths to `/index.html` so page refresh works.
