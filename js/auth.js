(function () {
  const toggle = document.querySelector(".nav-toggle");
  const navWrap = document.querySelector(".nav-wrap");

  if (toggle && navWrap) {
    toggle.addEventListener("click", function () {
      const isOpen = navWrap.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  document.querySelectorAll(".password-toggle").forEach(function (button) {
    button.addEventListener("click", function () {
      const input = document.querySelector("#" + button.getAttribute("aria-controls"));
      const showPassword = input.type === "password";
      input.type = showPassword ? "text" : "password";
      button.textContent = showPassword ? "Hide" : "Show";
      button.setAttribute("aria-label", showPassword ? "Hide password" : "Show password");
      input.focus();
    });
  });

  function setError(field, message) {
    const error = document.querySelector("#" + field.id + "-error");
    if (error) error.textContent = message;
    field.setAttribute("aria-invalid", "true");
  }

  function clearError(field) {
    const error = document.querySelector("#" + field.id + "-error");
    if (error) error.textContent = "";
    field.removeAttribute("aria-invalid");
  }

  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  const loginForm = document.querySelector("#login-form");
  if (loginForm) {
    const email = document.querySelector("#login-email");
    const password = document.querySelector("#login-password");
    const success = loginForm.querySelector(".auth-success");

    [email, password].forEach(function (field) {
      field.addEventListener("input", function () {
        clearError(field);
        success.textContent = "";
      });
    });

    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();
      let firstInvalid = null;
      success.textContent = "";
      clearError(email);
      clearError(password);

      if (!email.value.trim()) {
        setError(email, "Please enter your email.");
        firstInvalid = firstInvalid || email;
      } else if (!validEmail(email.value.trim())) {
        setError(email, "Please enter a valid email address.");
        firstInvalid = firstInvalid || email;
      }

      if (!password.value) {
        setError(password, "Please enter your password.");
        firstInvalid = firstInvalid || password;
      } else if (password.value.length < 8) {
        setError(password, "Password must be at least 8 characters.");
        firstInvalid = firstInvalid || password;
      }

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      success.textContent = "Design only, backend coming soon";
    });
  }

  const signupForm = document.querySelector("#signup-form");
  if (signupForm) {
    const name = document.querySelector("#signup-name");
    const email = document.querySelector("#signup-email");
    const phone = document.querySelector("#signup-phone");
    const password = document.querySelector("#signup-password");
    const confirmPassword = document.querySelector("#signup-confirm");
    const terms = document.querySelector("#signup-terms");
    const success = signupForm.querySelector(".auth-success");

    function strengthLevel(value) {
      let score = 0;
      if (value.length >= 8) score += 1;
      if (/[A-Z]/.test(value)) score += 1;
      if (/[0-9]/.test(value)) score += 1;
      if (/[^A-Za-z0-9]/.test(value)) score += 1;
      return score;
    }

    password.addEventListener("input", function () {
      clearError(password);
      success.textContent = "";
      const level = password.value ? strengthLevel(password.value) : 0;
      document.querySelectorAll(".strength-bar").forEach(function (bar, index) {
        bar.className = "strength-bar";
        if (index < level) bar.classList.add("active-" + level);
      });
    });

    [name, email, phone, confirmPassword].forEach(function (field) {
      field.addEventListener("input", function () {
        clearError(field);
        success.textContent = "";
      });
    });

    terms.addEventListener("change", function () {
      clearError(terms);
      success.textContent = "";
    });

    signupForm.addEventListener("submit", function (event) {
      event.preventDefault();
      let firstInvalid = null;
      success.textContent = "";

      [name, email, phone, password, confirmPassword].forEach(clearError);
      clearError(terms);

      if (!name.value.trim()) {
        setError(name, "Please enter your full name.");
        firstInvalid = firstInvalid || name;
      }

      if (!email.value.trim()) {
        setError(email, "Please enter your email.");
        firstInvalid = firstInvalid || email;
      } else if (!validEmail(email.value.trim())) {
        setError(email, "Please enter a valid email address.");
        firstInvalid = firstInvalid || email;
      }

      if (!phone.value.trim()) {
        setError(phone, "Please enter your phone number.");
        firstInvalid = firstInvalid || phone;
      }

      if (!password.value) {
        setError(password, "Please enter a password.");
        firstInvalid = firstInvalid || password;
      } else if (password.value.length < 8) {
        setError(password, "Password must be at least 8 characters.");
        firstInvalid = firstInvalid || password;
      }

      if (!confirmPassword.value) {
        setError(confirmPassword, "Please confirm your password.");
        firstInvalid = firstInvalid || confirmPassword;
      } else if (confirmPassword.value !== password.value) {
        setError(confirmPassword, "Passwords do not match.");
        firstInvalid = firstInvalid || confirmPassword;
      }

      if (!terms.checked) {
        setError(terms, "Please agree to the terms and privacy notice.");
        firstInvalid = firstInvalid || terms;
      }

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      success.textContent = "Design only, backend coming soon";
    });
  }
})();
