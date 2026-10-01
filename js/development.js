import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabase = createClient(
  "https://diljkqsrqdktzyumrqkg.supabase.co",
  "sb_publishable_JjzaLH_H48oLIvuRz9F5jg_yyC5xxII"
);

const params = new URLSearchParams(window.location.search);
const developmentId = params.get("id");

const titleElement = document.getElementById("developmentTitle");
const addressElement = document.getElementById("developmentAddress");
const nameElement = document.getElementById("developmentName");
const detailsElement = document.getElementById("developmentDetails");
const descriptionElement = document.getElementById("developmentDescription");
const messageElement = document.getElementById("developmentMessage");
const contentElement = document.getElementById("developmentContent");
const discussionList = document.getElementById("discussionList");

async function loadDevelopment() {
  if (!developmentId) {
    messageElement.textContent = "No development was specified.";
    return;
  }

  const result = await supabase
    .from("developments")
    .select("*")
    .eq("id", developmentId)
    .eq("is_approved", true)
    .single();

  if (result.error) {
    console.error("Development error:", result.error);

    messageElement.textContent =
      "Unable to load this development.";

    return;
  }

  const development = result.data;

  titleElement.textContent = development.title;
  addressElement.textContent =
    development.address || "Kelowna, British Columbia";

  nameElement.textContent = development.title;

  detailsElement.innerHTML = "";

  if (development.address) {
    detailsElement.innerHTML +=
      `<p><strong>Address:</strong> ${escapeHtml(development.address)}</p>`;
  }

  if (development.developer) {
    detailsElement.innerHTML +=
      `<p><strong>Developer:</strong> ${escapeHtml(development.developer)}</p>`;
  }

  if (development.project_type) {
    detailsElement.innerHTML +=
      `<p><strong>Project Type:</strong> ${escapeHtml(development.project_type)}</p>`;
  }

  if (development.status) {
    detailsElement.innerHTML +=
      `<p><strong>Status:</strong> ${escapeHtml(development.status)}</p>`;
  }

  if (development.units !== null) {
    detailsElement.innerHTML +=
      `<p><strong>Units:</strong> ${development.units}</p>`;
  }

  if (development.storeys !== null) {
    detailsElement.innerHTML +=
      `<p><strong>Storeys:</strong> ${development.storeys}</p>`;
  }

  descriptionElement.textContent =
    development.description ||
    "No description has been provided yet.";

  document.title =
    `${development.title} | Kelowna Developments`;

  messageElement.style.display = "none";
  contentElement.style.display = "block";

  loadDiscussions();
}

async function loadDiscussions() {
  discussionList.innerHTML = "<p>Loading discussions...</p>";

  const result = await supabase
    .from("discussions")
    .select("*")
    .eq("development_id", developmentId)
    .order("created_at", { ascending: true });

  if (result.error) {
    console.error("Discussion error:", result.error);

    discussionList.innerHTML =
      "<p>Unable to load discussions.</p>";

    return;
  }

  if (!result.data || result.data.length === 0) {
    discussionList.innerHTML =
      "<p>No discussions yet.</p>";

    return;
  }

  discussionList.innerHTML = result.data
    .map((discussion) => `
      <div class="discussion-card">
        <p>${escapeHtml(discussion.content)}</p>
        <small>
          ${new Date(discussion.created_at).toLocaleString()}
        </small>
      </div>
    `)
    .join("");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadDevelopment();
