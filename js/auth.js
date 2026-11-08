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
      if (!input) return;
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

  function requireSupabase(success) {
    if (!window.supabaseClient) {
      success.textContent = "Supabase is not configured yet. Please add the project keys.";
      return false;
    }
    return true;
  }

  function setLoading(button, loadingText) {
    if (!button.dataset.originalText) button.dataset.originalText = button.textContent.trim();
    if (button.dataset.originalDisabled === undefined) {
      button.dataset.originalDisabled = button.disabled ? "true" : "false";
    }
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = "";

    const spinner = document.createElement("span");
    spinner.className = "auth-button-spinner";
    spinner.setAttribute("aria-hidden", "true");
    spinner.style.width = "16px";
    spinner.style.height = "16px";
    spinner.style.marginRight = "8px";
    spinner.style.border = "2px solid rgba(255,255,255,.55)";
    spinner.style.borderTopColor = "#fff";
    spinner.style.borderRadius = "50%";
    spinner.style.display = "inline-block";
    spinner.style.verticalAlign = "-3px";
    spinner.style.animation = "auth-spin .7s linear infinite";

    if (!document.querySelector("#auth-spin-style")) {
      const style = document.createElement("style");
      style.id = "auth-spin-style";
      style.textContent = "@keyframes auth-spin { to { transform: rotate(360deg); } }";
      document.head.appendChild(style);
    }

    button.appendChild(spinner);
    button.appendChild(document.createTextNode(loadingText));
  }

  function setDone(button) {
    button.disabled = button.dataset.originalDisabled === "true";
    button.removeAttribute("aria-busy");
    button.textContent = button.dataset.originalText || "Submit";
  }

  function friendlyError(error, type) {
    const message = error && error.message ? error.message.toLowerCase() : "";
    const networkError = /network|fetch failed|failed to fetch|load failed/i.test(error && error.message ? error.message : "");

    if (networkError) return "Unable to connect. Please check your internet connection and try again.";
    if (type === "signup") {
      if (/already registered|user already registered|already exists/.test(message)) {
        return "This email is already registered. Try logging in instead.";
      }
      if (/weak password|password should be at least|password.*characters/.test(message)) {
        return "Your password is too weak. Please use at least 8 characters.";
      }
    }
    if (type === "login") {
      if (/invalid login credentials|invalid email or password/.test(message)) {
        return "The email or password is incorrect.";
      }
      if (/email not confirmed|not confirmed/.test(message)) {
        return "Please confirm your email before logging in.";
      }
    }
    if (type === "reset") {
      if (/same password|different password/.test(message)) {
        return "Please choose a new password.";
      }
    }
    return error && error.message ? error.message : "Something went wrong. Please try again.";
  }

  const loginForm = document.querySelector("#login-form");
  if (loginForm) {
    const email = document.querySelector("#login-email");
    const password = document.querySelector("#login-password");
    const success = loginForm.querySelector(".auth-success");
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const forgotLink = loginForm.querySelector(".forgot-link");

    [email, password].forEach(function (field) {
      field.addEventListener("input", function () {
        clearError(field);
        success.textContent = "";
      });
    });

    forgotLink.addEventListener("click", async function (event) {
      event.preventDefault();
      if (!requireSupabase(success)) return;

      const enteredEmail = window.prompt("Enter your email to reset your password:");
      if (!enteredEmail) return;
      if (!validEmail(enteredEmail.trim())) {
        success.textContent = "Please enter a valid email address.";
        return;
      }

      setLoading(submitButton, "Please wait...");
      try {
        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(
          enteredEmail.trim(),
          { redirectTo: new URL("reset-password.html", window.location.href).href }
        );
        if (error) throw error;
        success.textContent = "Check your email for a password reset link.";
      } catch (error) {
        success.textContent = friendlyError(error, "reset");
      } finally {
        setDone(submitButton);
      }
    });

    loginForm.addEventListener("submit", async function (event) {
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
      if (!requireSupabase(success)) return;

      setLoading(submitButton, "Logging in...");
      try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
          email: email.value.trim(),
          password: password.value
        });
        if (error) throw error;
        if (data && data.user) {
          window.location.href = "dashboard.html";
        }
      } catch (error) {
        success.textContent = friendlyError(error, "login");
      } finally {
        setDone(submitButton);
      }
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
    const submitButton = signupForm.querySelector('button[type="submit"]');

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

    signupForm.addEventListener("submit", async function (event) {
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
      if (!requireSupabase(success)) return;

      const selectedRole = signupForm.querySelector('input[name="role"]:checked');
      const role = selectedRole && selectedRole.value === "tutor" ? "tutor" : "student";

      setLoading(submitButton, "Creating account...");
      try {
        const { error } = await window.supabaseClient.auth.signUp({
          email: email.value.trim(),
          password: password.value,
          options: {
            data: {
              full_name: name.value.trim(),
              phone: phone.value.trim(),
              role: role
            },
            emailRedirectTo: new URL("login.html", window.location.href).href
          }
        });
        if (error) throw error;
        success.textContent = "Check your email to confirm your account";
      } catch (error) {
        success.textContent = friendlyError(error, "signup");
      } finally {
        setDone(submitButton);
      }
    });
  }

  const resetForm = document.querySelector("#reset-password-form");
  if (resetForm) {
    const password = document.querySelector("#reset-password");
    const confirmPassword = document.querySelector("#reset-confirm-password");
    const success = resetForm.querySelector(".auth-success");
    const submitButton = resetForm.querySelector('button[type="submit"]');

    resetForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      let firstInvalid = null;
      success.textContent = "";
      clearError(password);
      clearError(confirmPassword);

      if (!password.value) {
        setError(password, "Please enter a new password.");
        firstInvalid = password;
      } else if (password.value.length < 8) {
        setError(password, "Password must be at least 8 characters.");
        firstInvalid = password;
      }

      if (!confirmPassword.value) {
        setError(confirmPassword, "Please confirm your new password.");
        firstInvalid = firstInvalid || confirmPassword;
      } else if (confirmPassword.value !== password.value) {
        setError(confirmPassword, "Passwords do not match.");
        firstInvalid = firstInvalid || confirmPassword;
      }

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      if (!requireSupabase(success)) return;

      setLoading(submitButton, "Updating password...");
      try {
        const { error } = await window.supabaseClient.auth.updateUser({
          password: password.value
        });
        if (error) throw error;
        success.textContent = "Password updated. Redirecting to login...";
        window.setTimeout(function () {
          window.location.href = "login.html";
        }, 800);
      } catch (error) {
        success.textContent = friendlyError(error, "reset");
        setDone(submitButton);
      }
    });
  }
})();
