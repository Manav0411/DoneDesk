from __future__ import annotations

import numpy as np
import pandas as pd
from flask import Blueprint
from flask_login import current_user, login_required

from ..utils import api_response

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.get("/analytics")
@login_required
def analytics():
    task_rows = [task.to_dict() for task in current_user.tasks]
    frame = pd.DataFrame(task_rows)

    if frame.empty:
        metrics = {
            "total_tasks": 0,
            "completed_tasks": 0,
            "pending_tasks": 0,
            "completion_percentage": 0.0,
        }
    else:
        frame["status"] = frame["status"].fillna("").astype(str).str.lower()
        total_tasks = int(len(frame))
        completed_tasks = int(frame["status"].eq("completed").sum())
        pending_tasks = int(np.subtract(total_tasks, completed_tasks))
        completion_percentage = float(np.round(np.divide(completed_tasks, total_tasks) * 100 if total_tasks else 0.0, 2))

        metrics = {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks,
            "completion_percentage": completion_percentage,
        }

    return api_response(True, "Analytics loaded.", metrics)
