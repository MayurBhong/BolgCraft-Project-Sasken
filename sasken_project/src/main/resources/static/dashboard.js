const API_BASE = "http://localhost:8080/api/posts";

async function loadDashboardData() {
  try {
    // Load all posts from your backend
    const response = await fetch(API_BASE);
    const posts = await response.json();

    console.log("📊 Dashboard posts loaded:", posts);

    // Calculate statistics based on your actual post statuses
    const totalPosts = posts.length;
    const publishedPosts = posts.filter(post => post.status === "PUBLISHED").length;
    // FIXED: Changed from "REVIEWED" to "REVIEW" to match the actual status used in your app
    const reviewPosts = posts.filter(post => post.status === "REVIEW").length;
    const draftPosts = posts.filter(post => post.status === "DRAFT").length;

    // Update stats cards
    document.getElementById("total-posts").textContent = totalPosts;
    document.getElementById("published-posts").textContent = publishedPosts;
    document.getElementById("review-posts").textContent = reviewPosts;
    document.getElementById("draft-posts").textContent = draftPosts;

    // Show published posts in the "Ready to Publish" section
    displayRecentPosts(posts);

  } catch (error) {
    console.error("❌ Error loading dashboard data:", error);
    showErrorState();
  }
}

function displayRecentPosts(posts) {
  const container = document.getElementById("dashboard-posts");
  container.innerHTML = "";

  // Show recent published posts (last 5)
  const recentPosts = posts
    .filter(post => post.status === "PUBLISHED")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (recentPosts.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <div class="text-6xl mb-4">📝</div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No Published Posts Yet</h3>
        <p class="text-gray-600">Your published posts will appear here once you start publishing content.</p>
        <div class="mt-6">
          <a href="create.html" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            ➕ Create Your First Post
          </a>
        </div>
      </div>
    `;
    return;
  }

  recentPosts.forEach((post) => {
    const div = document.createElement("div");
    div.className = "bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden";
    
    div.innerHTML = `
      <div class="p-6">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-xl font-semibold text-gray-900 mb-2">${post.title}</h3>
            <div class="flex items-center gap-4 text-sm text-gray-500 mb-3">
              <span>👤 ${post.author || 'Anonymous'}</span>
              <span>🕒 ${formatDate(post.createdAt)}</span>
              <span>📝 Last updated: ${formatDate(post.updatedAt)}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              ✅ ${post.status}
            </span>
          </div>
        </div>
        
        <div class="bg-gray-50 rounded-lg p-4 mb-6">
          <p class="text-gray-700 leading-relaxed">${truncateContent(post.content, 200)}</p>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-3">
          <button 
            onclick="editPost(${post.id})"
            class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          >
            ✏️ Edit Post
          </button>
          
          <button 
            onclick="viewPost(${post.id})"
            class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          >
            👁️ View Post
          </button>
          
          <button 
            onclick="deletePost(${post.id}, '${post.title.replace(/'/g, "\\'")}')"
            class="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
    
    container.appendChild(div);
  });
}

// Edit post function
function editPost(postId) {
  console.log("✏️ Editing post:", postId);
  window.location.href = `create.html?edit=${postId}`;
}

// View post function
function viewPost(postId) {
  console.log("👁️ Viewing post:", postId);
  window.open(`posts.html?id=${postId}`, '_blank');
}

// Delete post function
async function deletePost(postId, postTitle) {
  const confirmMessage = `Are you sure you want to delete this post?\n\nTitle: "${postTitle}"\n\nThis action cannot be undone!`;
  
  if (!confirm(confirmMessage)) return;

  try {
    console.log("🗑️ Deleting post:", postId);
    
    const response = await fetch(`${API_BASE}/${postId}`, { 
      method: "DELETE",
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      showNotification(`✅ Post "${postTitle}" deleted successfully!`, 'success');
      loadDashboardData(); // Reload dashboard
    } else {
      console.error("❌ Delete failed:", response.status);
      showNotification('❌ Failed to delete post. Please try again.', 'error');
    }
  } catch (error) {
    console.error("❌ Error deleting post:", error);
    showNotification('❌ Network error. Please check your connection.', 'error');
  }
}

// Show error state when loading fails
function showErrorState() {
  document.getElementById("dashboard-posts").innerHTML = `
    <div class="text-center py-12">
      <div class="text-6xl mb-4">⚠️</div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
      <p class="text-gray-600">Failed to load dashboard data. Please try again.</p>
      <button onclick="loadDashboardData()" class="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
        🔄 Retry
      </button>
    </div>
  `;
}

// Show notifications
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 max-w-md ${
    type === 'success' ? 'bg-green-500 text-white' : 
    type === 'error' ? 'bg-red-500 text-white' : 
    'bg-blue-500 text-white'
  }`;
  
  notification.innerHTML = `
    <div class="flex items-start gap-3">
      <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span class="flex-1">${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="text-white/70 hover:text-white ml-2">
        ✕
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Remove notification after 4 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 4000);
}

// Format date helper
function formatDate(dateString) {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Truncate content helper
function truncateContent(content, maxLength) {
  if (!content) return '';
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}

// Load dashboard when page loads
window.onload = function() {
  console.log("🚀 Dashboard page loaded");
  loadDashboardData();
};
