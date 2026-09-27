```javascript
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

const developmentList =
  document.getElementById("developmentList");

let authMode = "signup";


// =========================================================
// OPEN AUTH MODAL
// =========================================================

function openAuth(mode) {

  authMode = mode;

  authModal.classList.remove("hidden");

  authMessage.textContent = "";

  authForm.reset();

  authForm.style.display = "block";
  switchAuth.style.display = "block";


  if (mode === "signup") {

    authTitle.textContent =
      "Create your account";

    authDescription.textContent =
      "Create an account to participate in the Kelowna Developments community.";

    authButtonText.textContent =
      "Create Account";

    nameField.style.display =
      "block";

    displayName.required =
      true;

    switchAuth.textContent =
      "Already have an account? Log in";


  } else {

    authTitle.textContent =
      "Log in";

    authDescription.textContent =
      "Log in to your Kelowna Developments account.";

    authButtonText.textContent =
      "Log In";

    nameField.style.display =
      "none";

    displayName.required =
      false;

    switchAuth.textContent =
      "Need an account? Create one";

  }

}


// =========================================================
// CLOSE AUTH MODAL
// =========================================================

function closeAuth() {

  authModal.classList.add("hidden");

}


// =========================================================
// RESET AUTH MODAL
// =========================================================

function resetAuthModal() {

  authForm.style.display =
    "block";

  switchAuth.style.display =
    "block";

  nameField.style.display =
    "block";

  displayName.required =
    true;

  authMessage.textContent =
    "";

}


// =========================================================
// OPEN ACCOUNT
// =========================================================

async function openAccount() {

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();


  if (userError || !user) {

    resetAuthModal();

    openAuth("login");

    return;

  }


  const {
    data: profile,
    error: profileError
  } = await supabase

    .from("profiles")

    .select("*")

    .eq("id", user.id)

    .single();


  if (profileError) {

    console.error(
      "Could not load profile:",
      profileError
    );

  }


  const {
    data: roleData,
    error: roleError
  } = await supabase

    .from("user_roles")

    .select("role")

    .eq("user_id", user.id)

    .single();


  if (roleError) {

    console.error(
      "Could not load role:",
      roleError
    );

  }


  const role =
    roleData?.role || "user";


  authModal.classList.remove("hidden");


  authTitle.textContent =
    "Your Account";


  authDescription.textContent =
    "Manage your Kelowna Developments account.";


  authForm.style.display =
    "none";


  switchAuth.style.display =
    "none";


  nameField.style.display =
    "none";


  const verificationStatus =
    profile?.is_verified
      ? "✓ Verified"
      : "Not yet verified";


  let roleName =
    "User";


  if (role === "owner") {

    roleName =
      "Owner";

  } else if (role === "moderator") {

    roleName =
      "Moderator";

  }


  authMessage.innerHTML = `

    <div class="account-panel">

      <div class="account-row">

        <span class="account-label">
          Display Name
        </span>

        <span class="account-value">
          ${escapeHtml(
            profile?.display_name ||
            "Not set"
          )}
        </span>

      </div>


      <div class="account-row">

        <span class="account-label">
          Email
        </span>

        <span class="account-value">
          ${escapeHtml(
            user.email || ""
          )}
        </span>

      </div>


      <div class="account-row">

        <span class="account-label">
          Account Status
        </span>

        <span class="account-value">
          ${verificationStatus}
        </span>

      </div>


      <div class="account-row">

        <span class="account-label">
          Account Role
        </span>

        <span class="account-value">
          ${roleName}
        </span>

      </div>

    </div>

  `;


  // Owner dashboard button.
  // This will become the main administration area
  // as we build the site.

  if (role === "owner" || role === "moderator") {

    const dashboardButton =
      document.createElement("button");

    dashboardButton.className =
      "button full-width";

    dashboardButton.textContent =
      role === "owner"
        ? "Open Owner Dashboard"
        : "Open Moderator Dashboard";


    dashboardButton.style.marginTop =
      "16px";


    dashboardButton.addEventListener(
      "click",
      function() {

        authMessage.innerHTML = `

          <div class="account-panel">

            <h3>
              ${
                role === "owner"
                  ? "Owner Dashboard"
                  : "Moderator Dashboard"
              }
            </h3>

            <p>
              Your administration tools will appear here
              as we build the management system.
            </p>

          </div>

        `;

      }
    );


    authMessage.appendChild(
      dashboardButton
    );

  }

}


// =========================================================
// NAVIGATION
// =========================================================

async function updateNavigation() {

  const {
    data: { user }
  } = await supabase.auth.getUser();


  if (user) {

    // Logged-in header

    loginLink.textContent =
      "Account";

    signupLink.textContent =
      "Log Out";

    signupLink.classList.remove(
      "button"
    );


    // Hide Create Account from hero

    if (heroSignup) {

      heroSignup.style.display =
        "none";

    }


  } else {

    // Logged-out header

    loginLink.textContent =
      "Log In";

    signupLink.textContent =
      "Create Account";

    signupLink.classList.add(
      "button"
    );


    // Show Create Account in hero

    if (heroSignup) {

      heroSignup.style.display =
        "inline-flex";

    }

  }

}


// =========================================================
// LOGIN / ACCOUNT BUTTON
// =========================================================

loginLink.addEventListener(
  "click",
  async function(event) {

    event.preventDefault();


    const {
      data: { user }
    } = await supabase.auth.getUser();


    if (user) {

      openAccount();

    } else {

      resetAuthModal();

      openAuth("login");

    }

  }
);


// =========================================================
// CREATE ACCOUNT / LOG OUT BUTTON
// =========================================================

signupLink.addEventListener(
  "click",
  async function(event) {

    event.preventDefault();


    const {
      data: { user }
    } = await supabase.auth.getUser();


    if (user) {

      const {
        error
      } = await supabase.auth.signOut();


      if (error) {

        console.error(
          "Logout error:",
          error
        );

        return;

      }


      closeAuth();

      resetAuthModal();

      await updateNavigation();

      return;

    }


    resetAuthModal();

    openAuth("signup");

  }
);


// =========================================================
// HERO CREATE ACCOUNT BUTTON
// =========================================================

if (heroSignup) {

  heroSignup.addEventListener(
    "click",
    function(event) {

      event.preventDefault();

      resetAuthModal();

      openAuth("signup");

    }
  );

}


// =========================================================
// CLOSE MODAL
// =========================================================

closeModal.addEventListener(
  "click",
  function() {

    closeAuth();

    resetAuthModal();

  }
);


const modalBackground =
  document.querySelector(
    ".modal-background"
  );


if (modalBackground) {

  modalBackground.addEventListener(
    "click",
    function() {

      closeAuth();

      resetAuthModal();

    }
  );

}


// =========================================================
// SWITCH LOGIN / SIGNUP
// =========================================================

switchAuth.addEventListener(
  "click",
  function() {

    const previousMode =
      authMode;


    resetAuthModal();


    if (previousMode === "signup") {

      openAuth("login");

    } else {

      openAuth("signup");

    }

  }
);


// =========================================================
// SIGN UP / LOG IN
// =========================================================

authForm.addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();


    authMessage.textContent =
      "Please wait...";


    const email =
      document
        .getElementById("email")
        .value
        .trim();


    const password =
      document
        .getElementById("password")
        .value;


    try {


      // ---------------------------------------------
      // SIGN UP
      // ---------------------------------------------

      if (authMode === "signup") {

        const name =
          displayName
            .value
            .trim();


        const {
          error
        } = await supabase.auth.signUp({

          email: email,

          password: password,

          options: {

            data: {

              display_name:
                name

            }

          }

        });


        if (error) {

          throw error;

        }


        authMessage.textContent =
          "Account created! Check your email to confirm your account.";


        authForm.reset();


      }


      // ---------------------------------------------
      // LOG IN
      // ---------------------------------------------

      else {

        const {
          error
        } = await supabase.auth
          .signInWithPassword({

            email:
              email,

            password:
              password

          });


        if (error) {

          throw error;

        }


        authMessage.textContent =
          "Logged in successfully.";


        await updateNavigation();


        setTimeout(
          function() {

            closeAuth();

            resetAuthModal();

          },
          700
        );

      }


    } catch (error) {

      console.error(
        error
      );


      authMessage.textContent =
        error.message ||
        "Something went wrong.";

    }

  }
);


// =========================================================
// AUTH STATE LISTENER
// =========================================================

supabase.auth.onAuthStateChange(
  function() {

    updateNavigation();

  }
);


// =========================================================
// LOAD DEVELOPMENTS
// =========================================================

async function loadDevelopments() {

  if (!developmentList) {

    return;

  }


  const {
    data,
    error
  } = await supabase

    .from("developments")

    .select("*")

    .eq(
      "is_approved",
      true
    )

    .order(
      "created_at",
      {
        ascending: false
      }
    )

    .limit(3);


  if (error) {

    console.error(
      "Could not load developments:",
      error
    );

    return;

  }


  if (!data || data.length === 0) {

    return;

  }


  developmentList.innerHTML =
    "";


  data.forEach(
    function(development) {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "development-card";


      card.innerHTML = `

        <p class="eyebrow">

          ${escapeHtml(
            development.project_type ||
            "DEVELOPMENT"
          )}

        </p>


        <h3>

          ${escapeHtml(
            development.title
          )}

        </h3>


        <p>

          ${escapeHtml(
            development.description ||
            "No description available."
          )}

        </p>


        ${
          development.address
            ? `
              <p>
                <strong>
                  Location:
                </strong>

                ${escapeHtml(
                  development.address
                )}
              </p>
            `
            : ""
        }

      `;


      developmentList.appendChild(
        card
      );

    }
  );

}


// =========================================================
// HTML ESCAPING
// =========================================================

function escapeHtml(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


// =========================================================
// START APPLICATION
// =========================================================

updateNavigation();

loadDevelopments();
```
