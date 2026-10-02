import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://diljkqsrqdktzyumrqkg.supabase.co";
const SUPABASE_KEY = "sb_publishable_JjzaLH_H48oLIvuRz9F5jg_yyC5xxII";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const userList =
  document.getElementById("userList");

const requestList =
  document.getElementById(
    "developmentRequestList"
  );

const requestMessage =
  document.getElementById(
    "developmentRequestMessage"
  );

const createDevelopmentForm =
  document.getElementById(
    "createDevelopmentForm"
  );

const createDevelopmentMessage =
  document.getElementById(
    "createDevelopmentMessage"
  );

const officialDevelopmentList =
  document.getElementById(
    "officialDevelopmentList"
  );

const officialDevelopmentMessage =
  document.getElementById(
    "officialDevelopmentMessage"
  );

const discussionModerationList =
  document.getElementById(
    "discussionModerationList"
  );

const discussionModerationMessage =
  document.getElementById(
    "discussionModerationMessage"
  );


function escapeHtml(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function getStatusClass(status) {
  if (!status) {
    return "status-default";
  }

  const normalized = String(status)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

  if (
    normalized.includes("concept")
  ) {
    return "status-concept";
  }

  if (
    normalized.includes("proposed")
  ) {
    return "status-proposed";
  }

  if (
    normalized.includes("construction") ||
    normalized.includes(
      "under-construction"
    )
  ) {
    return "status-construction";
  }

  if (
    normalized.includes("approved")
  ) {
    return "status-approved";
  }

  if (
    normalized.includes("completed") ||
    normalized.includes("complete")
  ) {
    return "status-completed";
  }

  return "status-default";
}


function setOwnerLoadingText(text) {
  const elements =
    document.querySelectorAll("*");

  elements.forEach(element => {
    if (
      element.children.length === 0 &&
      element.textContent.trim() ===
        "Loading your account..."
    ) {
      element.textContent = text;
    }
  });
}


async function getCurrentUser() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    console.error(
      "Unable to get current user:",
      error
    );

    return null;
  }

  return user;
}


async function checkOwner(user) {
  if (!user) {
    window.location.href =
      "index.html";

    return false;
  }

  const {
    data: role,
    error
  } = await supabase
    .from("user_roles")
    .select("role")
    .eq(
      "user_id",
      user.id
    )
    .single();

  if (
    error ||
    !role ||
    role.role !== "owner"
  ) {
    window.location.href =
      "index.html";

    return false;
  }

  return true;
}


async function loadOwnerAccount(user) {
  const accountText =
    document.querySelector(
      ".hero > p:not(.eyebrow)"
    );

  const {
    data: profile,
    error
  } = await supabase
    .from("profiles")
    .select(`
      display_name,
      avatar_url,
      is_verified
    `)
    .eq(
      "id",
      user.id
    )
    .single();

  if (error) {
    console.error(
      "Unable to load owner profile:",
      error
    );

    setOwnerLoadingText(
      "Unable to load your account."
    );

    return;
  }

  const displayName =
    profile?.display_name ||
    user.email ||
    "Owner";

  if (accountText) {
    accountText.innerHTML = `
      Signed in as
      <strong>
        ${escapeHtml(displayName)}
      </strong>
    `;
  } else {
    setOwnerLoadingText(
      `Signed in as ${displayName}`
    );
  }
}


