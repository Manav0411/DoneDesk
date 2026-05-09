(function () {
  const taskTableBody = document.getElementById("task-table-body");
  const taskForm = document.getElementById("task-form");
  const editForm = document.getElementById("edit-task-form");
  const editModalElement = document.getElementById("editTaskModal");
  const dashboardShell = document.querySelector(".dashboard-shell");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const notificationArea = document.getElementById("notification-area");
  const toastStack = document.getElementById("toast-stack");
  const dashboardAlert = document.getElementById("dashboard-alert");
  const refreshButton = document.getElementById("refresh-btn");
  const refreshButtonInline = document.getElementById("refresh-btn-inline");
  const metricTotal = document.getElementById("metric-total");
  const metricCompleted = document.getElementById("metric-completed");
  const metricPending = document.getElementById("metric-pending");
  const metricPercentage = document.getElementById("metric-percentage");
  const completionChartCanvas = document.getElementById("completion-chart");
  const priorityChartCanvas = document.getElementById("priority-chart");
  const completionChartEmpty = document.getElementById("completion-chart-empty");
  const priorityChartEmpty = document.getElementById("priority-chart-empty");

  if (!taskTableBody || !taskForm || !editForm) {
    return;
  }

  const editModal = editModalElement ? new bootstrap.Modal(editModalElement) : null;
  let currentTasks = [];
  let socket = null;
  let completionChart = null;
  let priorityChart = null;

  const escapeHtml = (value) => {
    const element = document.createElement("div");
    element.textContent = value ?? "";
    return element.innerHTML;
  };

  const showToast = (message, type = "info", title = "DoneDesk") => {
    if (!toastStack || typeof bootstrap === "undefined") {
      if (dashboardAlert) {
        dashboardAlert.className = `alert app-alert alert-${type}`;
        dashboardAlert.textContent = message;
        dashboardAlert.classList.remove("d-none");
      }
      return;
    }

    const toast = document.createElement("div");
    toast.className = `toast app-toast toast-${type}`;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.innerHTML = `
      <div class="toast-header">
        <span class="me-auto fw-semibold">${escapeHtml(title)}</span>
        <small class="text-soft">now</small>
        <button type="button" class="btn-close ms-2" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">${escapeHtml(message)}</div>
    `;

    toastStack.appendChild(toast);
    const toastInstance = bootstrap.Toast.getOrCreateInstance(toast, { delay: 3600 });
    toast.addEventListener("hidden.bs.toast", () => toast.remove(), { once: true });
    toastInstance.show();
  };

  const showBanner = (message, type = "info") => {
    showToast(message, type);
  };

  const toggleSidebar = () => {
    if (!dashboardShell) {
      return;
    }
    dashboardShell.classList.toggle("sidebar-open");
  };

  const closeSidebarOnMobile = () => {
    if (!dashboardShell || window.innerWidth >= 992) {
      return;
    }
    dashboardShell.classList.remove("sidebar-open");
  };

  const getPriorityCounts = (tasks) =>
    tasks.reduce(
      (acc, task) => {
        const priority = String(task.priority || "medium").toLowerCase();
        if (priority === "high") {
          acc.high += 1;
        } else if (priority === "low") {
          acc.low += 1;
        } else {
          acc.medium += 1;
        }
        return acc;
      },
      { high: 0, medium: 0, low: 0 },
    );

  const createCompletionChart = () => {
    if (!completionChartCanvas || typeof Chart === "undefined") {
      return null;
    }

    return new Chart(completionChartCanvas, {
      type: "doughnut",
      data: {
        labels: ["Completed", "Open"],
        datasets: [
          {
            data: [0, 1],
            backgroundColor: ["rgba(52, 211, 153, 0.85)", "rgba(124, 58, 237, 0.65)"],
            borderColor: ["rgba(52, 211, 153, 1)", "rgba(124, 58, 237, 0.9)"],
            borderWidth: 1,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#cbc8ef",
              usePointStyle: true,
              boxHeight: 8,
              boxWidth: 8,
            },
          },
        },
      },
    });
  };

  const createPriorityChart = () => {
    if (!priorityChartCanvas || typeof Chart === "undefined") {
      return null;
    }

    return new Chart(priorityChartCanvas, {
      type: "bar",
      data: {
        labels: ["High", "Medium", "Low"],
        datasets: [
          {
            label: "Tasks",
            data: [0, 0, 0],
            backgroundColor: ["rgba(251, 191, 36, 0.7)", "rgba(124, 58, 237, 0.7)", "rgba(56, 189, 248, 0.7)"],
            borderColor: ["rgba(251, 191, 36, 1)", "rgba(124, 58, 237, 1)", "rgba(56, 189, 248, 1)"],
            borderRadius: 10,
            borderWidth: 1,
            maxBarThickness: 34,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            ticks: { color: "#cbc8ef" },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              color: "#cbc8ef",
            },
            grid: { color: "rgba(203, 200, 239, 0.2)" },
          },
        },
      },
    });
  };

  const setAnalyticsEmptyState = (isEmpty) => {
    if (completionChartCanvas && completionChartEmpty) {
      completionChartCanvas.classList.toggle("d-none", isEmpty);
      completionChartEmpty.classList.toggle("d-none", !isEmpty);
    }
    if (priorityChartCanvas && priorityChartEmpty) {
      priorityChartCanvas.classList.toggle("d-none", isEmpty);
      priorityChartEmpty.classList.toggle("d-none", !isEmpty);
    }
  };

  const updateCharts = (tasks, metrics = {}) => {
    if (typeof Chart === "undefined") {
      return;
    }

    completionChart = completionChart || createCompletionChart();
    priorityChart = priorityChart || createPriorityChart();

    if (!completionChart || !priorityChart) {
      return;
    }

    const total = Number(metrics.total_tasks ?? tasks.length ?? 0);
    const completed = Number(metrics.completed_tasks ?? tasks.filter((task) => task.status === "completed").length ?? 0);
    const open = Math.max(total - completed, 0);
    const isEmpty = total <= 0;

    setAnalyticsEmptyState(isEmpty);
    if (isEmpty) {
      return;
    }

    completionChart.data.datasets[0].data = [completed, open];
    completionChart.update();

    const counts = getPriorityCounts(tasks);
    priorityChart.data.datasets[0].data = [counts.high, counts.medium, counts.low];
    priorityChart.update();
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
          <td colspan="5">
            <div class="task-empty">
              <div class="task-empty-icon">◌</div>
              <div class="task-empty-title">No tasks yet</div>
              <p class="mb-0">Create your first task to start tracking workflow progress.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    taskTableBody.innerHTML = tasks
      .map(
        (task) => `
          <tr>
            <td>
              <div class="fw-semibold task-title">${escapeHtml(task.title)}</div>
              <div class="small text-soft text-truncate" style="max-width: 340px;">${escapeHtml(task.description || "")}</div>
            </td>
            <td><span class="badge-soft ${priorityClass(task.priority)}">${priorityLabel(task.priority)}</span></td>
            <td><span class="badge-soft ${statusClass(task.status)}">${statusLabel(task.status)}</span></td>
            <td>${formatDate(task.created_at)}</td>
            <td>
              <div class="task-row-actions">
                <button class="btn btn-sm btn-icon btn-ghost js-edit-task" data-task-id="${task.id}" title="Edit task" aria-label="Edit task">
                  <i class="bi bi-pencil-square" aria-hidden="true"></i>
                </button>
                <button class="btn btn-sm btn-icon btn-danger-soft js-delete-task" data-task-id="${task.id}" title="Delete task" aria-label="Delete task">
                  <i class="bi bi-trash3" aria-hidden="true"></i>
                </button>
              </div>
            </td>
          </tr>
        `,
      )
      .join("");
  };

  const updateMetrics = async () => {
    try {
      const response = await fetch("/analytics", {
        headers: { "X-Requested-With": "XMLHttpRequest" },
        credentials: "same-origin",
      });
      if (!response.ok) {
        throw new Error("Unable to fetch analytics.");
      }

      const data = await response.json();
      const metrics = data.data || {};
      metricTotal.textContent = metrics.total_tasks ?? 0;
      metricCompleted.textContent = metrics.completed_tasks ?? 0;
      metricPending.textContent = metrics.pending_tasks ?? 0;
      metricPercentage.textContent = `${metrics.completion_percentage ?? 0}%`;
      updateCharts(currentTasks, metrics);
    } catch (_error) {
      const totalTasks = currentTasks.length;
      const completedTasks = currentTasks.filter((task) => String(task.status || "").toLowerCase() === "completed").length;
      const pendingTasks = Math.max(totalTasks - completedTasks, 0);
      const completion = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

      metricTotal.textContent = totalTasks;
      metricCompleted.textContent = completedTasks;
      metricPending.textContent = pendingTasks;
      metricPercentage.textContent = `${completion}%`;
      updateCharts(currentTasks, {
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
      });
    }
  };

  const loadTasks = async () => {
    taskTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-5 text-soft">
          <div class="task-loading">
            <div class="spinner-border spinner-border-sm text-info me-2" role="status" aria-hidden="true"></div>
            Loading tasks...
          </div>
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
          <td colspan="5" class="text-center py-5 text-soft">
            <div class="task-empty">
              <div class="task-empty-icon">!</div>
              <div class="task-empty-title">Could not load tasks</div>
              <p class="mb-0">Please refresh and try again.</p>
            </div>
          </td>
        </tr>
      `;
      showToast(error.message, "danger", "Analytics error");
      updateCharts([], { total_tasks: 0, completed_tasks: 0 });
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

  const submitTask = async (formElement, url, method, onSuccess, eventTitle) => {
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
      showToast(data.message || "Task saved.", "success", eventTitle || "Task update");
    } catch (error) {
      showToast(error.message, "danger", eventTitle || "Task update");
    } finally {
      setLoading(formElement, false);
    }
  };

  taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitTask(taskForm, "/tasks", "POST", () => taskForm.reset(), "Task created");
  });

  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const taskId = document.getElementById("edit-task-id").value;
    await submitTask(editForm, `/tasks/${taskId}`, "PUT", () => editModal?.hide(), "Task updated");
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
        showToast(data.message || "Task deleted.", "success", "Task deleted");
      } catch (error) {
        showToast(error.message, "danger", "Task deleted");
      }
    }
  });

  refreshButton?.addEventListener("click", () => loadTasks());
  refreshButtonInline?.addEventListener("click", () => loadTasks());
  sidebarToggle?.addEventListener("click", toggleSidebar);

  document.addEventListener("click", (event) => {
    if (!dashboardShell || window.innerWidth >= 992 || !dashboardShell.classList.contains("sidebar-open")) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (!target.closest(".sidebar-panel") && !target.closest("#sidebar-toggle")) {
      closeSidebarOnMobile();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 992) {
      dashboardShell?.classList.remove("sidebar-open");
    }
  });

  const connectSocket = () => {
    if (typeof io === "undefined") {
      return;
    }

    socket = io({ transports: ["websocket", "polling"] });
    socket.on("connect", () => {
      addNotification("Connected", "Live updates are active.");
      showToast("Live updates are active.", "info", "Connected");
    });
    socket.on("task_notification", (payload) => {
      if (payload?.event === "connected") {
        return;
      }
      addNotification("Task activity", payload?.message || "Task updated.");
      showToast(payload?.message || "Task updated.", "info", "Task activity");
    });
    socket.on("tasks_updated", async (payload) => {
      addNotification("Sync update", payload?.message || "Refreshing tasks.");
      showToast(payload?.message || "Refreshing tasks.", "info", "Sync update");
      await loadTasks();
    });
    socket.on("disconnect", () => {
      addNotification("Disconnected", "Live updates paused.");
      showToast("Live updates paused.", "danger", "Disconnected");
    });
  };

  setOriginalLabels(taskForm);
  setOriginalLabels(editForm);
  setAnalyticsEmptyState(true);
  connectSocket();
  loadTasks();
})();
