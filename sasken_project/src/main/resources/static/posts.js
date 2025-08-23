const API_BASE = "http://localhost:8080/api/posts";
let allPosts = []; // Store all posts for filtering
let filteredPosts = []; // Store filtered posts

// --- helpers to wire up the UI ---
function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function attachUIEventBindings() {
  const searchInput = document.getElementById("searchInput");
  const dateFilter = document.getElementById("dateFilter");
  const sortFilter = document.getElementById("sortFilter");

  if (searchInput) {
    searchInput.addEventListener("input", debounce(handleSearch, 200));
  } else {
    console.warn("#searchInput not found");
  }

  if (dateFilter) {
    dateFilter.addEventListener("change", handleDateFilter);
  } else {
    console.warn("#dateFilter not found");
  }

  if (sortFilter) {
    sortFilter.addEventListener("change", handleSort);
  } else {
    console.warn("#sortFilter not found");
  }
}

// Load all posts when page loads
async function loadAllPosts() {
  try {
    console.log("📝 Loading all posts...");
    const response = await fetch(API_BASE);
    allPosts = await response.json();

    console.log(`📊 Loaded ${allPosts.length} posts`);

    // Initially show all posts
    filteredPosts = [...allPosts];
    displayPosts(filteredPosts);
    updateResultsInfo();
  } catch (error) {
    console.error("❌ Error loading posts:", error);
    document.getElementById("posts").innerHTML = `
      <div class="text-center py-12">
        <div class="text-6xl mb-4">⚠</div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Error Loading Posts</h3>
        <p class="text-gray-600">Failed to load posts. Please try again.</p>
        <button onclick="loadAllPosts()" class="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          🔄 Retry
        </button>
      </div>
    `;
  }
}

// Display posts with like, comment, and feedback buttons
function displayPosts(posts) {
  const container = document.getElementById("posts");
  container.innerHTML = "";

  if (posts.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <div class="text-6xl mb-4">📝</div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No Posts Found</h3>
        <p class="text-gray-600">No posts match your current search criteria.</p>
        <button onclick="clearAllFilters()" class="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          🔄 Clear Filters
        </button>
      </div>
    `;
    return;
  }

  posts.forEach((post) => {
    const div = document.createElement("div");
    div.className =
      "bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200";

    const statusInfo = getStatusInfo(post.status);
    let deleteButton =
      post.status === "PUBLISHED"
        ? `<button onclick="deletePublishedPost(${post.id}, '${post.title?.replace(/'/g, "\\'") ?? ""}')" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">🗑 Delete Blog</button>`
        : `<button onclick="deletePost(${post.id}, '${post.title?.replace(/'/g, "\\'") ?? ""}')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">🗑 Delete Blog</button>`;

    const readMoreLink =
      post.content?.length > 300
        ? `<p class="text-blue-600 text-sm mt-2 cursor-pointer font-medium hover:underline" onclick="showFullPostModal(${post.id})">📖 Read full post...</p>`
        : "";

    div.innerHTML = `
      <div class="flex justify-between items-start mb-4">
        <div class="flex-1">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">${post.title ?? ""}</h2>
          <div class="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <span>👤 ${post.author ?? "Anonymous"}</span>
            <span>🕒 ${formatDate(post.createdAt)}</span>
            <span>📝 Updated: ${formatDate(post.updatedAt)}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-3 py-1 ${statusInfo.bgColor} ${statusInfo.textColor} text-xs font-medium rounded-full">
            ${statusInfo.emoji} ${post.status}
          </span>
        </div>
      </div>

      <div class="mb-4">
        <p class="text-gray-700 leading-relaxed">${truncateContent(
          post.content,
          300
        )}</p>
        ${readMoreLink}
      </div>

      <div class="flex items-center gap-4 mt-4">
        <button 
          onclick="likePost(${post.id})" 
          class="inline-flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          ❤ Like <span id="like-count-${post.id}">${post.likes ?? 0}</span>
        </button>

        <button 
          onclick="showComments(${post.id})" 
          class="bg-green-600 px-3 py-1 rounded text-white hover:bg-green-700"
        >
          💬 Comments
        </button>

        <button 
          onclick="showFeedback(${post.id})" 
          class="bg-yellow-500 px-3 py-1 rounded text-white hover:bg-yellow-600"
        >
          📝 Feedback
        </button>

        <div class="flex justify-end ml-auto">${deleteButton}</div>
      </div>
    `;

    container.appendChild(div);
  });
}

