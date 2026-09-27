import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://diljkqsrqdktzyumrqkg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_JjzaLH_H48oLIvuRz9F5jg_yyC5xxII";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

async function checkOwnerAccess() {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const { data: roleData, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || roleData?.role !== "owner") {
    window.location.href = "index.html";
    return;
  }

  console.log("Owner access granted.");
}

checkOwnerAccess();
