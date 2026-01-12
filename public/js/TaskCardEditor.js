/**
 * TaskCardEditor - OOP class for managing task card editing
 * 
 * This class handles card-level interactive functionality for task cards:
 * 
 * **Core Card Functionality:**
 * - Edit mode toggle (expand/collapse)
 * - Task status pill updates (based on deadline)
 * - Complete checkbox with delay
 * - Skip task button
 * - Delete task button
 * - Complete & Log button
 * - Log form submission
 * 
 * **Legacy Field Management (only for non-inline fields):**
 * - Universe add/remove (only if NOT in inline-editable-field)
 * - Deadline "Today" button (only if NOT in inline-editable-field)
 * - Time unit conversion for estimated time (only if NOT in inline-editable-field)
 * - Time unit conversion for log time (only if NOT in inline-editable-field)
 * 
 * **Note:** Most field-level functionality has been moved to dedicated field classes:
 * - InlineUniversesField - handles universe selection
 * - InlineEstimatedTimeField - handles estimated time
 * - InlineDeadlineField - handles deadline
 * - InlineLogTimeField - handles log time
 * 
 * TaskCardEditor now skips handling these fields if they're inside an `.inline-editable-field`.
 */
class TaskCardEditor {
    constructor(taskId) {
        this.taskId = taskId;
        this.universeData = {};
        this.universeIndex = 0;
        this.init();
    }
    
