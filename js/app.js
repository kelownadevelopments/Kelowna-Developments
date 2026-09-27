```javascript
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://diljkqsrqdktzyumrqkg.supabase.co";

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
const modalBackground = document.querySelector(".modal-background");

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
// MODAL
// =========================================================

function openModal() {
  if (authModal) {
    authModal.classList.remove("hidden");
  }
}


function closeAuth() {
  if (authModal) {
    authModal.classList.add("hidden");
  }
}


// =========================================================
// AUTH SCREEN
// =========================================================

function openAuth(mode) {

  authMode = mode;

  openModal();

  authMessage.textContent = "";

  authForm.style.display = "block";
  switchAuth.style.display = "block";

  authForm.reset();


  if (mode === "signup") {

    authTitle.textContent = "Create your account";

    authDescription.textContent =
      "Create an account to participate in the Kelowna Developments community.";

    authButtonText.textContent = "Create Account";

    nameField.style.display = "block";

    displayName.required = true;

    switchAuth.textContent =
      "Already have an account? Log in";

  } else {

    authTitle.textContent = "Log in";

    authDescription.textContent =
      "Log in to your Kelowna Developments account.";

    authButtonText.textContent = "Log In";

    nameField.style.display = "none";

    displayName.required = false;

    switchAuth.textContent =
      "Need an account? Create one";

  }
}


// =========================================================
// ACCOUNT
// =========================================================

async function openAccount() {

  const result =
    await supabase.auth.getUser();

  const user =
    result.data.user;


  if (!user) {

    openAuth("login");

    return;

  }


  const profileResult =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();


  const profile =
    profileResult.data;


  const roleResult =
    await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();


  const role =
    roleResult.data?.role || "user";


  authTitle.textContent =
    "Your Account";


  authDescription.textContent =
    "Your Kelowna Developments account information.";


  authForm.style.display =
    "none";


  switchAuth.style.display =
    "none";


  nameField.style.display =
    "none";


  authMessage.innerHTML = "";


  const accountInfo =
    document.createElement("div");


  accountInfo.className =
    "account-panel";


  const nameParagraph =
    document.createElement("p");

  nameParagraph.innerHTML =
    "<strong>Display Name</strong><br>" +
    escapeHtml(
      profile?.display_name || "Not set"
    );


  const emailParagraph =
    document.createElement("p");

  emailParagraph.innerHTML =
    "<strong>Email</strong><br>" +
    escapeHtml(
      user.email || ""
    );


  const statusParagraph =
    document.createElement("p");

  statusParagraph.innerHTML =
    "<strong>Account Status</strong><br>" +
    (
      profile?.is_verified
        ? "✓ Verified"
        : "Not yet verified"
    );


  const roleParagraph =
    document.createElement("p");

  let roleName =
    "User";


  if (role === "owner") {

    roleName = "Owner";

  } else if (role === "moderator") {

    roleName = "Moderator";

  }


  roleParagraph.innerHTML =
    "<strong>Account Role</strong><br>" +
    roleName;


  accountInfo.appendChild(
    nameParagraph
  );

  accountInfo.appendChild(
    emailParagraph
  );

  accountInfo.appendChild(
    statusParagraph
  );

  accountInfo.appendChild(
    roleParagraph
  );


  authMessage.appendChild(
    accountInfo
  );


  if (
    role === "owner" ||
    role === "moderator"
  ) {

    const dashboardButton =
      document.createElement("button");


    dashboardButton.type =
      "button";


    dashboardButton.className =
      "button full-width";


    dashboardButton.style.marginTop =
      "16px";


    dashboardButton.textContent =
      role === "owner"
        ? "Owner Dashboard"
        : "Moderator Dashboard";


    dashboardButton.addEventListener(
      "click",
      function() {

        authMessage.textContent =
          "The dashboard will be built here.";

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

  const result =
    await supabase.auth.getUser();

  const user =
    result.data.user;


  if (user) {

    loginLink.textContent =
      "Account";

    signupLink.textContent =
      "Log Out";

    signupLink.classList.remove(
      "button"
    );


    if (heroSignup) {

      heroSignup.style.display =
        "none";

    }

  } else {

    loginLink.textContent =
      "Log In";

    signupLink.textContent =
      "Create Account";

    signupLink.classList.add(
      "button"
    );


    if (heroSignup) {

      heroSignup.style.display =
        "inline-flex";

    }

  }

}


// =========================================================
// LOG IN / ACCOUNT
// =========================================================

loginLink.addEventListener(
  "click",
  async function(event) {

    event.preventDefault();


    const result =
      await supabase.auth.getUser();


    if (result.data.user) {

      await openAccount();

    } else {

      openAuth("login");

    }

  }
);


// =========================================================
// CREATE ACCOUNT / LOG OUT
// =========================================================

signupLink.addEventListener(
  "click",
  async function(event) {

    event.preventDefault();


    const result =
      await supabase.auth.getUser();


    if (result.data.user) {

      const logoutResult =
        await supabase.auth.signOut();


      if (logoutResult.error) {

        console.error(
          logoutResult.error
        );

        return;

      }


      await updateNavigation();

    } else {

      openAuth("signup");

    }

  }
);


// =========================================================
// HERO CREATE ACCOUNT
// =========================================================

if (heroSignup) {

  heroSignup.addEventListener(
    "click",
    function(event) {

      event.preventDefault();

      openAuth("signup");

    }
  );

}


// =========================================================
// CLOSE MODAL
// =========================================================

if (closeModal) {

  closeModal.addEventListener(
    "click",
    function() {

      closeAuth();

    }
  );

}


if (modalBackground) {

  modalBackground.addEventListener(
    "click",
    function() {

      closeAuth();

    }
  );

}


// =========================================================
// SWITCH LOGIN / SIGNUP
// =========================================================

switchAuth.addEventListener(
  "click",
  function() {

    if (authMode === "signup") {

      openAuth("login");

    } else {

      openAuth("signup");

    }

  }
);


// =========================================================
// AUTH FORM
// =========================================================

authForm.addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();


    authMessage.textContent =
      "Please wait...";


    const email =
      document.getElementById("email")
        .value
        .trim();


    const password =
      document.getElementById("password")
        .value;


    try {

      if (authMode === "signup") {

        const name =
          displayName.value.trim();


        const result =
          await supabase.auth.signUp({

            email: email,

            password: password,

            options: {

              data: {

                display_name: name

              }

            }

          });


        if (result.error) {

          throw result.error;

        }


        authMessage.textContent =
          "Account created! Check your email to confirm your account.";


        authForm.reset();


      } else {

        const result =
          await supabase.auth.signInWithPassword({

            email: email,

            password: password

          });


        if (result.error) {

          throw result.error;

        }


        authMessage.textContent =
          "Logged in successfully.";


        await updateNavigation();


        setTimeout(
          function() {

            closeAuth();

          },
          700
        );

      }

    } catch (error) {

      console.error(error);

      authMessage.textContent =
        error.message ||
        "Something went wrong.";

    }

  }
);


// =========================================================
// AUTH STATE
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


  const result =
    await supabase
      .from("developments")
      .select("*")
      .eq("is_approved", true)
      .order("created_at", {
        ascending: false
      })
      .limit(3);


  if (result.error) {

    console.error(
      "Could not load developments:",
      result.error
    );

    return;

  }


  if (
    !result.data ||
    result.data.length === 0
  ) {

    return;

  }


  developmentList.innerHTML =
    "";


  result.data.forEach(
    function(development) {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "development-card";


      const type =
        document.createElement("p");

      type.className =
        "eyebrow";

      type.textContent =
        development.project_type ||
        "DEVELOPMENT";


      const title =
        document.createElement("h3");

      title.textContent =
        development.title;


      const description =
        document.createElement("p");

      description.textContent =
        development.description ||
        "No description available.";


      card.appendChild(type);

      card.appendChild(title);

      card.appendChild(description);


      if (development.address) {

        const location =
          document.createElement("p");


        const strong =
          document.createElement("strong");


        strong.textContent =
          "Location: ";


        location.appendChild(
          strong
        );


        location.appendChild(
          document.createTextNode(
            development.address
          )
        );


        card.appendChild(
          location
        );

      }


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
```
