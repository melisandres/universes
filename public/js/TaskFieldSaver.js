/**
 * TaskFieldSaver - Helper utility for saving individual task fields
 * 
 * This utility provides a reusable function to save individual task fields
 * to the server via AJAX, used by inline editable fields.
 * 
 * @class
 */
class TaskFieldSaver {
    /**
     * Save a single task field to the server
     * @param {number} taskId - The task ID
     * @param {string} fieldName - The field name (e.g., 'name', 'description', 'universe_ids', 'estimated_time', 'deadline_at', 'recurring_task_id')
     * @param {string|number|Array<number>} fieldValue - The field value to save
     * @param {Object} [options={}] - Additional options
     * @param {string} [options.timeUnit='hours'] - Time unit for estimated_time field ('minutes' or 'hours')
     * @returns {Promise<boolean>} - Returns true on success, false on failure
     */
    static async saveField(taskId, fieldName, fieldValue, options = {}) {
        const form = document.querySelector(`.task-edit-form-simple[data-task-id="${taskId}"]`);
        if (!form) {
            console.error('Task form not found');
            return false;
        }

        // Get CSRF token
        const csrfToken = DOMUtils.getCSRFToken();
        if (!csrfToken) {
            Logger.error('TaskFieldSaver: CSRF token not found');
            return false;
        }

        // Build form data with all current form values
        // Note: The browser automatically decodes HTML entities when reading input.value,
        // so FormData will already contain properly decoded values. We don't need to decode again.
        const formData = new FormData(form);
        
        // Override the specific field value
        // The fieldValue parameter is already decoded by the browser (from input.value),
        // so we can use it directly without additional decoding
        if (fieldName === 'universe_ids') {
            // Handle universe_ids array
            formData.delete('universe_ids[]');
            if (Array.isArray(fieldValue)) {
                fieldValue.forEach(id => {
                    formData.append('universe_ids[]', id);
                });
            }
        } else if (fieldName === 'estimated_time') {
            // Handle estimated_time with unit conversion
            const timeUnit = options.timeUnit || 'hours';
            formData.set('estimated_time', fieldValue);
            formData.set('time_unit', timeUnit);
        } else if (fieldName === 'deadline_at') {
            // Handle deadline_at
            if (fieldValue) {
                formData.set('deadline_at', fieldValue);
            } else {
                formData.set('deadline_at', '');
            }
        } else {
            // For text fields, use the value directly
            // The browser has already decoded HTML entities when reading from input.value
            formData.set(fieldName, fieldValue);
        }

        // Ensure _method is set
        if (!formData.has('_method')) {
            formData.append('_method', 'PUT');
        }

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json'
                },
                body: formData
            });

            const result = await ErrorHandler.handleResponse(response, {
                defaultMessage: 'Error updating task'
            });

            if (!result.success) {
                return false;
            }

            if (result.data.success) {
                return true;
            } else {
                ErrorHandler.handleError(new Error('Task update failed'), {
                    context: 'updating task',
                    showAlert: true
                });
                return false;
            }
        } catch (error) {
            ErrorHandler.handleFetchError(error, {
                defaultMessage: 'Error updating task'
            });
            return false;
        }
    }
}

// Ensure TaskFieldSaver is available on window for global access
if (typeof window !== 'undefined') {
    window.TaskFieldSaver = TaskFieldSaver;
}
