# DoneDesk

DoneDesk is a premium Flask-based smart task management platform featuring secure authentication, user-scoped task management, real-time updates with Socket.IO, and analytics powered by Pandas and NumPy.

The application features a modern AI-inspired SaaS dashboard UI built using Bootstrap, custom CSS, and vanilla JavaScript with glassmorphism styling, responsive layouts, realtime notifications, and interactive analytics charts.

---

## Features

### Authentication

* User registration
* User login/logout
* Session-based authentication with Flask-Login
* Secure password hashing using Werkzeug

### Task Management

* Create tasks
* Update tasks
* Delete tasks
* User-scoped task access
* Priority and status management
* Responsive task dashboard

### Analytics

* Total tasks
* Completed tasks
* Pending tasks
* Completion percentage
* Chart.js analytics visualizations
* Data processing using Pandas and NumPy

### Realtime Features

* Live task updates using Flask-SocketIO
* Realtime notifications
* User-specific Socket.IO rooms

## Design Inspiration

The frontend UI design of DoneDesk was inspired by the visual design language of Surefy.ai. The project adopts a similar modern AI SaaS aesthetic, including:

* Dark premium dashboard styling
* Purple/blue gradient color palette
* Glassmorphism-inspired UI components
* Minimal productivity-focused layouts

The logo and color theme used in this project were adapted for inspiration purposes to align the application with the company’s design identity during the internship assignment.


---

## Tech Stack

### Backend

* Python 3.12
* Flask
* Flask-SQLAlchemy
* Flask-Migrate
* Flask-Login
* Flask-SocketIO
* Flask-Cors

### Database

* PostgreSQL
* SQLAlchemy ORM

### Data Analytics

* Pandas
* NumPy

### Frontend

* HTML5
* CSS3
* Bootstrap 5
* Vanilla JavaScript
* Bootstrap Icons
* Chart.js

### Dev Tools

* Docker
* Git
* Virtual Environment

---

## Screenshots

### Login Page

![Login](screenshots/login.png)

### Dashboard

![Dashboard](screenshots/dashboard.png)

### Analytics

![Analytics](screenshots/analytics.png)

---

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
├── screenshots/
├── config.py
├── requirements.txt
├── run.py
├── schema.sql
├── .env
└── README.md
```

---

## Quick Start

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd DoneDesk
```

### 2. Create Virtual Environment

```bash
python3.12 -m venv .venv
```

Activate virtual environment:

#### macOS/Linux

```bash
source .venv/bin/activate
```

#### Windows

```bash
.venv\Scripts\activate
```

---

## PostgreSQL Setup with Docker

Run PostgreSQL locally using Docker:

```bash
docker run --name taskmanager-postgres \
-e POSTGRES_USER=taskuser \
-e POSTGRES_PASSWORD=password123 \
-e POSTGRES_DB=taskdb \
-p 5432:5432 \
-d postgres:16
```

Verify container:

```bash
docker ps
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
SECRET_KEY=your_secret_key

DATABASE_URL=postgresql+psycopg://taskuser:password123@localhost:5432/taskdb

SOCKETIO_ASYNC_MODE=eventlet
SOCKETIO_CORS_ALLOWED_ORIGINS=*
PORT=5000
```

---

## Database Migration

Initialize database tables:

```bash
flask db upgrade
```

---

## Running the Application

```bash
python run.py
```

Application runs at:

```text
http://127.0.0.1:5000
```

---

## API Endpoints

### Authentication Routes

| Method | Endpoint     | Description                 |
| ------ | ------------ | --------------------------- |
| GET    | `/`          | Redirect to dashboard/login |
| GET    | `/login`     | Render login page           |
| POST   | `/login`     | Login user                  |
| GET    | `/register`  | Render register page        |
| POST   | `/register`  | Register user               |
| GET    | `/logout`    | Logout user                 |
| GET    | `/dashboard` | Protected dashboard         |

---

### Task Routes

| Method | Endpoint           | Description        |
| ------ | ------------------ | ------------------ |
| GET    | `/tasks`           | Get all user tasks |
| POST   | `/tasks`           | Create task        |
| PUT    | `/tasks/<task_id>` | Update task        |
| DELETE | `/tasks/<task_id>` | Delete task        |

---

### Analytics Routes

| Method | Endpoint     | Description               |
| ------ | ------------ | ------------------------- |
| GET    | `/analytics` | Fetch dashboard analytics |

Analytics response includes:

* total_tasks
* completed_tasks
* pending_tasks
* completion_percentage

---

## Realtime Socket Events

### Socket.IO Features

* User-specific rooms
* Live task refresh
* Realtime notifications
* Instant dashboard updates

### Events

* `tasks_updated`
* `task_notification`

---

## Database Schema

The project includes:

```text
schema.sql
```

which contains:

* users table
* tasks table
* indexes
* foreign key relationships
* constraints

---

## Security Features

* Password hashing using Werkzeug
* User-scoped task authorization
* Protected routes with Flask-Login
* Secure session management
* Input validation and normalization
* Ownership verification before update/delete

---

## Future Improvements

* Task deadlines and reminders
* Drag-and-drop Kanban board
* Team collaboration
* Role-based access control
* AI-generated productivity insights
* Email notifications
* Full Dockerized deployment

---

## Demo Video

Demo walkthrough:


---

## License

MIT License
