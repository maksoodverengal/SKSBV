const form = document.getElementById("registrationForm");
const photoInput = document.getElementById("photo");
const preview = document.getElementById("preview");
const previewWrap = document.getElementById("previewWrap");
const submitBtn = document.getElementById("submitBtn");
const statusBox = document.getElementById("status");

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  if (!file) {
    previewWrap.classList.add("hidden");
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    photoInput.value = "";
    previewWrap.classList.add("hidden");
    setStatus("Photo must be 2 MB or smaller.", "error");
    return;
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    photoInput.value = "";
    previewWrap.classList.add("hidden");
    setStatus("Please select a JPG, PNG or WebP image.", "error");
    return;
  }

  preview.src = URL.createObjectURL(file);
  previewWrap.classList.remove("hidden");
  setStatus("", "");
});

function setStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = "status " + (type || "");
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("", "");

  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
    setStatus("Admin setup is incomplete: add the Google Apps Script URL in config.js.", "error");
    return;
  }

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const studentClass = document.getElementById("class").value;
  const photoFile = photoInput.files[0];

  if (name.length < 2) return setStatus("Please enter a valid name.", "error");
  if (!/^[0-9+\-\s()]{7,15}$/.test(phone))
    return setStatus("Please enter a valid phone number.", "error");
  if (!studentClass) return setStatus("Please select a class.", "error");
  if (!photoFile) return setStatus("Please select a photo.", "error");
  if (photoFile.size > 2 * 1024 * 1024)
    return setStatus("Photo must be 2 MB or smaller.", "error");

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  setStatus("Please wait...", "");

  try {
    const photoBase64 = await fileToBase64(photoFile);

    const data = new URLSearchParams();
    data.append("name", name);
    data.append("phone", phone);
    data.append("class", studentClass);
    data.append("photoBase64", photoBase64);
    data.append("photoMimeType", photoFile.type);
    data.append("photoName", photoFile.name);

    // no-cors is intentional: Apps Script Web Apps do not expose a normal
    // CORS response to browser JavaScript. The request is still delivered.
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      body: data
    });

    form.reset();
    previewWrap.classList.add("hidden");
    setStatus("Registration submitted successfully!", "success");
  } catch (error) {
    console.error(error);
    setStatus("Could not submit. Please try again.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Registration";
  }
});
