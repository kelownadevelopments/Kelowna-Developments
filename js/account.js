import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://diljkqsrqdktzyumrqkg.supabase.co";
const SUPABASE_KEY = "sb_publishable_JjzaLH_H48oLIvuRz9F5jg_yyC5xxII";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

async function loadAccount() {
  const accountMessage = document.getElementById("accountMessage");

  try {
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!session || !session.user) {
      window.location.href = "index.html";
      return;
    }

    const user = session.user;

    document.getElementById("accountEmail").textContent =
      user.email || "Not available";

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "display_name, bio, is_verified, is_banned, created_at"
      )
      .eq("id", user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    document.getElementById("accountDisplayName").textContent =
      profile.display_name || "No display name";

    document.getElementById("accountVerified").textContent =
      profile.is_verified ? "Verified" : "Not verified";

    document.getElementById("accountCreated").textContent =
      formatDate(profile.created_at);

    document.getElementById("accountBio").textContent =
      profile.bio || "No bio has been added yet.";

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleError) {
      throw roleError;
    }

    const role = roleData?.role || "user";

    document.getElementById("accountRole").textContent =
      formatRole(role);

    if (role === "owner") {
      document.getElementById("accountOwnerDashboard").hidden = false;
    }

    if (profile.is_banned) {
      accountMessage.textContent =
        "Your account is currently restricted.";
      accountMessage.classList.add("error");
    }

  } catch (error) {
    console.error("Account loading error:", error);

    if (accountMessage) {
      accountMessage.textContent =
        "Unable to load your account information.";
      accountMessage.classList.add("error");
    }
  }
}

function formatRole(role) {
  if (!role) {
    return "User";
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}

function formatDate(dateString) {
  if (!dateString) {
    return "Not available";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

async function setupLogout() {
  const logoutButton = document.getElementById("accountLogout");

  if (!logoutButton) {
    return;
  }

  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    logoutButton.textContent = "Logging Out...";

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);

      logoutButton.disabled = false;
      logoutButton.textContent = "Log Out";

      const accountMessage = document.getElementById("accountMessage");

      if (accountMessage) {
        accountMessage.textContent =
          "Unable to log out. Please try again.";
        accountMessage.classList.add("error");
      }

      return;
    }

    window.location.href = "index.html";
  });
}

async function initializeAccount() {
  await loadAccount();
  await setupLogout();
}

initializeAccount();
