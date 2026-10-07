const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;
const MONGODB_URI = "mongodb+srv://mayanksri359_db_user:BTcJ6Udpibq8nfTn@cluster0.h3ltwx1.mongodb.net/mayankdata";
const DB_NAME = process.env.DB_NAME || "profile_card_generator";

let profilesCollection;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function cleanUrl(value = "") {
  const url = String(value).trim();
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function initials(name) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map(word => word[0].toUpperCase()).join("");
}

function normalizeSkills(rawSkills = "") {
  return [...new Set(String(rawSkills).split(",").map(s => s.trim()).filter(Boolean))].slice(0, 12);
}

function profileCard(profile) {
  const skills = profile.skills.length
    ? profile.skills.map(s => `<span class="skill">${escapeHtml(s)}</span>`).join("")
    : `<span class="muted">No skills added</span>`;

  const links = [["GitHub", profile.links.github], ["LinkedIn", profile.links.linkedin], ["Website", profile.links.website]]
    .filter(([, url]) => url)
    .map(([label, url]) => `<a class="social-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`)
    .join("") || `<span class="muted">No social links added</span>`;

  return page(`${escapeHtml(profile.name)} · Profile Card`, `
    <main class="page narrow">
      <a class="back-link" href="/">← Create another profile</a>
      <section class="profile-card">
        <div class="avatar">${escapeHtml(profile.avatar)}</div>
        <h1>${escapeHtml(profile.name)}</h1>
        <p class="bio">${escapeHtml(profile.bio) || "No bio provided."}</p>
        <div class="section"><h2>Skills</h2><div class="skills">${skills}</div></div>
        <div class="section"><h2>Social Links</h2><div class="social-links">${links}</div></div>
        <div class="card-footer">
          <span>Profile generated on the server</span>
          <a href="/profiles">View all profiles</a>
        </div>
      </section>
    </main>
  `);
}

function page(title, content) {
  return `<!DOCTYPE html><html lang="en"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title><link rel="stylesheet" href="/styles.css">
  </head><body>${content}</body></html>`;
}

app.get("/", (req, res) => {
  res.send(page("User Profile Card Generator", `
    <main class="page">
      <section class="hero">
        <span class="eyebrow">SERVER-SIDE RENDERING</span>
        <h1>User Profile Card Generator</h1>
        <p>Create a profile, process the form on the Node.js server, save it in MongoDB, and receive a dynamically rendered profile card.</p>
      </section>

      <section class="panel">
        <form method="POST" action="/profiles">
          <div class="field"><label for="name">Name</label>
            <input id="name" name="name" maxlength="80" placeholder="e.g. Mayank Srivastava" required></div>

          <div class="field"><label for="bio">Bio</label>
            <textarea id="bio" name="bio" maxlength="400" rows="4" placeholder="Write a short introduction..."></textarea></div>

          <div class="field"><label for="skills">Skills</label>
            <input id="skills" name="skills" placeholder="JavaScript, Node.js, MongoDB, Python">
            <small>Separate skills with commas.</small></div>

          <div class="two-column">
            <div class="field"><label for="github">GitHub URL</label>
              <input id="github" name="github" type="url" placeholder="https://github.com/username"></div>
            <div class="field"><label for="linkedin">LinkedIn URL</label>
              <input id="linkedin" name="linkedin" type="url" placeholder="https://linkedin.com/in/username"></div>
          </div>

          <div class="field"><label for="website">Website URL</label>
            <input id="website" name="website" type="url" placeholder="https://example.com"></div>

          <button type="submit">Generate Profile Card</button>
        </form>
      </section>

      <section class="info-grid">
        <div class="info-card"><strong>1</strong><span>Capture form data</span></div>
        <div class="info-card"><strong>2</strong><span>Process on Node.js</span></div>
        <div class="info-card"><strong>3</strong><span>Save to MongoDB</span></div>
        <div class="info-card"><strong>4</strong><span>Render dynamic card</span></div>
      </section>

      <p class="footer-link"><a href="/profiles">View saved profiles →</a></p>
    </main>
  `));
});

app.post("/profiles", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const bio = String(req.body.bio || "").trim();
    if (!name) return res.status(400).send(page("Validation Error", `<main class="page narrow"><section class="panel error-panel"><h1>Name is required</h1><a class="button-link" href="/">Go back</a></section></main>`));

    const profile = {
      name,
      bio,
      skills: normalizeSkills(req.body.skills),
      links: {
        github: cleanUrl(req.body.github),
        linkedin: cleanUrl(req.body.linkedin),
        website: cleanUrl(req.body.website)
      },
      avatar: initials(name),
      createdAt: new Date()
    };

    const result = await profilesCollection.insertOne(profile);
    profile._id = result.insertedId;
    res.status(201).send(profileCard(profile));
  } catch (error) {
    console.error(error);
    res.status(500).send(page("Server Error", `<main class="page narrow"><section class="panel error-panel"><h1>Something went wrong</h1><p>The profile could not be saved.</p><a class="button-link" href="/">Return to form</a></section></main>`));
  }
});

app.get("/profiles", async (req, res) => {
  try {
    const profiles = await profilesCollection.find({}).sort({ createdAt: -1 }).limit(50).toArray();
    const cards = profiles.length ? profiles.map(profile => `
      <article class="mini-card">
        <div class="mini-avatar">${escapeHtml(profile.avatar)}</div>
        <div class="mini-content">
          <h2>${escapeHtml(profile.name)}</h2>
          <p>${escapeHtml(profile.bio || "No bio provided.")}</p>
          <a href="/profiles/${profile._id}">Open profile →</a>
        </div>
      </article>`).join("") : `<div class="empty-state">No profiles saved yet.</div>`;

    res.send(page("Saved Profiles", `<main class="page">
      <div class="topbar"><div><span class="eyebrow">MONGODB RECORDS</span><h1>Saved Profiles</h1></div><a class="button-link" href="/">+ New profile</a></div>
      <section class="profile-list">${cards}</section>
    </main>`));
  } catch (error) {
    console.error(error);
    res.status(500).send("Could not load profiles.");
  }
});

app.get("/profiles/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).send("Invalid profile ID.");
    const profile = await profilesCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!profile) return res.status(404).send(page("Not Found", `<main class="page narrow"><section class="panel error-panel"><h1>Profile not found</h1><a class="button-link" href="/profiles">View profiles</a></section></main>`));
    res.send(profileCard(profile));
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error.");
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "user-profile-card-generator" });
});

async function startServer() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  profilesCollection = db.collection("profiles");
  await profilesCollection.createIndex({ createdAt: -1 });

  app.listen(PORT, "0.0.0.0", () => console.log(`Running on port ${PORT}`));
}

startServer().catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
