import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://diljkqsrqdktzyumrqkg.supabase.co";
const SUPABASE_KEY = "sb_publishable_JjzaLH_H48oLIvuRz9F5jg_yyC5xxII";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const params = new URLSearchParams(window.location.search);
const developmentId = params.get("id");

const message = document.getElementById("editDevelopmentMessage");
const form = document.getElementById("editDevelopmentForm");
const saveMessage = document.getElementById("editDevelopmentSaveMessage");

const presetImagesSection = document.getElementById("presetImagesSection");
const presetImagesInput = document.getElementById("presetImages");
const presetImageList = document.getElementById("presetImageList");
const presetImageMessage = document.getElementById("presetImageMessage");

let currentUser = null;

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createSafeFileName(fileName) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

function createUniqueFileName(fileName) {
  const safeName = createSafeFileName(fileName);
  const uniqueId = crypto.randomUUID();

  return `${uniqueId}-${safeName}`;
}

async function checkOwner() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    window.location.href = "index.html";
    return false;
  }

  currentUser = user;

  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (roleError || !roleData || roleData.role !== "owner") {
    window.location.href = "index.html";
    return false;
  }

  return true;
}

async function loadDevelopment() {
  if (!developmentId) {
    message.textContent = "No development was specified.";
    return;
  }

  const { data, error } = await supabase
    .from("developments")
    .select(`
      id,
      title,
      address,
      developer,
      project_type,
      status,
      completion_year,
      units,
      storeys,
      description
    `)
    .eq("id", developmentId)
    .eq("is_approved", true)
    .single();

  if (error) {
    console.error(error);
    message.textContent = "Unable to load this development.";
    return;
  }

  document.getElementById("editTitle").value = data.title || "";
  document.getElementById("editAddress").value = data.address || "";
  document.getElementById("editDeveloper").value = data.developer || "";
  document.getElementById("editProjectType").value = data.project_type || "";
  document.getElementById("editStatus").value = data.status || "Concept";
  document.getElementById("editCompletionYear").value =
    data.completion_year || "";
  document.getElementById("editUnits").value = data.units ?? "";
  document.getElementById("editStoreys").value = data.storeys ?? "";
  document.getElementById("editDescription").value = data.description || "";

  message.textContent = "";
  form.hidden = false;
  presetImagesSection.hidden = false;

  await loadPresetImages();
}

async function saveDevelopment(event) {
  event.preventDefault();

  saveMessage.textContent = "Saving changes...";

  const title = document.getElementById("editTitle").value.trim();
  const address = document.getElementById("editAddress").value.trim();
  const developer = document.getElementById("editDeveloper").value.trim();
  const projectType = document.getElementById("editProjectType").value.trim();
  const status = document.getElementById("editStatus").value;
  const completionYear =
    document.getElementById("editCompletionYear").value.trim();
  const units = document.getElementById("editUnits").value.trim();
  const storeys = document.getElementById("editStoreys").value.trim();
  const description =
    document.getElementById("editDescription").value.trim();

  const { error } = await supabase
    .from("developments")
    .update({
      title: title,
      address: address || null,
      developer: developer || null,
      project_type: projectType || null,
      status: status || null,
      completion_year: completionYear
        ? Number(completionYear)
        : null,
      units: units ? Number(units) : null,
      storeys: storeys ? Number(storeys) : null,
      description: description || null
    })
    .eq("id", developmentId);

  if (error) {
    console.error(error);
    saveMessage.textContent =
      "Unable to save changes: " + error.message;
    return;
  }

  saveMessage.textContent = "Development updated successfully.";
}

