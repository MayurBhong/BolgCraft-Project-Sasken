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
    document.getElementById("currentUserLabel").innerText = `Logged in as ${role}`;
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
  if (!res.ok) {
    alert("Failed to load posts.");
    return;
  }
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
      <button onclick="showHistory(${post.id})" class="bg-blue-600 text-white px-2 py-1 rounded mr-2 hover:bg-blue-700 transition">🕓 View History</button>
      <button onclick="showComments(${post.id})" class="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition">💬 View Comments</button>
    `;

    if (["REVIEWER", "ADMIN"].includes(currentUser.role)) {
      div.innerHTML += `
        <select onchange="changeStatus(${post.id}, this.value)" class="ml-4 border rounded px-2 py-1 text-sm">
          <option value="">-- Change Status --</option>
          <option value="REVIEW">Send to Review</option>
          <option value="APPROVED">Approve</option>
          <option value="PUBLISHED">Publish</option>
          <option value="DRAFT">Revert to Draft</option>
        </select>
      `;
    }

    container.appendChild(div);
  });
}

async function changeStatus(postId, newStatus) {
  if (!currentUser.id) return alert("Please select a user first.");

  const res = await fetch(
    `${API_BASE}/${postId}/status?status=${newStatus}&userId=${currentUser.id}`,
    {
      method: "PUT",
    }
  );

  if (res.ok) {
    alert("Status updated!");
    loadPosts();
  } else {
    alert("Failed to update status.");
  }
}

function createModal(title, contentHtml) {
  let existingModal = document.getElementById("info-modal");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.id = "info-modal";
  modal.className =
    "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50";

  modal.innerHTML = `
    <div class="bg-white rounded-lg w-11/12 max-w-lg p-6 shadow-lg relative">
      <h3 class="text-xl font-semibold mb-4">${title}</h3>
      <div class="max-h-96 overflow-y-auto mb-6">${contentHtml}</div>
      <button id="closeModal" class="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition">Close</button>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("closeModal").onclick = () => {
    modal.remove();
  };
}

async function showHistory(postId) {
  const res = await fetch(`${API_BASE}/${postId}/history`);
  if (!res.ok) return alert("Failed to load history");

  const history = await res.json();
  const contentHtml = history
    .map(
      (h) =>
        `<p>🔁 <strong>${h.oldStatus}</strong> → <strong>${h.newStatus}</strong> (by User ${h.changedBy})</p>`
    )
    .join("");
  createModal("Status History", contentHtml);
}

async function showComments(postId) {
  const res = await fetch(`${API_BASE}/${postId}/comments`);
  if (!res.ok) return alert("Failed to load comments");

  const comments = await res.json();
  const commentsHtml = comments
    .map((c) => `<p>💬 ${c.comment} <small>(User ${c.commenterId})</small></p>`)
    .join("");
  const contentHtml = `
    ${commentsHtml}
    <input type="text" id="new-comment-${postId}" placeholder="Add a comment..." class="w-full border rounded px-2 py-1 my-2" />
    <button onclick="addComment(${postId})" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Add</button>
  `;
  createModal("Comments", contentHtml);
}

async function addComment(postId) {
  const input = document.getElementById(`new-comment-${postId}`);
  const commentText = input?.value.trim();
  if (!currentUser.id) return alert("Please select a user first.");
  if (!commentText) return alert("Comment cannot be empty.");

  const res = await fetch(`${API_BASE}/${postId}/comment?userId=${currentUser.id}`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: commentText,
  });

  if (res.ok) {
    alert("Comment added!");
    input.value = "";
    showComments(postId);
  } else {
    alert("Failed to add comment.");
  }
}

async function createPost() {
  const title = document.getElementById("newTitle").value.trim();
  const content = document.getElementById("newContent").value.trim();

  if (!title || !content) return alert("Please fill out both fields.");
  if (!currentUser.id || !currentUser.role) return alert("Select a user first.");

  const post = {
    title,
    content,
    authorId: currentUser.id,
  };

  const res = await fetch(`${API_BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
  });

  if (res.ok) {
    alert("Post saved!");
    window.location.href = "index.html";
  } else {
    const msg = await res.text();
    alert("❌ Failed to save post: " + msg);
  }
}

async function loadDashboard() {
  const res = await fetch(`${API_BASE}/status-summary`);
  if (!res.ok) {
    alert("Failed to load dashboard data.");
    return;
  }
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
