# DoneDesk

DoneDesk is a Flask-based smart task management dashboard with secure authentication, user-scoped task CRUD APIs, real-time Socket.IO updates, and analytics powered by Pandas/NumPy.

The frontend is a premium dark SaaS UI (Bootstrap + custom CSS + vanilla JavaScript) with glassmorphism panels, responsive dashboard layout, Chart.js analytics charts, and real-time toast notifications.

## Core Features

- Session-based authentication (register, login, logout) with Flask-Login
- User-scoped task management (create, list, update, delete)
- Real-time task refresh events with Flask-SocketIO
- Analytics endpoint with completion metrics (Pandas + NumPy)
- Chart.js dashboard charts:
	- Doughnut chart for completion split
	- Bar chart for priority distribution
- Premium responsive UI:
	- Sidebar dashboard layout
	- Glass cards, gradient accents, hover polish
	- Empty/loading states and top-right toasts

## Tech Stack

- Python 3
- Flask
- Flask-SQLAlchemy
- Flask-Migrate
- Flask-Login
- Flask-SocketIO
- Flask-Cors
- Pandas + NumPy
- PostgreSQL (or SQLite fallback)
- Bootstrap 5 + Bootstrap Icons + Chart.js (CDN)

## Project Structure

```text
DoneDesk/
├── app/
│   ├── __init__.py
│   ├── extensions.py
│   ├── models.py
│   ├── sockets.py
│   ├── utils.py
│   ├── routes/
│   │   ├── auth_routes.py
│   │   ├── task_routes.py
│   │   └── analytics_routes.py
│   ├── templates/
│   │   ├── base.html
│   │   ├── dashboard.html
│   │   ├── login.html
│   │   └── register.html
│   └── static/
│       ├── css/main.css
│       └── js/
│           ├── auth.js
│           └── dashboard.js
├── migrations/
├── config.py
├── requirements.txt
├── run.py
├── schema.sql
└── README.md
```

## Configuration

Environment variables used by the app:

- `SECRET_KEY`: Flask session secret
- `DATABASE_URL`: Database URL
	- `postgres://...` and `postgresql://...` are automatically normalized to `postgresql+psycopg://...`
	- If empty, the app falls back to local SQLite: `smart_task_manager.db`
- `SOCKETIO_ASYNC_MODE`: defaults to `eventlet`
- `SOCKETIO_CORS_ALLOWED_ORIGINS`: defaults to `*`
- `PORT`: app port (default `5000`)

Example `.env`:

```env
SECRET_KEY=change-me
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/donedesk
SOCKETIO_ASYNC_MODE=eventlet
SOCKETIO_CORS_ALLOWED_ORIGINS=*
PORT=5000
```

## Local Setup

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure `.env`.
4. Initialize database:

- Quick start (current behavior in `run.py`):

```bash
python run.py
```

This runs `db.create_all()` on startup.

- Or use migrations:

```bash
flask db upgrade
```

## Running the App

```bash
python run.py
```

The app starts with Flask-SocketIO and serves the dashboard at `/dashboard` after login.

## API Routes

All task and analytics routes require authentication.

### Auth Routes

- `GET /` - redirect to dashboard if authenticated, else login
- `GET /login` - render login page
- `POST /login` - login (supports JSON and form)
- `GET /register` - render register page
- `POST /register` - register user (supports JSON and form)
- `GET /logout` - logout
- `GET /dashboard` - render protected dashboard

### Task Routes

- `GET /tasks` - list current user tasks
- `POST /tasks` - create task
- `PUT /tasks/<task_id>` - update owned task
- `DELETE /tasks/<task_id>` - delete owned task

### Analytics Routes

- `GET /analytics` - returns:
	- `total_tasks`
	- `completed_tasks`
	- `pending_tasks`
	- `completion_percentage`

### Response Shape

API helpers return consistent JSON:

```json
{
	"success": true,
	"message": "...",
	"data": {}
}
```

## Realtime Socket Events

Socket room model is user-scoped (`user_<id>`).

Server emits:

- `tasks_updated`
	- payload includes: `event`, `task`, `message`
- `task_notification`
	- payload includes: `event`, `message`, `task`

On socket connect, authenticated users join their own room and receive a `task_notification` with `event: connected`.

## Frontend Notes

- Dashboard interactions are fetch-based (`app/static/js/dashboard.js`)
- Auth form submit is AJAX-style (`app/static/js/auth.js`)
- Chart.js loaded via CDN in dashboard template
- Bootstrap Icons loaded via CDN in base template

## Security and Validation Highlights

- Password hashing via Werkzeug
- Task ownership checks before update/delete
- Normalized/validated priority and status values
- Auth-aware 401 handling for AJAX/API requests
