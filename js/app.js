import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://diljkqsrqdktzyumrqkg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_JjzaLH_H48oLIvuRz9F5jg_yyC5xxII";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const loginLink = document.getElementById("loginLink");
const signupLink = document.getElementById("signupLink");
const heroSignup = document.getElementById("heroSignup");

const authModal = document.getElementById("authModal");
const closeModal = document.getElementById("closeModal");
const authContent = document.getElementById("authContent");
const authForm = document.getElementById("authForm");
const nameField = document.getElementById("nameField");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authMessage = document.getElementById("authMessage");
const switchAuth = document.getElementById("switchAuth");

const developmentList = document.getElementById("developmentList");

let currentUser = null;
let isLoginMode = true;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openAuthModal(login = true) {
  isLoginMode = login;

  if (!authModal) return;

  authModal.style.display = "flex";

  if (authContent) {
    authContent.innerHTML = `
      <h2>${isLoginMode ? "Log In" : "Create Account"}</h2>

      ${
        isLoginMode
          ? ""
          : `
            <label for="displayName">Display Name</label>
            <input
              id="displayName"
              type="text"
              placeholder="Your name"
              required
            />
          `
      }

      <label for="email">Email</label>
      <input
        id="email"
        type="email"
        placeholder="you@example.com"
        required
      />

      <label for="password">Password</label>
      <input
        id="password"
        type="password"
        placeholder="Password"
        required
      />

      <button type="submit" class="button full-width">
        ${isLoginMode ? "Log In" : "Create Account"}
      </button>

      <p id="authMessage"></p>

      <button type="button" id="switchAuth" class="secondary full-width">
        ${
          isLoginMode
            ? "Need an account? Create one"
            : "Already have an account? Log in"
        }
      </button>
    `;

    const newForm = document.createElement("form");
    newForm.id = "authForm";

    const fields = Array.from(authContent.children);
    fields.forEach((child) => newForm.appendChild(child));

    authContent.appendChild(newForm);

    newForm.addEventListener("submit", handleAuth);

    document
      .getElementById("switchAuth")
      ?.addEventListener("click", () => {
        openAuthModal(!isLoginMode);
      });
  }
}

function closeAuthModal() {
  if (authModal) {
    authModal.style.display = "none";
  }
}

async function handleAuth(event) {
  event.preventDefault();

  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;
  const displayName =
    document.getElementById("displayName")?.value.trim() || "";

  const message = document.getElementById("authMessage");

  if (!email || !password) {
    if (message) message.textContent = "Please enter your email and password.";
    return;
  }

  if (message) message.textContent = "Please wait...";

  if (isLoginMode) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      if (message) message.textContent = error.message;
      return;
    }

    closeAuthModal();
  } else {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    });

    if (error) {
      if (message) message.textContent = error.message;
      return;
    }

    if (data.session) {
      closeAuthModal();
    } else {
      if (message) {
        message.textContent =
          "Account created. Check your email if confirmation is required.";
      }
    }
  }
}

async function logout() {
  await supabase.auth.signOut();
}

async function updateNavigation() {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  currentUser = user;

  if (user) {
    if (loginLink) {
      loginLink.textContent = "Account";
      loginLink.onclick = (event) => {
        event.preventDefault();
        showAccount();
      };
    }

    if (signupLink) {
      signupLink.textContent = "Log Out";
      signupLink.classList.remove("button");
      signupLink.onclick = async (event) => {
        event.preventDefault();
        await logout();
      };
    }

    if (heroSignup) {
      heroSignup.style.display = "none";
    }
  } else {
    if (loginLink) {
      loginLink.textContent = "Log In";
      loginLink.onclick = (event) => {
        event.preventDefault();
        openAuthModal(true);
      };
    }

    if (signupLink) {
      signupLink.textContent = "Create Account";
      signupLink.classList.add("button");
      signupLink.onclick = (event) => {
        event.preventDefault();
        openAuthModal(false);
      };
    }

    if (heroSignup) {
      heroSignup.style.display = "inline-flex";
      heroSignup.onclick = (event) => {
        event.preventDefault();
        openAuthModal(false);
      };
    }
  }
}

