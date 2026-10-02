const SUPABASE_URL = "https://diljkqsrqdktzyumrqkg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_JjzaLH_H48oLIvuRz9F5jg_yyC5xxII";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const params = new URLSearchParams(window.location.search);
const developmentId = params.get("id");

const messageElement = document.getElementById("developmentMessage");
const contentElement = document.getElementById("developmentContent");

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const STORAGE_BUCKET = "development-files";

async function loadDevelopment() {
  if (!developmentId) {
    messageElement.textContent = "No development was specified.";
    return;
  }

  const result = await supabaseClient
    .from("developments")
    .select("*")
    .eq("id", developmentId)
    .eq("is_approved", true)
    .single();

  if (result.error) {
    console.error(result.error);
    messageElement.textContent = "Unable to load this development.";
    return;
  }

  const data = result.data;

  document.getElementById("developmentTitle").textContent =
    data.title;

  document.getElementById("developmentAddress").textContent =
    data.address || "Kelowna, British Columbia";

  document.getElementById("developmentName").textContent =
    data.title;

  const details = document.getElementById("developmentDetails");

  details.innerHTML = "";

  if (data.address) {
    details.innerHTML +=
      "<p><strong>Address:</strong> " +
      escapeHtml(data.address) +
      "</p>";
  }

  if (data.developer) {
    details.innerHTML +=
      "<p><strong>Developer:</strong> " +
      escapeHtml(data.developer) +
      "</p>";
  }

  if (data.project_type) {
    details.innerHTML +=
      "<p><strong>Project Type:</strong> " +
      escapeHtml(data.project_type) +
      "</p>";
  }

  if (data.status) {
    details.innerHTML +=
      "<p><strong>Status:</strong> " +
      escapeHtml(data.status) +
      "</p>";
  }

  if (data.units !== null) {
    details.innerHTML +=
      "<p><strong>Units:</strong> " +
      data.units +
      "</p>";
  }

  if (data.storeys !== null) {
    details.innerHTML +=
      "<p><strong>Storeys:</strong> " +
      data.storeys +
      "</p>";
  }

  document.getElementById("developmentDescription").textContent =
    data.description ||
    "No description has been provided yet.";

  document.title =
    data.title + " | Kelowna Developments";

  messageElement.style.display = "none";
  contentElement.style.display = "block";

  await loadDiscussions();
  await loadAttachments();
  setupFileSelection();
  await setupDiscussionForm();
}

