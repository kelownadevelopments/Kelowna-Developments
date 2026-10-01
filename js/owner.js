import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://diljkqsrqdktzyumrqkg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_JjzaLH_H48oLIvuRz9F5jg_yyC5xxII";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

async function loadOwnerDashboard() {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleError || roleData?.role !== "owner") {
    window.location.href = "index.html";
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, is_verified")
    .eq("id", user.id)
    .maybeSingle();

  const dashboardHero = document.querySelector(".hero");

  if (dashboardHero) {
    dashboardHero.innerHTML = `
      <p class="eyebrow">ADMINISTRATION</p>

      <h1>Owner Dashboard</h1>

      <p>
        Welcome, ${escapeHtml(
          profile?.display_name || user.email || "Owner"
        )}.
      </p>

      <p>
        You are signed in as the Owner of Kelowna Developments.
      </p>
    `;
  }

  await loadUsers();
}

async function loadUsers() {
  const userList = document.getElementById("userList");
  const userMessage = document.getElementById("userMessage");

  if (!userList) return;

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      avatar_url,
      bio,
      is_verified,
      is_banned,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);

    if (userMessage) {
      userMessage.textContent =
        "Could not load users. Check the browser console for details.";
    }

    return;
  }

  if (userMessage) {
    userMessage.textContent =
      `${profiles.length} account${profiles.length === 1 ? "" : "s"} found.`;
  }

  if (profiles.length === 0) {
    userList.innerHTML = `
      <p>No users have registered yet.</p>
    `;

    return;
  }

  userList.innerHTML = profiles
    .map(
      (profile) => `
        <div class="user-card">

          <div class="user-card-info">

            ${
              profile.avatar_url
                ? `
                  <img
                    src="${escapeHtml(profile.avatar_url)}"
                    alt=""
                    class="user-avatar"
                  >
                `
                : `
                  <div class="user-avatar user-avatar-placeholder">
                    ?
                  </div>
                `
            }

            <div>
              <h3>
                ${escapeHtml(profile.display_name || "Unnamed User")}
              </h3>

              <p>
                Joined:
                ${new Date(profile.created_at).toLocaleDateString()}
              </p>

              <p>
                ${
                  profile.is_verified
                    ? "✓ Verified"
                    : "Not verified"
                }

                ·

                ${
                  profile.is_banned
                    ? "🚫 Banned"
                    : "Active"
                }
              </p>

              <div class="user-actions">

                ${
                  profile.is_verified
                    ? `
                      <button
                        type="button"
                        class="secondary verify-button"
                        data-user-id="${escapeHtml(profile.id)}"
                        data-action="unverify"
                      >
                        Unverify
                      </button>
                    `
                    : `
                      <button
                        type="button"
                        class="button verify-button"
                        data-user-id="${escapeHtml(profile.id)}"
                        data-action="verify"
                      >
                        Verify
                      </button>
                    `
                }

              </div>
            </div>

          </div>

        </div>
      `
    )
    .join("");

  document.querySelectorAll(".verify-button").forEach((button) => {
    button.addEventListener("click", () => {
      updateVerification(
        button.dataset.userId,
        button.dataset.action === "verify"
      );
    });
  });
}

