/**
 * UniverseFieldSaver - Helper utility for saving individual universe fields
 * 
 * This utility provides a reusable function to save individual universe fields
 * to the server via AJAX, used by inline editable fields.
 */
class UniverseFieldSaver {
    /**
     * Save a single universe field to the server
     * @param {number} universeId - The universe ID
     * @param {string} fieldName - The field name (e.g., 'name', 'parent_id')
     * @param {any} fieldValue - The field value to save
     * @returns {Promise<boolean>} - Returns true on success, false on failure
     */
    static async saveField(universeId, fieldName, fieldValue) {
        // Get CSRF token
        const csrfToken = DOMUtils.getCSRFToken();
        if (!csrfToken) {
            Logger.error('UniverseFieldSaver: CSRF token not found');
            return false;
        }

        // Get update URL
        const updateUrl = document.querySelector(`[data-universe-id="${universeId}"]`)?.dataset?.updateUrl ||
                         `/universes/${universeId}`;
        
        // Get current values from the view
        const viewDiv = document.getElementById(`universe-view-${universeId}`);
        if (!viewDiv) {
            console.error('Universe view not found');
            return false;
        }

        // Build form data with current values
        const formData = new FormData();
        formData.append('_token', csrfToken);
        formData.append('_method', 'PUT');
        
        // Get current name from inline editable field
        const nameFieldId = `universe-name-${universeId}`;
        const nameViewElement = document.getElementById(`inline-view-${nameFieldId}`);
        const nameValueElement = nameViewElement ? nameViewElement.querySelector('.inline-field-value') : null;
        const currentName = nameValueElement ? nameValueElement.textContent.trim() : '';
        formData.append('name', fieldName === 'name' ? fieldValue : currentName);
        
        // Get current parent_id from data attribute
        const currentParentId = viewDiv.dataset.parentId || '';
        formData.append('parent_id', fieldName === 'parent_id' ? (fieldValue || '') : currentParentId);
        
        // Get current status from inline editable field
        // Read from the select element (may be in hidden edit div)
        const statusFieldId = `universe-status-${universeId}`;
        const statusSelectElement = document.getElementById(`input-${statusFieldId}`);
        let currentStatus = 'active';
        
        if (statusSelectElement) {
            currentStatus = statusSelectElement.value || 'active';
        } else {
            // Fallback: try to get from the editor's stored value
            if (window.inlineFieldEditors && window.inlineFieldEditors[statusFieldId]) {
                const editor = window.inlineFieldEditors[statusFieldId];
                currentStatus = editor.originalValue || 'active';
            }
        }
        formData.append('status', fieldName === 'status' ? fieldValue : currentStatus);

        try {
            const response = await fetch(updateUrl, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json'
                },
                body: formData
            });

            if (response.redirected) {
                console.error('Server returned redirect instead of JSON!');
                return false;
            }

            const data = await response.json();

            if (!response.ok) {
                let errorMessage = 'Error updating universe';
                if (data.errors) {
                    errorMessage = Object.values(data.errors).flat().join('\n');
                } else if (data.message) {
                    errorMessage = data.message;
                }
                alert('Error: ' + errorMessage);
                return false;
            }

            if (data.success) {
                // Update the data-parent-id attribute if parent_id was changed
                if (fieldName === 'parent_id') {
                    viewDiv.dataset.parentId = fieldValue || '';
                    // Reload page to show updated hierarchy
                    // Store which universe was expanded before reload
                    sessionStorage.setItem('expandedUniverseId', universeId.toString());
                    window.location.reload();
                } else {
                    // For name and status, just update the display without reloading
                    // The display value is already updated by the InlineFieldEditor
                    // Update status display in non-expanded view if status was changed
                    if (fieldName === 'status') {
                        const statusDisplay = document.querySelector(`#universe-view-${universeId} .universe-status-display`);
                        if (statusDisplay) {
                            // Replace underscores with spaces for display
                            statusDisplay.textContent = fieldValue.replace(/_/g, ' ');
                        }
                    }
                    // Update name in non-expanded view if name was changed
                    if (fieldName === 'name') {
                        const nameElement = document.querySelector(`#universe-view-${universeId} .universe-name`);
                        if (nameElement) {
                            nameElement.textContent = fieldValue;
                        }
                    }
                }
                return true;
            } else {
                alert('Error updating universe');
                return false;
            }
        } catch (error) {
            console.error('Fetch error:', error);
            alert('Error: ' + (error.message || 'Error updating universe'));
            return false;
        }
    }
}
