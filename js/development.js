const SUPABASE_URL = "https://diljkqsrqdktzyumrqkg.supabase.co";
const SUPABASE_KEY = "sb_publishable_JjzaLH_H48oLIvuRz9F5jg_yyC5xxII";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const params = new URLSearchParams(window.location.search);
const developmentId = params.get("id");

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

function getStatusClass(status) {
  if (!status) {
    return "status-default";
  }

  const value = status.toLowerCase();

  if (value.includes("concept")) {
    return "status-concept";
  }

  if (value.includes("proposed")) {
    return "status-proposed";
  }

  if (value.includes("approved")) {
    return "status-approved";
  }

  if (value.includes("construction")) {
    return "status-construction";
  }

  if (value.includes("completed")) {
    return "status-completed";
  }

  return "status-default";
}

async function loadDevelopment() {
  if (!developmentId) {
    showError("No development was specified.");
    return;
  }

  const { data, error } = await supabase
    .from("developments")
    .select(`
      id,
      title,
      address,
      description,
      developer,
      project_type,
      status,
      completion_year,
      units,
      storeys
    `)
    .eq("id", developmentId)
    .eq("is_approved", true)
    .single();

  if (error || !data) {
    console.error("Development loading error:", error);
    showError("Unable to load this development.");
    return;
  }

  document.title = `${data.title} | Kelowna Developments`;

  const titleElement = document.getElementById("developmentTitle");
  const addressElement = document.getElementById("developmentAddress");
  const nameElement = document.getElementById("developmentName");
  const detailsElement = document.getElementById("developmentDetails");
  const descriptionElement = document.getElementById("developmentDescription");

  if (titleElement) {
    titleElement.textContent = data.title;
  }

  if (addressElement) {
    addressElement.textContent =
      data.address || "Kelowna, British Columbia";
  }

  if (nameElement) {
    nameElement.textContent = data.title;
  }

  if (detailsElement) {
    detailsElement.innerHTML = `
      <div class="detail-item">
        <strong>Address</strong>
        <span>${escapeHtml(data.address || "Kelowna, British Columbia")}</span>
      </div>

      <div class="detail-item">
        <strong>Developer</strong>
        <span>${escapeHtml(data.developer || "Not specified")}</span>
      </div>

      <div class="detail-item">
        <strong>Project Type</strong>
        <span>${escapeHtml(data.project_type || "Not specified")}</span>
      </div>

      <div class="detail-item">
        <strong>Status</strong>
        <span>${escapeHtml(data.status || "Not specified")}</span>
      </div>

      ${
        data.completion_year
          ? `
            <div class="detail-item">
              <strong>Expected Completion</strong>
              <span>${escapeHtml(data.completion_year)}</span>
            </div>
          `
          : ""
      }

      <div class="detail-item">
        <strong>Units</strong>
        <span>${data.units ?? "Not specified"}</span>
      </div>

      <div class="detail-item">
        <strong>Storeys</strong>
        <span>${data.storeys ?? "Not specified"}</span>
      </div>
    `;
  }

  if (descriptionElement) {
    descriptionElement.innerHTML = data.description
      ? escapeHtml(data.description).replace(/\n/g, "<br>")
      : "No description has been provided.";
  }

  addStatusBanner(data);

  await loadPresetImages();
  await loadDiscussions();
  await loadAttachments();
  await setupDiscussionForm();
}

function addStatusBanner(data) {
  const titleElement = document.getElementById("developmentTitle");

  if (!titleElement) {
    return;
  }

  const existingBanner = document.getElementById(
    "developmentStatusBanner"
  );

  if (existingBanner) {
    existingBanner.remove();
  }

  if (!data.status) {
    return;
  }

  const banner = document.createElement("div");

  banner.id = "developmentStatusBanner";
  banner.className =
    `development-status-banner ${getStatusClass(data.status)}`;

  banner.innerHTML = `
    <span class="development-status-label">
      ${escapeHtml(data.status)}
    </span>

    ${
      data.completion_year
        ? `
          <span class="development-completion">
            Expected completion: ${escapeHtml(data.completion_year)}
          </span>
        `
        : ""
    }
  `;

  titleElement.parentNode.insertBefore(
    banner,
    titleElement
  );
}

