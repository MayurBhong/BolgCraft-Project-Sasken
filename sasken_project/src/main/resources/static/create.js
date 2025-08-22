const API_BASE = "http://localhost:8080/api/posts"; // FIXED: Removed backslash
let isEditMode = false;
let editPostId = null;

// Check if we're in edit mode when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log("🚀 Create page loaded");
  // First, check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  editPostId = urlParams.get('edit');

  if (editPostId) {
    console.log("📝 Edit mode detected from URL:", editPostId);
    isEditMode = true;
    
    // Check localStorage for draft data
    const editData = localStorage.getItem('editDraftData');
    if (editData) {
      console.log("💾 Loading draft data from localStorage");
      const data = JSON.parse(editData);
      
      // Pre-fill form with localStorage data
      document.getElementById('title').value = data.title || '';
      document.getElementById('content').value = data.content || '';
      window.currentAuthor = data.author || 'Anonymous';
      
      updateUIForEditMode();
      
      // Clear localStorage after use
      localStorage.removeItem('editDraftData');
      console.log("✅ Form populated and localStorage cleared");
    } else {
      // Fallback: try to load from API
      console.log("🔍 No localStorage data, trying API...");
      loadPostForEditing(editPostId);
    }
    
    updateUIForEditMode();
  } else {
    console.log("📝 Create mode - new post");
  }
});

// Load existing post data for editing
async function loadPostForEditing(postId) {
  try {
    const response = await fetch(`${API_BASE}/${postId}`); // FIXED: Removed backslashes
    
    if (!response.ok) {
      throw new Error('Post not found');
    }
    
    const post = await response.json();
    
    // Pre-populate the form with existing data
    document.getElementById('title').value = post.title;
    document.getElementById('content').value = post.content;
    
    // Store the author for later use
    window.currentAuthor = post.author;
    
    console.log('Post loaded for editing:', post);
    
  } catch (error) {
    console.error('Error loading post:', error);
    showErrorMessage('Failed to load post for editing. Redirecting to create new post...');
    
    // If loading fails, clear the URL and continue as create mode
    setTimeout(() => {
      window.location.href = 'create.html';
    }, 3000);
  }
}

// Update UI elements for edit mode
function updateUIForEditMode() {
  // Change page title
  document.title = 'Edit Post - BlogCraft';
  // Update header text
  const headerTitle = document.querySelector('h1');
  if (headerTitle) {
    headerTitle.textContent = 'Edit Blog Post';
  }
  // Update the subtitle
  const subtitle = document.querySelector('p');
  if (subtitle && subtitle.textContent.includes('Share your thoughts')) {
    subtitle.textContent = 'Update your post with new ideas';
  }
  // Update button text - SIMPLIFIED with emojis only
  const buttons = document.querySelectorAll('button[onclick*="submitPost"]'); // FIXED: Removed backslash
  buttons.forEach(btn => {
    if (btn.textContent.includes('Save as Draft')) {
      btn.innerHTML = `💾 Update Draft`;
    } else if (btn.textContent.includes('Send to Review')) {
      btn.innerHTML = `📋 Update & Send to Review`;
    }
  });
}

// Main function to submit posts (handles both create and edit)
async function submitPost(status) {
  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();
  // Get author - use existing author for edits, or prompt for new posts
  let author;
  if (isEditMode && window.currentAuthor) {
    author = window.currentAuthor;
    console.log("📝 Using existing author for edit:", author);
  } else {
    author = prompt('Please enter your name as the author:');
    if (!author || author.trim() === '') {
      author = 'Anonymous';
    }
    author = author.trim();
  }
  // Validate form data
  if (!title || !content) {
    showErrorMessage('Please fill in both title and content fields.');
    return;
  }

  try {
    // Show loading state
    const buttons = document.querySelectorAll('button[onclick*="submitPost"]'); // FIXED: Removed backslash
    let clickedButton = null;
    
    buttons.forEach(btn => {
      if ((status === 'DRAFT' && (btn.textContent.includes('Draft') || btn.textContent.includes('Update Draft'))) || 
          (status === 'REVIEW' && (btn.textContent.includes('Review') || btn.textContent.includes('Update & Send')))) {
        clickedButton = btn;
      }
    });

    if (clickedButton) {
      clickedButton.innerHTML = status === 'DRAFT' ? '⏳ Saving...' : '⏳ Sending...';
      clickedButton.disabled = true;
    }

    // Create post data
    const postData = {
      title: title,
      content: content,
      author: author
    };
    let result;
    
    if (isEditMode) {
      console.log("📝 Updating existing post:", editPostId);
      // UPDATE existing post
      result = await updatePost(editPostId, postData);
      
      if (status === 'REVIEW') {
        // If updating and sending to review, change status
        await submitForReview(editPostId);
      }
      
      const action = status === 'DRAFT' ? 'updated' : 'updated and submitted for review';
      showSuccessMessage(`Post "${result.title}" ${action} successfully!`);
      
      // Redirect back to drafts after successful edit
      setTimeout(() => {
        window.location.href = 'drafts.html';
      }, 2000);
      
    } else {
      console.log("📝 Creating new post");
      // CREATE new post
      if (status === 'DRAFT') {
        result = await createPost(postData);
        showSuccessMessage(`Post "${result.title}" saved as draft successfully!`); // FIXED: Removed backslashes
      } else if (status === 'REVIEW') {
        result = await createPost(postData);
        await submitForReview(result.id);
        showSuccessMessage(`Post "${result.title}" submitted for review successfully!`); // FIXED: Removed backslashes
      }
      
      // Clear form after successful creation
      clearForm();
    }
  } catch (error) {
    console.error('Error submitting post:', error);
    const action = isEditMode ? 'update post' : (status === 'DRAFT' ? 'save as draft' : 'submit for review');
    showErrorMessage(`Failed to ${action}. Please try again.`); // FIXED: Removed backslashes
  } finally {
    // Restore button states
    restoreButtonStates();
  }
}