async function loadDiscussions() {
  const discussionList =
    document.getElementById("discussionList");

  if (!discussionList) {
    return;
  }

  discussionList.innerHTML =
    "<p>Loading discussions...</p>";

  const result = await supabaseClient
    .from("discussions")
    .select(`
      id,
      content,
      created_at,
      user_id,
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

  if (result.error) {
    console.error(result.error);

    discussionList.innerHTML =
      "<p>Unable to load discussions.</p>";

    return;
  }

  const data = result.data;

  if (!data || data.length === 0) {
    discussionList.innerHTML =
      "<p>No discussions yet.</p>";

    return;
  }

  discussionList.innerHTML = "";

  data.forEach(function (discussion) {
    const card =
      document.createElement("div");

    card.className =
      "discussion-card";

    const author =
      document.createElement("div");

    author.className =
      "discussion-author";

    const authorName =
      document.createElement("strong");

    const profile =
      Array.isArray(discussion.profiles)
        ? discussion.profiles[0]
        : discussion.profiles;

    authorName.textContent =
      profile && profile.display_name
        ? profile.display_name
        : "User";

    author.appendChild(authorName);

    const date =
      document.createElement("small");

    date.textContent =
      new Date(
        discussion.created_at
      ).toLocaleString();

    author.appendChild(date);

    const paragraph =
      document.createElement("p");

    paragraph.textContent =
      discussion.content;

    card.appendChild(author);
    card.appendChild(paragraph);

    const attachments =
      discussion.attachments || [];

    if (attachments.length > 0) {
      const attachmentContainer =
        document.createElement("div");

      attachmentContainer.className =
        "discussion-attachments";

      attachments.forEach(function (attachment) {
        if (
          attachment.file_type &&
          attachment.file_type.startsWith("image/")
        ) {
          const imageLink =
            document.createElement("a");

          imageLink.href =
            attachment.file_url;

          imageLink.target =
            "_blank";

          imageLink.rel =
            "noopener noreferrer";

          const image =
            document.createElement("img");

          image.src =
            attachment.file_url;

          image.alt =
            attachment.file_name;

          image.loading =
            "lazy";

          image.className =
            "discussion-image";

          imageLink.appendChild(image);
          attachmentContainer.appendChild(imageLink);
        } else {
          const fileLink =
            document.createElement("a");

          fileLink.href =
            attachment.file_url;

          fileLink.target =
            "_blank";

          fileLink.rel =
            "noopener noreferrer";

          fileLink.textContent =
            "📎 " + attachment.file_name;

          fileLink.className =
            "discussion-file";

          attachmentContainer.appendChild(fileLink);
        }
      });

      card.appendChild(
        attachmentContainer
      );
    }

    discussionList.appendChild(card);
  });
}

async function loadAttachments() {
  const imageGallery =
    document.getElementById("imageGallery");

  const fileList =
    document.getElementById("fileList");

  if (!imageGallery || !fileList) {
    return;
  }

  imageGallery.innerHTML = "";
  fileList.innerHTML = "";

  const result = await supabaseClient
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

  if (result.error) {
    console.error(result.error);

    imageGallery.innerHTML =
      "<p>Unable to load images.</p>";

    fileList.innerHTML =
      "<p>Unable to load files.</p>";

    return;
  }

  const attachments =
    result.data || [];

  const images =
    attachments.filter(function (attachment) {
      return (
        attachment.file_type &&
        attachment.file_type.startsWith("image/")
      );
    });

  const files =
    attachments.filter(function (attachment) {
      return !(
        attachment.file_type &&
        attachment.file_type.startsWith("image/")
      );
    });

  if (images.length === 0) {
    imageGallery.innerHTML =
      "<p>No images have been uploaded yet.</p>";
  } else {
    images.forEach(function (attachment) {
      const link =
        document.createElement("a");

      link.href =
        attachment.file_url;

      link.target =
        "_blank";

      link.rel =
        "noopener noreferrer";

      const image =
        document.createElement("img");

      image.src =
        attachment.file_url;

      image.alt =
        attachment.file_name;

      image.loading =
        "lazy";

      image.className =
        "gallery-image";

      link.appendChild(image);
      imageGallery.appendChild(link);
    });
  }

  if (files.length === 0) {
    fileList.innerHTML =
      "<p>No files have been uploaded yet.</p>";
  } else {
    files.forEach(function (attachment) {
      const link =
        document.createElement("a");

      link.href =
        attachment.file_url;

      link.target =
        "_blank";

      link.rel =
        "noopener noreferrer";

      link.textContent =
        "📎 " + attachment.file_name;

      link.className =
        "gallery-file";

      fileList.appendChild(link);
    });
  }
}

function setupFileSelection() {
  const fileInput =
    document.getElementById("discussionFiles");

  const selectedFiles =
    document.getElementById("selectedFiles");

  if (!fileInput || !selectedFiles) {
    return;
  }

  fileInput.addEventListener(
    "change",
    function () {
      selectedFiles.innerHTML = "";

      const files =
        Array.from(fileInput.files);

      if (files.length === 0) {
        return;
      }

      files.forEach(function (file) {
        const item =
          document.createElement("div");

        if (file.size > MAX_FILE_SIZE) {
          item.textContent =
            file.name +
            " — too large. Maximum size is 10 MB.";

          item.className =
            "selected-file-error";
        } else {
          item.textContent =
            file.name +
            " — " +
            formatFileSize(file.size);

          item.className =
            "selected-file";
        }

        selectedFiles.appendChild(item);
      });
    }
  );
}

async function setupDiscussionForm() {
  const formContainer =
    document.getElementById(
      "discussionFormContainer"
    );

  const loginMessage =
    document.getElementById(
      "discussionLoginMessage"
    );

  const form =
    document.getElementById(
      "discussionForm"
    );

  if (
    !formContainer ||
    !loginMessage ||
    !form
  ) {
    return;
  }

  const userResult =
    await supabaseClient.auth.getUser();

  const user =
    userResult.data.user;

  if (user) {
    formContainer.style.display =
      "block";

    loginMessage.style.display =
      "none";
  } else {
    formContainer.style.display =
      "none";

    loginMessage.style.display =
      "block";

    return;
  }

  form.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      const contentInput =
        document.getElementById(
          "discussionContent"
        );

      const fileInput =
        document.getElementById(
          "discussionFiles"
        );

      const selectedFiles =
        fileInput
          ? Array.from(fileInput.files)
          : [];

      const submitButton =
        document.getElementById(
          "discussionSubmitButton"
        );

      const formMessage =
        document.getElementById(
          "discussionFormMessage"
        );

      const content =
        contentInput.value.trim();

      if (!content) {
        formMessage.textContent =
          "Please enter something before posting.";

        return;
      }

      if (content.length > 5000) {
        formMessage.textContent =
          "Your discussion is too long.";

        return;
      }

      const oversizedFile =
        selectedFiles.find(function (file) {
          return file.size > MAX_FILE_SIZE;
        });

      if (oversizedFile) {
        formMessage.textContent =
          oversizedFile.name +
          " is larger than the 10 MB limit.";

        return;
      }

      submitButton.disabled =
        true;

      submitButton.textContent =
        "Posting...";

      formMessage.textContent =
        "";

      const currentUserResult =
        await supabaseClient.auth.getUser();

      const currentUser =
        currentUserResult.data.user;

      if (!currentUser) {
        formMessage.textContent =
          "You must be logged in to post a discussion.";

        submitButton.disabled =
          false;

        submitButton.textContent =
          "Post Discussion";

        return;
      }

      const insertResult =
        await supabaseClient
          .from("discussions")
          .insert({
            development_id:
              Number(developmentId),

            user_id:
              currentUser.id,

            content:
              content
          })
          .select("id")
          .single();

      if (insertResult.error) {
        console.error(
          insertResult.error
        );

        formMessage.textContent =
          "There was a problem posting your discussion.";

        submitButton.disabled =
          false;

        submitButton.textContent =
          "Post Discussion";

        return;
      }

      const discussionId =
        insertResult.data.id;

      const uploadedPaths = [];

      let failedUploads = [];

      for (const file of selectedFiles) {
        const safeFileName =
          file.name
            .replace(/[^a-zA-Z0-9._-]/g, "_");

        const uniqueName =
          crypto.randomUUID() +
          "-" +
          safeFileName;

        const storagePath =
          developmentId +
          "/" +
          currentUser.id +
          "/" +
          uniqueName;

        const uploadResult =
          await supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .upload(
              storagePath,
              file,
              {
                cacheControl: "3600",
                upsert: false,
                contentType:
                  file.type ||
                  "application/octet-stream"
              }
            );

        if (uploadResult.error) {
          console.error(
            uploadResult.error
          );

          failedUploads.push(
            file.name
          );

          continue;
        }

        uploadedPaths.push(
          storagePath
        );

        const publicUrlResult =
          supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(
              storagePath
            );

        const publicUrl =
          publicUrlResult.data.publicUrl;

        const attachmentResult =
          await supabaseClient
            .from("attachments")
            .insert({
              development_id:
                Number(developmentId),

              discussion_id:
                discussionId,

              user_id:
                currentUser.id,

              file_name:
                file.name,

              file_url:
                publicUrl,

              file_type:
                file.type ||
                "application/octet-stream",

              file_size:
                file.size
            });

        if (attachmentResult.error) {
          console.error(
            attachmentResult.error
          );

          failedUploads.push(
            file.name
          );

          await supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .remove([
              storagePath
            ]);
        }
      }

      contentInput.value = "";

      if (fileInput) {
        fileInput.value = "";
      }

      const selectedFilesContainer =
        document.getElementById(
          "selectedFiles"
        );

      if (selectedFilesContainer) {
        selectedFilesContainer.innerHTML =
          "";
      }

      if (failedUploads.length > 0) {
        formMessage.textContent =
          "Discussion posted, but these files could not be uploaded: " +
          failedUploads.join(", ");
      } else if (selectedFiles.length > 0) {
        formMessage.textContent =
          "Discussion and files posted successfully.";
      } else {
        formMessage.textContent =
          "Discussion posted successfully.";
      }

      submitButton.disabled =
        false;

      submitButton.textContent =
        "Post Discussion";

      await loadDiscussions();
      await loadAttachments();
    }
  );
}

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return bytes + " B";
  }

  if (bytes < 1024 * 1024) {
    return (
      (bytes / 1024).toFixed(1) +
      " KB"
    );
  }

  return (
    (bytes / (1024 * 1024)).toFixed(1) +
    " MB"
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

loadDevelopment();
