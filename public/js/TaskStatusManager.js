/**
 * TaskStatusManager - Centralized utility for managing task status
 * 
 * This utility provides a single source of truth for task status updates,
 * handling both the hidden status input field and CSS class updates.
 * 
 * Status priority (highest to lowest):
 * 1. completed - if task is completed
 * 2. skipped - if task is skipped
 * 3. late - if deadline is past (not today) OR status is explicitly "late"
 * 4. open - default
 * 
 * @class
 */
class TaskStatusManager {
    /**
     * Update task status based on deadline
     * @param {number} taskId - The task ID
     * @param {string} deadlineValue - The deadline value in datetime-local format (YYYY-MM-DDTHH:mm) or empty string
     * @returns {void}
     */
    static updateFromDeadline(taskId, deadlineValue) {
        let newStatus = 'open';
        
        if (deadlineValue) {
            // Parse datetime-local format (YYYY-MM-DDTHH:mm)
            const deadline = new Date(deadlineValue);
            if (!isNaN(deadline.getTime())) {
                const now = new Date();
                
                // Compare dates (ignore time for "today" check)
                const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                
                // If deadline is before today, it's "late"
                if (deadlineDate < today) {
                    newStatus = 'late';
                }
            }
        }
        
        this.updateStatus(taskId, newStatus, { source: 'deadline' });
    }
    
    /**
     * Update task status to "skipped"
     * @param {number} taskId - The task ID
     * @returns {void}
     */
    static updateToSkipped(taskId) {
        this.updateStatus(taskId, 'skipped', { source: 'skip' });
    }
    
    /**
     * Update task status to "completed"
     * @param {number} taskId - The task ID
     * @returns {void}
     */
    static updateToCompleted(taskId) {
        this.updateStatus(taskId, 'completed', { source: 'complete' });
    }
    
    /**
     * Update task status to "open"
     * @param {number} taskId - The task ID
     * @returns {void}
     */
    static updateToOpen(taskId) {
        this.updateStatus(taskId, 'open', { source: 'manual' });
    }
    
    /**
     * Update task status - central method that updates both hidden input and CSS classes
     * @param {number} taskId - The task ID
     * @param {string} status - The status to set ('open', 'late', 'completed', 'skipped')
     * @param {Object} [options={}] - Additional options
     * @param {string} [options.source] - Source of the update (for debugging)
     * @returns {void}
     */
    static updateStatus(taskId, status, options = {}) {
        // Validate status
        const validStatuses = ['open', 'late', 'completed', 'skipped'];
        if (!validStatuses.includes(status)) {
            Logger.warn('TaskStatusManager: Invalid status', { taskId, status });
            return;
        }
        
        // Get the form
        const form = document.querySelector(`.task-edit-form-simple[data-task-id="${taskId}"]`);
        if (!form) {
            Logger.warn('TaskStatusManager: Form not found', { taskId });
            return;
        }
        
        // Update hidden status input
        const statusInput = form.querySelector('input[name="status"]');
        if (statusInput) {
            statusInput.value = status;
            Logger.debug('TaskStatusManager: Updated hidden status input', { taskId, status, source: options.source });
        } else {
            Logger.warn('TaskStatusManager: Status input not found', { taskId });
        }
        
        // Update CSS classes via TaskCardEditor if it exists
        if (window.taskCardEditors && window.taskCardEditors[taskId]) {
            const taskCardEditor = window.taskCardEditors[taskId];
            taskCardEditor.setTaskStatus(status);
            Logger.debug('TaskStatusManager: Updated CSS classes via TaskCardEditor', { taskId, status, source: options.source });
        } else {
            // Fallback: update CSS classes directly
            this.updateCSSClasses(taskId, status);
        }
    }
    
    /**
     * Update CSS classes directly (fallback if TaskCardEditor doesn't exist)
     * @param {number} taskId - The task ID
     * @param {string} status - The status to set
     * @returns {void}
     */
    static updateCSSClasses(taskId, status) {
        const taskItem = document.querySelector(`.task-item[data-task-id="${taskId}"], .task-item:has([data-task-id="${taskId}"])`);
        const viewMode = document.querySelector(`#task-view-${taskId}`);
        
        const statusClasses = ['task-status-open', 'task-status-late', 'task-status-skipped', 'task-status-completed'];
        
        if (taskItem) {
            statusClasses.forEach(cls => taskItem.classList.remove(cls));
            taskItem.classList.add(`task-status-${status}`);
        }
        
        if (viewMode) {
            statusClasses.forEach(cls => viewMode.classList.remove(cls));
            viewMode.classList.add(`task-status-${status}`);
        }
    }
    
    /**
     * Get current status from hidden input
     * @param {number} taskId - The task ID
     * @returns {string|null} - The current status or null if not found
     */
    static getStatus(taskId) {
        const form = document.querySelector(`.task-edit-form-simple[data-task-id="${taskId}"]`);
        if (!form) return null;
        
        const statusInput = form.querySelector('input[name="status"]');
        return statusInput ? statusInput.value : null;
    }
    
    /**
     * Recalculate and update status based on current task state
     * This checks completed_at, skipped_at, deadline, and current status
     * Priority: completed > skipped > late (from deadline or status) > open
     * @param {number} taskId - The task ID
     * @returns {void}
     */
    static recalculateStatus(taskId) {
        const form = document.querySelector(`.task-edit-form-simple[data-task-id="${taskId}"]`);
        if (!form) {
            // Fallback: try to update CSS classes directly if form not found
            const currentStatus = this.getStatus(taskId);
            if (currentStatus) {
                this.updateCSSClasses(taskId, currentStatus);
            }
            return;
        }
        
        // Priority 1: Check if task is completed (from checkbox or data attribute)
        const completeCheckbox = form.querySelector(`.complete-task-checkbox[data-task-id="${taskId}"]`);
        if (completeCheckbox && completeCheckbox.checked) {
            this.updateToCompleted(taskId);
            return;
        }
        
        // Priority 2: Check if task is skipped (from data attribute)
        const skipBtn = form.querySelector(`.skip-task-btn[data-task-id="${taskId}"]`);
        if (skipBtn && skipBtn.dataset.isSkipped === '1') {
            this.updateToSkipped(taskId);
            return;
        }
        
        // Priority 3: Check current status in hidden input (may be "late" from database)
        const currentStatus = this.getStatus(taskId);
        if (currentStatus === 'late') {
            // If status is already "late", keep it (trusts database value)
            this.updateStatus(taskId, 'late', { source: 'recalculate' });
            return;
        }
        
        // Priority 4: Check deadline
        const inlineDeadlineInput = document.querySelector(`input[id^="input-deadline-${taskId}"].inline-field-deadline-input`);
        if (inlineDeadlineInput && inlineDeadlineInput.value) {
            this.updateFromDeadline(taskId, inlineDeadlineInput.value);
            return;
        }
        
        // Fallback: use current status or default to "open"
        if (currentStatus && currentStatus !== 'open') {
            this.updateStatus(taskId, currentStatus, { source: 'recalculate' });
        } else {
            this.updateToOpen(taskId);
        }
    }
}

// Expose to window for global access
if (typeof window !== 'undefined') {
    window.TaskStatusManager = TaskStatusManager;
}