// Function to create a new post
async function createPost(postData) {
  try {
    const response = await fetch(`${API_BASE}/create`, { // FIXED: Removed backslashes
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`); // FIXED: Removed backslashes
    }
    const result = await response.json();
    console.log('Post created successfully:', result);
    return result;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

// Function to update an existing post
async function updatePost(postId, postData) {
  try {
    const response = await fetch(`${API_BASE}/${postId}`, { // FIXED: Removed backslashes
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`); // FIXED: Removed backslashes
    }
    const result = await response.json();
    console.log('Post updated successfully:', result);
    return result;
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}

// Function to submit post for review
async function submitForReview(postId) {
  try {
    const response = await fetch(`${API_BASE}/${postId}/review`, { // FIXED: Removed backslashes
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to submit for review: ${response.status}`); // FIXED: Removed backslashes
    }
    return await response.json();
  } catch (error) {
    console.error('Error submitting for review:', error);
    throw error;
  }
}

// Helper function to clear form
function clearForm() {
  document.getElementById('title').value = '';
  document.getElementById('content').value = '';
}

// Helper function to restore button states - SIMPLIFIED
function restoreButtonStates() {
  const buttons = document.querySelectorAll('button[onclick*="submitPost"]'); // FIXED: Removed backslash
  buttons.forEach(btn => {
    btn.disabled = false;
    if (btn.textContent.includes('Saving') || btn.textContent.includes('Sending')) {
      if (isEditMode) {
        // Restore edit mode button text
        if (btn.textContent.includes('Saving')) {
          btn.innerHTML = `💾 Update Draft`;
        } else {
          btn.innerHTML = `📋 Update & Send to Review`;
        }
      } else {
        // Restore create mode button text
        if (btn.textContent.includes('Saving')) {
          btn.innerHTML = `💾 Save as Draft`;
        } else {
          btn.innerHTML = `📋 Send to Review`;
        }
      }
    }
  });
}

// Function to format text in the content textarea
function formatText(command) {
  const textarea = document.getElementById('content');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  let replacement = '';

  switch (command) {
    case 'bold':
      // Wrap selected text with markdown for bold
      replacement = `**${selectedText}**`;
      break;
    case 'italic':
      // Wrap selected text with markdown for italic
      replacement = `*${selectedText}*`;
      break;
    case 'ul':
      // Create a bulleted list from selected lines or insert a new bullet
      if (selectedText.length > 0) {
        replacement = selectedText.split('\n').map(line => line.trim() ? `• ${line}` : line).join('\n');
      } else {
        replacement = '\n• ';
      }
      break;
    case 'ol':
      // Create a numbered list from selected lines or insert a new number
      if (selectedText.length > 0) {
        let counter = 1;
        replacement = selectedText.split('\n').map(line => line.trim() ? `${counter++}. ${line}` : line).join('\n');
      } else {
        replacement = '\n1. ';
      }
      break;
    default:
      return; // Do nothing if command is unknown
  }

  // Update the textarea value with the formatted text
  textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);

  // Re-focus the textarea and adjust the cursor position
  textarea.focus();
  if (selectedText.length === 0) {
    // If no text was selected, move cursor to the end of the inserted text
    textarea.selectionEnd = start + replacement.length;
  } else {
    // If text was selected, re-select the newly formatted text
    textarea.setSelectionRange(start, start + replacement.length);
  }
}

// Success/Error message functions - SIMPLIFIED
function showSuccessMessage(message) {
  removeExistingMessages();
  const messageDiv = document.createElement('div');
  messageDiv.className = 'fixed top-20 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md';
  messageDiv.innerHTML = `
    <div class="flex items-center gap-3">
      <span>✅</span>
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white/70 hover:text-white">×</button>
    </div>
  `; // FIXED: Removed backslashes
  document.body.appendChild(messageDiv);
  // Auto-remove after 5 seconds
  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}

function showErrorMessage(message) {
  removeExistingMessages();
  const messageDiv = document.createElement('div');
  messageDiv.className = 'fixed top-20 right-6 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md';
  messageDiv.innerHTML = `
    <div class="flex items-center gap-3">
      <span>❌</span>
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white/70 hover:text-white">×</button>
    </div>
  `; // FIXED: Removed backslashes
  document.body.appendChild(messageDiv);
  // Auto-remove after 5 seconds
  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}

// Helper function to remove existing messages
function removeExistingMessages() {
  const existingMessages = document.querySelectorAll('.fixed.top-20.right-6');
  existingMessages.forEach(msg => msg.remove());
}
