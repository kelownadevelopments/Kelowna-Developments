import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://diljkqsrqdktzyumrqkg.supabase.co";
const SUPABASE_KEY = "sb_publishable_JjzaLH_H48oLIvuRz9F5jg_yyC5xxII";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const authModal = document.getElementById("authModal");
const authForm = document.getElementById("authForm");
const authEmail = document.getElementById("email");
const authPassword = document.getElementById("password");
const authDisplayName = document.getElementById("displayName");
const authTitle = document.getElementById("authTitle");
const authSubmit = document.getElementById("authButtonText");
const authSwitch = document.getElementById("switchAuth");
const authMessage = document.getElementById("authMessage");
const closeAuthModal = document.getElementById("closeModal");

let authMode = "login";
let allDevelopments = [];

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeStatus(status) {
  if (!status) {
    return "";
  }

  return String(status)
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

function getStatusClass(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "concept") {
    return "status-concept";
  }

  if (normalized === "proposed") {
    return "status-proposed";
  }

  if (normalized === "approved") {
    return "status-approved";
  }

  if (
    normalized === "under construction" ||
    normalized === "construction"
  ) {
    return "status-construction";
  }

  if (
    normalized === "completed" ||
    normalized === "complete"
  ) {
    return "status-completed";
  }

  return "status-default";
}

function openAuthModal(mode = "login") {
  if (!authModal) {
    return;
  }

  authMode = mode;

  if (authTitle) {
    authTitle.textContent =
      authMode === "signup"
        ? "Create your account"
        : "Log In";
  }

  if (authSubmit) {
    authSubmit.textContent =
      authMode === "signup"
        ? "Create Account"
        : "Log In";
  }

  if (authSwitch) {
    authSwitch.textContent =
      authMode === "signup"
        ? "Already have an account? Log in"
        : "Don't have an account? Create one";
  }

  if (authDisplayName) {
    authDisplayName.style.display =
      authMode === "signup"
        ? ""
        : "none";

    authDisplayName.required =
      authMode === "signup";
  }

  if (authMessage) {
    authMessage.textContent = "";
  }

  if (authForm) {
    authForm.reset();
  }

  authModal.classList.add("open");
}

function closeModal() {
  if (!authModal) {
    return;
  }

  authModal.classList.remove("open");
}

function setupAuthModal() {
  const loginLink =
    document.getElementById("loginLink");

  const signupLink =
    document.getElementById("signupLink");

  const communitySignup =
    document.getElementById("communitySignup");

  const heroSignup =
    document.getElementById("heroSignup");

  if (loginLink) {
    loginLink.addEventListener("click", event => {
      const isAccountLink =
        loginLink.dataset.loggedIn === "true";

      if (isAccountLink) {
        return;
      }

      event.preventDefault();
      openAuthModal("login");
    });
  }

  if (signupLink) {
    signupLink.addEventListener("click", async event => {
      const isLoggedIn =
        signupLink.dataset.loggedIn === "true";

      if (isLoggedIn) {
        event.preventDefault();

        try {
          const { error } =
            await supabase.auth.signOut();

          if (error) {
            throw error;
          }

          window.location.href = "index.html";
        } catch (error) {
          console.error(
            "Logout error:",
            error
          );
        }

        return;
      }

      event.preventDefault();
      openAuthModal("signup");
    });
  }

  if (communitySignup) {
    communitySignup.addEventListener(
      "click",
      event => {
        event.preventDefault();
        openAuthModal("signup");
      }
    );
  }

  if (heroSignup) {
    heroSignup.addEventListener(
      "click",
      event => {
        event.preventDefault();
        openAuthModal("signup");
      }
    );
  }

  if (closeAuthModal) {
    closeAuthModal.addEventListener(
      "click",
      closeModal
    );
  }

  if (authSwitch) {
    authSwitch.addEventListener(
      "click",
      event => {
        event.preventDefault();

        openAuthModal(
          authMode === "login"
            ? "signup"
            : "login"
        );
      }
    );
  }

  if (authModal) {
    authModal.addEventListener(
      "click",
      event => {
        if (
          event.target === authModal ||
          event.target.classList.contains(
            "modal-background"
          )
        ) {
          closeModal();
        }
      }
    );
  }

  if (authForm) {
    authForm.addEventListener(
      "submit",
      handleAuthSubmit
    );
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();

  if (!authEmail || !authPassword) {
    return;
  }

  const email =
    authEmail.value.trim();

  const password =
    authPassword.value;

  const displayName =
    authDisplayName
      ? authDisplayName.value.trim()
      : "";

  if (!email || !password) {
    if (authMessage) {
      authMessage.textContent =
        "Please enter your email and password.";
    }

    return;
  }

  if (
    authMode === "signup" &&
    !displayName
  ) {
    if (authMessage) {
      authMessage.textContent =
        "Please enter a display name.";
    }

    return;
  }

  const submitButton =
    authForm
      ? authForm.querySelector(
          'button[type="submit"]'
        )
      : null;

  if (submitButton) {
    submitButton.disabled = true;
  }

  if (authSubmit) {
    authSubmit.textContent =
      authMode === "signup"
        ? "Creating Account..."
        : "Logging In...";
  }

  try {
    if (authMode === "signup") {
      const { error } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name:
                displayName
            }
          }
        });

      if (error) {
        throw error;
      }

      if (authMessage) {
        authMessage.textContent =
          "Account created successfully. You can now log in.";
      }

      authMode = "login";

      if (authTitle) {
        authTitle.textContent =
          "Log In";
      }

      if (authSubmit) {
        authSubmit.textContent =
          "Log In";
      }

      if (authSwitch) {
        authSwitch.textContent =
          "Don't have an account? Create one";
      }

      if (authDisplayName) {
        authDisplayName.style.display =
          "none";

        authDisplayName.required =
          false;
      }

      if (authPassword) {
        authPassword.value = "";
      }
    } else {
      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });

      if (error) {
        throw error;
      }

      closeModal();

      if (authForm) {
        authForm.reset();
      }

      await updateNavigation();
    }
  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    if (authMessage) {
      authMessage.textContent =
        error.message ||
        "Something went wrong.";
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }

    if (authSubmit) {
      authSubmit.textContent =
        authMode === "signup"
          ? "Create Account"
          : "Log In";
    }
  }
}

