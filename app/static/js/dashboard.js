(function () {
  const taskTableBody = document.getElementById("task-table-body");
  const taskForm = document.getElementById("task-form");
  const editForm = document.getElementById("edit-task-form");
  const editModalElement = document.getElementById("editTaskModal");
  const notificationArea = document.getElementById("notification-area");
  const dashboardAlert = document.getElementById("dashboard-alert");
  const refreshButton = document.getElementById("refresh-btn");
  const metricTotal = document.getElementById("metric-total");
  const metricCompleted = document.getElementById("metric-completed");
  const metricPending = document.getElementById("metric-pending");
  const metricPercentage = document.getElementById("metric-percentage");

  if (!taskTableBody || !taskForm || !editForm) {
    return;
  }

  const editModal = editModalElement ? new bootstrap.Modal(editModalElement) : null;
  let currentTasks = [];
  let socket = null;

  const escapeHtml = (value) => {
    const element = document.createElement("div");
    element.textContent = value ?? "";
    return element.innerHTML;
  };

  const showBanner = (message, type = "info") => {
    if (!dashboardAlert) {
      return;
    }

    dashboardAlert.className = `alert alert-${type}`;
    dashboardAlert.textContent = message;
    dashboardAlert.classList.remove("d-none");

    window.clearTimeout(showBanner.timer);
    showBanner.timer = window.setTimeout(() => {
      dashboardAlert.classList.add("d-none");
    }, 3500);
  };

  const setLoading = (formElement, loading) => {
    const submitButton = formElement.querySelector("button[type='submit']");
    const label = submitButton?.querySelector(".btn-label");
    const spinner = submitButton?.querySelector(".btn-spinner");

    if (!submitButton) {
      return;
    }

    submitButton.disabled = loading;
    if (label) {
      label.textContent = loading ? "Working..." : submitButton.dataset.originalLabel || label.textContent;
    }
    if (spinner) {
      spinner.classList.toggle("d-none", !loading);
    }
  };

  const setOriginalLabels = (formElement) => {
    const submitButton = formElement.querySelector("button[type='submit']");
    if (submitButton) {
      submitButton.dataset.originalLabel = submitButton.querySelector(".btn-label")?.textContent || submitButton.textContent.trim();
    }
  };

  const priorityClass = (priority) => `priority-${String(priority || "medium").toLowerCase()}`;
  const statusClass = (status) => `status-${String(status || "pending").toLowerCase()}`;

  const statusLabel = (status) => {
    const normalized = String(status || "pending").toLowerCase();
    if (normalized === "in_progress") {
      return "In Progress";
    }
    if (normalized === "completed") {
      return "Completed";
    }
    return "Pending";
  };

  const priorityLabel = (priority) => String(priority || "medium").toUpperCase();

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  };

  const renderTaskRows = (tasks) => {
    if (!tasks.length) {
      taskTableBody.innerHTML = `
        <tr>
          <td colspan="5"><div class="task-empty">No tasks yet. Add the first one from the form on the left.</div></td>
        </tr>
      `;
      return;
    }

    taskTableBody.innerHTML = tasks
      .map(
        (task) => `
          <tr>
            <td>
              <div class="fw-semibold text-white">${escapeHtml(task.title)}</div>
              <div class="small text-soft text-truncate" style="max-width: 340px;">${escapeHtml(task.description || "")}</div>
            </td>
            <td><span class="badge-soft ${priorityClass(task.priority)}">${priorityLabel(task.priority)}</span></td>
            <td><span class="badge-soft ${statusClass(task.status)}">${statusLabel(task.status)}</span></td>
            <td>${formatDate(task.created_at)}</td>
            <td>
              <div class="task-row-actions">
                <button class="btn btn-sm btn-outline-light js-edit-task" data-task-id="${task.id}">Edit</button>
                <button class="btn btn-sm btn-outline-danger js-delete-task" data-task-id="${task.id}">Delete</button>
              </div>
            </td>
          </tr>
        `,
      )
      .join("");
  };

  const updateMetrics = async () => {
    const response = await fetch("/analytics", {
      headers: { "X-Requested-With": "XMLHttpRequest" },
      credentials: "same-origin",
    });
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    const metrics = data.data || {};
    metricTotal.textContent = metrics.total_tasks ?? 0;
    metricCompleted.textContent = metrics.completed_tasks ?? 0;
    metricPending.textContent = metrics.pending_tasks ?? 0;
    metricPercentage.textContent = `${metrics.completion_percentage ?? 0}%`;
  };

  const loadTasks = async () => {
    taskTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-5 text-soft">
          <div class="spinner-border spinner-border-sm text-info me-2" role="status" aria-hidden="true"></div>
          Loading tasks...
        </td>
      </tr>
    `;

    try {
      const response = await fetch("/tasks", {
        headers: { "X-Requested-With": "XMLHttpRequest" },
        credentials: "same-origin",
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const data = await response.json();
      currentTasks = data.data?.tasks || [];
      renderTaskRows(currentTasks);
      await updateMetrics();
    } catch (error) {
      taskTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-5 text-soft">Unable to load tasks.</td>
        </tr>
      `;
      showBanner(error.message, "danger");
    }
  };

  const addNotification = (title, message) => {
    if (!notificationArea) {
      return;
    }

    const emptyState = notificationArea.querySelector(".notification-empty");
    if (emptyState) {
      emptyState.remove();
    }

    const item = document.createElement("div");
    item.className = "notification-item";
    item.innerHTML = `
      <strong>${escapeHtml(title)}</strong>
      <div>${escapeHtml(message)}</div>
      <div class="small text-soft mt-1">${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
    `;

    notificationArea.prepend(item);
  };

  const submitTask = async (formElement, url, method, onSuccess) => {
    setLoading(formElement, true);
    try {
      const payload = Object.fromEntries(new FormData(formElement).entries());
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Request failed.");
      }

      onSuccess?.(data);
      await loadTasks();
      addNotification("Task update", data.message || "Task saved.");
      showBanner(data.message || "Task saved.", "success");
    } catch (error) {
      showBanner(error.message, "danger");
    } finally {
      setLoading(formElement, false);
    }
  };

  taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitTask(taskForm, "/tasks", "POST", () => taskForm.reset());
  });

  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const taskId = document.getElementById("edit-task-id").value;
    await submitTask(editForm, `/tasks/${taskId}`, "PUT", () => editModal?.hide());
  });

  taskTableBody.addEventListener("click", async (event) => {
    const editButton = event.target.closest(".js-edit-task");
    const deleteButton = event.target.closest(".js-delete-task");

    if (editButton) {
      const taskId = Number(editButton.dataset.taskId);
      const task = currentTasks.find((entry) => entry.id === taskId);
      if (!task) {
        return;
      }

      document.getElementById("edit-task-id").value = task.id;
      document.getElementById("edit-title").value = task.title || "";
      document.getElementById("edit-description").value = task.description || "";
      document.getElementById("edit-priority").value = task.priority || "medium";
      document.getElementById("edit-status").value = task.status || "pending";
      editModal?.show();
      return;
    }

    if (deleteButton) {
      const taskId = Number(deleteButton.dataset.taskId);
      if (!window.confirm("Delete this task?")) {
        return;
      }

      try {
        const response = await fetch(`/tasks/${taskId}`, {
          method: "DELETE",
          headers: { "X-Requested-With": "XMLHttpRequest" },
          credentials: "same-origin",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Delete failed.");
        }

        await loadTasks();
        addNotification("Task deleted", data.message || "Task removed.");
        showBanner(data.message || "Task deleted.", "success");
      } catch (error) {
        showBanner(error.message, "danger");
      }
    }
  });

  refreshButton.addEventListener("click", () => loadTasks());

  const connectSocket = () => {
    if (typeof io === "undefined") {
      return;
    }

    socket = io({ transports: ["websocket", "polling"] });
    socket.on("connect", () => addNotification("Connected", "Live updates are active."));
    socket.on("task_notification", (payload) => {
      if (payload?.event === "connected") {
        return;
      }
      addNotification("Task activity", payload?.message || "Task updated.");
    });
    socket.on("tasks_updated", async (payload) => {
      addNotification("Sync update", payload?.message || "Refreshing tasks.");
      await loadTasks();
    });
    socket.on("disconnect", () => addNotification("Disconnected", "Live updates paused."));
  };

  setOriginalLabels(taskForm);
  setOriginalLabels(editForm);
  connectSocket();
  loadTasks();
})();
