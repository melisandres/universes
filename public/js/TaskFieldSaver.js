/**
 * TaskFieldSaver - Helper utility for saving individual task fields
 * 
 * This utility provides a reusable function to save individual task fields
 * to the server via AJAX, used by inline editable fields.
 */
class TaskFieldSaver {
    /**
     * Save a single task field to the server
     * @param {number} taskId - The task ID
     * @param {string} fieldName - The field name (e.g., 'name', 'description')
     * @param {any} fieldValue - The field value to save
     * @param {Object} options - Additional options
     * @returns {Promise<boolean>} - Returns true on success, false on failure
     */
    static async saveField(taskId, fieldName, fieldValue, options = {}) {
        const form = document.querySelector(`.task-edit-form-simple[data-task-id="${taskId}"]`);
        if (!form) {
            console.error('Task form not found');
            return false;
        }

        // Get CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (!csrfToken) {
            console.error('CSRF token not found');
            return false;
        }

        // Build form data with all current form values
        const formData = new FormData(form);
        
        // Decode HTML entities in textarea/input values to prevent double-encoding
        // This ensures we always send raw, unencoded values to the server
        const textareas = form.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            const currentValue = textarea.value;
            if (currentValue && currentValue.includes('&#')) {
                // Decode HTML entities
                const temp = document.createElement('textarea');
                temp.innerHTML = currentValue;
                const decodedValue = temp.value;
                if (decodedValue !== currentValue) {
                    // Update FormData with decoded value
                    formData.set(textarea.name, decodedValue);
                }
            }
        });
        
        // Also decode text inputs that might have HTML entities
        const textInputs = form.querySelectorAll('input[type="text"]');
        textInputs.forEach(input => {
            const currentValue = input.value;
            if (currentValue && currentValue.includes('&#')) {
                // Decode HTML entities
                const temp = document.createElement('textarea');
                temp.innerHTML = currentValue;
                const decodedValue = temp.value;
                if (decodedValue !== currentValue) {
                    // Update FormData with decoded value
                    formData.set(input.name, decodedValue);
                }
            }
        });
        
        // Override the specific field value
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
            // Decode HTML entities for text fields to prevent double-encoding
            let decodedValue = fieldValue;
            if (typeof fieldValue === 'string' && fieldValue.includes('&#')) {
                const temp = document.createElement('textarea');
                temp.innerHTML = fieldValue;
                decodedValue = temp.value;
            }
            formData.set(fieldName, decodedValue);
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

            if (response.redirected) {
                console.error('Server returned redirect instead of JSON!');
                return false;
            }

            const data = await response.json();

            if (!response.ok) {
                let errorMessage = 'Error updating task';
                if (data.errors) {
                    errorMessage = Object.values(data.errors).flat().join('\n');
                } else if (data.message) {
                    errorMessage = data.message;
                }
                alert('Error: ' + errorMessage);
                return false;
            }

            if (data.success) {
                return true;
            } else {
                alert('Error updating task');
                return false;
            }
        } catch (error) {
            console.error('Fetch error:', error);
            alert('Error: ' + (error.message || 'Error updating task'));
            return false;
        }
    }
}

// Ensure TaskFieldSaver is available on window for global access
if (typeof window !== 'undefined') {
    window.TaskFieldSaver = TaskFieldSaver;
}
