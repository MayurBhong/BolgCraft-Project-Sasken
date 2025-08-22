const API_BASE = "http://localhost:8080/api/posts";

// Store all loaded drafts in a variable accessible to other functions
let allDrafts = [];

// Load all drafts on page load
async function loadDrafts() {
  try {
    const response = await fetch(`${API_BASE}/drafts`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Store the fetched drafts in our global variable
    allDrafts = await response.json();
    console.log("📝 Drafts loaded:", allDrafts);

    const container = document.getElementById("draft-posts");
    container.innerHTML = "";

    if (allDrafts.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="text-6xl mb-4">📝</div>
          <h3 class="text-lg font-medium text-gray-900">No drafts yet</h3>
          <p class="mt-2 text-gray-500">Start writing your first draft!</p>
          <div class="mt-6">
            <a href="create.html" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              ➕ New Post
            </a>
          </div>
        </div>
      `;
      return;
    }

    allDrafts.forEach((draft) => {
      console.log("🔍 Processing draft:", draft);
      
      const draftCard = document.createElement("div");
      draftCard.className = "bg-white rounded-lg shadow p-6 mb-4";

      // Safe escaping for display
      const safeTitle = (draft.title || '').replace(/"/g, '&quot;');
      const safeContent = (draft.content || '').replace(/"/g, '&quot;');
      const safeAuthor = (draft.author || '').replace(/"/g, '&quot;');

      draftCard.innerHTML = `
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">${safeTitle || 'Untitled'}</h2>
          <div class="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <span>👤 ${safeAuthor || 'Anonymous'}</span>
            <span>🕒 ${formatDate(draft.updatedAt || draft.createdAt)}</span>
            <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">📝 ${draft.status || 'DRAFT'}</span>
          </div>
        </div>
        
        <div class="mb-4">
          <p class="text-gray-700">${truncateContent(draft.content, 200)}</p>
        </div>

        <div class="flex gap-2">
          <button onclick="editDraft(${draft.id})" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            ✏️ Edit
          </button>
          <button onclick="publishDraft(${draft.id})" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            ✅ Publish
          </button>
          <button onclick="submitForReview(${draft.id})" class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
            📋 Review
          </button>
          <button onclick="deleteDraft(${draft.id})" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            🗑️ Delete
          </button>
        </div>
      `;

      container.appendChild(draftCard);
    });
    
  } catch (error) {
    console.error("❌ Error loading drafts:", error);
    
    const container = document.getElementById("draft-posts");
    container.innerHTML = `
      <div class="text-center py-12">
        <div class="text-6xl mb-4">⚠️</div>
        <h3 class="text-lg font-medium text-gray-900">Error Loading Drafts</h3>
        <p class="mt-2 text-gray-500">Error: ${error.message}</p>
        <button onclick="loadDrafts()" class="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          🔄 Retry
        </button>
      </div>
    `;
  }
}

// Edit draft function - robust implementation
function editDraft(draftId) {
  console.log(`✏️ Edit button clicked for draft ID: ${draftId}`);
  
  // Find the full draft object from our stored array
  const draftToEdit = allDrafts.find(draft => draft.id === draftId);

  if (!draftToEdit) {
    alert("❌ Error: Could not find the draft data to edit.");
    console.error(`Could not find draft with ID ${draftId} in allDrafts array.`);
    return;
  }
  
  // Store the clean, complete draft object in localStorage
  localStorage.setItem('editDraftData', JSON.stringify(draftToEdit));
  
  console.log("💾 Full draft object stored in localStorage:", draftToEdit);
  console.log("🔗 Redirecting to create page for editing...");
  
  // Redirect to the create/edit page
  window.location.href = `create.html?edit=${draftId}`;
}

// Publish draft function
async function publishDraft(draftId) {
  if (!confirm("Publish this draft?")) return;
  try {
    const response = await fetch(`${API_BASE}/${draftId}/publish`, { 
      method: "PUT",
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) {
      showNotification("✅ Published successfully!", 'success');
      loadDrafts();
    } else {
      showNotification("❌ Failed to publish", 'error');
    }
  } catch (error) {
    console.error("❌ Error publishing:", error);
    showNotification("❌ Server error", 'error');
  }
}

// Submit for review function
async function submitForReview(draftId) {
  if (!confirm("Submit for review?")) return;
  try {
    const response = await fetch(`${API_BASE}/${draftId}/review`, { 
      method: "PUT",
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) {
      showNotification("✅ Submitted for review!", 'success');
      loadDrafts();
    } else {
      showNotification("❌ Failed to submit", 'error');
    }
  } catch (error) {
    console.error("❌ Error submitting:", error);
    showNotification("❌ Server error", 'error');
  }
}

// Delete draft function
async function deleteDraft(draftId) {
  if (!confirm("Delete this draft permanently?")) return;
  try {
    const response = await fetch(`${API_BASE}/${draftId}`, { method: "DELETE" });
    if (response.ok) {
      showNotification("✅ Deleted!", 'success');
      loadDrafts();
    } else {
      showNotification("❌ Failed to delete", 'error');
    }
  } catch (error) {
    console.error("❌ Error deleting:", error);
    showNotification("❌ Server error", 'error');
  }
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

// Utility functions
function formatDate(datetime) {
  if (!datetime) return "Unknown";
  return new Date(datetime).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function truncateContent(content, maxLength) {
  if (!content) return '';
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}

// Load drafts when page loads
window.onload = function() {
  console.log("🚀 Drafts page loaded");
  loadDrafts();
};