async function loadUsers() {
  if (!userList) {
    return;
  }

  const {
    data: users,
    error
  } = await supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      avatar_url,
      is_verified,
      is_banned,
      ban_reason,
      created_at
    `)
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {
    console.error(
      "Unable to load users:",
      error
    );

    userList.innerHTML = `
      <p>
        Unable to load users.
      </p>
    `;

    return;
  }

  if (
    !users ||
    users.length === 0
  ) {
    userList.innerHTML = `
      <p>
        No users found.
      </p>
    `;

    return;
  }

  userList.innerHTML =
    users
      .map(user => {
        return `
          <div class="dashboard-item user-dashboard-item">

            <div class="user-dashboard-info">

              ${
                user.avatar_url
                  ? `
                    <img
                      src="${escapeHtml(
                        user.avatar_url
                      )}"
                      alt=""
                      class="user-avatar"
                    >
                  `
                  : ""
              }

              <div>

                <strong>
                  ${escapeHtml(
                    user.display_name ||
                    "Unnamed User"
                  )}
                </strong>

                ${
                  user.is_verified
                    ? `
                      <span class="verified-badge">
                        Verified
                      </span>
                    `
                    : `
                      <span class="unverified-badge">
                        Unverified
                      </span>
                    `
                }

                ${
                  user.is_banned
                    ? `
                      <span class="banned-badge">
                        Banned
                      </span>
                    `
                    : ""
                }

                <small>
                  Joined
                  ${new Date(
                    user.created_at
                  ).toLocaleDateString()}
                </small>

              </div>

            </div>

            <div class="user-dashboard-actions">

              <button
                type="button"
                class="button verify-user-button"
                data-user-id="${user.id}"
                data-verified="${
                  user.is_verified
                    ? "true"
                    : "false"
                }"
              >
                ${
                  user.is_verified
                    ? "Unverify"
                    : "Verify"
                }
              </button>

            </div>

          </div>
        `;
      })
      .join("");

  document
    .querySelectorAll(
      ".verify-user-button"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        async () => {
          const userId =
            button.dataset.userId;

          const currentlyVerified =
            button.dataset.verified ===
            "true";

          if (!userId) {
            return;
          }

          button.disabled = true;
          button.textContent =
            "Saving...";

          const {
            error
          } = await supabase
            .from("profiles")
            .update({
              is_verified:
                !currentlyVerified
            })
            .eq(
              "id",
              userId
            );

          if (error) {
            console.error(
              "Unable to update verification:",
              error
            );

            button.disabled = false;

            button.textContent =
              currentlyVerified
                ? "Unverify"
                : "Verify";

            return;
          }

          await loadUsers();
        }
      );
    });
}


async function loadDevelopmentRequests() {
  if (!requestList) {
    return;
  }

  const {
    data: requests,
    error
  } = await supabase
    .from("development_requests")
    .select(`
      id,
      title,
      address,
      description,
      developer,
      project_type,
      units,
      storeys,
      status,
      owner_notes,
      created_at,
      profiles!development_requests_submitted_by_fkey (
        display_name,
        avatar_url
      )
    `)
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {
    console.error(
      "Unable to load development requests:",
      error
    );

    requestList.innerHTML =
      "<p>Unable to load development requests.</p>";

    return;
  }

  if (
    !requests ||
    requests.length === 0
  ) {
    requestList.innerHTML =
      "<p>No development requests found.</p>";

    return;
  }

  requestList.innerHTML =
    requests
      .map(request => {
        const profile =
          request.profiles || {};

        return `
          <article class="dashboard-card">

            <div class="dashboard-card-header">

              <div>

                <h3>
                  ${escapeHtml(
                    request.title
                  )}
                </h3>

                <p>
                  Submitted by
                  <strong>
                    ${escapeHtml(
                      profile.display_name ||
                      "Unknown User"
                    )}
                  </strong>
                </p>

              </div>

              <span class="request-status">
                ${escapeHtml(
                  request.status ||
                  "pending"
                )}
              </span>

            </div>

            ${
              request.address
                ? `
                  <p>
                    <strong>Address:</strong>
                    ${escapeHtml(
                      request.address
                    )}
                  </p>
                `
                : ""
            }

            ${
              request.developer
                ? `
                  <p>
                    <strong>Developer:</strong>
                    ${escapeHtml(
                      request.developer
                    )}
                  </p>
                `
                : ""
            }

            ${
              request.project_type
                ? `
                  <p>
                    <strong>Project type:</strong>
                    ${escapeHtml(
                      request.project_type
                    )}
                  </p>
                `
                : ""
            }

            ${
              request.units !== null &&
              request.units !== undefined
                ? `
                  <p>
                    <strong>Units:</strong>
                    ${escapeHtml(
                      request.units
                    )}
                  </p>
                `
                : ""
            }

            ${
              request.storeys !== null &&
              request.storeys !== undefined
                ? `
                  <p>
                    <strong>Storeys:</strong>
                    ${escapeHtml(
                      request.storeys
                    )}
                  </p>
                `
                : ""
            }

            ${
              request.description
                ? `
                  <div class="dashboard-description">
                    <strong>Description</strong>
                    <p>
                      ${escapeHtml(
                        request.description
                      )}
                    </p>
                  </div>
                `
                : ""
            }

            <div class="development-actions">

              <button
                type="button"
                class="button delete-request-button"
                data-id="${request.id}"
              >
                Delete Request
              </button>

            </div>

          </article>
        `;
      })
      .join("");

  document
    .querySelectorAll(
      ".delete-request-button"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        async () => {
          const requestId =
            button.dataset.id;

          if (!requestId) {
            return;
          }

          const confirmed =
            window.confirm(
              "Are you sure you want to permanently delete this development request?"
            );

          if (!confirmed) {
            return;
          }

          button.disabled = true;
          button.textContent =
            "Deleting...";

          const {
            error
          } = await supabase
            .from(
              "development_requests"
            )
            .delete()
            .eq(
              "id",
              requestId
            );

          if (error) {
            console.error(
              "Unable to delete request:",
              error
            );

            button.disabled = false;
            button.textContent =
              "Delete Request";

            if (requestMessage) {
              requestMessage.textContent =
                error.message ||
                "Unable to delete the request.";
            }

            return;
          }

          if (requestMessage) {
            requestMessage.textContent =
              "Development request deleted.";
          }

          await loadDevelopmentRequests();
        }
      );
    });
}


async function loadOfficialDevelopments() {
  if (!officialDevelopmentList) {
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
      "Unable to load official developments:",
      error
    );

    officialDevelopmentList.innerHTML =
      "<p>Unable to load official developments.</p>";

    return;
  }

  if (
    !developments ||
    developments.length === 0
  ) {
    officialDevelopmentList.innerHTML =
      "<p>No official developments have been created yet.</p>";

    return;
  }

  officialDevelopmentList.innerHTML =
    developments
      .map(development => {
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

        return `
          <article class="development-card">

            ${
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
                : ""
            }

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
                ${escapeHtml(
                  development.title
                )}
              </h3>

              ${
                development.address
                  ? `
                    <p>
                      <strong>Address:</strong>
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
                      <strong>Project type:</strong>
                      ${escapeHtml(
                        development.project_type
                      )}
                    </p>
                  `
                  : ""
              }

              ${
                development.units !== null &&
                development.units !== undefined
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
                development.storeys !== null &&
                development.storeys !== undefined
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

                <button
                  type="button"
                  class="button edit-development-button"
                  data-id="${development.id}"
                >
                  Edit
                </button>

                <button
                  type="button"
                  class="button delete-development-button"
                  data-id="${development.id}"
                >
                  Delete
                </button>

              </div>

            </div>

          </article>
        `;
      })
      .join("");

  setupOfficialDevelopmentButtons();
}


function setupOfficialDevelopmentButtons() {
  document
    .querySelectorAll(
      ".edit-development-button"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          const developmentId =
            button.dataset.id;

          if (!developmentId) {
            return;
          }

          window.location.href =
            `edit-development.html?id=${developmentId}`;
        }
      );
    });

  document
    .querySelectorAll(
      ".delete-development-button"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        async () => {
          const developmentId =
            button.dataset.id;

          if (!developmentId) {
            return;
          }

          const confirmed =
            window.confirm(
              "Are you sure you want to permanently delete this development? This will also delete its discussions and attachments."
            );

          if (!confirmed) {
            return;
          }

          button.disabled = true;
          button.textContent =
            "Deleting...";

          const {
            error
          } = await supabase
            .from("developments")
            .delete()
            .eq(
              "id",
              developmentId
            );

          if (error) {
            console.error(
              "Unable to delete development:",
              error
            );

            button.disabled = false;
            button.textContent =
              "Delete";

            if (
              officialDevelopmentMessage
            ) {
              officialDevelopmentMessage.textContent =
                error.message ||
                "Unable to delete development.";
            }

            return;
          }

          if (
            officialDevelopmentMessage
          ) {
            officialDevelopmentMessage.textContent =
              "Development deleted successfully.";
          }

          await loadOfficialDevelopments();
        }
      );
    });
}


async function loadDiscussions() {
  if (!discussionModerationList) {
    return;
  }

  discussionModerationList.innerHTML =
    "<p>Loading discussions...</p>";

  const {
    data: discussions,
    error
  } = await supabase
    .from("discussions")
    .select(`
      id,
      development_id,
      user_id,
      content,
      created_at,
      developments (
        title
      ),
      profiles (
        display_name,
        avatar_url
      )
    `)
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {
    console.error(
      "Unable to load discussions:",
      error
    );

    discussionModerationList.innerHTML = `
      <p>
        Unable to load discussions.
      </p>
    `;

    if (discussionModerationMessage) {
      discussionModerationMessage.textContent =
        error.message ||
        "Unable to load discussions.";
    }

    return;
  }

  if (
    !discussions ||
    discussions.length === 0
  ) {
    discussionModerationList.innerHTML = `
      <p>
        No discussions have been posted yet.
      </p>
    `;

    return;
  }

  discussionModerationList.innerHTML =
    discussions
      .map(discussion => {
        const development =
          discussion.developments ||
          {};

        const profile =
          discussion.profiles ||
          {};

        const date =
          new Date(
            discussion.created_at
          ).toLocaleString();

        return `
          <article
            class="dashboard-card discussion-moderation-item"
          >

            <div class="dashboard-card-header">

              <div>

                <h3>
                  ${escapeHtml(
                    development.title ||
                    "Unknown Development"
                  )}
                </h3>

                <p>
                  Posted by
                  <strong>
                    ${escapeHtml(
                      profile.display_name ||
                      "Unknown User"
                    )}
                  </strong>
                </p>

              </div>

              <small>
                ${escapeHtml(date)}
              </small>

            </div>


            <div class="dashboard-description">

              <strong>
                Discussion
              </strong>

              <p>
                ${escapeHtml(
                  discussion.content
                )}
              </p>

            </div>


            <div class="development-actions">

              <a
                href="development.html?id=${discussion.development_id}"
                class="button"
              >
                View Discussion
              </a>

              <button
                type="button"
                class="button delete-discussion-button"
                data-id="${discussion.id}"
                data-user-id="${discussion.user_id}"
                data-development-id="${discussion.development_id}"
              >
                Delete Discussion
              </button>

            </div>

          </article>
        `;
      })
      .join("");

  setupDiscussionModerationButtons();
}


function setupDiscussionModerationButtons() {
  document
    .querySelectorAll(
      ".delete-discussion-button"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        async () => {
          const discussionId =
            button.dataset.id;

          const userId =
            button.dataset.userId;

          const developmentId =
            button.dataset.developmentId;

          if (!discussionId) {
            return;
          }

          const confirmed =
            window.confirm(
              "Are you sure you want to permanently delete this discussion?"
            );

          if (!confirmed) {
            return;
          }

          button.disabled = true;
          button.textContent =
            "Deleting...";

          const {
            error
          } = await supabase
            .from("discussions")
            .delete()
            .eq(
              "id",
              discussionId
            );

          if (error) {
            console.error(
              "Unable to delete discussion:",
              error
            );

            button.disabled = false;
            button.textContent =
              "Delete Discussion";

            if (
              discussionModerationMessage
            ) {
              discussionModerationMessage.textContent =
                error.message ||
                "Unable to delete discussion.";
            }

            return;
          }

          const currentUser =
            await getCurrentUser();

          if (currentUser) {
            const {
              error:
                auditError
            } = await supabase
              .from(
                "moderation_actions"
              )
              .insert({
                moderator_id:
                  currentUser.id,
                action:
                  "deleted_discussion",
                target_user_id:
                  userId || null,
                development_id:
                  developmentId
                    ? Number(
                        developmentId
                      )
                    : null,
                discussion_id:
                  Number(
                    discussionId
                  ),
                reason:
                  "Discussion deleted by owner."
              });

            if (auditError) {
              console.error(
                "Unable to record moderation action:",
                auditError
              );
            }
          }

          if (
            discussionModerationMessage
          ) {
            discussionModerationMessage.textContent =
              "Discussion deleted successfully.";
          }

          await loadDiscussions();
        }
      );
    });
}


function setupCreateDevelopmentForm() {
  if (!createDevelopmentForm) {
    return;
  }

  createDevelopmentForm.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href =
          "index.html";

        return;
      }

      const title =
        document.getElementById(
          "developmentTitle"
        )?.value.trim() || "";

      const address =
        document.getElementById(
          "developmentAddress"
        )?.value.trim() || "";

      const developer =
        document.getElementById(
          "developmentDeveloper"
        )?.value.trim() || "";

      const projectType =
        document.getElementById(
          "developmentProjectType"
        )?.value.trim() || "";

      const status =
        document.getElementById(
          "developmentStatus"
        )?.value.trim() || "";

      const completionYear =
        document.getElementById(
          "developmentCompletionYear"
        )?.value || "";

      const units =
        document.getElementById(
          "developmentUnits"
        )?.value || "";

      const storeys =
        document.getElementById(
          "developmentStoreys"
        )?.value || "";

      const description =
        document.getElementById(
          "developmentDescription"
        )?.value.trim() || "";

      if (!title) {
        if (
          createDevelopmentMessage
        ) {
          createDevelopmentMessage.textContent =
            "Please enter a development title.";
        }

        return;
      }

      if (
        createDevelopmentMessage
      ) {
        createDevelopmentMessage.textContent =
          "Creating development...";
      }

      const {
        error
      } = await supabase
        .from("developments")
        .insert({
          title,
          address:
            address || null,
          description:
            description || null,
          developer:
            developer || null,
          project_type:
            projectType || null,
          status:
            status || null,
          completion_year:
            completionYear
              ? Number(
                  completionYear
                )
              : null,
          units:
            units
              ? Number(units)
              : null,
          storeys:
            storeys
              ? Number(storeys)
              : null,
          submitted_by:
            user.id,
          approved_by:
            user.id,
          is_approved:
            true,
          approved_at:
            new Date().toISOString()
        });

      if (error) {
        console.error(
          "Unable to create development:",
          error
        );

        if (
          createDevelopmentMessage
        ) {
          createDevelopmentMessage.textContent =
            error.message ||
            "Unable to create development.";
        }

        return;
      }

      createDevelopmentForm.reset();

      if (
        createDevelopmentMessage
      ) {
        createDevelopmentMessage.textContent =
          "Development created successfully.";
      }

      await loadOfficialDevelopments();
    }
  );
}


async function initializeOwnerDashboard() {
  const user =
    await getCurrentUser();

  const isOwner =
    await checkOwner(user);

  if (!isOwner) {
    return;
  }

  await loadOwnerAccount(user);
  await loadUsers();
  await loadDevelopmentRequests();
  await loadOfficialDevelopments();
  await loadDiscussions();

  setupCreateDevelopmentForm();
}


initializeOwnerDashboard();