async function loadPresetImages() {
  const gallery = document.getElementById(
    "developmentPresetGallery"
  );

  if (!gallery) {
    return;
  }

  gallery.innerHTML = "<p>Loading development photos...</p>";

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
    console.error("Preset image loading error:", error);

    gallery.innerHTML =
      "<p>Unable to load development photos.</p>";

    return;
  }

  if (!data || data.length === 0) {
    gallery.innerHTML = "";
    return;
  }

  gallery.innerHTML = data.map(image => `
    <a
      href="${escapeHtml(image.image_url)}"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        src="${escapeHtml(image.image_url)}"
        alt="${escapeHtml(image.file_name || "Development photo")}"
        class="preset-gallery-image"
      >
    </a>
  `).join("");
}

async function loadDiscussions() {
  const discussionList = document.getElementById(
    "discussionList"
  );

  if (!discussionList) {
    return;
  }

  discussionList.innerHTML =
    "<p>Loading discussions...</p>";

  const { data, error } = await supabase
    .from("discussions")
    .select(`
      id,
      development_id,
      user_id,
      content,
      created_at,
      profiles (
        display_name,
        avatar_url
      ),
      attachments (
        id,
        file_name,
        file_url,
        file_type,
        file_size
      )
    `)
    .eq("development_id", developmentId)
    .order("created_at", {
      ascending: true
    });

  if (error) {
    console.error("Discussion loading error:", error);

    discussionList.innerHTML =
      "<p>Unable to load discussions.</p>";

    return;
  }

  if (!data || data.length === 0) {
    discussionList.innerHTML =
      "<p>No discussions yet. Be the first to comment.</p>";

    return;
  }

  discussionList.innerHTML = data.map(discussion => {
    const profile = discussion.profiles || {};

    const displayName =
      profile.display_name || "User";

    const date = new Date(
      discussion.created_at
    ).toLocaleString();

    const attachments =
      discussion.attachments || [];

    const attachmentHtml = attachments.length
      ? `
        <div class="discussion-attachments">
          ${attachments.map(file => {
            if (file.file_type &&
                file.file_type.startsWith("image/")) {
              return `
                <a
                  href="${escapeHtml(file.file_url)}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="${escapeHtml(file.file_url)}"
                    alt="${escapeHtml(file.file_name)}"
                    class="discussion-image"
                  >
                </a>
              `;
            }

            return `
              <a
                href="${escapeHtml(file.file_url)}"
                target="_blank"
                rel="noopener noreferrer"
                class="discussion-file"
              >
                ${escapeHtml(file.file_name)}
              </a>
            `;
          }).join("")}
        </div>
      `
      : "";

    return `
      <article class="discussion-card">

        <div class="discussion-header">
          <strong>
            ${escapeHtml(displayName)}
          </strong>

          <span>
            ${escapeHtml(date)}
          </span>
        </div>

        <div class="discussion-content">
          ${escapeHtml(discussion.content).replace(/\n/g, "<br>")}
        </div>

        ${attachmentHtml}

      </article>
    `;
  }).join("");
}

async function loadAttachments() {
  const imageGallery = document.getElementById(
    "imageGallery"
  );

  const fileList = document.getElementById(
    "fileList"
  );

  if (imageGallery) {
    imageGallery.innerHTML =
      "Loading images...";
  }

  if (fileList) {
    fileList.innerHTML =
      "Loading files...";
  }

  const { data, error } = await supabase
    .from("attachments")
    .select(`
      id,
      file_name,
      file_url,
      file_type,
      file_size,
      created_at
    `)
    .eq("development_id", developmentId)
    .order("created_at", {
      ascending: true
    });

  if (error) {
    console.error("Attachment loading error:", error);

    if (imageGallery) {
      imageGallery.innerHTML =
        "<p>Unable to load images.</p>";
    }

    if (fileList) {
      fileList.innerHTML =
        "<p>Unable to load files.</p>";
    }

    return;
  }

  const images = (data || []).filter(file =>
    file.file_type &&
    file.file_type.startsWith("image/")
  );

  const files = (data || []).filter(file =>
    !file.file_type ||
    !file.file_type.startsWith("image/")
  );

  if (imageGallery) {
    if (images.length === 0) {
      imageGallery.innerHTML =
        "<p>No discussion images yet.</p>";
    } else {
      imageGallery.innerHTML = images.map(file => `
        <a
          href="${escapeHtml(file.file_url)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="${escapeHtml(file.file_url)}"
            alt="${escapeHtml(file.file_name)}"
            class="gallery-image"
          >
        </a>
      `).join("");
    }
  }

  if (fileList) {
    if (files.length === 0) {
      fileList.innerHTML =
        "<p>No files yet.</p>";
    } else {
      fileList.innerHTML = files.map(file => `
        <a
          href="${escapeHtml(file.file_url)}"
          target="_blank"
          rel="noopener noreferrer"
          class="gallery-file"
        >
          ${escapeHtml(file.file_name)}
        </a>
      `).join("");
    }
  }
}