async function loadPresetImages() {
  presetImageList.innerHTML = "Loading photos...";

  const { data, error } = await supabase
    .from("development_images")
    .select(`
      id,
      image_url,
      file_name,
      created_at
    `)
    .eq("development_id", developmentId)
    .order("created_at", {
      ascending: true
    });

  if (error) {
    console.error(error);
    presetImageList.innerHTML =
      "<p>Unable to load official photos.</p>";
    return;
  }

  if (!data || data.length === 0) {
    presetImageList.innerHTML =
      "<p>No official photos have been added yet.</p>";
    return;
  }

  presetImageList.innerHTML = data.map(image => `
    <div class="preset-image-item">
      <img
        src="${escapeHtml(image.image_url)}"
        alt="${escapeHtml(image.file_name || "Development photo")}"
        class="preset-image-preview"
      >

      <div class="preset-image-info">
        <strong>
          ${escapeHtml(image.file_name || "Development photo")}
        </strong>

        <button
          type="button"
          class="button delete-preset-image-button"
          data-id="${image.id}"
          data-url="${escapeHtml(image.image_url)}"
        >
          Delete Photo
        </button>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".delete-preset-image-button").forEach(button => {
    button.addEventListener("click", async () => {
      await deletePresetImage(
        button.dataset.id,
        button.dataset.url
      );
    });
  });
}

async function uploadPresetImages() {
  const files = Array.from(presetImagesInput.files || []);

  if (files.length === 0) {
    return;
  }

  presetImageMessage.textContent = "Uploading photos...";

  const maxFileSize = 10 * 1024 * 1024;

  for (const file of files) {
    if (file.size > maxFileSize) {
      presetImageMessage.textContent =
        `${file.name} is larger than 10 MB.`;

      continue;
    }

    if (!file.type.startsWith("image/")) {
      presetImageMessage.textContent =
        `${file.name} is not a supported image.`;

      continue;
    }

    const fileName = createUniqueFileName(file.name);

    const storagePath =
      `developments/${developmentId}/preset/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("development-files")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      });

    if (uploadError) {
      console.error(uploadError);

      presetImageMessage.textContent =
        `Unable to upload ${file.name}: ${uploadError.message}`;

      continue;
    }

    const {
      data: publicUrlData
    } = supabase.storage
      .from("development-files")
      .getPublicUrl(storagePath);

    const imageUrl = publicUrlData.publicUrl;

    const { error: insertError } = await supabase
      .from("development_images")
      .insert({
        development_id: Number(developmentId),
        image_url: imageUrl,
        file_name: file.name
      });

    if (insertError) {
      console.error(insertError);

      await supabase.storage
        .from("development-files")
        .remove([storagePath]);

      presetImageMessage.textContent =
        `Unable to save ${file.name}: ${insertError.message}`;

      continue;
    }
  }

  presetImagesInput.value = "";
  presetImageMessage.textContent =
    "Photos uploaded successfully.";

  await loadPresetImages();
}

async function deletePresetImage(imageId, imageUrl) {
  const confirmed = confirm(
    "Are you sure you want to delete this official photo?"
  );

  if (!confirmed) {
    return;
  }

  const { error } = await supabase
    .from("development_images")
    .delete()
    .eq("id", imageId);

  if (error) {
    console.error(error);

    presetImageMessage.textContent =
      "Unable to delete photo: " + error.message;

    return;
  }

  try {
    const storageUrl = new URL(imageUrl);
    const marker = "/storage/v1/object/public/development-files/";

    const markerIndex = storageUrl.pathname.indexOf(marker);

    if (markerIndex !== -1) {
      const storagePath = decodeURIComponent(
        storageUrl.pathname.substring(
          markerIndex + marker.length
        )
      );

      await supabase.storage
        .from("development-files")
        .remove([storagePath]);
    }
  } catch (error) {
    console.error("Storage cleanup failed:", error);
  }

  presetImageMessage.textContent =
    "Photo deleted successfully.";

  await loadPresetImages();
}

async function initialize() {
  const owner = await checkOwner();

  if (!owner) {
    return;
  }

  await loadDevelopment();
}

form.addEventListener("submit", saveDevelopment);

presetImagesInput.addEventListener(
  "change",
  uploadPresetImages
);

initialize();