async function showAccount() {
  if (!currentUser) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, bio, is_verified")
    .eq("id", currentUser.id)
    .maybeSingle();

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  const role = roleData?.role || "user";

  const roleName =
    role === "owner"
      ? "Owner"
      : role === "moderator"
        ? "Moderator"
        : "User";

  const verificationStatus = profile?.is_verified
    ? "Verified"
    : "Not yet verified";

  if (authModal) {
    authModal.style.display = "flex";
  }

  if (authContent) {
    authContent.innerHTML = `
      <h2>Account</h2>

      <div class="account-panel">
        <p>
          <strong>Display Name</strong><br>
          ${escapeHtml(profile?.display_name || "Not set")}
        </p>

        <p>
          <strong>Email</strong><br>
          ${escapeHtml(currentUser.email || "")}
        </p>

        <p>
          <strong>Role</strong><br>
          ${escapeHtml(roleName)}
        </p>

        <p>
          <strong>Verification</strong><br>
          ${escapeHtml(verificationStatus)}
        </p>

        <p>
          <strong>Account Created</strong><br>
          ${new Date(currentUser.created_at).toLocaleDateString()}
        </p>
      </div>

      <button type="button" id="closeAccount" class="button full-width">
        Close
      </button>
    `;

    document
      .getElementById("closeAccount")
      ?.addEventListener("click", closeAuthModal);
  }
}

async function loadDevelopments() {
  const developmentList = document.getElementById("developmentList");

  if (!developmentList) {
    return;
  }

  developmentList.innerHTML = "";

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
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error(error);
    developmentList.innerHTML =
      "<p>Unable to load developments.</p>";
    return;
  }

  if (!data || data.length === 0) {
    developmentList.innerHTML =
      "<p>No developments have been published yet.</p>";
    return;
  }

  data.forEach((development) => {
    const card = document.createElement("a");

    card.className = "development-card";
    card.href = `development.html?id=${development.id}`;

    card.innerHTML = `
      <h3>${development.title}</h3>

      ${
        development.address
          ? `<p><strong>Address:</strong> ${development.address}</p>`
          : ""
      }

      ${
        development.developer
          ? `<p><strong>Developer:</strong> ${development.developer}</p>`
          : ""
      }

      ${
        development.project_type
          ? `<p><strong>Project Type:</strong> ${development.project_type}</p>`
          : ""
      }

      ${
        development.status
          ? `<p><strong>Status:</strong> ${development.status}</p>`
          : ""
      }

      ${
        development.units !== null
          ? `<p><strong>Units:</strong> ${development.units}</p>`
          : ""
      }

      ${
        development.storeys !== null
          ? `<p><strong>Storeys:</strong> ${development.storeys}</p>`
          : ""
      }

      ${
        development.description
          ? `<p>${development.description}</p>`
          : ""
      }

      <span class="development-card-link">
        View Development →
      </span>
    `;

    developmentList.appendChild(card);
  });
}


closeModal?.addEventListener("click", closeAuthModal);

authModal?.addEventListener("click", (event) => {
  if (event.target === authModal) {
    closeAuthModal();
  }
});

heroSignup?.addEventListener("click", (event) => {
  event.preventDefault();
  openAuthModal(false);
});

supabase.auth.onAuthStateChange(() => {
  updateNavigation();
});

updateNavigation();
loadDevelopments();

const developmentRequestForm = document.getElementById("developmentRequestForm");

if (developmentRequestForm) {
  developmentRequestForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = document.getElementById("developmentRequestMessage");

    message.textContent = "Submitting...";

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      message.textContent = "You must be logged in to submit a development request.";
      return;
    }

    const title = document.getElementById("requestTitle").value.trim();
    const address = document.getElementById("requestAddress").value.trim();
    const developer = document.getElementById("requestDeveloper").value.trim();
    const projectType = document.getElementById("requestProjectType").value;
    const unitsValue = document.getElementById("requestUnits").value;
    const storeysValue = document.getElementById("requestStoreys").value;
    const description = document.getElementById("requestDescription").value.trim();

    const { error } = await supabase
      .from("development_requests")
      .insert({
        submitted_by: user.id,
        title: title,
        address: address || null,
        description: description || null,
        developer: developer || null,
        project_type: projectType || null,
        units: unitsValue ? Number(unitsValue) : null,
        storeys: storeysValue ? Number(storeysValue) : null
      });

    if (error) {
      console.error(error);
      message.textContent = "There was a problem submitting your request.";
      return;
    }

    developmentRequestForm.reset();

    message.textContent =
      "Your development request has been submitted successfully.";
  });
}