async function updateVerification(userId, shouldVerify) {
  const action = shouldVerify ? "verify" : "unverify";

  const confirmed = window.confirm(
    `Are you sure you want to ${action} this user?`
  );

  if (!confirmed) return;

  const { error } = await supabase
    .from("profiles")
    .update({
      is_verified: shouldVerify
    })
    .eq("id", userId);

  if (error) {
    console.error(error);

    alert(
      `Could not ${action} this user: ${error.message}`
    );

    return;
  }

  await loadUsers();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadOwnerDashboard();

async function loadDevelopmentRequests() {
  const message = document.getElementById("developmentRequestMessage");
  const list = document.getElementById("developmentRequestList");

  if (!message || !list) {
    return;
  }

  message.textContent = "Loading development requests...";
  list.innerHTML = "";

  const { data, error } = await supabase
    .from("development_requests")
    .select(`
      id,
      title,
      address,
      description,
      developer,
      project_type,
      units,
      storeys,
      status,
      owner_notes,
      created_at,
      profiles!development_requests_submitted_by_fkey (
        display_name,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    message.textContent = "Unable to load development requests.";
    return;
  }

  if (!data || data.length === 0) {
    message.textContent = "No development requests have been submitted.";
    return;
  }

  message.textContent = "";

  data.forEach((request) => {
    const card = document.createElement("div");
    card.className = "dashboard-card";

    const submittedBy =
      request.profiles?.display_name || "Unknown user";

    const date = new Date(request.created_at).toLocaleDateString();

    card.innerHTML = `
      <h3>${request.title}</h3>

      <p>
        <strong>Submitted by:</strong>
        ${submittedBy}
      </p>

      <p>
        <strong>Submitted:</strong>
        ${date}
      </p>

      <p>
        <strong>Status:</strong>
        ${request.status}
      </p>

      ${
        request.address
          ? `<p><strong>Address:</strong> ${request.address}</p>`
          : ""
      }

      ${
        request.developer
          ? `<p><strong>Developer:</strong> ${request.developer}</p>`
          : ""
      }

      ${
        request.project_type
          ? `<p><strong>Project Type:</strong> ${request.project_type}</p>`
          : ""
      }

      ${
        request.units !== null
          ? `<p><strong>Units:</strong> ${request.units}</p>`
          : ""
      }

      ${
        request.storeys !== null
          ? `<p><strong>Storeys:</strong> ${request.storeys}</p>`
          : ""
      }

      ${
  request.description
    ? `<p><strong>Description:</strong> ${request.description}</p>`
    : ""
}

<button
  class="button delete-request-button"
  data-request-id="${request.id}"
  type="button"
>
  Delete Request
</button>
`;

    list.appendChild(card);
  });
}

loadDevelopmentRequests();

document.addEventListener("click", async (event) => {
  const button = event.target.closest(".delete-request-button");

  if (!button) {
    return;
  }

  const requestId = button.dataset.requestId;

  const confirmed = confirm(
    "Are you sure you want to permanently delete this development request?"
  );

  if (!confirmed) {
    return;
  }

  button.disabled = true;
  button.textContent = "Deleting...";

  const { error } = await supabase
    .from("development_requests")
    .delete()
    .eq("id", requestId);

  if (error) {
    console.error(error);
    alert("Unable to delete the development request.");
    button.disabled = false;
    button.textContent = "Delete Request";
    return;
  }

  loadDevelopmentRequests();
});

const createDevelopmentForm = document.getElementById("createDevelopmentForm");

if (createDevelopmentForm) {
  createDevelopmentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = document.getElementById("createDevelopmentMessage");

    message.textContent = "Creating development...";

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      message.textContent = "You must be logged in.";
      return;
    }

    const title = document.getElementById("developmentTitle").value.trim();
    const address = document.getElementById("developmentAddress").value.trim();
    const developer = document.getElementById("developmentDeveloper").value.trim();
    const projectType = document.getElementById("developmentProjectType").value;
    const status = document.getElementById("developmentStatus").value;
    const unitsValue = document.getElementById("developmentUnits").value;
    const storeysValue = document.getElementById("developmentStoreys").value;
    const description = document.getElementById("developmentDescription").value.trim();

    const { error } = await supabase
      .from("developments")
      .insert({
        title: title,
        address: address || null,
        description: description || null,
        developer: developer || null,
        project_type: projectType || null,
        status: status,
        units: unitsValue ? Number(unitsValue) : null,
        storeys: storeysValue ? Number(storeysValue) : null,
        submitted_by: user.id,
        approved_by: user.id,
        is_approved: true,
        approved_at: new Date().toISOString()
      });

    if (error) {
      console.error(error);
      message.textContent = "There was a problem creating the development.";
      return;
    }

    createDevelopmentForm.reset();

    message.textContent =
      "Development created successfully.";
    
    loadDevelopmentRequests();
  });
}

async function loadOfficialDevelopments() {
  const list = document.getElementById("officialDevelopmentList");
  const message = document.getElementById("officialDevelopmentMessage");

  if (!list || !message) {
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
      units,
      storeys,
      created_at
    `)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    message.textContent = "Unable to load official developments.";
    return;
  }

  if (!data || data.length === 0) {
    message.textContent = "No official developments have been created yet.";
    list.innerHTML = "";
    return;
  }

  message.textContent = "";

  list.innerHTML = data.map((development) => `
    <div class="development-card">
      <h3>${escapeHtml(development.title)}</h3>

      ${
        development.address
          ? `<p><strong>Address:</strong> ${escapeHtml(development.address)}</p>`
          : ""
      }

      ${
        development.developer
          ? `<p><strong>Developer:</strong> ${escapeHtml(development.developer)}</p>`
          : ""
      }

      ${
        development.status
          ? `<p><strong>Status:</strong> ${escapeHtml(development.status)}</p>`
          : ""
      }

      ${
        development.project_type
          ? `<p><strong>Project Type:</strong> ${escapeHtml(development.project_type)}</p>`
          : ""
      }

      <p>
        <strong>Units:</strong>
        ${development.units ?? "N/A"}
      </p>

      <p>
        <strong>Storeys:</strong>
        ${development.storeys ?? "N/A"}
      </p>

     <div class="development-actions">
  <a
    href="development.html?id=${development.id}"
    class="button"
  >
    View Development
  </a>

  <button
    type="button"
    class="button edit-development-button"
    data-id="${development.id}"
  >
    Edit
  </button>
</div>
    </div>
  `).join("");
}

loadOfficialDevelopments();