// Like button handler
async function likePost(postId) {
  try {
    const response = await fetch(`${API_BASE}/${postId}/like`, { method: "PUT" });
    if (!response.ok) throw new Error("Like failed");

    const updatedPost = await response.json();
    const likeCountEl = document.getElementById(`like-count-${postId}`);
    if (likeCountEl) likeCountEl.textContent = updatedPost.likes;
  } catch (error) {
    alert("Failed to like post.");
  }
}

// Show comments modal
async function showComments(postId) {
  try {
    const res = await fetch(`${API_BASE}/${postId}/comments`);
    if (!res.ok) throw new Error("Failed to load comments");
    const comments = await res.json();

    const commentsHtml = comments
      .map(
        (c) =>
          `<p class="mb-1">💬 ${c.comment} <small class="text-gray-500">(User ${c.commenterId})</small></p>`
      )
      .join("");

    const contentHtml = `
      <div class="max-h-64 overflow-y-auto mb-4">${commentsHtml}</div>
      <input type="text" id="new-comment-${postId}" placeholder="Add a comment..." class="w-full border rounded px-2 py-1 mb-2" />
      <button onclick="addComment(${postId})" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Add Comment</button>
    `;

    showModal("Comments", contentHtml);
  } catch (error) {
    alert(error.message);
  }
}

// Add comment
async function addComment(postId) {
  const input = document.getElementById(`new-comment-${postId}`);
  const commentText = input?.value.trim();
  if (!commentText) return alert("Comment cannot be empty.");

  try {
    const res = await fetch(`${API_BASE}/${postId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: commentText,
    });
    if (!res.ok) throw new Error("Failed to add comment");
    alert("Comment added!");
    input.value = "";
    showComments(postId);
  } catch (error) {
    alert(error.message);
  }
}

// Show feedback modal
async function showFeedback(postId) {
  try {
    const res = await fetch(`${API_BASE}/${postId}/feedback`);
    if (!res.ok) throw new Error("Failed to load feedback");
    const feedbacks = await res.json();

    const feedbackHtml = feedbacks
      .map(
        (f) =>
          `<p class="mb-1">📝 ${f.feedback} <small class="text-gray-500">(User ${f.feedbackerId})</small></p>`
      )
      .join("");

    const contentHtml = `
      <div class="max-h-64 overflow-y-auto mb-4">${feedbackHtml}</div>
      <input type="text" id="new-feedback-${postId}" placeholder="Add feedback..." class="w-full border rounded px-2 py-1 mb-2" />
      <button onclick="addFeedback(${postId})" class="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">Add Feedback</button>
    `;

    showModal("Feedback", contentHtml);
  } catch (error) {
    alert(error.message);
  }
}

// Add feedback
async function addFeedback(postId) {
  const input = document.getElementById(`new-feedback-${postId}`);
  const feedbackText = input?.value.trim();
  if (!feedbackText) return alert("Feedback cannot be empty.");

  try {
    const res = await fetch(`${API_BASE}/${postId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: feedbackText,
    });
    if (!res.ok) throw new Error("Failed to add feedback");
    alert("Feedback added!");
    input.value = "";
    showFeedback(postId);
  } catch (error) {
    alert(error.message);
  }
}

