const API_BASE = "http://localhost:8080/api/posts";

// NEW: Store all loaded review posts in a variable accessible to other functions
let allReviewPosts = [];

async function loadReviewPosts() {
  try {
    // Load posts in review status using the correct endpoint
    const reviewResponse = await fetch(`${API_BASE}/review`);
    allReviewPosts = await reviewResponse.json();

    // Load all posts to calculate statistics
    const allResponse = await fetch(`${API_BASE}`);
    const allPosts = await allResponse.json();

    console.log("📋 Review posts loaded:", allReviewPosts);
    console.log("📊 All posts for stats:", allPosts);

    const container = document.getElementById("review-posts");
    container.innerHTML = "";

    // Update statistics
    updateStatistics(allReviewPosts, allPosts);

    if (allReviewPosts.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="text-6xl mb-4">📝</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No Posts for Review</h3>
          <p class="text-gray-600">All posts have been reviewed or are in other stages.</p>
          <div class="mt-4">
            <a href="drafts.html" class="text-blue-600 hover:text-blue-700 font-medium">
              Check drafts that can be submitted for review →
            </a>
          </div>
        </div>
      `;
      return;
    }

    allReviewPosts.forEach((post) => {
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
              <span class="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                📋 ${post.status}
              </span>
            </div>
          </div>
          
          <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <p class="text-gray-700 leading-relaxed">${truncateContent(post.content, 300)}</p>
            ${post.content.length > 300 ? `<p class="text-blue-600 text-sm mt-2 cursor-pointer font-medium hover:underline" onclick="showFullContent(${post.id})">📖 Read full content...</p>` : ''}
          </div>
          
          <div class="flex flex-col sm:flex-row gap-3">
            <button 
              onclick="approvePost(${post.id})"
              class="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            >
              ✅ Approve & Publish
            </button>
            
            <button 
              onclick="rejectPost(${post.id}, '${post.title.replace(/'/g, "\\'")}')"
              class="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            >
              ❌ Reject & Delete
            </button>
          </div>
        </div>
      `;
      
      container.appendChild(div);
    });
  } catch (error) {
    console.error("❌ Error loading review posts:", error);
    document.getElementById("review-posts").innerHTML = `
      <div class="text-center py-12">
        <div class="text-6xl mb-4">⚠️</div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Error Loading Posts</h3>
        <p class="text-gray-600">Failed to load posts for review. Please try again.</p>
        <button onclick="loadReviewPosts()" class="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          🔄 Retry
        </button>
      </div>
    `;
  }
}

// Update statistics on the dashboard
function updateStatistics(reviewPosts, allPosts) {
  // Pending Review count
  const pendingCount = reviewPosts.length;
  document.getElementById("pending-count").textContent = pendingCount;
  
  // Total Approved (all published posts)
  const totalApproved = allPosts.filter(post => post.status === 'PUBLISHED').length;
  document.getElementById("approved-count").textContent = totalApproved;
  
  // Total Rejected (all rejections from localStorage)
  const totalRejected = getTotalRejectedCount();
  document.getElementById("rejected-count").textContent = totalRejected;
  
  console.log(`📊 Stats - Pending: ${pendingCount}, Total Approved: ${totalApproved}, Total Rejected: ${totalRejected}`);
}

// Show full content in a modal
function showFullContent(postId) {
  const post = allReviewPosts.find(p => p.id === postId);
  if (!post) {
    alert("❌ Could not find post content");
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
      <div class="p-6 border-b border-gray-200">
        <div class="flex justify-between items-start">
          <h2 class="text-2xl font-bold text-gray-900 pr-4">${post.title}</h2>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-800 text-3xl font-light leading-none">&times;</button>
        </div>
        <div class="text-sm text-gray-500 mt-2">By <b>${post.author || 'Anonymous'}</b> | ${formatDate(post.createdAt)}</div>
      </div>
      <div class="p-6 text-gray-700 leading-relaxed overflow-y-auto" style="white-space: pre-wrap;">${post.content}</div>
      <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 text-right">
        <button onclick="this.closest('.fixed').remove()" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-lg font-semibold">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// Approve post (publish it)
async function approvePost(postId) {
  if (!confirm("Are you sure you want to approve and publish this post?")) return;

  try {
    console.log("✅ Approving post:", postId);
    const response = await fetch(`${API_BASE}/${postId}/publish`, {
      method: "PUT",
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      showNotification('✅ Post approved and published successfully!', 'success');
      loadReviewPosts(); // Reload the page
    } else {
      console.error("❌ Approval failed:", response.status);
      showNotification('❌ Failed to approve post. Please try again.', 'error');
    }
  } catch (error) {
    console.error("❌ Error approving post:", error);
    showNotification('❌ Network error. Please check your connection.', 'error');
  }
}

// Reject post (delete permanently)
async function rejectPost(postId, postTitle) {
  const confirmMessage = `Are you sure you want to REJECT and PERMANENTLY DELETE this post?\n\nTitle: "${postTitle}"\n\nThis action cannot be undone!`;
  
  if (!confirm(confirmMessage)) return;

  try {
    console.log("❌ Rejecting and deleting post:", postId);
    
    const response = await fetch(`${API_BASE}/${postId}`, {
      method: "DELETE",
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      // Track the rejection in localStorage
      trackRejectionToday();
      
      showNotification(`❌ Post "${postTitle}" rejected and deleted permanently!`, 'error');
      loadReviewPosts(); // Reload the page to update counts
    } else {
      console.error("❌ Rejection failed:", response.status);
      showNotification('❌ Failed to reject post. Please try again.', 'error');
    }
  } catch (error) {
    console.error("❌ Error rejecting post:", error);
    showNotification('❌ Network error. Please check your connection.', 'error');
  }
}

// Track rejections in localStorage for today's count
function trackRejectionToday() {
  const today = new Date().toDateString();
  const rejections = JSON.parse(localStorage.getItem('rejectedPosts') || '{}');
  
  if (!rejections[today]) {
    rejections[today] = 0;
  }
  
  rejections[today]++;
  localStorage.setItem('rejectedPosts', JSON.stringify(rejections));
  
  console.log(`📊 Rejection tracked. Total rejections today: ${rejections[today]}`);
}

// Get total rejection count from localStorage (across all days)
function getTotalRejectedCount() {
  const rejections = JSON.parse(localStorage.getItem('rejectedPosts') || '{}');
  let total = 0;
  
  // Sum all rejections across all days
  for (const date in rejections) {
    total += rejections[date];
  }
  
  return total;
}

// Get today's rejection count from localStorage (kept for individual day tracking)
function getRejectedTodayCount() {
  const today = new Date().toDateString();
  const rejections = JSON.parse(localStorage.getItem('rejectedPosts') || '{}');
  return rejections[today] || 0;
}

// Clean up old rejection data (optional - run on page load)
function cleanupOldRejectionData() {
  const rejections = JSON.parse(localStorage.getItem('rejectedPosts') || '{}');
  const today = new Date().toDateString();
  
  // Keep only today's and yesterday's data
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  
  const cleanedRejections = {};
  if (rejections[today]) cleanedRejections[today] = rejections[today];
  if (rejections[yesterdayStr]) cleanedRejections[yesterdayStr] = rejections[yesterdayStr];
  
  localStorage.setItem('rejectedPosts', JSON.stringify(cleanedRejections));
}

// Utility functions
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
  
  // Remove notification after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

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

function truncateContent(content, maxLength) {
  if (!content) return '';
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}

// Load review posts when page loads
window.onload = function() {
  console.log("🚀 Review panel loaded");
  cleanupOldRejectionData(); // Clean up old data
  loadReviewPosts();
};
