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

  console.log("Owner dashboard loaded successfully.");
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
