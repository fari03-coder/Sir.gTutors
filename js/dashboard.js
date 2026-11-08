(function () {
  document.addEventListener("DOMContentLoaded", async function () {
    const toggle = document.querySelector(".nav-toggle");
    const navWrap = document.querySelector(".nav-wrap");
    if (toggle && navWrap) {
      toggle.addEventListener("click", function () {
        const open = navWrap.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
      });
    }

    const loading = document.querySelector("#dashboard-loading");
    const content = document.querySelector("#dashboard-content");
    const errorPanel = document.querySelector("#dashboard-error");
    const retryButton = document.querySelector("#dashboard-retry");
    const welcome = document.querySelector("#dashboard-welcome");
    const roleBadge = document.querySelector("#dashboard-role-badge");
    const roleContent = document.querySelector("#dashboard-role-content");
    const profileForm = document.querySelector("#profile-form");
    const profileName = document.querySelector("#profile-full-name");
    const profilePhone = document.querySelector("#profile-phone");
    const profileSave = document.querySelector("#profile-save");
    const profileMessage = document.querySelector("#profile-message");
    let currentUser = null;
    let originalProfileSaveText = profileSave.textContent;

    function showLoading() {
      loading.hidden = false;
      content.hidden = true;
      errorPanel.hidden = true;
    }

    function showError(error) {
      console.error(error);
      loading.hidden = true;
      content.hidden = true;
      errorPanel.hidden = false;
    }

    function createElement(tag, className, text) {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (text !== undefined) element.textContent = text;
      return element;
    }

    function formatDate(value) {
      if (!value) return "Date unavailable";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "Date unavailable";
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    }

    function showStudent(requests) {
      roleContent.replaceChildren();
      const heading = createElement("div", "dashboard-section-heading");
      heading.appendChild(createElement("h2", "", "My Requests"));
      const newRequest = createElement("a", "btn dashboard-button", "New request");
      newRequest.href = "find-tutor.html";
      heading.appendChild(newRequest);
      roleContent.appendChild(heading);

      if (!requests.length) {
        const empty = createElement("div", "dashboard-empty");
        empty.appendChild(createElement("strong", "", "You have no requests yet"));
        empty.appendChild(createElement("p", "", "Create a request to find the right tutor."));
        roleContent.appendChild(empty);
        return;
      }

      const list = createElement("div", "dashboard-request-list");
      requests.forEach(function (request) {
        const card = createElement("article", "dashboard-request-card");
        card.appendChild(createElement("h3", "", request.subject || "Tutor request"));
        const meta = createElement("div", "dashboard-request-meta");
        meta.appendChild(createElement("span", "", request.level || "Level not set"));
        meta.appendChild(createElement("span", "", request.city || "City not set"));
        meta.appendChild(createElement("span", "", request.mode || "Mode not set"));
        meta.appendChild(createElement("span", "", formatDate(request.created_at)));
        card.appendChild(meta);

        const statuses = ["new", "in_progress", "matched", "closed"];
        const status = statuses.includes(request.status) ? request.status : "new";
        card.appendChild(createElement("span", "dashboard-status dashboard-status-" + status, status.replace("_", " ")));
        list.appendChild(card);
      });
      roleContent.appendChild(list);
    }

    function showTutor(application) {
      roleContent.replaceChildren();
      roleContent.appendChild(createElement("span", "eyebrow", "Tutor application"));
      roleContent.appendChild(createElement("h2", "", "Application status"));

      if (!application) {
        const empty = createElement("div", "dashboard-empty");
        empty.appendChild(createElement("strong", "", "No application found"));
        empty.appendChild(createElement("p", "", "Complete your tutor application to get started."));
        const link = createElement("a", "btn dashboard-button", "Complete your tutor application");
        link.href = "tutor-register.html";
        empty.appendChild(link);
        roleContent.appendChild(empty);
        return;
      }

      const status = ["pending", "approved", "rejected"].includes(application.status)
        ? application.status
        : "pending";
      const statusMessages = {
        pending: "Your application is being reviewed.",
        approved: "Your application has been approved.",
        rejected: "Your application needs review and was not approved."
      };
      roleContent.appendChild(createElement("span", "dashboard-status dashboard-status-" + status, status));
      roleContent.appendChild(createElement("p", "", statusMessages[status]));

      const summary = createElement("div", "dashboard-summary");
      const fields = [
        ["Name", application.full_name],
        ["Phone", application.phone],
        ["Location", [application.city, application.area].filter(Boolean).join(", ")],
        ["Subjects", Array.isArray(application.subjects) ? application.subjects.join(", ") : ""],
        ["Levels", Array.isArray(application.levels) ? application.levels.join(", ") : ""],
        ["Mode", application.mode],
        ["Experience", application.experience_years !== null && application.experience_years !== undefined ? application.experience_years + " years" : ""],
        ["Fee", application.fee_per_hour !== null && application.fee_per_hour !== undefined ? "Rs. " + application.fee_per_hour : ""],
        ["Qualification", application.qualification],
        ["Institute", application.institute],
        ["Availability", application.availability],
        ["Bio", application.bio]
      ];
      fields.forEach(function (item) {
        if (!item[1] && item[1] !== 0) return;
        const row = createElement("div", "dashboard-summary-row");
        row.appendChild(createElement("span", "", item[0]));
        row.appendChild(createElement("span", "", String(item[1])));
        summary.appendChild(row);
      });
      roleContent.appendChild(summary);
    }

    function showAdmin() {
      roleContent.replaceChildren();
      roleContent.appendChild(createElement("span", "eyebrow", "Administration"));
      roleContent.appendChild(createElement("h2", "", "Admin dashboard coming soon"));
      roleContent.appendChild(createElement("p", "", "Admin tools will be available here later."));
    }

    async function loadDashboard() {
      showLoading();
      if (!window.supabaseClient) {
        showError(new Error("Supabase client is unavailable"));
        return;
      }

      try {
        const sessionResult = await window.supabaseClient.auth.getSession();
        if (sessionResult.error) throw sessionResult.error;
        if (!sessionResult.data || !sessionResult.data.session || !sessionResult.data.session.user) {
          window.location.href = "login.html?next=dashboard.html";
          return;
        }
        currentUser = sessionResult.data.session.user;

        const profileResult = await window.supabaseClient
          .from("profiles")
          .select("full_name, role")
          .single();
        if (profileResult.error) throw profileResult.error;

        const profile = profileResult.data || {};
        const role = String(profile.role || "").toLowerCase();
        const fullName = String(profile.full_name || "").trim();
        welcome.textContent = fullName ? "Welcome, " + fullName : "Welcome";
        roleBadge.textContent = role || "student";
        profileName.value = fullName;

        const phoneResult = await window.supabaseClient
          .from("profiles")
          .select("phone")
          .single();
        if (phoneResult.error && phoneResult.error.code !== "PGRST116") throw phoneResult.error;
        profilePhone.value = phoneResult.data && phoneResult.data.phone ? String(phoneResult.data.phone) : "";

        if (role === "student") {
          const requestsResult = await window.supabaseClient
            .from("demo_requests")
            .select("subject, level, city, mode, status, created_at")
            .order("created_at", { ascending: false });
          if (requestsResult.error) throw requestsResult.error;
          showStudent(requestsResult.data || []);
        } else if (role === "tutor") {
          const applicationResult = await window.supabaseClient
            .from("tutor_applications")
            .select("status, full_name, phone, city, area, subjects, levels, mode, experience_years, fee_per_hour, qualification, institute, bio, availability")
            .maybeSingle();
          if (applicationResult.error) throw applicationResult.error;
          showTutor(applicationResult.data || null);
        } else if (role === "admin") {
          showAdmin();
        } else {
          showError(new Error("Unknown profile role"));
          return;
        }

        loading.hidden = true;
        errorPanel.hidden = true;
        content.hidden = false;
      } catch (error) {
        showError(error);
      }
    }

    retryButton.addEventListener("click", loadDashboard);

    profileForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      const name = profileName.value.trim();
      const phone = profilePhone.value.trim();
      profileMessage.textContent = "";
      document.querySelector("#profile-name-error").textContent = "";

      if (!name) {
        document.querySelector("#profile-name-error").textContent = "Please enter your full name.";
        profileName.focus();
        return;
      }
      if (!currentUser) return;

      profileSave.disabled = true;
      profileSave.setAttribute("aria-busy", "true");
      profileSave.textContent = "";
      const spinner = document.createElement("span");
      spinner.className = "dashboard-spinner";
      spinner.setAttribute("aria-hidden", "true");
      profileSave.append(spinner, document.createTextNode("Saving..."));

      try {
        const { error } = await window.supabaseClient
          .from("profiles")
          .update({ full_name: name, phone: phone })
          .eq("id", currentUser.id);
        if (error) throw error;
        welcome.textContent = "Welcome, " + name;
        profileMessage.textContent = "Your profile was updated.";
      } catch (error) {
        console.error(error);
        profileMessage.textContent = "We could not save your profile. Please try again.";
      } finally {
        profileSave.disabled = false;
        profileSave.removeAttribute("aria-busy");
        profileSave.textContent = originalProfileSaveText;
      }
    });

    loadDashboard();
  });
})();
