const params = new URLSearchParams(window.location.search);
const developmentId = params.get("id");

const developmentMessage = document.getElementById("developmentMessage");
const developmentContent = document.getElementById("developmentContent");

async function loadDevelopment() {
  if (!developmentId) {
    developmentMessage.textContent = "No development was specified.";
    return;
  }

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
    .eq("id", developmentId)
    .eq("is_approved", true)
    .single();

  if (error) {
    console.error(error);
    developmentMessage.textContent = "Unable to load this development.";
    return;
  }

  document.title = `${data.title} | Kelowna Developments`;

  document.getElementById("developmentTitle").textContent = data.title;

  document.getElementById("developmentAddress").textContent =
    data.address || "Kelowna, British Columbia";

  document.getElementById("developmentName").textContent = data.title;

  const details = document.getElementById("developmentDetails");

  details.innerHTML = `
    ${data.address ? `<p><strong>Address:</strong> ${data.address}</p>` : ""}
    ${data.developer ? `<p><strong>Developer:</strong> ${data.developer}</p>` : ""}
    ${data.project_type ? `<p><strong>Project Type:</strong> ${data.project_type}</p>` : ""}
    ${data.status ? `<p><strong>Status:</strong> ${data.status}</p>` : ""}
    ${data.units !== null ? `<p><strong>Units:</strong> ${data.units}</p>` : ""}
    ${data.storeys !== null ? `<p><strong>Storeys:</strong> ${data.storeys}</p>` : ""}
  `;

  document.getElementById("developmentDescription").textContent =
    data.description || "No description has been provided yet.";

  developmentMessage.style.display = "none";
  developmentContent.style.display = "block";
}

loadDevelopment();