async function updateNavigation() {
  const loginLink =
    document.getElementById("loginLink");

  const signupLink =
    document.getElementById("signupLink");

  if (!loginLink || !signupLink) {
    return;
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    console.error(
      "Unable to check authentication:",
      error
    );
  }

  if (!user) {
    loginLink.textContent =
      "Log In";

    loginLink.href =
      "#";

    loginLink.dataset.loggedIn =
      "false";

    signupLink.textContent =
      "Create Account";

    signupLink.href =
      "#";

    signupLink.dataset.loggedIn =
      "false";

    signupLink.classList.add(
      "button"
    );

    return;
  }

  loginLink.textContent =
    "Account";

  loginLink.href =
    "account.html";

  loginLink.dataset.loggedIn =
    "true";

  signupLink.textContent =
    "Log Out";

  signupLink.href =
    "#";

  signupLink.dataset.loggedIn =
    "true";

  signupLink.classList.remove(
    "button"
  );
}

async function loadDevelopments() {
  const developmentList =
    document.getElementById(
      "developmentList"
    );

  if (!developmentList) {
    return;
  }

  const {
    data: developments,
    error
  } = await supabase
    .from("developments")
    .select(`
      id,
      title,
      address,
      developer,
      project_type,
      status,
      completion_year,
      units,
      storeys,
      created_at,
      development_images (
        id,
        image_url,
        file_name,
        created_at
      )
    `)
    .eq(
      "is_approved",
      true
    )
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {
    console.error(
      "Unable to load developments:",
      error
    );

    developmentList.innerHTML =
      "<p>Unable to load developments.</p>";

    return;
  }

  allDevelopments =
    developments || [];

  renderDevelopments();
}

