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

    const form = document.querySelector("#tutor-registration-form");
    const progress = document.querySelector(".registration-progress");
    const successPanel = document.querySelector(".application-success");
    const statusPanel = document.querySelector(".application-status");
    const statusText = document.querySelector(".application-status-text");
    const steps = Array.from(document.querySelectorAll(".form-step"));
    const progressSteps = Array.from(document.querySelectorAll(".progress-step"));
    const progressFill = document.querySelector(".progress-fill");
    const backButton = document.querySelector(".tutor-back");
    const nextButton = document.querySelector(".tutor-next");
    const submitButton = document.querySelector(".tutor-submit");
    const originalSubmitText = submitButton.textContent;
    let currentStep = 0;
    let currentUser = null;

    function setError(field, message) {
      const wrap = field.closest(".form-field") || field.closest("fieldset") ||
        field.closest(".upload-field") || field.parentElement;
      const error = wrap.querySelector(".field-error") ||
        wrap.parentElement.querySelector(".field-error");
      if (error) error.textContent = message;
      field.setAttribute("aria-invalid", "true");
    }

    function clearError(field) {
      const wrap = field.closest(".form-field") || field.closest("fieldset") ||
        field.closest(".upload-field") || field.parentElement;
      const error = wrap && wrap.querySelector(".field-error");
      if (error) error.textContent = "";
      field.removeAttribute("aria-invalid");
    }

    function showStep(index) {
      steps.forEach(function (step, stepIndex) {
        step.classList.toggle("active", stepIndex === index);
      });
      progressSteps.forEach(function (step, stepIndex) {
        step.classList.toggle("active", stepIndex === index);
        step.classList.toggle("done", stepIndex < index);
        step.querySelector(".progress-dot").textContent =
          stepIndex < index ? "✓" : String(stepIndex + 1);
      });
      progressFill.style.width = (index / 3 * 100) + "%";
      backButton.hidden = index === 0;
      nextButton.hidden = index === steps.length - 1;
      submitButton.hidden = index !== steps.length - 1;
    }

    function validateRequiredInputs(step) {
      let valid = true;
      let firstInvalid = null;

      step.querySelectorAll("input[required], textarea[required], select[required]").forEach(function (field) {
        clearError(field);
        if (!field.value.trim()) {
          setError(field, "This field is required.");
          valid = false;
          firstInvalid = firstInvalid || field;
        }
      });

      step.querySelectorAll('input[type="email"]').forEach(function (field) {
        if (field.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())) {
          setError(field, "Please enter a valid email address.");
          valid = false;
          firstInvalid = firstInvalid || field;
        }
      });

      if (step.dataset.step === "1") {
        const subjects = step.querySelectorAll('input[name="subjects"]:checked');
        const levels = step.querySelectorAll('input[name="levels"]:checked');
        const mode = step.querySelector('input[name="teachingMode"]:checked');
        if (!subjects.length) {
          step.querySelector("#subjects-group .field-error").textContent = "Choose at least one subject.";
          valid = false;
        }
        if (!levels.length) {
          step.querySelector("#levels-group .field-error").textContent = "Choose at least one level.";
          valid = false;
        }
        if (!mode) {
          step.querySelector('[data-error-for="teachingMode"]').textContent = "Choose a teaching mode.";
          valid = false;
        }
      }

      if (step.dataset.step === "2") {
        const days = step.querySelectorAll('input[name="days"]:checked');
        const time = step.querySelector('input[name="availabilityTime"]:checked');
        const bio = step.querySelector("#bio");
        if (!days.length) {
          step.querySelector("#availability-group .field-error").textContent = "Choose at least one available day.";
          valid = false;
        }
        if (!time) {
          step.querySelector('[data-error-for="availabilityTime"]').textContent = "Choose a preferred time.";
          valid = false;
        }
        if (bio.value.trim().length > 400) {
          bio.nextElementSibling.querySelector(".field-error").textContent =
            "Bio must be 400 characters or fewer.";
          valid = false;
        }
      }

      if (firstInvalid) firstInvalid.focus();
      return valid;
    }

    nextButton.addEventListener("click", function () {
      if (!validateRequiredInputs(steps[currentStep])) return;
      currentStep += 1;
      showStep(currentStep);
    });

    backButton.addEventListener("click", function () {
      if (currentStep > 0) {
        currentStep -= 1;
        showStep(currentStep);
      }
    });

    const bio = document.querySelector("#bio");
    const bioCount = document.querySelector("#bio-count");
    bio.addEventListener("input", function () {
      bioCount.textContent = String(bio.value.length);
    });

    document.querySelectorAll(".upload-box input[type=file]").forEach(function (input) {
      const box = input.closest(".upload-box");
      function showFileName() {
        const name = box.querySelector(".file-name");
        name.textContent = input.files.length ? input.files[0].name : "";
        box.classList.toggle("has-file", input.files.length > 0);
      }
      input.addEventListener("change", showFileName);
      box.addEventListener("dragover", function (dragEvent) {
        dragEvent.preventDefault();
        box.classList.add("has-file");
      });
      box.addEventListener("dragleave", function () {
        if (!input.files.length) box.classList.remove("has-file");
      });
      box.addEventListener("drop", function (dragEvent) {
        dragEvent.preventDefault();
        if (dragEvent.dataTransfer.files.length && typeof DataTransfer !== "undefined") {
          input.files = dragEvent.dataTransfer.files;
          showFileName();
        }
      });
    });

    function setWorking(isWorking, text) {
      submitButton.disabled = isWorking;
      submitButton.setAttribute("aria-busy", String(isWorking));
      submitButton.textContent = "";
      if (isWorking) {
        const spinner = document.createElement("span");
        spinner.className = "tutor-submit-spinner";
        spinner.setAttribute("aria-hidden", "true");
        submitButton.append(spinner, document.createTextNode(text));
      } else {
        submitButton.textContent = originalSubmitText;
        submitButton.removeAttribute("aria-busy");
      }
    }

    function validateDocument(file, input, label) {
      const allowed = {
        "application/pdf": "pdf",
        "image/jpeg": "jpg",
        "image/png": "png"
      };
      const errorElement = input.closest(".upload-field").querySelector(".field-error");
      errorElement.textContent = "";

      if (!file) {
        errorElement.textContent = "Please choose your " + label + ".";
        return null;
      }
      if (!allowed[file.type]) {
        errorElement.textContent = label + " must be a PDF, JPG or PNG file.";
        return null;
      }
      if (file.size > 5 * 1024 * 1024) {
        errorElement.textContent = label + " must be 5 MB or smaller.";
        return null;
      }
      return allowed[file.type];
    }

    async function showExistingApplication(userId) {
      try {
        const { data, error } = await window.supabaseClient
          .from("tutor_applications")
          .select("status")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          const status = ["pending", "approved", "rejected"].includes(data.status)
            ? data.status
            : "pending";
          statusText.textContent = status + " application";
          form.hidden = true;
          progress.hidden = true;
          successPanel.hidden = true;
          statusPanel.hidden = false;
          return true;
        }
      } catch (error) {
        console.error(error);
      }
      return false;
    }

    if (!window.supabaseClient) {
      const termsError = document.querySelector(".terms-error");
      termsError.textContent = "The application service is not ready. Please refresh and try again.";
      return;
    }

    try {
      const { data, error } = await window.supabaseClient.auth.getSession();
      if (error) throw error;
      if (!data || !data.session || !data.session.user) {
        window.location.href = "login.html?next=tutor-register.html";
        return;
      }
      currentUser = data.session.user;
    } catch (error) {
      console.error(error);
      window.location.href = "login.html?next=tutor-register.html";
      return;
    }

    const alreadyApplied = await showExistingApplication(currentUser.id);
    if (alreadyApplied) return;

    form.hidden = false;
    progress.hidden = false;
    showStep(0);

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const cvInput = document.querySelector("#cv-upload");
      const idInput = document.querySelector("#id-upload");
      const terms = document.querySelector("#application-terms");
      const termsError = document.querySelector(".terms-error");
      termsError.textContent = "";
      document.querySelectorAll(".upload-field").forEach(function (field) {
        field.querySelector(".field-error").textContent = "";
      });

      const cvExt = validateDocument(cvInput.files[0], cvInput, "CV document");
      const idExt = validateDocument(idInput.files[0], idInput, "ID document");

      let valid = Boolean(cvExt && idExt);
      if (!terms.checked) {
        termsError.textContent = "Please confirm the information is accurate.";
        valid = false;
      }
      if (!valid) return;

      const values = {
        fullName: document.querySelector("#full-name").value.trim(),
        phone: document.querySelector("#tutor-phone").value.trim(),
        city: document.querySelector("#tutor-city").value.trim(),
        area: document.querySelector("#tutor-area").value.trim(),
        subjects: Array.from(form.querySelectorAll('input[name="subjects"]:checked')).map(function (input) {
          return input.value.trim();
        }),
        levels: Array.from(form.querySelectorAll('input[name="levels"]:checked')).map(function (input) {
          return input.value.trim();
        }),
        mode: (form.querySelector('input[name="teachingMode"]:checked').value.toLowerCase()),
        experience: Number(document.querySelector("#experience").value),
        fee: Number(document.querySelector("#fee").value),
        qualification: document.querySelector("#qualification").value.trim(),
        institute: document.querySelector("#institute").value.trim(),
        bio: document.querySelector("#bio").value.trim(),
        days: Array.from(form.querySelectorAll('input[name="days"]:checked')).map(function (input) {
          return input.value.trim();
        }),
        time: form.querySelector('input[name="availabilityTime"]:checked').value.trim()
      };

      let validFinalValues = true;
      if (!values.fullName || !values.phone || !values.city || !values.area ||
        !values.subjects.length || !values.levels.length || !values.qualification ||
        !values.institute || !values.bio || !values.days.length || !values.time ||
        !Number.isFinite(values.experience) || !Number.isFinite(values.fee)) {
        validFinalValues = false;
      }
      if (!validFinalValues) {
        termsError.textContent = "Please complete all required information before submitting.";
        return;
      }

      const uploadBucket = window.supabaseClient.storage.from("tutor-documents");
      const timestamp = Date.now();
      const cvPath = currentUser.id + "/cv-" + timestamp + "." + cvExt;
      const idPath = currentUser.id + "/id-" + timestamp + "." + idExt;
      const uploadedPaths = [];

      setWorking(true, "Uploading documents...");
      try {
        const cvUpload = await uploadBucket.upload(cvPath, cvInput.files[0]);
        if (cvUpload.error) throw cvUpload.error;
        uploadedPaths.push(cvPath);

        const idUpload = await uploadBucket.upload(idPath, idInput.files[0]);
        if (idUpload.error) throw idUpload.error;
        uploadedPaths.push(idPath);

        const availability = values.days.join(", ") + " - " + values.time;
        const { error: insertError } = await window.supabaseClient
          .from("tutor_applications")
          .insert({
            full_name: values.fullName,
            phone: values.phone,
            city: values.city,
            area: values.area,
            subjects: values.subjects,
            levels: values.levels,
            mode: values.mode,
            experience_years: values.experience,
            fee_per_hour: values.fee,
            qualification: values.qualification,
            institute: values.institute,
            bio: values.bio,
            availability: availability,
            cv_path: cvPath,
            id_doc_path: idPath
          });

        if (insertError) throw insertError;

        form.hidden = true;
        progress.hidden = true;
        successPanel.hidden = false;
      } catch (error) {
        console.error(error);
        if (uploadedPaths.length) {
          try {
            await uploadBucket.remove(uploadedPaths);
          } catch (cleanupError) {
            console.error(cleanupError);
          }
        }
        if (error && error.code === "23505") {
          statusText.textContent = "pending application";
          form.hidden = true;
          progress.hidden = true;
          statusPanel.hidden = false;
        } else {
          termsError.textContent = "We could not submit your application. Please try again.";
        }
      } finally {
        setWorking(false);
      }
    });
  });
})();
