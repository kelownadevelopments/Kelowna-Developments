const SUPABASE_URL = "https://diljkqsrqdktzyumrqkg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_JjzaLH_H48oLIvuRz9F5jg_yyC5xxII";

const supabaseClient = window.supabase.createClient(
SUPABASE_URL,
SUPABASE_PUBLISHABLE_KEY
);

const params = new URLSearchParams(window.location.search);
const developmentId = params.get("id");

const messageElement = document.getElementById("developmentMessage");
const contentElement = document.getElementById("developmentContent");

async function loadDevelopment() {
if (!developmentId) {
messageElement.textContent = "No development was specified.";
return;
}

const result = await supabaseClient
.from("developments")
.select("*")
.eq("id", developmentId)
.eq("is_approved", true)
.single();

if (result.error) {
console.error(result.error);
messageElement.textContent = "Unable to load this development.";
return;
}

const data = result.data;

document.getElementById("developmentTitle").textContent = data.title;
document.getElementById("developmentAddress").textContent =
data.address || "Kelowna, British Columbia";
document.getElementById("developmentName").textContent = data.title;

const details = document.getElementById("developmentDetails");
details.innerHTML = "";

if (data.address) {
details.innerHTML +=
"<p><strong>Address:</strong> " +
escapeHtml(data.address) +
"</p>";
}

if (data.developer) {
details.innerHTML +=
"<p><strong>Developer:</strong> " +
escapeHtml(data.developer) +
"</p>";
}

if (data.project_type) {
details.innerHTML +=
"<p><strong>Project Type:</strong> " +
escapeHtml(data.project_type) +
"</p>";
}

if (data.status) {
details.innerHTML +=
"<p><strong>Status:</strong> " +
escapeHtml(data.status) +
"</p>";
}

if (data.units !== null) {
details.innerHTML +=
"<p><strong>Units:</strong> " +
data.units +
"</p>";
}

if (data.storeys !== null) {
details.innerHTML +=
"<p><strong>Storeys:</strong> " +
data.storeys +
"</p>";
}

document.getElementById("developmentDescription").textContent =
data.description || "No description has been provided yet.";

document.title = data.title + " | Kelowna Developments";

messageElement.style.display = "none";
contentElement.style.display = "block";

await loadDiscussions();
setupDiscussionForm();
}

async function loadDiscussions() {
const discussionList = document.getElementById("discussionList");

if (!discussionList) {
return;
}

discussionList.innerHTML = "<p>Loading discussions...</p>";

const result = await supabaseClient
.from("discussions")
.select("*")
.eq("development_id", developmentId)
.order("created_at", {
ascending: true
});

if (result.error) {
console.error(result.error);
discussionList.innerHTML =
"<p>Unable to load discussions.</p>";
return;
}

const data = result.data;

if (!data || data.length === 0) {
discussionList.innerHTML =
"<p>No discussions yet.</p>";
return;
}

discussionList.innerHTML = "";

data.forEach(function (discussion) {
const card = document.createElement("div");
card.className = "discussion-card";

```
const paragraph = document.createElement("p");
paragraph.textContent = discussion.content;

const date = document.createElement("small");
date.textContent =
  new Date(discussion.created_at).toLocaleString();

card.appendChild(paragraph);
card.appendChild(date);

discussionList.appendChild(card);
```

});
}

async function setupDiscussionForm() {
const formContainer =
document.getElementById("discussionFormContainer");

const loginMessage =
document.getElementById("discussionLoginMessage");

const form =
document.getElementById("discussionForm");

if (!formContainer || !loginMessage || !form) {
return;
}

const userResult =
await supabaseClient.auth.getUser();

const user = userResult.data.user;

if (user) {
formContainer.style.display = "block";
loginMessage.style.display = "none";
} else {
formContainer.style.display = "none";
loginMessage.style.display = "block";
}

form.addEventListener("submit", async function (event) {
event.preventDefault();

```
const contentInput =
  document.getElementById("discussionContent");

const submitButton =
  document.getElementById("discussionSubmitButton");

const formMessage =
  document.getElementById("discussionFormMessage");

const content =
  contentInput.value.trim();

if (!content) {
  formMessage.textContent =
    "Please enter something before posting.";
  return;
}

if (content.length > 5000) {
  formMessage.textContent =
    "Your discussion is too long.";
  return;
}

submitButton.disabled = true;
submitButton.textContent = "Posting...";
formMessage.textContent = "";

const currentUserResult =
  await supabaseClient.auth.getUser();

const currentUser =
  currentUserResult.data.user;

if (!currentUser) {
  formMessage.textContent =
    "You must be logged in to post a discussion.";

  submitButton.disabled = false;
  submitButton.textContent = "Post Discussion";

  return;
}

const insertResult =
  await supabaseClient
    .from("discussions")
    .insert({
      development_id: developmentId,
      user_id: currentUser.id,
      content: content
    });

if (insertResult.error) {
  console.error(insertResult.error);

  formMessage.textContent =
    "There was a problem posting your discussion.";

  submitButton.disabled = false;
  submitButton.textContent = "Post Discussion";

  return;
}

contentInput.value = "";

formMessage.textContent =
  "Discussion posted successfully.";

submitButton.disabled = false;
submitButton.textContent = "Post Discussion";

await loadDiscussions();
```

});
}

function escapeHtml(value) {
return String(value ?? "")
.replaceAll("&", "&")
.replaceAll("<", "<")
.replaceAll(">", ">")
.replaceAll('"', """)
.replaceAll("'", "'");
}

loadDevelopment();
