import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://diljkqsrqdktzyumrqkg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_JjzaLH_H48oLIvuRz9F5jg_yyC5xxII";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const params = new URLSearchParams(window.location.search);
const developmentId = params.get("id");

const message = document.getElementById("editDevelopmentMessage");
const form = document.getElementById("editDevelopmentForm");

async function loadDevelopment() {
  if (!developmentId) {
    message.textContent = "No development was specified.";
    return;
  }

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
      storeys
    `)
    .eq("id", developmentId)
    .eq("is_approved", true)
    .single();

  if (error) {
    console.error(error);
    message.textContent = "Unable to load this development.";
    return;
  }

  document.getElementById("editTitle").value =
    data.title || "";

  document.getElementById("editAddress").value =
    data.address || "";

  document.getElementById("editDeveloper").value =
    data.developer || "";

  document.getElementById("editProjectType").value =
    data.project_type || "";

  document.getElementById("editStatus").value =
    data.status || "";

  document.getElementById("editUnits").value =
    data.units ?? "";

  document.getElementById("editStoreys").value =
    data.storeys ?? "";

  document.getElementById("editDescription").value =
    data.description || "";

  message.textContent = "";
  form.style.display = "block";
}

loadDevelopment();
