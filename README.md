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

## Viva Q&A
- **Why JWT?** Stateless login: server signs a token with JWT_SECRET; the client sends it in the Authorization header on each request.
- **Authentication vs authorization?** `protect` proves who you are; `authorize('organizer')` checks what you may do.
- **How are passwords stored?** Hashed with bcrypt in a `pre('save')` hook; never returned (`select: false`).
- **Why store registeredCount instead of counting registrations?** Fast reads on the list page; kept correct by atomic `$inc`.
- **What is `populate`?** Replaces an ObjectId reference with the referenced document (e.g. organizer name).
- **What is a virtual?** A computed field (`isFull`, `seatsLeft`) not stored in the DB.
- **What is middleware?** A function that runs before the controller and can stop the request.
- **What happens on simultaneous last-seat clicks?** The atomic update lets exactly one succeed; the other gets "event is full".
- **Why is business logic in the backend?** The frontend can be bypassed; the server is the single source of truth.
- **Possible future work:** email confirmation, waiting list, pagination, unit tests.

## Demo script (5 minutes)
1. Show folder structure and schemas. 2. Postman "Capacity rule demo" folder: student 1 succeeds, student 2 gets "event is full". 3. Login as organizer in React, create an event with capacity 1. 4. Register as a student, then show the Full badge and the participant table as organizer. 5. Show a student hitting an organizer route: 403.
