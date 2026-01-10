/**
 * TaskCardEditor - OOP class for managing task card editing
 * 
 * This class handles all interactive functionality for task cards:
 * - Edit mode toggle
 * - Form submission via AJAX
 * - Universe add/remove
 * - Deadline management
 * - Recurring task toggle
 * - Status pill updates
 * - Complete checkbox with delay
 */
class TaskCardEditor {
    constructor(taskId, options = {}) {
        this.taskId = taskId;
        this.options = {
            completeDelay: 1000, // ms delay before completing task
            ...options
        };
        
        // State
        this.universeData = {};
        this.universeIndex = 0;
        this.completeTimeout = null;
        
        // DOM elements (will be cached)
        this.elements = {};
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the editor
     */
    init() {
        this.cacheElements();
        this.parseDataAttributes();
        this.attachEventListeners();
    }
    
    /**
     * Cache DOM elements for this task
     */
    cacheElements() {
        const id = this.taskId;
        this.elements = {
            viewMode: document.getElementById(`task-view-${id}`),
            editMode: document.getElementById(`task-edit-${id}`),
            editForm: document.querySelector(`.task-edit-form[data-task-id="${id}"]`),
            editBtn: document.querySelector(`.edit-task-btn[data-task-id="${id}"]`),
            cancelBtn: document.querySelector(`.cancel-task-edit-btn[data-task-id="${id}"]`),
            statusPill: document.getElementById(`status-pill-${id}`),
            statusInput: document.getElementById(`status-input-${id}`),
            deadlineCheckbox: document.getElementById(`deadline-checkbox-${id}`),
            deadlineContainer: document.getElementById(`deadline-container-${id}`),
            deadlineInput: document.getElementById(`deadline-${id}`),
            todayBtn: document.querySelector(`.btn-today[data-task-id="${id}"]`),
            recurringCheckbox: document.getElementById(`recurring-checkbox-${id}`),
            recurringContainer: document.getElementById(`recurring-task-container-${id}`),
            universesContainer: document.getElementById(`universes-container-${id}`),
            addUniverseBtn: document.querySelector(`.add-universe-btn[data-task-id="${id}"]`),
            completeCheckbox: document.getElementById(`complete-checkbox-${id}`)
        };
    }
    
    /**
     * Parse data from JSON script tags
     */
    parseDataAttributes() {
        const id = this.taskId;
        
        // Parse universe data
        const universeDataEl = document.getElementById(`universes-data-${id}`);
        if (universeDataEl && universeDataEl.textContent.trim()) {
            try {
                this.universeData = JSON.parse(universeDataEl.textContent.trim());
            } catch (e) {
                console.error(`Error parsing universes data for task ${id}:`, e);
                this.universeData = {};
            }
        }
        
        // Parse universe index
        const universeIndexEl = document.getElementById(`universe-index-data-${id}`);
        if (universeIndexEl) {
            this.universeIndex = parseInt(universeIndexEl.textContent.trim()) || 0;
        }
    }
    
    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Edit/Cancel toggle
        if (this.elements.editBtn) {
            this.elements.editBtn.addEventListener('click', () => this.toggleEditMode(true));
        }
        if (this.elements.cancelBtn) {
            this.elements.cancelBtn.addEventListener('click', () => this.toggleEditMode(false));
        }
        
        // Form submission
        if (this.elements.editForm) {
            this.elements.editForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        
        // Deadline checkbox (using data-action attribute)
        if (this.elements.deadlineCheckbox) {
            this.elements.deadlineCheckbox.addEventListener('change', () => this.toggleDeadlineInput());
        }
        
        // Recurring checkbox (using data-action attribute)
        if (this.elements.recurringCheckbox) {
            this.elements.recurringCheckbox.addEventListener('change', () => this.toggleRecurringTaskDropdown());
        }
        
        // Deadline input change
        if (this.elements.deadlineInput) {
            this.elements.deadlineInput.addEventListener('change', () => this.updateStatusPillFromDeadline());
        }
        
        // Today button
        if (this.elements.todayBtn) {
            this.elements.todayBtn.addEventListener('click', () => this.setDeadlineToday());
        }
        
        // Universe add/remove buttons (using event delegation)
        if (this.elements.universesContainer) {
            this.elements.universesContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-universe-btn')) {
                    this.removeUniverseRow(e.target);
                }
            });
        }
        
        if (this.elements.addUniverseBtn) {
            this.elements.addUniverseBtn.addEventListener('click', () => this.addUniverseRow());
        }
        
        // Complete checkbox
        if (this.elements.completeCheckbox) {
            this.initCompleteCheckbox();
        }
        
        // Delete form confirmation
        const deleteForm = document.querySelector(`.task-delete-form[data-task-id="${this.taskId}"]`);
        if (deleteForm) {
            deleteForm.addEventListener('submit', (e) => {
                if (!confirm('Are you sure you want to delete this task?')) {
                    e.preventDefault();
                }
            });
        }
    }
    
    /**
     * Toggle edit mode on/off
     */
    toggleEditMode(showEdit) {
        if (showEdit) {
            if (this.elements.viewMode) this.elements.viewMode.style.display = 'none';
            if (this.elements.editMode) {
                this.elements.editMode.classList.remove('d-none');
                this.elements.editMode.style.display = 'block';
            }
        } else {
            if (this.elements.viewMode) this.elements.viewMode.style.display = 'flex';
            if (this.elements.editMode) {
                this.elements.editMode.classList.add('d-none');
                this.elements.editMode.style.display = 'none';
            }
        }
    }
    
    /**
     * Handle form submission
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        
        // Clear deadline if checkbox is unchecked
        this.clearDeadlineIfUnchecked();
        
        const form = this.elements.editForm;
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : 'Save';
        
        // Ensure _method is set
        if (!formData.has('_method')) {
            formData.append('_method', 'PUT');
        }
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';
        }
        
        try {
            // Debug: Log form action and data
            console.log('Submitting form:', {
                action: form.action,
                method: form.method,
                taskId: this.taskId,
                _method: formData.get('_method'),
                hasToken: formData.has('_token')
            });
            
            const response = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': formData.get('_token'),
                    'Accept': 'application/json'
                },
                body: formData
            });
            
            // Note: We can't check response.ok before reading body, but we can check status
            // We'll handle 404 in the error handling below after reading the response
            
            // Check for redirect
            if (response.redirected) {
                console.error('Server returned redirect instead of JSON!');
                const shouldReload = confirm('Task may have been saved, but server returned HTML instead of JSON. Reload page to see changes?');
                if (shouldReload) {
                    window.location.reload();
                } else if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
                return;
            }
            
            // Check content type
            const contentType = response.headers.get('Content-Type') || '';
            
            // Try to parse as JSON (even for error responses)
            let data;
            try {
                const text = await response.text();
                if (text) {
                    data = JSON.parse(text);
                } else {
                    data = {};
                }
            } catch (e) {
                console.error('Failed to parse response as JSON:', e);
                if (!contentType.includes('application/json')) {
                    console.error('Response is not JSON! Content-Type:', contentType);
                    const shouldReload = confirm('Error: Server returned HTML instead of JSON. The task may have been saved. Reload page to see changes?');
                    if (shouldReload) {
                        window.location.reload();
                    } else if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    }
                    return;
                }
                data = {};
            }
            
            if (!response.ok) {
                let errorMessage = 'Error updating task';
                if (response.status === 404) {
                    errorMessage = 'Task not found (404). The task may have been deleted.';
                } else if (data.errors) {
                    errorMessage = Object.values(data.errors).flat().join('\n');
                } else if (data.message) {
                    errorMessage = data.message;
                }
                console.error('Request failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    data: data
                });
                alert('Error: ' + errorMessage);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
                return;
            }
            
            if (data.success) {
                console.log('Task updated successfully, reloading page');
                window.location.reload();
            } else {
                alert('Error updating task');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        } catch (error) {
            console.error('Fetch error:', error);
            alert('Error: ' + (error.message || 'Error updating task'));
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    }
    
    /**
     * Toggle deadline input visibility
     */
    toggleDeadlineInput() {
        const checkbox = this.elements.deadlineCheckbox;
        const container = this.elements.deadlineContainer;
        const input = this.elements.deadlineInput;
        
        if (!checkbox || !container || !input) return;
        
        container.style.display = checkbox.checked ? 'block' : 'none';
        
        if (!checkbox.checked) {
            input.value = '';
            input.disabled = true;
            this.updateStatusPillFromDeadline();
        } else {
            input.disabled = false;
            if (!input.value) {
                this.setDeadlineToday();
            }
        }
    }
    
    /**
     * Set deadline to today at 5pm
     */
    setDeadlineToday() {
        const input = this.elements.deadlineInput;
        if (!input) return;
        
        const today = new Date();
        today.setHours(17, 0, 0, 0); // 5pm
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const hours = String(today.getHours()).padStart(2, '0');
        const minutes = String(today.getMinutes()).padStart(2, '0');
        input.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        this.updateStatusPillFromDeadline();
    }
    
    /**
     * Update status pill based on deadline
     */
    updateStatusPillFromDeadline() {
        const input = this.elements.deadlineInput;
        const pill = this.elements.statusPill;
        const statusInput = this.elements.statusInput;
        
        if (!input || !pill || !statusInput) return;
        
        const deadlineValue = input.value;
        if (deadlineValue) {
            const deadline = new Date(deadlineValue);
            const now = new Date();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const deadlineDate = new Date(deadline);
            deadlineDate.setHours(0, 0, 0, 0);
            
            // Check if deadline is in the past (but not today)
            if (deadline < now && deadlineDate.getTime() !== today.getTime()) {
                pill.textContent = 'late';
                pill.className = 'status-pill status-pill-late';
                statusInput.value = 'late';
            } else {
                pill.textContent = 'open';
                pill.className = 'status-pill status-pill-open';
                if (statusInput.value === 'late') {
                    statusInput.value = 'open';
                }
            }
        } else {
            // No deadline, default to open
            pill.textContent = 'open';
            pill.className = 'status-pill status-pill-open';
            if (statusInput.value === 'late') {
                statusInput.value = 'open';
            }
        }
    }
    
    /**
     * Toggle recurring task dropdown
     */
    toggleRecurringTaskDropdown() {
        const checkbox = this.elements.recurringCheckbox;
        const container = this.elements.recurringContainer;
        
        if (!checkbox || !container) return;
        
        container.style.display = checkbox.checked ? 'block' : 'none';
        
        if (!checkbox.checked) {
            const select = container.querySelector('select[name="recurring_task_id"]');
            if (select) {
                select.value = '';
            }
        }
    }
    
    /**
     * Add a new universe row
     */
    addUniverseRow() {
        const container = this.elements.universesContainer;
        if (!container) return;
        
        const newRow = document.createElement('div');
        newRow.className = 'universe-item-row';
        newRow.setAttribute('data-index', this.universeIndex);
        
        let optionsHtml = '<option value="">— select universe —</option>';
        for (const [id, name] of Object.entries(this.universeData)) {
            optionsHtml += `<option value="${id}">${name}</option>`;
        }
        
        const select = document.createElement('select');
        select.name = 'universe_ids[]';
        select.className = 'universe-select';
        select.required = true;
        select.innerHTML = optionsHtml;
        
        const label = document.createElement('label');
        label.className = 'task-edit-universe-label';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'primary_universe';
        radio.value = this.universeIndex;
        
        label.appendChild(radio);
        label.appendChild(document.createTextNode(' Primary'));
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-universe-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.dataset.taskId = this.taskId;
        
        newRow.appendChild(select);
        newRow.appendChild(label);
        newRow.appendChild(removeBtn);
        
        container.appendChild(newRow);
        this.universeIndex++;
    }
    
    /**
     * Remove a universe row
     */
    removeUniverseRow(btn) {
        const container = this.elements.universesContainer;
        if (!container) return;
        
        if (container.children.length > 1) {
            btn.closest('.universe-item-row').remove();
        } else {
            alert('At least one universe is required');
        }
    }
    
    /**
     * Clear deadline if checkbox is unchecked
     */
    clearDeadlineIfUnchecked() {
        const checkbox = this.elements.deadlineCheckbox;
        const input = this.elements.deadlineInput;
        
        if (!checkbox || !input) return;
        
        if (!checkbox.checked) {
            input.value = '';
            input.disabled = true;
        } else {
            input.disabled = false;
        }
    }
    
    /**
     * Initialize complete checkbox with delay
     */
    initCompleteCheckbox() {
        const checkbox = this.elements.completeCheckbox;
        if (!checkbox || checkbox.dataset.initialized === 'true') return;
        
        checkbox.dataset.initialized = 'true';
        
        checkbox.addEventListener('change', () => {
            const taskId = checkbox.dataset.taskId;
            const completeUrl = checkbox.dataset.completeUrl;
            const isChecked = checkbox.checked;
            const isCompleted = checkbox.dataset.isCompleted === 'true';
            
            // Clear any existing timeout
            if (this.completeTimeout) {
                clearTimeout(this.completeTimeout);
                this.completeTimeout = null;
            }
            
            // Only handle completion if task is not already completed
            if (!isCompleted && !checkbox.disabled && isChecked) {
                // Set timeout for completion
                this.completeTimeout = setTimeout(() => {
                    // Check if checkbox is still checked
                    if (checkbox.checked) {
                        // Create form and submit
                        const form = document.createElement('form');
                        form.method = 'POST';
                        form.action = completeUrl;
                        
                        const csrfToken = document.querySelector('meta[name="csrf-token"]');
                        if (csrfToken) {
                            const csrfInput = document.createElement('input');
                            csrfInput.type = 'hidden';
                            csrfInput.name = '_token';
                            csrfInput.value = csrfToken.getAttribute('content');
                            form.appendChild(csrfInput);
                        }
                        
                        document.body.appendChild(form);
                        form.submit();
                    }
                    this.completeTimeout = null;
                }, this.options.completeDelay);
            }
        });
    }
}

// Initialize all task card editors on page load
document.addEventListener('DOMContentLoaded', function() {
    if (!window.taskCardEditors) {
        window.taskCardEditors = {};
    }
    
    // Collect all unique task IDs from both forms and edit buttons
    const taskIds = new Set();
    
    // Find all task edit forms
    document.querySelectorAll('.task-edit-form[data-task-id]').forEach(form => {
        const taskId = parseInt(form.dataset.taskId);
        if (taskId) taskIds.add(taskId);
    });
    
    // Find all edit buttons (for tasks that might only have view mode initially)
    document.querySelectorAll('.edit-task-btn[data-task-id]').forEach(btn => {
        const taskId = parseInt(btn.dataset.taskId);
        if (taskId) taskIds.add(taskId);
    });
    
    // Initialize editor for each unique task ID
    taskIds.forEach(taskId => {
        if (!window.taskCardEditors[taskId]) {
            window.taskCardEditors[taskId] = new TaskCardEditor(taskId);
        }
    });
});

