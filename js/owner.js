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
  document.getElementById("developmentRequestList");

const requestMessage =
  document.getElementById("developmentRequestMessage");

const createDevelopmentForm =
  document.getElementById("createDevelopmentForm");

const createDevelopmentMessage =
  document.getElementById("createDevelopmentMessage");

const officialDevelopmentList =
  document.getElementById("officialDevelopmentList");

const officialDevelopmentMessage =
  document.getElementById("officialDevelopmentMessage");

const discussionModerationList =
  document.getElementById("discussionModerationList");

const discussionModerationMessage =
  document.getElementById("discussionModerationMessage");

const reportList =
  document.getElementById("reportList");

const banList =
  document.getElementById("banList");

const reportModerationMessage =
  document.getElementById("reportModerationMessage");


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

  if (normalized.includes("concept")) {
    return "status-concept";
  }

  if (normalized.includes("proposed")) {
    return "status-proposed";
  }

  if (
    normalized.includes("construction") ||
    normalized.includes("under-construction")
  ) {
    return "status-construction";
  }

  if (normalized.includes("approved")) {
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
    window.location.href = "index.html";
    return false;
  }

  const {
    data: role,
    error
  } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (
    error ||
    !role ||
    role.role !== "owner"
  ) {
    window.location.href = "index.html";
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
    .eq("id", user.id)
    .single();

  if (error) {
    console.error(
      "Unable to load owner profile:",
      error
    );

    if (accountText) {
      accountText.textContent =
        "Unable to load your account.";
    }

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

    userList.innerHTML =
      "<p>Unable to load users.</p>";

    return;
  }

  if (
    !users ||
    users.length === 0
  ) {
    userList.innerHTML =
      "<p>No users found.</p>";

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
    .querySelectorAll(".verify-user-button")
    .forEach(button => {
      button.addEventListener(
        "click",
        async () => {
          const userId =
            button.dataset.userId;

          const currentlyVerified =
            button.dataset.verified === "true";

          button.disabled = true;
          button.textContent = "Saving...";

          const {
            error
          } = await supabase
            .from("profiles")
            .update({
              is_verified:
                !currentlyVerified
            })
            .eq("id", userId);

          if (error) {
            console.error(error);

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
    console.error(error);

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
    .querySelectorAll(".delete-request-button")
    .forEach(button => {
      button.addEventListener(
        "click",
        async () => {
          const requestId =
            button.dataset.id;

          const confirmed =
            window.confirm(
              "Are you sure you want to permanently delete this development request?"
            );

          if (!confirmed) {
            return;
          }

          button.disabled = true;
          button.textContent = "Deleting...";

          const {
            error
          } = await supabase
            .from("development_requests")
            .delete()
            .eq("id", requestId);

          if (error) {
            console.error(error);

            button.disabled = false;
            button.textContent =
              "Delete Request";

            return;
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
    console.error(error);

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
          development.development_images || [];

        const firstImage =
          images.length
            ? [...images].sort(
                (a, b) =>
                  new Date(a.created_at) -
                  new Date(b.created_at)
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
    .querySelectorAll(".edit-development-button")
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          const developmentId =
            button.dataset.id;

          window.location.href =
            `edit-development.html?id=${developmentId}`;
        }
      );
    });

  document
    .querySelectorAll(".delete-development-button")
    .forEach(button => {
      button.addEventListener(
        "click",
        async () => {
          const developmentId =
            button.dataset.id;

          const confirmed =
            window.confirm(
              "Are you sure you want to permanently delete this development? This will also delete its discussions and attachments."
            );

          if (!confirmed) {
            return;
          }

          button.disabled = true;
          button.textContent = "Deleting...";

          const {
            error
          } = await supabase
            .from("developments")
            .delete()
            .eq("id", developmentId);

          if (error) {
            console.error(error);

            button.disabled = false;
            button.textContent = "Delete";

            return;
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
    console.error(error);

    discussionModerationList.innerHTML =
      "<p>Unable to load discussions.</p>";

    return;
  }

  if (
    !discussions ||
    discussions.length === 0
  ) {
    discussionModerationList.innerHTML =
      "<p>No discussions have been posted yet.</p>";

    return;
  }

  discussionModerationList.innerHTML =
    discussions
      .map(discussion => {
        const development =
          discussion.developments || {};

        const profile =
          discussion.profiles || {};

        return `
          <article class="dashboard-card">

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
                ${escapeHtml(
                  new Date(
                    discussion.created_at
                  ).toLocaleString()
                )}
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

          const confirmed =
            window.confirm(
              "Are you sure you want to permanently delete this discussion?"
            );

          if (!confirmed) {
            return;
          }

          button.disabled = true;
          button.textContent = "Deleting...";

          const {
            data: discussion,
            error: discussionLookupError
          } = await supabase
            .from("discussions")
            .select(`
              user_id,
              development_id
            `)
            .eq("id", discussionId)
            .single();

          if (discussionLookupError) {
            console.error(
              discussionLookupError
            );

            button.disabled = false;
            button.textContent =
              "Delete Discussion";

            return;
          }

          const {
            error
          } = await supabase
            .from("discussions")
            .delete()
            .eq("id", discussionId);

          if (error) {
            console.error(error);

            button.disabled = false;
            button.textContent =
              "Delete Discussion";

            return;
          }

          const currentUser =
            await getCurrentUser();

          if (currentUser) {
            const {
              error: auditError
            } = await supabase
              .from("moderation_actions")
              .insert({
                moderator_id:
                  currentUser.id,
                action:
                  "deleted_discussion",
                target_user_id:
                  discussion.user_id,
                development_id:
                  discussion.development_id,
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

          await loadDiscussions();
        }
      );
    });
}


async function loadReports() {
  if (!reportList) {
    return;
  }

  reportList.innerHTML =
    "<p>Loading reports...</p>";

  const {
    data: reports,
    error
  } = await supabase
    .from("reports")
    .select(`
      id,
      reporter_id,
      reported_user_id,
      development_id,
      discussion_id,
      attachment_id,
      reason,
      status,
      created_at
    `)
    .eq(
      "status",
      "pending"
    )
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {
    console.error(
      "Unable to load reports:",
      error
    );

    reportList.innerHTML =
      "<p>Unable to load reports.</p>";

    return;
  }

  if (
    !reports ||
    reports.length === 0
  ) {
    reportList.innerHTML =
      "<p>No pending reports.</p>";

    return;
  }

  const userIds = [
    ...new Set(
      reports.flatMap(report => [
        report.reporter_id,
        report.reported_user_id
      ])
      .filter(Boolean)
    )
  ];

  let profiles = [];

  if (userIds.length) {
    const {
      data,
      error: profileError
    } = await supabase
      .from("profiles")
      .select(`
        id,
        display_name,
        avatar_url
      `)
      .in(
        "id",
        userIds
      );

    if (!profileError) {
      profiles = data || [];
    }
  }

  const profileMap =
    new Map(
      profiles.map(profile => [
        profile.id,
        profile
      ])
    );

  reportList.innerHTML =
    reports
      .map(report => {
        const reporter =
          profileMap.get(
            report.reporter_id
          );

        const reportedUser =
          profileMap.get(
            report.reported_user_id
          );

        return `
          <article class="dashboard-card">

            <div class="dashboard-card-header">

              <div>

                <h3>
                  Report #${escapeHtml(
                    report.id
                  )}
                </h3>

                <small>
                  ${escapeHtml(
                    new Date(
                      report.created_at
                    ).toLocaleString()
                  )}
                </small>

              </div>

              <span class="request-status">
                Pending
              </span>

            </div>


            <p>
              <strong>
                Reported by:
              </strong>

              ${escapeHtml(
                reporter?.display_name ||
                "Unknown User"
              )}
            </p>


            ${
              reportedUser
                ? `
                  <p>
                    <strong>
                      Reported user:
                    </strong>

                    ${escapeHtml(
                      reportedUser.display_name ||
                      "Unknown User"
                    )}
                  </p>
                `
                : ""
            }


            ${
              report.development_id
                ? `
                  <p>
                    <strong>
                      Development ID:
                    </strong>

                    ${escapeHtml(
                      report.development_id
                    )}
                  </p>
                `
                : ""
            }


            ${
              report.discussion_id
                ? `
                  <p>
                    <strong>
                      Discussion ID:
                    </strong>

                    ${escapeHtml(
                      report.discussion_id
                    )}
                  </p>
                `
                : ""
            }


            ${
              report.attachment_id
                ? `
                  <p>
                    <strong>
                      Attachment ID:
                    </strong>

                    ${escapeHtml(
                      report.attachment_id
                    )}
                  </p>
                `
                : ""
            }


            <div class="dashboard-description">

              <strong>
                Reason
              </strong>

              <p>
                ${escapeHtml(
                  report.reason
                )}
              </p>

            </div>


            <div class="development-actions">

              <button
                type="button"
                class="button dismiss-report-button"
                data-id="${report.id}"
              >
                Dismiss
              </button>

              ${
                report.reported_user_id
                  ? `
                    <button
                      type="button"
                      class="button ban-report-user-button"
                      data-id="${report.id}"
                      data-user-id="${report.reported_user_id}"
                    >
                      Ban User
                    </button>
                  `
                  : ""
              }

            </div>

          </article>
        `;
      })
      .join("");

  setupReportButtons();
}


function setupReportButtons() {
  document
    .querySelectorAll(
      ".dismiss-report-button"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        async () => {
          const reportId =
            button.dataset.id;

          button.disabled = true;
          button.textContent = "Saving...";

          const {
            error
          } = await supabase
            .from("reports")
            .update({
              status: "dismissed"
            })
            .eq(
              "id",
              reportId
            );

          if (error) {
            console.error(error);

            button.disabled = false;
            button.textContent =
              "Dismiss";

            return;
          }

          await loadReports();
        }
      );
    });


  document
    .querySelectorAll(
      ".ban-report-user-button"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        async () => {
          const reportId =
            button.dataset.id;

          const userId =
            button.dataset.userId;

          const duration =
            window.prompt(
              "Enter ban duration:\n\n7 = 7 days\n30 = 30 days\n0 = permanent\n\nEnter 7, 30, or 0:"
            );

          if (
            duration === null
          ) {
            return;
          }

          if (
            !["0", "7", "30"].includes(
              duration.trim()
            )
          ) {
            window.alert(
              "Please enter 7, 30, or 0."
            );

            return;
          }

          let reason =
            window.prompt(
              "Enter the reason for the ban:"
            );

          if (reason === null) {
            return;
          }

          reason =
            reason.trim();

          if (!reason) {
            reason =
              "Ban issued following a community report.";
          }

          button.disabled = true;
          button.textContent = "Banning...";

          const currentUser =
            await getCurrentUser();

          if (!currentUser) {
            return;
          }

          let expiresAt = null;

          if (duration !== "0") {
            const days =
              Number(duration);

            const expiration =
              new Date();

            expiration.setDate(
              expiration.getDate() +
              days
            );

            expiresAt =
              expiration.toISOString();
          }

          const {
            error: banError
          } = await supabase
            .from("bans")
            .insert({
              user_id:
                userId,
              banned_by:
                currentUser.id,
              reason,
              expires_at:
                expiresAt
            });

          if (banError) {
            console.error(
              "Unable to create ban:",
              banError
            );

            button.disabled = false;
            button.textContent =
              "Ban User";

            window.alert(
              banError.message ||
              "Unable to ban user."
            );

            return;
          }

          const {
            error: profileError
          } = await supabase
            .from("profiles")
            .update({
              is_banned: true,
              ban_reason: reason
            })
            .eq(
              "id",
              userId
            );

          if (profileError) {
            console.error(
              "Unable to update user profile:",
              profileError
            );
          }

          const {
            error: reportError
          } = await supabase
            .from("reports")
            .update({
              status: "reviewed"
            })
            .eq(
              "id",
              reportId
            );

          if (reportError) {
            console.error(
              "Unable to update report:",
              reportError
            );
          }

          await supabase
            .from("moderation_actions")
            .insert({
              moderator_id:
                currentUser.id,
              action:
                "banned_user",
              target_user_id:
                userId,
              reason
            });

          if (
            reportModerationMessage
          ) {
            reportModerationMessage.textContent =
              "User banned and report reviewed.";
          }

          await loadReports();
          await loadBans();
          await loadUsers();
        }
      );
    });
}


async function loadBans() {
  if (!banList) {
    return;
  }

  banList.innerHTML =
    "<p>Loading bans...</p>";

  const {
    data: bans,
    error
  } = await supabase
    .from("bans")
    .select(`
      id,
      user_id,
      banned_by,
      reason,
      expires_at,
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
      "Unable to load bans:",
      error
    );

    banList.innerHTML =
      "<p>Unable to load bans.</p>";

    return;
  }

  if (
    !bans ||
    bans.length === 0
  ) {
    banList.innerHTML =
      "<p>No bans have been issued.</p>";

    return;
  }

  const userIds = [
    ...new Set(
      bans.map(
        ban => ban.user_id
      )
    )
  ];

  const {
    data: profiles
  } = await supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      avatar_url,
      is_banned
    `)
    .in(
      "id",
      userIds
    );

  const profileMap =
    new Map(
      (profiles || []).map(
        profile => [
          profile.id,
          profile
        ]
      )
    );

  const now =
    new Date();

  const activeBans =
    bans.filter(ban => {
      if (!ban.expires_at) {
        return true;
      }

      return (
        new Date(
          ban.expires_at
        ) > now
      );
    });

  if (
    activeBans.length === 0
  ) {
    banList.innerHTML =
      "<p>No active bans.</p>";

    return;
  }

  banList.innerHTML =
    activeBans
      .map(ban => {
        const profile =
          profileMap.get(
            ban.user_id
          );

        const permanent =
          !ban.expires_at;

        return `
          <article class="dashboard-card">

            <div class="dashboard-card-header">

              <div>

                <h3>
                  ${escapeHtml(
                    profile?.display_name ||
                    "Unknown User"
                  )}
                </h3>

                <small>
                  Banned
                  ${escapeHtml(
                    new Date(
                      ban.created_at
                    ).toLocaleString()
                  )}
                </small>

              </div>

              <span class="banned-badge">
                Banned
              </span>

            </div>


            <p>
              <strong>
                Reason:
              </strong>

              ${escapeHtml(
                ban.reason ||
                "No reason provided."
              )}
            </p>


            <p>
              <strong>
                Duration:
              </strong>

              ${
                permanent
                  ? "Permanent"
                  : `Until ${escapeHtml(
                      new Date(
                        ban.expires_at
                      ).toLocaleString()
                    )}`
              }
            </p>


            <div class="development-actions">

              <button
                type="button"
                class="button unban-user-button"
                data-ban-id="${ban.id}"
                data-user-id="${ban.user_id}"
              >
                Unban User
              </button>

            </div>

          </article>
        `;
      })
      .join("");

  setupUnbanButtons();
}


function setupUnbanButtons() {
  document
    .querySelectorAll(
      ".unban-user-button"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        async () => {
          const banId =
            button.dataset.banId;

          const userId =
            button.dataset.userId;

          const confirmed =
            window.confirm(
              "Are you sure you want to unban this user?"
            );

          if (!confirmed) {
            return;
          }

          button.disabled = true;
          button.textContent = "Unbanning...";

          const currentUser =
            await getCurrentUser();

          if (!currentUser) {
            return;
          }

          const {
            error: banError
          } = await supabase
            .from("bans")
            .delete()
            .eq(
              "id",
              banId
            );

          if (banError) {
            console.error(
              "Unable to remove ban:",
              banError
            );

            button.disabled = false;
            button.textContent =
              "Unban User";

            return;
          }

          const {
            error: profileError
          } = await supabase
            .from("profiles")
            .update({
              is_banned: false,
              ban_reason: null
            })
            .eq(
              "id",
              userId
            );

          if (profileError) {
            console.error(
              "Unable to update profile:",
              profileError
            );
          }

          await supabase
            .from("moderation_actions")
            .insert({
              moderator_id:
                currentUser.id,
              action:
                "unbanned_user",
              target_user_id:
                userId,
              reason:
                "User unbanned by owner."
            });

          await loadBans();
          await loadUsers();
        }
      );
    });
}

async function loadRoles() {
  const roleManagementList =
    document.getElementById(
      "roleManagementList"
    );

  if (!roleManagementList) {
    return;
  }

  roleManagementList.innerHTML =
    "<p>Loading roles...</p>";

  const currentUser =
    await getCurrentUser();

  if (!currentUser) {
    return;
  }

  const {
    data: users,
    error: usersError
  } = await supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      avatar_url,
      created_at
    `)
    .order(
      "created_at",
      {
        ascending: true
      }
    );

  if (usersError) {
    console.error(
      "Unable to load users for roles:",
      usersError
    );

    roleManagementList.innerHTML =
      "<p>Unable to load roles.</p>";

    return;
  }

  const {
    data: roles,
    error: rolesError
  } = await supabase
    .from("user_roles")
    .select(`
      user_id,
      role
    `);

  if (rolesError) {
    console.error(
      "Unable to load roles:",
      rolesError
    );

    roleManagementList.innerHTML =
      "<p>Unable to load roles.</p>";

    return;
  }

  const roleMap =
    new Map(
      (roles || []).map(role => [
        role.user_id,
        role.role
      ])
    );

  if (
    !users ||
    users.length === 0
  ) {
    roleManagementList.innerHTML =
      "<p>No users found.</p>";

    return;
  }

  roleManagementList.innerHTML =
    users
      .map(user => {
        const currentRole =
          roleMap.get(user.id) ||
          "user";

        const isCurrentUser =
          user.id === currentUser.id;

        return `
          <article class="dashboard-card">

            <div class="dashboard-card-header">

              <div>

                <h3>
                  ${escapeHtml(
                    user.display_name ||
                    "Unnamed User"
                  )}
                </h3>

                <small>
                  Joined
                  ${escapeHtml(
                    new Date(
                      user.created_at
                    ).toLocaleDateString()
                  )}
                </small>

              </div>

              ${
                isCurrentUser
                  ? `
                    <span class="verified-badge">
                      You
                    </span>
                  `
                  : ""
              }

            </div>


            <div class="form-field">

              <label
                for="role-${user.id}"
              >
                Account Role
              </label>

              <select
                id="role-${user.id}"
                class="role-select"
                data-user-id="${user.id}"
                ${
                  isCurrentUser
                    ? "disabled"
                    : ""
                }
              >

                <option
                  value="user"
                  ${
                    currentRole === "user"
                      ? "selected"
                      : ""
                  }
                >
                  User
                </option>

                <option
                  value="moderator"
                  ${
                    currentRole === "moderator"
                      ? "selected"
                      : ""
                  }
                >
                  Moderator
                </option>

                <option
                  value="owner"
                  ${
                    currentRole === "owner"
                      ? "selected"
                      : ""
                  }
                >
                  Owner
                </option>

              </select>

            </div>


            ${
              isCurrentUser
                ? `
                  <p>
                    Your own role cannot be changed
                    from this dashboard.
                  </p>
                `
                : `
                  <button
                    type="button"
                    class="button save-role-button"
                    data-user-id="${user.id}"
                  >
                    Save Role
                  </button>
                `
            }

          </article>
        `;
      })
      .join("");


  document
    .querySelectorAll(
      ".save-role-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const userId =
            button.dataset.userId;

          const select =
            document.querySelector(
              `.role-select[data-user-id="${userId}"]`
            );

          if (
            !userId ||
            !select
          ) {
            return;
          }

          const newRole =
            select.value;

          if (
            ![
              "user",
              "moderator",
              "owner"
            ].includes(newRole)
          ) {
            return;
          }

          const confirmed =
            window.confirm(
              `Change this user's role to ${newRole}?`
            );

          if (!confirmed) {
            return;
          }

          button.disabled = true;
          button.textContent =
            "Saving...";

          const {
            error
          } = await supabase
            .from("user_roles")
            .update({
              role: newRole
            })
            .eq(
              "user_id",
              userId
            );

          if (error) {
            console.error(
              "Unable to update role:",
              error
            );

            button.disabled = false;
            button.textContent =
              "Save Role";

            const message =
              document.getElementById(
                "roleManagementMessage"
              );

            if (message) {
              message.textContent =
                error.message ||
                "Unable to update role.";
            }

            return;
          }

          const message =
            document.getElementById(
              "roleManagementMessage"
            );

          if (message) {
            message.textContent =
              "Role updated successfully.";
          }

          await loadRoles();
        }
      );
    });
}

async function loadAuditLog() {
  const auditLogList =
    document.getElementById("auditLogList");

  if (!auditLogList) {
    return;
  }

  auditLogList.innerHTML =
    "<p>Loading audit log...</p>";

  const {
    data: actions,
    error
  } = await supabase
    .from("moderation_actions")
    .select(`
      id,
      moderator_id,
      action,
      target_user_id,
      development_id,
      discussion_id,
      attachment_id,
      reason,
      created_at
    `)
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error(
      "Unable to load audit log:",
      error
    );

    auditLogList.innerHTML =
      "<p>Unable to load audit log.</p>";

    return;
  }

  if (
    !actions ||
    actions.length === 0
  ) {
    auditLogList.innerHTML =
      "<p>No administrative activity has been recorded yet.</p>";

    return;
  }

  const userIds = [
    ...new Set(
      actions
        .flatMap(action => [
          action.moderator_id,
          action.target_user_id
        ])
        .filter(Boolean)
    )
  ];

  let profiles = [];

  if (userIds.length > 0) {
    const {
      data,
      error: profilesError
    } = await supabase
      .from("profiles")
      .select(`
        id,
        display_name
      `)
      .in("id", userIds);

    if (!profilesError) {
      profiles = data || [];
    }
  }

  const profileMap =
    new Map(
      profiles.map(profile => [
        profile.id,
        profile.display_name ||
          "Unknown User"
      ])
    );

  auditLogList.innerHTML =
    actions
      .map(action => {

        const moderatorName =
          profileMap.get(
            action.moderator_id
          ) ||
          "Unknown User";

        const targetName =
          action.target_user_id
            ? (
                profileMap.get(
                  action.target_user_id
                ) ||
                "Unknown User"
              )
            : null;

        const actionName =
          action.action
            .replaceAll("_", " ")
            .replace(/\b\w/g, letter =>
              letter.toUpperCase()
            );

        const date =
          new Date(
            action.created_at
          ).toLocaleString();

        return `
          <article class="dashboard-card">

            <h3>
              ${escapeHtml(actionName)}
            </h3>

            <p>
              <strong>By:</strong>
              ${escapeHtml(moderatorName)}
            </p>

            ${
              targetName
                ? `
                  <p>
                    <strong>Target:</strong>
                    ${escapeHtml(targetName)}
                  </p>
                `
                : ""
            }

            ${
              action.development_id
                ? `
                  <p>
                    <strong>Development ID:</strong>
                    ${escapeHtml(
                      String(
                        action.development_id
                      )
                    )}
                  </p>
                `
                : ""
            }

            ${
              action.discussion_id
                ? `
                  <p>
                    <strong>Discussion ID:</strong>
                    ${escapeHtml(
                      String(
                        action.discussion_id
                      )
                    )}
                  </p>
                `
                : ""
            }

            ${
              action.attachment_id
                ? `
                  <p>
                    <strong>Attachment ID:</strong>
                    ${escapeHtml(
                      String(
                        action.attachment_id
                      )
                    )}
                  </p>
                `
                : ""
            }

            ${
              action.reason
                ? `
                  <p>
                    <strong>Reason:</strong>
                    ${escapeHtml(
                      action.reason
                    )}
                  </p>
                `
                : ""
            }

            <p>
              <strong>Date:</strong>
              ${escapeHtml(date)}
            </p>

          </article>
        `;
      })
      .join("");
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
        createDevelopmentMessage.textContent =
          "Please enter a development title.";

        return;
      }

      createDevelopmentMessage.textContent =
        "Creating development...";

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
              ? Number(completionYear)
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
        console.error(error);

        createDevelopmentMessage.textContent =
          error.message ||
          "Unable to create development.";

        return;
      }

      createDevelopmentForm.reset();

      createDevelopmentMessage.textContent =
        "Development created successfully.";

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
await loadReports();
await loadBans();
await loadRoles();

setupCreateDevelopmentForm();
}


initializeOwnerDashboard();
