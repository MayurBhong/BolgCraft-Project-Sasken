const API_BASE = "http://localhost:8080/api/posts";

let currentUser = {
  id: null,
  role: null,
};

function setUser() {
  const value = document.getElementById("userSelect").value;
  if (value) {
    const [id, role] = value.split("|");
    currentUser.id = parseInt(id);
    currentUser.role = role;
    document.getElementById(
      "currentUserLabel"
    ).innerText = `Logged in as ${role}`;
    loadPosts();
  } else {
    currentUser.id = null;
    currentUser.role = null;
    document.getElementById("currentUserLabel").innerText = "";
    document.getElementById("posts").innerHTML = "";
  }
}

async function loadPosts() {
  if (!currentUser.id || !currentUser.role) return;

  const res = await fetch(API_BASE);
  const posts = await res.json();

  const container = document.getElementById("posts");
  container.innerHTML = "";

  posts.forEach((post) => {
    const div = document.createElement("div");
    div.style.border = "1px solid #aaa";
    div.style.padding = "10px";
    div.style.margin = "10px";
    div.style.borderRadius = "8px";

    div.innerHTML = `
      <h2>${post.title} (${post.status})</h2>
      <p>${post.content}</p>
      <button onclick="showHistory(${post.id})">🕓 View History</button>
      <button onclick="showComments(${post.id})">💬 View Comments</button>
    `;

    if (["REVIEWER", "ADMIN"].includes(currentUser.role)) {
      div.innerHTML += `
        <select onchange="changeStatus(${post.id}, this.value)">
          <option value="">-- Change Status --</option>
          <option value="REVIEW">Send to Review</option>
          <option value="APPROVED">Approve</option>
          <option value="PUBLISHED">Publish</option>
          <option value="DRAFT">Revert to Draft</option>
        </select>
      `;
    }

    div.innerHTML += `
      <div id="history-${post.id}" style="margin-top: 10px;"></div>
      <div id="comments-${post.id}" style="margin-top: 10px;"></div>
    `;

    container.appendChild(div);
  });
}

async function changeStatus(postId, newStatus) {
  if (!currentUser.id) return alert("Please select a user first.");
  await fetch(
    `${API_BASE}/${postId}/status?status=${newStatus}&userId=${currentUser.id}`,
    {
      method: "PUT",
    }
  );
  alert("Status updated!");
  loadPosts();
}

async function showHistory(postId) {
  const res = await fetch(`${API_BASE}/${postId}/history`);
  const history = await res.json();

  const div = document.getElementById(`history-${postId}`);
  div.innerHTML = `<strong>Status History:</strong><br>`;
  history.forEach((h) => {
    div.innerHTML += `🔁 ${h.oldStatus} → ${h.newStatus} (by User ${h.changedBy})<br>`;
  });
}

async function showComments(postId) {
  const res = await fetch(`${API_BASE}/${postId}/comments`);
  const comments = await res.json();

  const div = document.getElementById(`comments-${postId}`);
  div.innerHTML = `
    <strong>Comments:</strong><br>
    ${comments
      .map((c) => `💬 ${c.comment} (User ${c.commenterId})`)
      .join("<br>")}
    <br>
    <input type="text" id="new-comment-${postId}" placeholder="Add a comment..." />
    <button onclick="addComment(${postId})">Add</button>
  `;
}

async function addComment(postId) {
  const commentText = document.getElementById(`new-comment-${postId}`).value;
  if (!currentUser.id) return alert("Please select a user first.");
  if (!commentText.trim()) return alert("Comment cannot be empty.");

  await fetch(`${API_BASE}/${postId}/comment?userId=${currentUser.id}`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: commentText,
  });

  alert("Comment added!");
  showComments(postId);
}

async function createPost() {
  const title = document.getElementById("newTitle").value.trim();
  const content = document.getElementById("newContent").value.trim();

  if (!title || !content) return alert("Please fill out both fields.");
  if (!currentUser.id || !currentUser.role)
    return alert("Select a user first.");

  const post = {
    title,
    content,
    authorId: currentUser.id, // ✅ This is required!
  };

  const res = await fetch(`${API_BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
  });

  if (res.ok) {
    alert("Post saved!");
    window.location.href = "index.html"; // Or loadPosts()
  } else {
    const msg = await res.text();
    alert("❌ Failed to save post: " + msg);
  }
}

async function loadDashboard() {
  const res = await fetch(`${API_BASE}/status-summary`);
  const summary = await res.json();

  const container = document.getElementById("dashboard");
  container.innerHTML = "";

  for (const [status, count] of Object.entries(summary)) {
    const card = document.createElement("div");
    card.className = "p-4 bg-white rounded-xl shadow border text-center";
    card.innerHTML = `<h2 class="text-lg font-bold">${status}</h2><p class="text-2xl">${count}</p>`;
    container.appendChild(card);
  }
}

window.onload = () => {
  if (currentUser.id && currentUser.role) {
    loadPosts();
  }
};
