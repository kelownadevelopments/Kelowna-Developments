import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// =========================================================
// SUPABASE CONNECTION
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
// OPEN / CLOSE AUTH MODAL
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
// BUTTON EVENTS
// =========================================================

loginLink.addEventListener("click", function(event) {

  event.preventDefault();

  openAuth("login");

});


signupLink.addEventListener("click", function(event) {

  event.preventDefault();

  openAuth("signup");

});


heroSignup.addEventListener("click", function(event) {

  event.preventDefault();

  openAuth("signup");

});


closeModal.addEventListener("click", closeAuth);


document
  .querySelector(".modal-background")
  .addEventListener("click", closeAuth);


switchAuth.addEventListener("click", function() {

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
// CHECK CURRENT LOGIN
// =========================================================

async function updateNavigation() {

  const {
    data: { user }
  } = await supabase.auth.getUser();


  if (user) {

    loginLink.textContent = "Account";

    signupLink.textContent = "Log Out";

    signupLink.classList.remove("button");

    signupLink.style.cursor = "pointer";

  } else {

    loginLink.textContent = "Log In";

    signupLink.textContent = "Create Account";

    signupLink.classList.add("button");

  }

}


// =========================================================
// LOG OUT
// =========================================================

signupLink.addEventListener("click", async function(event) {

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  event.preventDefault();

  await supabase.auth.signOut();

  updateNavigation();

});


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
// BASIC HTML ESCAPING
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
// START APPLICATION
// =========================================================

updateNavigation();

loadDevelopments();
