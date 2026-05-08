(function () {
  const form = document.getElementById("auth-form");
  const alertBox = document.getElementById("auth-alert");

  if (!form) {
    return;
  }

  const setAlert = (message, type) => {
    if (!alertBox) {
      return;
    }

    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
  };

  const setLoading = (loading) => {
    const submitButton = form.querySelector("button[type='submit']");
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

  const submitHandler = async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const formType = form.dataset.authForm;

    if (formType === "register" && payload.password !== payload.confirm_password) {
      setAlert("Passwords do not match.", "danger");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(form.action, {
        method: "POST",
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

      window.location.href = data.data?.redirect || "/dashboard";
    } catch (error) {
      setAlert(error.message, "danger");
    } finally {
      setLoading(false);
    }
  };

  const submitButton = form.querySelector("button[type='submit']");
  if (submitButton) {
    submitButton.dataset.originalLabel = submitButton.querySelector(".btn-label")?.textContent || submitButton.textContent.trim();
  }

  form.addEventListener("submit", submitHandler);
})();
