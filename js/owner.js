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
