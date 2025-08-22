const API_BASE = "http://localhost:8080/api/posts";
let allPosts = []; // Store all posts for filtering
let filteredPosts = []; // Store filtered posts

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
        <div class="text-6xl mb-4">⚠️</div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Error Loading Posts</h3>
        <p class="text-gray-600">Failed to load posts. Please try again.</p>
        <button onclick="loadAllPosts()" class="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          🔄 Retry
        </button>
      </div>
    `;
  }
}

// Display posts in the UI
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
    div.className = "bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200";

    const statusInfo = getStatusInfo(post.status);
    let deleteButton = '';
    if (post.status === 'PUBLISHED') {
      deleteButton = `
        <button onclick="deletePublishedPost(${post.id}, '${post.title.replace(/'/g, "\\'")}')" 
                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          🗑️ Delete Blog
        </button>
      `;
    } else {
      deleteButton = `
        <button onclick="deletePost(${post.id}, '${post.title.replace(/'/g, "\\'")}')" 
                class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          🗑️ Delete Blog
        </button>
      `;
    }

    // Add a "Read full post" link if content is truncated
    const readMoreLink = post.content.length > 300
      ? `<p class="text-blue-600 text-sm mt-2 cursor-pointer font-medium hover:underline" onclick="showFullPostModal(${post.id})">📖 Read full post...</p>`
      : '';

    div.innerHTML = `
      <div class="flex justify-between items-start mb-4">
        <div class="flex-1">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">${post.title}</h2>
          <div class="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <span>👤 ${post.author || 'Anonymous'}</span>
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
        <p class="text-gray-700 leading-relaxed">${truncateContent(post.content, 300)}</p>
        ${readMoreLink}
      </div>
      
      <div class="pt-4 border-t border-gray-100">
        <div class="flex justify-end">
          ${deleteButton}
        </div>
      </div>
    `;

    container.appendChild(div);
  });
}

// Search, Filter, and Sort Functions
function handleSearch() { applyFilters(); }
function handleDateFilter() { applyFilters(); }
// REMOVED: handleStatusFilter() function is no longer needed.

function handleSort() {
  const sortBy = document.getElementById('sortFilter').value;
  filteredPosts.sort((a, b) => {
    switch (sortBy) {
      case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
      case 'title': return a.title.localeCompare(b.title);
      case 'author': return (a.author || 'Anonymous').localeCompare(b.author || 'Anonymous');
      default: return 0;
    }
  });
  displayPosts(filteredPosts);
}

function applyFilters() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
  const dateFilter = document.getElementById('dateFilter').value;

  filteredPosts = allPosts.filter(post => {
    const matchesSearch = !searchTerm || 
      post.title.toLowerCase().includes(searchTerm) || 
      post.content.toLowerCase().includes(searchTerm) ||
      (post.author && post.author.toLowerCase().includes(searchTerm));
    const matchesDate = dateFilter === 'all' || matchesDateFilter(post, dateFilter);
    // REMOVED: matchesStatus check is no longer needed.
    return matchesSearch && matchesDate;
  });

  handleSort();
  updateResultsInfo();
}

function matchesDateFilter(post, filter) {
  const postDate = new Date(post.createdAt);
  const now = new Date();
  switch (filter) {
    case 'today': return postDate.toDateString() === now.toDateString();
    case 'week': const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); return postDate >= weekAgo;
    case 'month': return postDate.getMonth() === now.getMonth() && postDate.getFullYear() === now.getFullYear();
    case 'year': return postDate.getFullYear() === now.getFullYear();
    default: return true;
  }
}

// Clear all filters
function clearAllFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('dateFilter').value = 'all';
  // REMOVED: Resetting status filter is no longer needed.
  document.getElementById('sortFilter').value = 'newest';
  
  filteredPosts = [...allPosts];
  handleSort();
  updateResultsInfo();
}

function updateResultsInfo() {
  const info = document.getElementById('resultsInfo');
  const total = allPosts.length;
  const showing = filteredPosts.length;
  info.textContent = (showing === total) ? `Showing all ${total} posts` : `Showing ${showing} of ${total} posts`;
}

function getStatusInfo(status) {
  switch (status) {
    case 'PUBLISHED': return { emoji: '✅', bgColor: 'bg-green-100', textColor: 'text-green-800' };
    case 'DRAFT': return { emoji: '📄', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
    default: return { emoji: '❓', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
  }
}

// Function to show full post content in a modal
function showFullPostModal(postId) {
  const post = allPosts.find(p => p.id === postId);
  if (!post) {
    console.error("Could not find post to display in modal");
    return;
  }

  const modal = document.getElementById('full-content-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMeta = document.getElementById('modal-meta');
  const modalContent = document.getElementById('modal-content');

  modalTitle.textContent = post.title;
  modalMeta.innerHTML = `By <b>${post.author || 'Anonymous'}</b> | Published on ${formatDate(post.createdAt)}`;
  modalContent.textContent = post.content; 

  modal.classList.remove('hidden');
}

// Function to close the modal
function closeFullPostModal() {
  const modal = document.getElementById('full-content-modal');
  modal.classList.add('hidden');
}

// Delete functions
async function deletePublishedPost(postId, postTitle) {
  const confirmMessage = `⚠️ WARNING: You are about to DELETE a PUBLISHED post!\n\nThis will remove the post from public view immediately and permanently delete all post data. This action CANNOT be undone!\n\nAre you absolutely sure you want to proceed?`;
  if (!confirm(confirmMessage)) return;
  const secondConfirm = confirm("This is your FINAL WARNING!\nClick OK to permanently delete this published post.");
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
        console.log("🗑️ Deleting post:", postId);
        const response = await fetch(`${API_BASE}/${postId}`, { method: "DELETE" });
        if (response.ok) {
            showNotification(`✅ Post "${postTitle}" deleted successfully!`, 'success');
            loadAllPosts();
        } else {
            showNotification('❌ Failed to delete post.', 'error');
        }
    } catch (error) {
        showNotification('❌ Network error.', 'error');
    }
}

// Utility Functions
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
    type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
  }`;
  notification.innerHTML = `<div class="flex items-center gap-2"><span>${message}</span><button onclick="this.parentElement.parentElement.remove()" class="font-bold">✕</button></div>`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 4000);
}

function formatDate(datetime) {
  if (!datetime) return "N/A";
  return new Date(datetime).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function truncateContent(content, maxLength) {
  if (!content) return '';
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}

window.onload = function() {
  console.log("🚀 Posts page loaded");
  loadAllPosts();
};