// Generic modal
function showModal(title, contentHtml) {
  const existingModal = document.getElementById("info-modal");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.id = "info-modal";
  modal.className =
    "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50";

  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-auto relative">
      <h3 class="text-xl font-semibold mb-4">${title}</h3>
      <div>${contentHtml}</div>
      <button id="closeModal" class="absolute top-3 right-3 bg-gray-300 hover:bg-gray-400 rounded px-3 py-1 text-gray-700 font-semibold">Close</button>
    </div>
  `;

  document.body.appendChild(modal);
  document.getElementById("closeModal").onclick = () => modal.remove();
}

// Filters
function handleSearch() {
  applyFilters();
}
function handleDateFilter() {
  applyFilters();
}

function handleSort() {
  const sortBy = document.getElementById("sortFilter")?.value || "newest";
  filteredPosts.sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "title":
        return (a.title ?? "").localeCompare(b.title ?? "");
      case "author":
        return (a.author ?? "Anonymous").localeCompare(b.author ?? "Anonymous");
      default:
        return 0;
    }
  });
  displayPosts(filteredPosts);
}

function applyFilters() {
  const searchInput = document.getElementById("searchInput");
  const dateFilterEl = document.getElementById("dateFilter");

  const searchTerm = (searchInput?.value || "").toLowerCase().trim();
  const dateFilter = dateFilterEl?.value || "all";

  filteredPosts = allPosts.filter((post) => {
    const matchesSearch =
      !searchTerm ||
      (post.title ?? "").toLowerCase().includes(searchTerm) ||
      (post.content ?? "").toLowerCase().includes(searchTerm) ||
      (post.author ?? "").toLowerCase().includes(searchTerm);

    const matchesDate =
      dateFilter === "all" || matchesDateFilter(post, dateFilter);

    return matchesSearch && matchesDate;
  });

  handleSort();
  updateResultsInfo();
}

function matchesDateFilter(post, filter) {
  const postDate = new Date(post.createdAt);
  const now = new Date();
  switch (filter) {
    case "today":
      return postDate.toDateString() === now.toDateString();
    case "week": {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return postDate >= weekAgo && postDate <= now;
    }
    case "month":
      return (
        postDate.getMonth() === now.getMonth() &&
        postDate.getFullYear() === now.getFullYear()
      );
    case "year":
      return postDate.getFullYear() === now.getFullYear();
    default:
      return true;
  }
}

function clearAllFilters() {
  const searchEl = document.getElementById("searchInput");
  const dateEl = document.getElementById("dateFilter");
  const sortEl = document.getElementById("sortFilter");

  if (searchEl) searchEl.value = "";
  if (dateEl) dateEl.value = "all";
  if (sortEl) sortEl.value = "newest";

  filteredPosts = [...allPosts];
  handleSort();
  updateResultsInfo();
}

function updateResultsInfo() {
  const info = document.getElementById("resultsInfo");
  const total = allPosts.length;
  const showing = filteredPosts.length;
  if (info) {
    info.textContent =
      showing === total
        ? `Showing all ${total} posts`
        : `Showing ${showing} of ${total} posts`;
  }
}

// Utilities
function getStatusInfo(status) {
  switch (status) {
    case "PUBLISHED":
      return {
        emoji: "✅",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
      };
    case "DRAFT":
      return { emoji: "📄", bgColor: "bg-gray-100", textColor: "text-gray-800" };
    default:
      return { emoji: "❓", bgColor: "bg-gray-100", textColor: "text-gray-800" };
  }
}

function showFullPostModal(postId) {
  const post = allPosts.find((p) => p.id === postId);
  if (!post) {
    console.error("Could not find post to display in modal");
    return;
  }

  const contentHtml = `
    <div class="mb-4 text-sm text-gray-600">
      By <b>${post.author ?? "Anonymous"}</b> | Published on ${formatDate(
        post.createdAt
      )}
    </div>
    <div class="text-gray-800 leading-relaxed whitespace-pre-wrap">${
      post.content
    }</div>
  `;

  showModal(post.title, contentHtml);
}

async function deletePublishedPost(postId, postTitle) {
  const confirmMessage = `⚠ WARNING: You are about to DELETE a PUBLISHED post!\n\nThis will remove the post from public view immediately and permanently delete all post data. This action CANNOT be undone!\n\nAre you absolutely sure you want to proceed?`;
  if (!confirm(confirmMessage)) return;
  const secondConfirm = confirm(
    "This is your FINAL WARNING!\nClick OK to permanently delete this published post."
  );
  if (!secondConfirm) return;
  await deletePostRequest(postId, postTitle);
}

async function deletePost(postId, postTitle) {
  const confirmMessage = `Delete this post permanently?\n\nTitle: "${postTitle}"`;
  if (!confirm(confirmMessage)) return;
  await deletePostRequest(postId, postTitle);
}

async function deletePostRequest(postId, postTitle) {
  try {
    console.log("🗑 Deleting post:", postId);
    const response = await fetch(`${API_BASE}/${postId}`, { method: "DELETE" });
    if (response.ok) {
      showNotification(`✅ Post "${postTitle}" deleted successfully!`, "success");
      loadAllPosts();
    } else {
      showNotification("❌ Failed to delete post.", "error");
    }
  } catch (error) {
    showNotification("❌ Network error.", "error");
  }
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
    type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
  }`;
  notification.innerHTML = `<div class="flex items-center gap-2"><span>${message}</span><button onclick="this.parentElement.parentElement.remove()" class="font-bold">✕</button></div>`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 4000);
}

function formatDate(datetime) {
  if (!datetime) return "N/A";
  return new Date(datetime).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateContent(content, maxLength) {
  if (!content) return "";
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + "...";
}

window.onload = function () {
  console.log("🚀 Posts page loaded");
  attachUIEventBindings();  // ← wire inputs to filters
  loadAllPosts();
};
