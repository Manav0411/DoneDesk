from __future__ import annotations

from flask_login import current_user
from flask_socketio import emit, join_room, leave_room

from .extensions import socketio


def user_room(user_id: int) -> str:
    return f"user_{user_id}"


def emit_task_event(event_type: str, task_payload: dict, message: str):
    if not task_payload:
        return

    room = user_room(task_payload["user_id"])
    socketio.emit(
        "tasks_updated",
        {"event": event_type, "task": task_payload, "message": message},
        room=room,
    )
    socketio.emit(
        "task_notification",
        {"event": event_type, "message": message, "task": task_payload},
        room=room,
    )


@socketio.on("connect")
def handle_connect():
    if not current_user.is_authenticated:
        return False
    join_room(user_room(current_user.id))
    emit("task_notification", {"event": "connected", "message": "Live updates connected."})


@socketio.on("disconnect")
def handle_disconnect():
    if current_user.is_authenticated:
        leave_room(user_room(current_user.id))
