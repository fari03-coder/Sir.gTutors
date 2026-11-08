(function () {
  document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("#tutor-request-form");
    if (!form) return;

    const subject = document.querySelector("#request-subject");
    const level = document.querySelector("#request-level");
    const city = document.querySelector("#request-city");
    const mode = document.querySelector("#request-mode");
    const details = document.querySelector("#request-details");
    const detailsCount = document.querySelector("#request-details-count");
    const success = form.querySelector(".request-success");
    const submitButton = form.querySelector('button[type="submit"]');
    let originalButtonText = submitButton.textContent;

    function clearFieldError(field) {
      const error = field.parentElement.querySelector(".request-error");
      if (error) error.textContent = "";
      field.removeAttribute("aria-invalid");
      success.textContent = "";
    }

    form.querySelectorAll("input, select, textarea").forEach(function (field) {
      field.addEventListener("input", function () {
        clearFieldError(field);
      });
      field.addEventListener("change", function () {
        clearFieldError(field);
      });
    });

    details.addEventListener("input", function () {
      detailsCount.textContent = String(details.value.length);
      if (details.value.length > 1000) {
        details.value = details.value.slice(0, 1000);
        detailsCount.textContent = "1000";
      }
    });

    document.addEventListener("click", function (event) {
      const demoButton = event.target.closest(".tutor-demo-button");
      if (!demoButton) return;

      subject.value = demoButton.dataset.subject || "";
      clearFieldError(subject);
      document.querySelector(".tutor-request-panel").scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
      subject.focus();
    });

    function setLoading(isLoading) {
      submitButton.disabled = isLoading;
      submitButton.setAttribute("aria-busy", String(isLoading));
      submitButton.textContent = "";

      if (isLoading) {
        const spinner = document.createElement("span");
        spinner.className = "request-spinner";
        spinner.setAttribute("aria-hidden", "true");
        submitButton.append(spinner, document.createTextNode("Saving..."));
      } else {
        submitButton.textContent = originalButtonText;
        submitButton.removeAttribute("aria-busy");
      }
    }

    function friendlyError(error) {
      const status = error && error.status;
      const code = error && error.code ? String(error.code).toUpperCase() : "";
      const message = error && error.message ? String(error.message).toLowerCase() : "";

      if (status === 401 || status === 403 || code.indexOf("42501") !== -1 || message.includes("permission") || message.includes("policy") || message.includes("jwt")) {
        return "Please log in again to submit your request.";
      }
      return "We could not save your request. Please try again.";
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      success.textContent = "";

      if (!window.supabaseClient) {
        success.textContent = "Supabase is not ready. Please refresh and try again.";
        return;
      }

      try {
        const { data: sessionData, error: sessionError } = await window.supabaseClient.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData || !sessionData.session) {
          window.location.href = "login.html?next=find-tutor.html";
          return;
        }
      } catch (error) {
        console.error(error);
        success.textContent = friendlyError(error);
        return;
      }

      const subjectValue = subject.value.trim();
      const levelValue = level.value.trim();
      const cityValue = city.value.trim();
      const detailsValue = details.value.trim();

      form.querySelectorAll(".request-error").forEach(function (error) {
        error.textContent = "";
      });

      let firstInvalid = null;
      if (!subjectValue) {
        const error = subject.parentElement.querySelector(".request-error");
        error.textContent = "Please enter a subject.";
        subject.setAttribute("aria-invalid", "true");
        firstInvalid = subject;
      }
      if (!levelValue) {
        const error = level.parentElement.querySelector(".request-error");
        error.textContent = "Please choose a level.";
        level.setAttribute("aria-invalid", "true");
        firstInvalid = firstInvalid || level;
      }
      if (detailsValue.length > 1000) {
        const error = details.parentElement.querySelector(".request-error");
        error.textContent = "Details must be 1000 characters or fewer.";
        details.setAttribute("aria-invalid", "true");
        firstInvalid = firstInvalid || details;
      }
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      try {
        setLoading(true);
        const { error } = await window.supabaseClient
          .from("demo_requests")
          .insert({
            subject: subjectValue,
            level: levelValue,
            city: cityValue,
            mode: mode.value,
            details: detailsValue
          });

        if (error) throw error;

        form.reset();
        detailsCount.textContent = "0";
        success.textContent = "";
        success.append(document.createTextNode("Thank you! Your tutor request has been submitted. "));
        const dashboardLink = document.createElement("a");
        dashboardLink.href = "dashboard.html";
        dashboardLink.textContent = "View dashboard";
        success.appendChild(dashboardLink);
      } catch (error) {
        console.error(error);
        success.textContent = friendlyError(error);
      } finally {
        setLoading(false);
      }
    });
  });
})();
