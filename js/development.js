const SUPABASE_URL = "https://diljkqsrqdktzyumrqkg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_JjzaLH_H48oLIvuRz9F5jg_yyC5xxII";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const params = new URLSearchParams(window.location.search);
const developmentId = params.get("id");

const messageElement =
  document.getElementById("developmentMessage");

const contentElement =
  document.getElementById("developmentContent");

async function loadDevelopment() {
  if (!developmentId) {
    messageElement.textContent =
      "No development was specified.";
    return;
  }

  const { data, error } = await supabaseClient
    .from("developments")
    .select("*")
    .eq("id", developmentId)
    .eq("is_approved", true)
    .single();

  if (error) {
    console.error(error);

    messageElement.textContent =
      "Unable to load this development.";

    return;
  }

  document.getElementById("developmentTitle").textContent =
    data.title;

  document.getElementById("developmentAddress").textContent =
    data.address || "Kelowna, British Columbia";

  document.getElementById("developmentName").textContent =
    data.title;

  const details =
    document.getElementById("developmentDetails");

  details.innerHTML = `
    ${
      data.address
        ? `<p><strong>Address:</strong> ${escapeHtml(data.address)}</p>`
        : ""
    }

    ${
      data.developer
        ? `<p><strong>Developer:</strong> ${escapeHtml(data.developer)}</p>`
        : ""
    }

    ${
      data.project_type
        ? `<p><strong>Project Type:</strong> ${escapeHtml(data.project_type)}</p>`
        : ""
    }

    ${
      data.status
        ? `<p><strong>Status:</strong> ${escapeHtml(data.status)}</p>`
        : ""
    }

    ${
      data.units !== null
        ? `<p><strong>Units:</strong> ${data.units}</p>`
        : ""
    }

    ${
      data.storeys !== null
        ? `<p><strong>Storeys:</strong> ${data.storeys}</p>`
        : ""
    }
  `;

  document.getElementById(
    "developmentDescription"
  ).textContent =
    data.description ||
    "No description has been provided yet.";

  document.title =
    `${data.title} | Kelowna Developments`;

  messageElement.style.display = "none";
  contentElement.style.display = "block";

  loadDiscussions();
}

async function loadDiscussions() {
  const discussionList =
    document.getElementById("discussionList");

  if (!discussionList) {
    return;
  }

  const { data, error } = await supabaseClient
    .from("discussions")
    .select("*")
    .eq("development_id", developmentId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    discussionList.innerHTML =
      "<p>Unable to load discussions.</p>";
    return;
  }

  if (!data || data.length === 0) {
    discussionList.innerHTML =
      "<p>No discussions yet.</p>";
    return;
  }

  discussionList.innerHTML = data
    .map(
      (discussion) => `
        <div class="discussion-card">
          <p>${escapeHtml(discussion.content)}</p>
          <small>
            ${new Date(
              discussion.created_at
            ).toLocaleString()}
          </small>
        </div>
      `
    )
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
