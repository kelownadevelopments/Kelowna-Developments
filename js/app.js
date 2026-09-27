import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// =========================================================
// SUPABASE
// =========================================================

const SUPABASE_URL =
  "https://diljkqsrqdktzyumrqkg.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_JjzaLH_H48oLIvuRz9F5jg_yyC5xxII";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


// =========================================================
// ELEMENTS
// =========================================================

const authModal = document.getElementById("authModal");
const closeModal = document.getElementById("closeModal");

const loginLink = document.getElementById("loginLink");
const signupLink = document.getElementById("signupLink");
const heroSignup = document.getElementById("heroSignup");

const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authDescription = document.getElementById("authDescription");
const authButtonText = document.getElementById("authButtonText");
const authMessage = document.getElementById("authMessage");

const nameField = document.getElementById("nameField");
const displayName = document.getElementById("displayName");

const switchAuth = document.getElementById("switchAuth");

let authMode = "signup";


// =========================================================
// OPEN AUTH MODAL
// =========================================================

function openAuth(mode) {

  authMode = mode;

  authModal.classList.remove("hidden");

  authMessage.textContent = "";

  authForm.reset();

  if (mode === "signup") {

    authTitle.textContent = "Create your account";

    authDescription.textContent =
      "Create an account to participate in the Kelowna Development community.";

    authButtonText.textContent = "Create Account";

    nameField.style.display = "block";

    displayName.required = true;

    switchAuth.textContent =
      "Already have an account? Log in";

  } else {

    authTitle.textContent = "Log in";

    authDescription.textContent =
      "Log in to your Kelowna Development account.";

    authButtonText.textContent = "Log In";

    nameField.style.display = "none";

    displayName.required = false;

    switchAuth.textContent =
      "Need an account? Create one";
  }
}


function closeAuth() {
  authModal.classList.add("hidden");
}


// =========================================================
// ACCOUNT MODAL
// =========================================================

async function openAccount() {

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    openAuth("login");
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  authModal.classList.remove("hidden");

  authTitle.textContent = "Your Account";

  authDescription.textContent =
    "Manage your Kelowna Development account.";

  nameField.style.display = "none";

  authForm.style.display = "none";

  switchAuth.style.display = "none";

  if (profile) {

    authMessage.innerHTML = `
      <div style="margin-top: 25px; padding: 20px; background: #f5f7f9; border-radius: 10px;">

        <p>
          <strong>Display Name</strong><br>
          ${escapeHtml(profile.display_name || "Not set")}
        </p>

        <p>
          <strong>Email</strong><br>
          ${escapeHtml(user.email || "")}
        </p>

        <p>
          <strong>Account Status</strong><br>
          ${
            profile.is_verified
              ? "✓ Verified"
              : "Not yet verified"
          }
        </p>

      </div>
    `;

  } else {

    authMessage.textContent =
      "Your profile could not be loaded.";
  }
}


// =========================================================
// RESET AUTH MODAL
// =========================================================

function resetAuthModal() {

  authForm.style.display = "block";

  switchAuth.style.display = "block";

  nameField.style.display = "block";

}


// =========================================================
// NAVIGATION
// =========================================================

loginLink.addEventListener("click", function(event) {

  event.preventDefault();

  supabase.auth.getUser().then(function(result) {

    if (result.data.user) {

      openAccount();

    } else {

      resetAuthModal();

      openAuth("login");

    }

  });

});


signupLink.addEventListener("click", async function(event) {

  event.preventDefault();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {

    await supabase.auth.signOut();

    updateNavigation();

  } else {

    resetAuthModal();

    openAuth("signup");

  }

});


heroSignup.addEventListener("click", function(event) {

  event.preventDefault();

  resetAuthModal();

  openAuth("signup");

});


closeModal.addEventListener("click", function() {

  closeAuth();

  resetAuthModal();

});


document
  .querySelector(".modal-background")
  .addEventListener("click", function() {

    closeAuth();

    resetAuthModal();

  });


switchAuth.addEventListener("click", function() {

  resetAuthModal();

  if (authMode === "signup") {

    openAuth("login");

  } else {

    openAuth("signup");

  }

});


// =========================================================
// SIGN UP / LOG IN
// =========================================================

authForm.addEventListener("submit", async function(event) {

  event.preventDefault();

  authMessage.textContent = "Please wait...";

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value;

  try {

    if (authMode === "signup") {

      const name =
        displayName.value.trim();

      const { error } =
        await supabase.auth.signUp({

          email: email,

          password: password,

          options: {
            data: {
              display_name: name
            }
          }

        });

      if (error) {
        throw error;
      }

      authMessage.textContent =
        "Account created! Check your email to confirm your account.";

      authForm.reset();

    } else {

      const { error } =
        await supabase.auth.signInWithPassword({

          email: email,

          password: password

        });

      if (error) {
        throw error;
      }

      authMessage.textContent =
        "Logged in successfully.";

      setTimeout(function() {

        closeAuth();

        resetAuthModal();

        updateNavigation();

      }, 700);

    }

  } catch (error) {

    console.error(error);

    authMessage.textContent =
      error.message || "Something went wrong.";

  }

});


// =========================================================
// NAVIGATION STATE
// =========================================================

async function updateNavigation() {

  const {
    data: { user }
  } = await supabase.auth.getUser();


if (user) {

  loginLink.textContent = "Account";

  signupLink.textContent = "Log Out";

  signupLink.classList.remove("button");

} else {

  loginLink.textContent = "Log In";

  signupLink.textContent = "Create Account";

  signupLink.classList.add("button");

}

}


// =========================================================
// LOAD DEVELOPMENTS
// =========================================================

async function loadDevelopments() {

  const developmentList =
    document.getElementById("developmentList");

  const {
    data,
    error
  } = await supabase

    .from("developments")

    .select("*")

    .eq("is_approved", true)

    .order("created_at", {
      ascending: false
    })

    .limit(3);


  if (error) {

    console.error(error);

    return;

  }


  if (!data || data.length === 0) {

    return;

  }


  developmentList.innerHTML = "";


  data.forEach(function(development) {

    const card =
      document.createElement("article");

    card.className =
      "development-card";


    card.innerHTML = `

      <p class="eyebrow">
        ${escapeHtml(development.project_type || "DEVELOPMENT")}
      </p>

      <h3>
        ${escapeHtml(development.title)}
      </h3>

      <p>
        ${escapeHtml(
          development.description ||
          "No description available."
        )}
      </p>

      ${
        development.address
          ? `<p><strong>Location:</strong> ${escapeHtml(development.address)}</p>`
          : ""
      }

    `;


    developmentList.appendChild(card);

  });

}


// =========================================================
// HTML ESCAPING
// =========================================================

function escapeHtml(value) {

  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}


// =========================================================
// START
// =========================================================

updateNavigation();

loadDevelopments();