async function setupDiscussionForm() {
  const form = document.getElementById(
    "discussionForm"
  );

  const contentInput = document.getElementById(
    "discussionContent"
  );

  const filesInput = document.getElementById(
    "discussionFiles"
  );

  const selectedFiles = document.getElementById(
    "selectedFiles"
  );

  const message = document.getElementById(
    "discussionFormMessage"
  );

  if (!form || !contentInput || !filesInput) {
    return;
  }

  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();

  currentUser = user;

  if (!currentUser) {
    form.innerHTML = `
      <p>
        Please log in to participate in the discussion.
      </p>
    `;

    return;
  }

  filesInput.addEventListener("change", () => {
    const files = Array.from(
      filesInput.files || []
    );

    if (!selectedFiles) {
      return;
    }

    if (files.length === 0) {
      selectedFiles.innerHTML = "";
      return;
    }

    const maxFileSize = 10 * 1024 * 1024;

    selectedFiles.innerHTML = files.map(file => {
      if (file.size > maxFileSize) {
        return `
          <div class="selected-file-error">
            ${escapeHtml(file.name)}
            — larger than 10 MB
          </div>
        `;
      }

      return `
        <div class="selected-file">
          ${escapeHtml(file.name)}
        </div>
      `;
    }).join("");
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const content = contentInput.value.trim();
    const files = Array.from(
      filesInput.files || []
    );

    if (!content) {
      message.textContent =
        "Please enter a discussion message.";

      return;
    }

    message.textContent =
      "Posting discussion...";

    const { data: discussion, error } = await supabase
      .from("discussions")
      .insert({
        development_id: Number(developmentId),
        user_id: currentUser.id,
        content: content
      })
      .select()
      .single();

    if (error) {
      console.error(error);

      message.textContent =
        "Unable to post discussion: " +
        error.message;

      return;
    }

    const maxFileSize = 10 * 1024 * 1024;

    for (const file of files) {
      if (file.size > maxFileSize) {
        continue;
      }

      const safeName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "-")
        .replace(/-+/g, "-");

      const storagePath =
        `${developmentId}/${currentUser.id}/${crypto.randomUUID()}-${safeName}`;

      const {
        error: uploadError
      } = await supabase.storage
        .from("development-files")
        .upload(
          storagePath,
          file,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type
          }
        );

      if (uploadError) {
        console.error(uploadError);
        continue;
      }

      const {
        data: publicUrlData
      } = supabase.storage
        .from("development-files")
        .getPublicUrl(storagePath);

      const fileUrl =
        publicUrlData.publicUrl;

      const {
        error: attachmentError
      } = await supabase
        .from("attachments")
        .insert({
          development_id: Number(developmentId),
          discussion_id: discussion.id,
          user_id: currentUser.id,
          file_name: file.name,
          file_url: fileUrl,
          file_type: file.type || "application/octet-stream",
          file_size: file.size
        });

      if (attachmentError) {
        console.error(attachmentError);

        await supabase.storage
          .from("development-files")
          .remove([storagePath]);
      }
    }

    contentInput.value = "";
    filesInput.value = "";

    if (selectedFiles) {
      selectedFiles.innerHTML = "";
    }

    message.textContent =
      "Discussion posted successfully.";

    await loadDiscussions();
    await loadAttachments();
  });
}

function showError(text) {
  const title = document.getElementById(
    "developmentTitle"
  );

  const address = document.getElementById(
    "developmentAddress"
  );

  const details = document.getElementById(
    "developmentDetails"
  );

  const description = document.getElementById(
    "developmentDescription"
  );

  if (title) {
    title.textContent = "Unable to load development";
  }

  if (address) {
    address.textContent = "";
  }

  if (details) {
    details.textContent = text;
  }

  if (description) {
    description.textContent = "";
  }
}

async function initialize() {
  try {
    await loadDevelopment();
  } catch (error) {
    console.error(
      "Unexpected development page error:",
      error
    );

    showError(
      "Something went wrong while loading this development."
    );
  }
}

initialize();