    init() {
        this.parseDataAttributes();
        this.cacheElements();
        this.attachEventListeners();
        this.updateStatusPillFromDeadline(); // Initialize status pill based on deadline
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
    
    cacheElements() {
        const id = this.taskId;
        this.elements = {
            viewMode: document.getElementById(`task-view-${id}`),
            editMode: document.getElementById(`task-edit-${id}`),
            editForm: document.querySelector(`.task-edit-form-simple[data-task-id="${id}"]`),
            taskName: document.querySelector(`.task-name-clickable[data-task-id="${id}"]`),
            deadlineInput: document.getElementById(`deadline-${id}`) || document.querySelector(`input[name="deadline_at"][data-task-id="${id}"]`),
            todayBtn: document.querySelector(`.btn-today[data-task-id="${id}"]`),
                universesContainer: document.getElementById(`universes-container-${id}`),
                addUniverseBtn: document.querySelector(`.add-universe-btn[data-task-id="${id}"]`),
                completeCheckbox: document.querySelector(`.complete-task-checkbox[data-task-id="${id}"]`),
                skipBtn: document.querySelector(`.skip-task-btn[data-task-id="${id}"]`),
                deleteBtn: document.querySelector(`.delete-task-btn[data-task-id="${id}"]`),
                completeAndLogBtn: document.querySelector(`.complete-and-log-btn[data-task-id="${id}"]`)
            };
        }
    
    attachEventListeners() {
        // Store handlers for cleanup
        this._handlers = {};

        // Edit/Cancel toggle - task name is clickable
        if (this.elements.taskName) {
            this._handlers.taskNameClick = () => this.toggleEditMode(true);
            this.elements.taskName.addEventListener('click', this._handlers.taskNameClick);
        }
        // Close button (X) in edit mode header
        const closeBtn = document.querySelector(`.task-close-edit-btn[data-task-id="${this.taskId}"]`);
        if (closeBtn) {
            this._handlers.closeBtnClick = () => this.toggleEditMode(false);
            closeBtn.addEventListener('click', this._handlers.closeBtnClick);
        }

            // Complete checkbox with delay
            if (this.elements.completeCheckbox) {
                this.completeTimeout = null;
                this._handlers.completeCheckboxChange = (e) => this.handleCompleteCheckbox(e);
                this.elements.completeCheckbox.addEventListener('change', this._handlers.completeCheckboxChange);
            }
        
        // Deadline input change - update status pill
        if (this.elements.deadlineInput) {
            this._handlers.deadlineChange = () => this.updateStatusPillFromDeadline();
            this._handlers.deadlineInput = () => this.updateStatusPillFromDeadline();
            this.elements.deadlineInput.addEventListener('change', this._handlers.deadlineChange);
            this.elements.deadlineInput.addEventListener('input', this._handlers.deadlineInput);
        }
        
        // Today button (skip if InlineDeadlineField is handling it)
        const todayBtn = document.querySelector(`.btn-today[data-task-id="${this.taskId}"]`);
        if (todayBtn && !todayBtn.closest('.inline-editable-field')) {
            this._handlers.todayBtnClick = () => {
                this.setDeadlineToday();
                this.updateStatusPillFromDeadline();
            };
            todayBtn.addEventListener('click', this._handlers.todayBtnClick);
        }
        
        // Universe add/remove buttons (using event delegation)
        // Skip if InlineUniversesField is handling it (for inline editable fields)
        if (this.elements.universesContainer && !this.elements.universesContainer.closest('.inline-editable-field')) {
            this._handlers.universesContainerClick = (e) => {
                if (e.target.classList.contains('remove-universe-btn')) {
                    this.removeUniverseRow(e.target);
                }
            };
            this.elements.universesContainer.addEventListener('click', this._handlers.universesContainerClick);
        }
        
            // Skip add universe button if InlineUniversesField is handling it
            // (InlineUniversesField will handle add/remove for inline editable fields)
            if (this.elements.addUniverseBtn && !this.elements.addUniverseBtn.closest('.inline-editable-field')) {
                this.elements.addUniverseBtn.addEventListener('click', () => this.addUniverseRow());
            }

            // Complete checkbox with delay
            if (this.elements.completeCheckbox) {
                this.completeTimeout = null;
                this.elements.completeCheckbox.addEventListener('change', (e) => this.handleCompleteCheckbox(e));
            }

            // Skip button (in edit form)
            if (this.elements.skipBtn) {
                this.elements.skipBtn.addEventListener('click', (e) => this.handleSkipTask(e));
            }

            // Delete button
            if (this.elements.deleteBtn) {
                this.elements.deleteBtn.addEventListener('click', (e) => this.handleDeleteTask(e));
            }

            // Log form submission (using event delegation since form is in edit mode)
            if (this.elements.editMode) {
                const logForm = this.elements.editMode.querySelector('.task-log-form');
                if (logForm) {
                    // Use a bound method to allow removal if needed
                    this.boundHandleLogSubmit = (e) => this.handleLogSubmit(e);
                    logForm.addEventListener('submit', this.boundHandleLogSubmit);
                }
            }

            // Complete and Log button
            if (this.elements.completeAndLogBtn) {
                this.elements.completeAndLogBtn.addEventListener('click', (e) => this.handleCompleteAndLog(e));
            }
            
            // Time unit radio buttons and estimated time input
            const timeInput = document.getElementById(`estimated-time-${this.taskId}`);
            const timeUnitRadios = document.querySelectorAll(`input[name="time_unit"][id$="-${this.taskId}"]`);
            
            // Initialize stored minutes value from data attribute or current value
            if (timeInput) {
                const originalMinutes = parseFloat(timeInput.dataset.originalMinutes) || 0;
                timeInput.dataset.storedMinutes = originalMinutes.toString();
                
                // Update stored minutes whenever input changes
                timeInput.addEventListener('input', () => {
                    this.updateStoredMinutes();
                });
            }
            
            timeUnitRadios.forEach(radio => {
                // Skip if the radio is inside an inline-editable-field (InlineEstimatedTimeField handles it)
                if (!radio.closest('.inline-editable-field')) {
                    radio.addEventListener('change', (e) => {
                        this.updateEstimatedTimeDisplay(e.target.value);
                    });
                }
            });
            
            // Log form time unit radio buttons and input (skip if InlineLogTimeField is handling it)
            const logForm = this.elements.editMode?.querySelector('.task-log-form');
            if (logForm) {
                const logTimeInput = logForm.querySelector(`input[name="minutes"][id^="log-minutes-"]`);
                const logTimeUnitRadios = logForm.querySelectorAll(`input[name="time_unit"][id^="log-time-unit-"]`);
                
                // Skip if the input is inside an inline-editable-field (InlineLogTimeField handles it)
                if (logTimeInput && !logTimeInput.closest('.inline-editable-field')) {
                    const originalMinutes = parseFloat(logTimeInput.dataset.originalMinutes) || 0;
                    logTimeInput.dataset.storedMinutes = originalMinutes.toString();
                    
                    logTimeInput.addEventListener('input', () => {
                        this.updateLogStoredMinutes(logTimeInput);
                    });
                }
                
                logTimeUnitRadios.forEach(radio => {
                    // Skip if the radio is inside an inline-editable-field
                    if (!radio.closest('.inline-editable-field')) {
                        radio.addEventListener('change', (e) => {
                            this.updateLogTimeDisplay(e.target.value, logTimeInput);
                        });
                    }
                });
            }
        
        }
    
    /**
     * Add a new universe row
     * @deprecated Only used for non-inline fields. InlineUniversesField handles inline editable fields.
     */
    addUniverseRow() {
        const container = this.elements.universesContainer;
        if (!container) return;
        
        const newRow = document.createElement('div');
        newRow.className = 'universe-item-row';
        newRow.setAttribute('data-index', this.universeIndex);
        newRow.style.cssText = 'margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;';
        
        // Build select options
        let optionsHtml = '<option value="">— select universe —</option>';
        for (const [id, name] of Object.entries(this.universeData)) {
            optionsHtml += `<option value="${id}">${name}</option>`;
        }
        
        // Create select
        const select = document.createElement('select');
        select.name = 'universe_ids[]';
        select.className = 'universe-select';
        select.required = true;
        select.style.cssText = 'padding: 0.35rem; flex: 1; max-width: 300px;';
        select.innerHTML = optionsHtml;
        
        // Create label with radio
        const label = document.createElement('label');
        label.style.cssText = 'display: flex; align-items: center; gap: 0.25rem; margin: 0; white-space: nowrap;';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'primary_universe';
        radio.value = this.universeIndex;
        
        label.appendChild(radio);
        label.appendChild(document.createTextNode(' Primary'));
        
        // Create remove button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-universe-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.dataset.taskId = this.taskId;
        removeBtn.style.cssText = 'padding: 0.35rem 0.75rem; font-size: 0.9rem; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;';
        
        // Append all elements
        newRow.appendChild(select);
        newRow.appendChild(label);
        newRow.appendChild(removeBtn);
        
        container.appendChild(newRow);
        this.universeIndex++;
    }
    
    /**
     * Remove a universe row
     * @deprecated Only used for non-inline fields. InlineUniversesField handles inline editable fields.
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
     * Set deadline to today at 5pm
     * @deprecated Only used for non-inline fields. InlineDeadlineField handles inline editable fields.
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
        input.disabled = false;
    }
    
    /**
     * Updates the task card status class based on the deadline value.
     * Status is "late" if deadline is in the past (not today), otherwise "open".
     */
    updateStatusPillFromDeadline() {
        const deadlineCheckbox = this.elements.deadlineCheckbox;
        const deadlineInput = this.elements.deadlineInput;

        // If no deadline checkbox or it's unchecked, status is "open"
        if (!deadlineCheckbox || !deadlineCheckbox.checked || !deadlineInput || !deadlineInput.value) {
            this.setTaskStatus('open');
            return;
        }

        // Parse the deadline value
        const deadlineValue = deadlineInput.value;
        if (!deadlineValue) {
            this.setTaskStatus('open');
            return;
        }

        // Parse datetime-local format (YYYY-MM-DDTHH:mm)
        const deadline = new Date(deadlineValue);
        const now = new Date();

        // Compare dates (ignore time for "today" check)
        const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // If deadline is before today, it's "late"
        if (deadlineDate < today) {
            this.setTaskStatus('late');
        } else {
            // If deadline is today or in the future, it's "open"
            this.setTaskStatus('open');
        }
    }

    /**
     * Sets the task card status class.
     * @param {string} status - The status to set ('open', 'late', 'completed', 'skipped')
     */
    setTaskStatus(status) {
        const viewMode = this.elements.viewMode;
        const taskItem = viewMode?.closest('.task-item');
        
        if (viewMode) {
            // Remove all status classes from view mode
            viewMode.classList.remove('task-status-open', 'task-status-late', 'task-status-skipped', 'task-status-completed');
            // Add the specific status class
            viewMode.classList.add(`task-status-${status}`);
        }
        
        if (taskItem) {
            // Also update the task-item class
            taskItem.classList.remove('task-status-open', 'task-status-late', 'task-status-skipped', 'task-status-completed');
            taskItem.classList.add(`task-status-${status}`);
        }
    }

    toggleEditMode(showEdit) {
        if (showEdit) {
            if (this.elements.viewMode) this.elements.viewMode.style.display = 'none';
            if (this.elements.editMode) {
                this.elements.editMode.classList.remove('d-none');
                this.elements.editMode.style.display = 'block';
            }
        } else {
            if (this.elements.viewMode) this.elements.viewMode.style.display = 'block';
            if (this.elements.editMode) {
                this.elements.editMode.classList.add('d-none');
                this.elements.editMode.style.display = 'none';
            }
        }
    }
    

    /**
     * Update stored minutes value based on current input and selected unit
     */
    updateStoredMinutes() {
        const input = document.getElementById(`estimated-time-${this.taskId}`);
        if (!input || !input.value) return;
        
        const currentValue = parseFloat(input.value);
        if (isNaN(currentValue)) return;
        
        const selectedUnit = document.querySelector(`input[name="time_unit"][id$="-${this.taskId}"]:checked`)?.value || 'minutes';
        
        let minutes;
        if (selectedUnit === 'hours') {
            minutes = currentValue * 60; // Convert hours to minutes
        } else {
            minutes = currentValue;
        }
        
        input.dataset.storedMinutes = Math.round(minutes).toString();
    }
    
    /**
     * Update stored minutes value for log form based on current input and selected unit
     */
    updateLogStoredMinutes(input) {
        if (!input || !input.value) return;
        
        const currentValue = parseFloat(input.value);
        if (isNaN(currentValue)) return;
        
        const form = input.closest('form');
        const selectedUnit = form?.querySelector('input[name="time_unit"]:checked')?.value || 'hours';
        
        let minutes;
        if (selectedUnit === 'hours') {
            minutes = currentValue * 60;
        } else {
            minutes = currentValue;
        }
        
        input.dataset.storedMinutes = Math.round(minutes).toString();
    }
    
    /**
     * Update log time display when unit changes
     */
    updateLogTimeDisplay(newUnit, input) {
        if (!input) return;
        
        this.updateLogStoredMinutes(input);
        
        const storedMinutes = parseFloat(input.dataset.storedMinutes) || 0;
        
        if (!storedMinutes) {
            // Use TimeHelper for consistent step values
            input.step = TimeHelper.getStepForUnit(newUnit);
            return;
        }
        
        if (newUnit === 'hours') {
            const hours = storedMinutes / 60;
            input.value = parseFloat(hours.toFixed(2));
            input.step = TimeHelper.getStepForUnit('hours');
        } else {
            input.value = Math.round(storedMinutes);
            input.step = TimeHelper.getStepForUnit('minutes');
        }
    }
    
    /**
     * Update estimated time display when unit changes
     */
    updateEstimatedTimeDisplay(newUnit) {
        const input = document.getElementById(`estimated-time-${this.taskId}`);
        if (!input) return;
        
        // First, update stored minutes from current value (before unit change)
        this.updateStoredMinutes();
        
        // Get stored minutes value
        const storedMinutes = parseFloat(input.dataset.storedMinutes) || 0;
        
        if (!storedMinutes) {
            // If no value, just update step attribute using TimeHelper
            input.step = TimeHelper.getStepForUnit(newUnit);
            return;
        }
        
        // Convert stored minutes to new unit for display
        if (newUnit === 'hours') {
            const hours = storedMinutes / 60;
            // Show up to 2 decimal places
            input.value = parseFloat(hours.toFixed(2));
            input.step = TimeHelper.getStepForUnit('hours');
        } else {
            input.value = Math.round(storedMinutes);
            input.step = TimeHelper.getStepForUnit('minutes');
        }
    }
    
    /**
     * @deprecated This method is no longer used.
     * Fields now save individually via InlineFieldEditor and TaskFieldSaver.
     * Kept for reference but not attached to any event listener.
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        
        
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
        
        console.log('Submitting form:', {
            action: form.action,
            method: form.method,
            taskId: this.taskId,
            _method: formData.get('_method'),
            hasToken: formData.has('_token')
        });
        
        try {
            const response = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': formData.get('_token'),
                    'Accept': 'application/json'
                },
                body: formData
            });
            
            // Check for redirect
            if (response.redirected) {
                console.error('Server returned redirect instead of JSON!');
                alert('Task may have been saved, but server returned HTML instead of JSON. Reload page to see changes?');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
                return;
            }
            
            // Parse JSON
            const data = await response.json();
            
            if (!response.ok) {
                let errorMessage = 'Error updating task';
                if (data.errors) {
                    errorMessage = Object.values(data.errors).flat().join('\n');
                } else if (data.message) {
                    errorMessage = data.message;
                }
                alert('Error: ' + errorMessage);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
                return;
            }
            
            if (data.success) {
                console.log('Task updated successfully! Reloading...');
                alert('Task updated successfully! Reloading...');
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
     * Handles the complete checkbox change with delay.
     * @param {Event} e - The change event.
     */
    handleCompleteCheckbox(e) {
        const checkbox = e.target;
        const isChecked = checkbox.checked;
        
        // Clear any existing timeout
        if (this.completeTimeout) {
            clearTimeout(this.completeTimeout);
            this.completeTimeout = null;
        }
        
        // If checked, set a delay before completing
        if (isChecked) {
            // Disable checkbox during delay
            checkbox.disabled = true;
            
            // Set timeout (2 seconds delay)
            this.completeTimeout = setTimeout(() => {
                this.completeTask();
            }, 2000);
        } else {
            // If unchecked, we could handle uncompleting, but for now just clear timeout
            // Uncompleting would require a different endpoint
        }
    }

    /**
     * Completes the task via AJAX.
     */
    async completeTask() {
        const checkbox = this.elements.completeCheckbox;
        if (!checkbox) return;
        
        try {
            const response = await fetch(`/tasks/${this.taskId}/complete`, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                alert('Error: ' + (data.message || 'Failed to complete task'));
                checkbox.checked = false;
                checkbox.disabled = false;
                return;
            }
            
            const data = await response.json();
            if (data.success) {
                // Reload page to reflect changes
                window.location.reload();
            } else {
                alert('Error: ' + (data.message || 'Unknown error'));
                checkbox.checked = false;
                checkbox.disabled = false;
            }
        } catch (error) {
            console.error('Complete error:', error);
            alert('Error: ' + error.message);
            checkbox.checked = false;
            checkbox.disabled = false;
        }
    }

    /**
     * Handles the delete task button click.
     * @param {Event} e - The click event.
     */
    async handleDeleteTask(e) {
        e.preventDefault();
        e.stopPropagation();

        const deleteBtn = this.elements.deleteBtn;
        if (!deleteBtn) return;

        if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/tasks/${this.taskId}`, {
                method: 'DELETE',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                alert('Error: ' + (data.message || 'Failed to delete task'));
                return;
            }

            const data = await response.json();
            if (data.success) {
                // Reload page to reflect changes
                window.location.reload();
            } else {
                alert('Error: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error: ' + error.message);
        }
    }

    /**
     * Handles the skip task button click.
     * @param {Event} e - The click event.
     */
    async handleSkipTask(e) {
        e.preventDefault();
        e.stopPropagation();

        const skipBtn = this.elements.skipBtn;
        if (!skipBtn) return;

        if (!confirm('Skip this task instance? The next recurring instance will be created.')) {
            return;
        }

        const originalText = skipBtn.textContent;
        skipBtn.disabled = true;
        skipBtn.textContent = 'Skipping...';

        try {
            const response = await fetch(`/tasks/${this.taskId}/skip`, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                alert('Error: ' + (data.message || 'Failed to skip task'));
                skipBtn.disabled = false;
                skipBtn.textContent = originalText;
                return;
            }

            const data = await response.json();
            if (data.success) {
                // Reload page to reflect changes
                window.location.reload();
            } else {
                alert('Error: ' + (data.message || 'Unknown error'));
                skipBtn.disabled = false;
                skipBtn.textContent = originalText;
            }
        } catch (error) {
            console.error('Skip error:', error);
            alert('Error: ' + error.message);
            skipBtn.disabled = false;
            skipBtn.textContent = originalText;
        }
    }

    /**
     * Handles the complete and log button click.
     * @param {Event} e - The click event.
     */
    async handleCompleteAndLog(e) {
        e.preventDefault();
        e.stopPropagation();

        const btn = this.elements.completeAndLogBtn;
        if (!btn) return;

        // Get the log form
        const logForm = this.elements.editMode?.querySelector('.task-log-form');
        if (!logForm) {
            alert('Error: Log form not found');
            return;
        }

        const formData = new FormData(logForm);
        const minutes = formData.get('minutes');
        const notes = formData.get('notes');

        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Completing...';

        try {
            // First, log the task
            const logResponse = await fetch(logForm.action, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': formData.get('_token'),
                    'Accept': 'application/json'
                },
                body: formData
            });

            if (!logResponse.ok) {
                const logData = await logResponse.json().catch(() => ({}));
                alert('Error logging task: ' + (logData.message || 'Failed to log task'));
                btn.disabled = false;
                btn.textContent = originalText;
                return;
            }

            // Then, complete the task
            const completeResponse = await fetch(`/tasks/${this.taskId}/complete`, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                    'Accept': 'application/json'
                }
            });

            if (!completeResponse.ok) {
                const completeData = await completeResponse.json().catch(() => ({}));
                alert('Error completing task: ' + (completeData.message || 'Failed to complete task'));
                btn.disabled = false;
                btn.textContent = originalText;
                return;
            }

            const completeData = await completeResponse.json();
            if (completeData.success) {
                // Clear the log form
                logForm.reset();
                // Reload page to reflect changes
                window.location.reload();
            } else {
                alert('Error: ' + (completeData.message || 'Unknown error'));
                btn.disabled = false;
                btn.textContent = originalText;
            }
        } catch (error) {
            console.error('Complete and log error:', error);
            alert('Error: ' + error.message);
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }

    /**
     * Handles the log form submission.
     * @param {Event} e - The submit event.
     */
    async handleLogSubmit(e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
        
        // Prevent double submission
        if (this.logSubmitting) {
            return;
        }
        this.logSubmitting = true;
        
        const form = e.target;
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : 'Log';
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging...';
        }
        
        try {
            const response = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': formData.get('_token'),
                    'Accept': 'application/json'
                },
                body: formData
            });
            
            // Check for redirect
            if (response.redirected) {
                console.error('Server returned redirect instead of JSON!');
                alert('Error: Server returned HTML instead of JSON. The log may have been saved. Please refresh the page.');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
                return;
            }
            
            // Try to parse as JSON
            let data;
            try {
                const text = await response.text();
                if (text) {
                    data = JSON.parse(text);
                } else {
                    data = {};
                }
            } catch (parseError) {
                console.error('Failed to parse response as JSON:', parseError);
                const contentType = response.headers.get('Content-Type') || '';
                if (!contentType.includes('application/json')) {
                    console.error('Response is not JSON! Content-Type:', contentType);
                    alert('Error: Server returned HTML instead of JSON. The log may have been saved. Please refresh the page.');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    }
                    return;
                }
                throw parseError;
            }
            
            if (!response.ok) {
                let errorMessage = 'Error logging task';
                if (response.status === 422 && data.errors) {
                    errorMessage = Object.values(data.errors).flat().join('\n');
                } else if (data.message) {
                    errorMessage = data.message;
                }
                alert('Error: ' + errorMessage);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
                return;
            }
            
            if (data.success) {
                // Clear the form
                form.reset();
                // Reset button state
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
                // Reset submission flag
                this.logSubmitting = false;
                alert('Task logged successfully!');
            } else {
                alert('Error: ' + (data.message || 'Unknown error'));
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
                // Reset submission flag
                this.logSubmitting = false;
            }
        } catch (error) {
            console.error('Log error:', error);
            alert('Error: ' + error.message);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
            // Reset submission flag
            this.logSubmitting = false;
        }
    }
}

// Initialize all task card editors on page load
document.addEventListener('DOMContentLoaded', function() {
    if (!window.taskCardEditors) {
        window.taskCardEditors = {};
    }
    
    // Find all task edit forms
    document.querySelectorAll('.task-edit-form-simple[data-task-id]').forEach(form => {
        const taskId = parseInt(form.dataset.taskId);
        if (taskId && !window.taskCardEditors[taskId]) {
            window.taskCardEditors[taskId] = new TaskCardEditor(taskId);
        }
    });
    
    // Also initialize for tasks with clickable task names
    document.querySelectorAll('.task-name-clickable[data-task-id]').forEach(taskName => {
        const taskId = parseInt(taskName.dataset.taskId);
        if (taskId && !window.taskCardEditors[taskId]) {
            window.taskCardEditors[taskId] = new TaskCardEditor(taskId);
        }
    });
});

