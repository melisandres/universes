document.addEventListener('DOMContentLoaded', function() {
    // Get CSRF token from meta tag or form
    function getCsrfToken() {
        return document.querySelector('meta[name="csrf-token"]')?.content ||
               document.querySelector('input[name="_token"]')?.value ||
               document.querySelector('form input[name="_token"]')?.value;
    }

    // Handle status dropdown changes
    document.querySelectorAll('.status-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', function() {
            const universeId = this.dataset.universeId;
            const updateUrl = this.dataset.updateUrl;
            const status = this.value;
            const originalValue = this.dataset.originalValue || this.options[this.selectedIndex].text;
            
            // Disable dropdown while saving
            this.disabled = true;
            
            // Create form data
            const formData = new FormData();
            const csrfToken = getCsrfToken();
            formData.append('_token', csrfToken);
            formData.append('_method', 'PUT');
            formData.append('name', document.querySelector('#universe-view-' + universeId + ' span').textContent.trim());
            formData.append('status', status);
            
            // Get current parent_id from the view div's data attribute
            const viewDiv = document.querySelector('#universe-view-' + universeId);
            const parentId = viewDiv ? (viewDiv.dataset.parentId || '') : '';
            formData.append('parent_id', parentId);
            
            fetch(updateUrl, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json'
                },
                body: formData
            })
            .then(response => {
                return response.json().then(data => {
                    if (!response.ok) {
                        let errorMessage = 'Validation error';
                        if (data.errors) {
                            errorMessage = Object.values(data.errors).flat().join('\n');
                        } else if (data.message) {
                            errorMessage = data.message;
                        }
                        throw new Error(errorMessage);
                    }
                    return data;
                });
            })
            .then(data => {
                if (data.success) {
                    // Update the original value marker
                    this.dataset.originalValue = status;
                    // Reload the page to show updated hierarchy
                    window.location.reload();
                } else {
                    alert('Error updating status');
                    this.value = this.dataset.originalValue || originalValue;
                    this.disabled = false;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert(error.message || 'Error updating status');
                this.value = this.dataset.originalValue || originalValue;
                this.disabled = false;
            });
        });
    });
    
    // Handle edit button clicks
    document.querySelectorAll('.edit-universe-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const universeId = this.dataset.universeId;
            const viewMode = document.getElementById('universe-view-' + universeId);
            const editMode = document.getElementById('universe-edit-' + universeId);
            
            viewMode.style.display = 'none';
            editMode.style.display = 'block';
        });
    });
    
    // Handle cancel button clicks (only for universe edits, not task edits)
    document.querySelectorAll('.cancel-edit-btn[data-universe-id]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const universeId = this.dataset.universeId;
            if (!universeId) return; // Skip if no universe ID
            
            const viewMode = document.getElementById('universe-view-' + universeId);
            const editMode = document.getElementById('universe-edit-' + universeId);
            
            if (viewMode && editMode) {
                viewMode.style.display = 'block';
                editMode.style.display = 'none';
            }
        });
    });
    
    // Handle form submissions (for name and parent)
    document.querySelectorAll('.inline-edit-form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const universeId = this.dataset.universeId;
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Get current status from the view mode dropdown
            const statusDropdown = document.querySelector('#universe-view-' + universeId + ' .status-dropdown');
            if (statusDropdown) {
                formData.set('status', statusDropdown.value);
            }
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';
            
            fetch(this.action, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': formData.get('_token')
                },
                body: formData
            })
            .then(response => {
                return response.json().then(data => {
                    if (!response.ok) {
                        // Handle Laravel validation errors
                        let errorMessage = 'Validation error';
                        if (data.errors) {
                            errorMessage = Object.values(data.errors).flat().join('\n');
                        } else if (data.message) {
                            errorMessage = data.message;
                        }
                        throw new Error(errorMessage);
                    }
                    return data;
                });
            })
            .then(data => {
                if (data.success) {
                    // Reload the page to show updated hierarchy
                    window.location.reload();
                } else {
                    alert('Error updating universe');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert(error.message || 'Error updating universe');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            });
        });
    });
    
    // Handle task edit button clicks
    document.querySelectorAll('.edit-task-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const taskId = this.dataset.taskId;
            const viewMode = document.getElementById('task-view-' + taskId);
            const editMode = document.getElementById('task-edit-' + taskId);
            
            // Only handle if elements exist and TaskCardEditorTest hasn't already handled it
            if (viewMode && editMode && !window.taskCardEditorsTest?.[taskId]) {
                viewMode.style.display = 'none';
                editMode.style.display = 'block';
            }
        });
    });
    
    // Handle task cancel button clicks
    document.querySelectorAll('.cancel-task-edit-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const taskId = this.dataset.taskId;
            const viewMode = document.getElementById('task-view-' + taskId);
            const editMode = document.getElementById('task-edit-' + taskId);
            
            // Only handle if elements exist and TaskCardEditorTest hasn't already handled it
            if (viewMode && editMode && !window.taskCardEditorsTest?.[taskId]) {
                viewMode.style.display = 'flex';
                editMode.style.display = 'none';
            }
        });
    });
    
    // Task form submissions are now handled by TaskCardEditor.js
    // This handler is removed to avoid conflicts
});

