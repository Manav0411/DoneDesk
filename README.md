# Smart Task Management System

DoneDesk is a production-style Flask task management system with secure authentication, PostgreSQL-backed persistence, REST APIs, live task updates with Socket.IO, and analytics powered by Pandas and NumPy.

## Project Overview

This application lets users register, log in, manage personal tasks, and view live analytics from a responsive Bootstrap dashboard. The backend uses Flask application factory patterns, blueprints, SQLAlchemy models, Flask-Login session auth, and Flask-SocketIO broadcasts for real-time refreshes.

## Features

- User registration, login, and logout
- Password hashing with Werkzeug
- Session-based auth with Flask-Login
- Protected dashboard and user-scoped task access
- REST APIs for add, update, delete, and list tasks
- PostgreSQL-ready SQLAlchemy models
- Analytics endpoint using Pandas and NumPy
- WebSocket live updates with Flask-SocketIO
- Responsive Bootstrap UI with dynamic fetch-based interactions
- Flash messages, loading states, badges, and notification feed

## Tech Stack

- Backend: Python, Flask
- Database: PostgreSQL
- ORM: Flask-SQLAlchemy
- Migrations: Flask-Migrate
- Authentication: Flask-Login
- Realtime: Flask-SocketIO
- Analytics: Pandas, NumPy
- Frontend: HTML, CSS, Bootstrap, Vanilla JavaScript
- Environment Management: python-dotenv

## Folder Structure

```text
smart-task-manager/
├── app/
│   ├── __init__.py
│   ├── extensions.py
│   ├── models.py
│   ├── routes/
│   │   ├── auth_routes.py
│   │   ├── task_routes.py
│   │   └── analytics_routes.py
│   ├── templates/
│   │   ├── base.html
│   │   ├── login.html
│   │   ├── register.html
│   │   └── dashboard.html
│   ├── static/
│   │   ├── css/
│   │   └── js/
│   └── sockets.py
├── migrations/
├── config.py
├── requirements.txt
├── run.py
├── .env
├── README.md
└── schema.sql
```

## Installation Steps

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure environment variables in `.env`.
4. By default the project falls back to SQLite when `DATABASE_URL` is empty, which is useful for local development.
5. To use PostgreSQL, set `DATABASE_URL` to a PostgreSQL connection string and create the target database first.
6. Initialize the schema with Flask-Migrate or run `schema.sql` manually.

## PostgreSQL Setup

Create a database and user, then set `DATABASE_URL` in `.env` to a SQLAlchemy-compatible PostgreSQL URL.

Example:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/smart_task_manager
SECRET_KEY=change-this-secret
```

If you prefer, the included `schema.sql` file can be used as a reference for the initial database structure.

If `DATABASE_URL` is left blank, the app automatically uses a local SQLite database for quick startup and demo runs.

## Environment Variables

- `SECRET_KEY`: Flask session secret
- `DATABASE_URL`: PostgreSQL connection string
- `SOCKETIO_ASYNC_MODE`: usually `eventlet`
- `SOCKETIO_CORS_ALLOWED_ORIGINS`: allowed Socket.IO origins
- `PORT`: optional port for local or hosted deployments

## Running Instructions

```bash
python run.py
```

For production deployment, use Gunicorn with Eventlet support.

## API Endpoints

### Authentication

- `GET /login` - render login page
- `POST /login` - log in a user
- `GET /register` - render register page
- `POST /register` - create a new user
- `GET /logout` - log out the current user

### Dashboard

- `GET /dashboard` - protected task dashboard

### Tasks

- `GET /tasks` - list the current user's tasks
- `POST /tasks` - add a task
- `PUT /tasks/<id>` - update a task
- `DELETE /tasks/<id>` - delete a task

### Analytics

- `GET /analytics` - task summary metrics

## Screenshots

Add production screenshots here once captured:

- Login page
- Register page
- Dashboard view
- Mobile responsive dashboard

## Future Improvements

- Add automated test coverage for auth, CRUD, analytics, and socket events
- Add task search and filtering
- Add due dates, reminders, and recurring tasks
- Add role-based access control for team workflows
- Add deployment-specific configuration for Docker and cloud hosting