function renderDevelopments() {
  const developmentList =
    document.getElementById(
      "developmentList"
    );

  if (!developmentList) {
    return;
  }

  const searchInput =
    document.getElementById(
      "developmentSearch"
    );

  const statusFilter =
    document.getElementById(
      "statusFilter"
    );

  const search =
    searchInput?.value
      .trim()
      .toLowerCase() || "";

  const selectedStatus =
    normalizeStatus(
      statusFilter?.value || "all"
    );

  const filteredDevelopments =
    allDevelopments.filter(
      development => {
        const developmentStatus =
          normalizeStatus(
            development.status
          );

        const searchableText = [
          development.title,
          development.address,
          development.developer,
          development.project_type,
          development.status,
          development.description
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !search ||
          searchableText.includes(
            search
          );

        const matchesStatus =
          !selectedStatus ||
          selectedStatus === "all" ||
          developmentStatus ===
            selectedStatus;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );

  if (
    filteredDevelopments.length ===
    0
  ) {
    developmentList.innerHTML = `
      <div class="empty-state">
        <h3>No matching developments</h3>
        <p>
          Try changing your search or status filter.
        </p>
      </div>
    `;

    return;
  }

  developmentList.innerHTML =
    filteredDevelopments
      .map(
        development => {
          const images =
            development.development_images ||
            [];

          const firstImage =
            images.length
              ? [...images].sort(
                  (a, b) =>
                    new Date(
                      a.created_at
                    ) -
                    new Date(
                      b.created_at
                    )
                )[0]
              : null;

          const imageHtml =
            firstImage
              ? `
                <a
                  href="development.html?id=${development.id}"
                  class="development-card-image-link"
                >
                  <img
                    src="${escapeHtml(
                      firstImage.image_url
                    )}"
                    alt="${escapeHtml(
                      firstImage.file_name ||
                      development.title
                    )}"
                    class="development-card-image"
                  >
                </a>
              `
              : "";

          return `
            <article class="development-card">

              ${imageHtml}

              <div class="development-card-content">

                ${
                  development.status
                    ? `
                      <div
                        class="development-status-banner ${getStatusClass(
                          development.status
                        )}"
                      >
                        <span class="development-status-label">
                          ${escapeHtml(
                            development.status
                          )}
                        </span>

                        ${
                          development.completion_year
                            ? `
                              <span class="development-completion">
                                Expected completion:
                                ${escapeHtml(
                                  development.completion_year
                                )}
                              </span>
                            `
                            : ""
                        }
                      </div>
                    `
                    : ""
                }

                <h3>
                  <a
                    href="development.html?id=${development.id}"
                  >
                    ${escapeHtml(
                      development.title
                    )}
                  </a>
                </h3>

                ${
                  development.address
                    ? `
                      <p class="development-card-address">
                        ${escapeHtml(
                          development.address
                        )}
                      </p>
                    `
                    : ""
                }

                ${
                  development.developer
                    ? `
                      <p>
                        <strong>Developer:</strong>
                        ${escapeHtml(
                          development.developer
                        )}
                      </p>
                    `
                    : ""
                }

                ${
                  development.project_type
                    ? `
                      <p>
                        <strong>Type:</strong>
                        ${escapeHtml(
                          development.project_type
                        )}
                      </p>
                    `
                    : ""
                }

                ${
                  development.units !==
                    null &&
                  development.units !==
                    undefined
                    ? `
                      <p>
                        <strong>Units:</strong>
                        ${escapeHtml(
                          development.units
                        )}
                      </p>
                    `
                    : ""
                }

                ${
                  development.storeys !==
                    null &&
                  development.storeys !==
                    undefined
                    ? `
                      <p>
                        <strong>Storeys:</strong>
                        ${escapeHtml(
                          development.storeys
                        )}
                      </p>
                    `
                    : ""
                }

                <div class="development-actions">
                  <a
                    href="development.html?id=${development.id}"
                    class="button"
                  >
                    View Development
                  </a>
                </div>

              </div>

            </article>
          `;
        }
      )
      .join("");
}

function setupDevelopmentSearch() {
  const searchInput =
    document.getElementById(
      "developmentSearch"
    );

  const statusFilter =
    document.getElementById(
      "statusFilter"
    );

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      renderDevelopments
    );
  }

  if (statusFilter) {
    statusFilter.addEventListener(
      "change",
      renderDevelopments
    );
  }
}

function setupDevelopmentRequestForm() {
  const form =
    document.getElementById(
      "developmentRequestForm"
    );

  if (!form) {
    return;
  }

  const message =
    document.getElementById(
      "developmentRequestMessage"
    );

  form.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        if (message) {
          message.textContent =
            "You must be logged in to submit a development.";
        }

        openAuthModal("login");
        return;
      }

      const title =
        document
          .getElementById(
            "requestTitle"
          )
          ?.value.trim() || "";

      const address =
        document
          .getElementById(
            "requestAddress"
          )
          ?.value.trim() || "";

      const developer =
        document
          .getElementById(
            "requestDeveloper"
          )
          ?.value.trim() || "";

      const projectType =
        document
          .getElementById(
            "requestProjectType"
          )
          ?.value.trim() || "";

      const units =
        document.getElementById(
          "requestUnits"
        )?.value || "";

      const storeys =
        document.getElementById(
          "requestStoreys"
        )?.value || "";

      const description =
        document
          .getElementById(
            "requestDescription"
          )
          ?.value.trim() || "";

      if (!title) {
        if (message) {
          message.textContent =
            "Please enter a development title.";
        }

        return;
      }

      if (message) {
        message.textContent =
          "Submitting development request...";
      }

      const { error } =
        await supabase
          .from(
            "development_requests"
          )
          .insert({
            submitted_by: user.id,
            title,
            address:
              address || null,
            description:
              description || null,
            developer:
              developer || null,
            project_type:
              projectType || null,
            units: units
              ? Number(units)
              : null,
            storeys: storeys
              ? Number(storeys)
              : null
          });

      if (error) {
        console.error(
          "Development request error:",
          error
        );

        if (message) {
          message.textContent =
            error.message ||
            "Unable to submit development request.";
        }

        return;
      }

      form.reset();

      if (message) {
        message.textContent =
          "Development request submitted successfully.";
      }
    }
  );
}

async function initializeApp() {
  setupAuthModal();
  setupDevelopmentRequestForm();
  setupDevelopmentSearch();

  await updateNavigation();
  await loadDevelopments();
}

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initializeApp
  );
} else {
  initializeApp();
}

supabase.auth.onAuthStateChange(
  () => {
    updateNavigation();
  }
);
