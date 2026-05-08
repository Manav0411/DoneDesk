from __future__ import annotations

from flask import Blueprint, request
from flask_login import current_user, login_required

from ..extensions import db
from ..models import Task
from ..sockets import emit_task_event
from ..utils import api_response

tasks_bp = Blueprint("tasks", __name__)

VALID_PRIORITIES = {"low", "medium", "high"}
VALID_STATUSES = {"pending", "in_progress", "completed"}


def _extract_payload():
    return request.get_json(silent=True) or request.form


def _normalize_value(value: str | None, allowed: set[str], default: str) -> str:
    normalized = (value or default).strip().lower().replace(" ", "_")
    return normalized if normalized in allowed else default


def _get_owned_task(task_id: int):
    return Task.query.filter_by(id=task_id, user_id=current_user.id).first()


@tasks_bp.get("/tasks")
@login_required
def get_tasks():
    tasks = [task.to_dict() for task in current_user.tasks]
    return api_response(True, "Tasks loaded.", {"tasks": tasks})


@tasks_bp.post("/tasks")
@login_required
def add_task():
    payload = _extract_payload()
    title = (payload.get("title") or "").strip()
    description = (payload.get("description") or "").strip()
    priority = _normalize_value(payload.get("priority"), VALID_PRIORITIES, "medium")
    status = _normalize_value(payload.get("status"), VALID_STATUSES, "pending")

    if not title:
        return api_response(False, "Task title is required.", status_code=400)

    task = Task(
        user_id=current_user.id,
        title=title,
        description=description,
        priority=priority,
        status=status,
    )
    db.session.add(task)
    db.session.commit()

    payload = task.to_dict()
    emit_task_event("created", payload, f"Task '{task.title}' added.")
    return api_response(True, "Task added successfully.", {"task": payload}, status_code=201)


@tasks_bp.put("/tasks/<int:task_id>")
@login_required
def update_task(task_id: int):
    task = _get_owned_task(task_id)
    if not task:
        return api_response(False, "Task not found.", status_code=404)

    payload = _extract_payload()
    title = (payload.get("title") or task.title).strip()
    description = (payload.get("description") if payload.get("description") is not None else task.description) or ""
    priority = _normalize_value(payload.get("priority") or task.priority, VALID_PRIORITIES, task.priority)
    status = _normalize_value(payload.get("status") or task.status, VALID_STATUSES, task.status)

    if not title:
        return api_response(False, "Task title is required.", status_code=400)

    task.title = title
    task.description = description.strip()
    task.priority = priority
    task.status = status
    db.session.commit()

    payload = task.to_dict()
    emit_task_event("updated", payload, f"Task '{task.title}' updated.")
    return api_response(True, "Task updated successfully.", {"task": payload})


@tasks_bp.delete("/tasks/<int:task_id>")
@login_required
def delete_task(task_id: int):
    task = _get_owned_task(task_id)
    if not task:
        return api_response(False, "Task not found.", status_code=404)

    payload = task.to_dict()
    db.session.delete(task)
    db.session.commit()

    emit_task_event("deleted", payload, f"Task '{payload['title']}' deleted.")
    return api_response(True, "Task deleted successfully.")
