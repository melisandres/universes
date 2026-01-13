/**
 * InlineUniversesField - Manages inline editing for universe selection field
 * 
 * This class handles:
 * - Multiple universe selection with primary designation
 * - Dynamic add/remove of universe rows
 * - Display formatting (★ for primary, comma-separated list)
 * - Custom save logic for universe_ids array and primary_universe
 */
class InlineUniversesField {
    constructor(fieldId, config = {}) {
        this.fieldId = fieldId;
        this.taskId = config.taskId;
        this.config = config;
        
        // Cache elements
        this.elements = {
            viewElement: document.getElementById(`inline-view-${fieldId}`),
            editElement: document.getElementById(`inline-edit-${fieldId}`),
            inputElement: document.getElementById(`input-${fieldId}`),
            container: null,
            valueElement: null
        };
        
        if (this.elements.viewElement) {
            this.elements.valueElement = this.elements.viewElement.querySelector('.inline-field-value');
        }
        
        if (this.taskId) {
            this.elements.container = document.getElementById(`universes-container-${this.taskId}`);
        }
        
        // Get universe data from JSON script tag
        this.universeData = this.loadUniverseData();
        this.universeIndex = this.loadUniverseIndex();
        
        this.init();
    }
    
    init() {
        if (!this.elements.viewElement || !this.elements.editElement || !this.elements.inputElement) {
            console.warn(`InlineUniversesField: Missing elements for field ${this.fieldId}`);
            return;
        }
        
        if (!this.elements.container) {
            console.warn(`InlineUniversesField: Universes container not found for task ${this.taskId}`);
            return;
        }
        
        this.setupEditor();
        this.setupEventListeners();
        this.updateSelectOptions(); // Disable already-selected universes in initial selects
        this.updateDisplay();
        
        // Store the initial primary universe ID for comparison when saving
        this.initialPrimaryUniverseId = this.getCurrentPrimaryUniverseId();
    }
    
    /**
     * Load universe data from JSON script tag
     */
    loadUniverseData() {
        if (!this.taskId) return {};
        
        const dataEl = document.getElementById(`universes-data-${this.taskId}`);
        if (dataEl && dataEl.textContent.trim()) {
            try {
                return JSON.parse(dataEl.textContent.trim());
            } catch (e) {
                console.error(`Error parsing universe data for task ${this.taskId}:`, e);
                return {};
            }
        }
        return {};
    }
    
    /**
     * Load universe index from JSON script tag
     */
    loadUniverseIndex() {
        if (!this.taskId) return 0;
        
        const indexEl = document.getElementById(`universe-index-data-${this.taskId}`);
        if (indexEl) {
            return parseInt(indexEl.textContent.trim()) || 0;
        }
        return this.elements.container ? this.elements.container.querySelectorAll('.universe-item-row').length : 0;
    }
    
    /**
     * Setup InlineFieldEditor with custom handlers
     */
    setupEditor() {
        if (!window.inlineFieldEditors) {
            window.inlineFieldEditors = {};
        }
        
        window.inlineFieldEditors[this.fieldId] = new InlineFieldEditor(this.fieldId, {
            formatValue: (value) => {
                // This won't be called for complex fields, but we need it for the interface
                return value || 'None';
            },
            onSave: (newValue, oldValue, editor) => this.handleSave(newValue, oldValue, editor)
        });
    }
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Update display when entering edit mode
        const editBtn = document.querySelector(`#inline-view-${this.fieldId} .inline-field-edit-btn`);
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                // Update the initial primary universe ID when entering edit mode
                // This ensures we capture the state at the moment edit mode opens
                this.initialPrimaryUniverseId = this.getCurrentPrimaryUniverseId();
                // Small delay to ensure edit mode is visible
                setTimeout(() => this.updateDisplay(), 10);
            });
        }
        
        // Update display when universes change (add/remove/select change)
        if (this.elements.container) {
            // Use event delegation for dynamic content
            this.elements.container.addEventListener('change', (e) => {
                if (e.target.matches('select[name="universe_ids[]"]')) {
                    // Check for duplicate universe selection
                    this.validateUniverseSelection(e.target);
                    // Update options in all selects to disable already-selected universes
                    this.updateSelectOptions();
                    // Only update if we're in edit mode
                    const editElement = document.getElementById(`inline-edit-${this.fieldId}`);
                    if (editElement && !editElement.classList.contains('d-none')) {
                        this.updateDisplay();
                    }
                } else if (e.target.matches('input[name="primary_universe"]')) {
                    // Only update if we're in edit mode
                    const editElement = document.getElementById(`inline-edit-${this.fieldId}`);
                    if (editElement && !editElement.classList.contains('d-none')) {
                        this.updateDisplay();
                    }
                }
            });
            
            // Handle remove universe button
            this.elements.container.addEventListener('click', (e) => {
                if (e.target.matches('.remove-universe-btn') || e.target.closest('.remove-universe-btn')) {
                    e.preventDefault();
                    e.stopPropagation(); // Prevent TaskCardEditor from also handling this
                    const btn = e.target.matches('.remove-universe-btn') ? e.target : e.target.closest('.remove-universe-btn');
                    this.removeUniverseRow(btn);
                    // Wait a bit for the row to be removed
                    setTimeout(() => this.updateDisplay(), 100);
                }
            });
        }
        
        // Use event delegation for add universe button - attach to document
        // This ensures it works even if the edit element is hidden
        console.log('InlineUniversesField: Setting up event delegation for add button on', this.fieldId, {
            editElement: !!this.elements.editElement,
            taskId: this.taskId
        });
        
        // Store references for the event handler
        const fieldId = this.fieldId;
        const taskId = this.taskId;
        const instance = this;
        
        // Listen for click events on the document
        const clickHandler = function(e) {
            // Log ALL clicks to see what's happening
            const target = e.target;
            const hasAddUniverseClass = target.classList?.contains('add-universe-btn') || 
                                       target.closest('.add-universe-btn');
            
            if (hasAddUniverseClass || target.textContent?.includes('Add Universe')) {
                console.log('InlineUniversesField: Potential add universe button click detected', {
                    fieldId: fieldId,
                    taskId: taskId,
                    target: target,
                    targetClass: target.className,
                    targetText: target.textContent,
                    closestBtn: target.closest('.add-universe-btn'),
                    closestBtnClass: target.closest('.add-universe-btn')?.className,
                    closestBtnDataset: target.closest('.add-universe-btn')?.dataset
                });
            }
            
            // Check if the clicked element is the add universe button
            const addBtn = target.closest('.add-universe-btn') || 
                          (target.classList?.contains('add-universe-btn') ? target : null);
            
            if (addBtn) {
                console.log('InlineUniversesField: Click detected on add universe button', {
                    fieldId: fieldId,
                    taskId: taskId,
                    clickedTaskId: addBtn.dataset?.taskId,
                    clickedTaskIdType: typeof addBtn.dataset?.taskId,
                    taskIdType: typeof taskId,
                    target: target,
                    addBtn: addBtn,
                    addBtnClasses: addBtn.className
                });
                
                // Check if it's for this task - compare as strings to avoid type issues
                const clickedTaskId = addBtn.dataset?.taskId;
                if (clickedTaskId && clickedTaskId.toString() === taskId.toString()) {
                    console.log('InlineUniversesField: Matched add button for task', taskId);
                    
                    // Verify it's within our field's edit element
                    const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
                    console.log('InlineUniversesField: Field element check', {
                        fieldElement: !!fieldElement,
                        addBtn: !!addBtn,
                        contains: fieldElement?.contains(addBtn)
                    });
                    
                    if (fieldElement && fieldElement.contains(addBtn)) {
                        console.log('InlineUniversesField: Field element contains button, handling click');
                        e.preventDefault();
                        e.stopPropagation(); // Prevent TaskCardEditor from also handling this
                        console.log('InlineUniversesField: Add universe button clicked via delegation', fieldId);
                        instance.addUniverseRow();
                        // Wait a bit for the new row to be added
                        setTimeout(() => instance.updateDisplay(), 100);
                    } else {
                        console.log('InlineUniversesField: Field element does not contain button', {
                            fieldElement: !!fieldElement,
                            addBtn: !!addBtn,
                            fieldElementId: fieldElement?.id,
                            addBtnParent: addBtn.parentElement?.className
                        });
                    }
                } else {
                    console.log('InlineUniversesField: Task ID mismatch', {
                        clickedTaskId: clickedTaskId,
                        expectedTaskId: taskId,
                        match: clickedTaskId?.toString() === taskId.toString()
                    });
                }
            }
        };
        
        // Attach to document with capture phase (fires BEFORE bubble phase)
        document.addEventListener('click', clickHandler, true);
        console.log('InlineUniversesField: Document click listener attached for', fieldId, {
            handler: clickHandler,
            taskId: taskId
        });
        
        // Test: Add a simple click listener to verify document listeners work
        const testHandler = function(e) {
            if (e.target.closest('.add-universe-btn')) {
                console.log('TEST: Document click handler fired for add-universe-btn');
            }
        };
        document.addEventListener('click', testHandler, true);
        
        // Store handler for potential cleanup
        this._addButtonClickHandler = clickHandler;
        
        // Also handle remove universe buttons using event delegation
        if (this.elements.container) {
            this._containerClickHandler = (e) => {
                const removeBtn = e.target.closest('.remove-universe-btn[data-task-id]');
                if (removeBtn && removeBtn.dataset.taskId === this.taskId.toString()) {
                    e.preventDefault();
                    e.stopPropagation();
                    Logger.debug('InlineUniversesField: Remove universe button clicked via delegation');
                    const row = removeBtn.closest('.universe-item-row');
                    if (row) {
                        row.remove();
                        this.updateSelectOptions(); // Update disabled options in remaining selects
                        this.updateDisplay();
                    }
                }
            };
            this.elements.container.addEventListener('click', this._containerClickHandler);
        }
    }
    
    /**
     * Update the display value from form inputs
     */
    updateDisplay() {
        if (!this.elements.container || !this.elements.valueElement) {
            return;
        }
        
        const rows = this.elements.container.querySelectorAll('.universe-item-row');
        const universeNames = [];
        
        // Find which row contains the checked primary radio
        const checkedPrimaryRadio = this.elements.container.querySelector('input[name="primary_universe"]:checked');
        const primaryRow = checkedPrimaryRadio ? checkedPrimaryRadio.closest('.universe-item-row') : null;
        
        rows.forEach((row) => {
            const select = row.querySelector('select[name="universe_ids[]"]');
            if (!select) return;
            
            if (select.value && select.value !== '') {
                const selectedOption = select.options[select.selectedIndex];
                const name = selectedOption ? selectedOption.text.trim() : '';
                if (name && name !== '— select universe —') {
                    // Check if this row contains the checked primary radio
                    const isPrimary = (row === primaryRow);
                    universeNames.push(isPrimary ? '★ ' + name : name);
                }
            }
        });
        
        const displayText = universeNames.length > 0 ? universeNames.join(', ') : 'None';
        this.elements.valueElement.textContent = displayText;
    }
    
    /**
     * Add a new universe row
     */
    addUniverseRow() {
        if (!this.elements.container) return;
        
        const newRow = document.createElement('div');
        newRow.className = 'universe-item-row inline-universe-item-row';
        newRow.setAttribute('data-index', this.universeIndex);
        
        // Get currently selected universe IDs (to disable them in the new select)
        const selectedUniverseIds = this.getSelectedUniverseIds();
        
        // Build select options, disabling already-selected universes
        let optionsHtml = '<option value="">— select universe —</option>';
        for (const [id, name] of Object.entries(this.universeData)) {
            const isDisabled = selectedUniverseIds.includes(id);
            optionsHtml += `<option value="${id}" ${isDisabled ? 'disabled' : ''}>${name}</option>`;
        }
        
        // Create select
        const select = document.createElement('select');
        select.name = 'universe_ids[]';
        select.className = 'universe-select inline-universe-select';
        select.required = true;
        select.innerHTML = optionsHtml;
        
        // Create label with radio
        const label = document.createElement('label');
        label.className = 'inline-universe-primary-label';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'primary_universe';
        radio.value = this.universeIndex.toString();
        
        label.appendChild(radio);
        label.appendChild(document.createTextNode(' Primary'));
        
        // Create remove button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-universe-btn inline-universe-remove-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.dataset.taskId = this.taskId;
        
        // Append all elements
        newRow.appendChild(select);
        newRow.appendChild(label);
        newRow.appendChild(removeBtn);
        
        this.elements.container.appendChild(newRow);
        this.universeIndex++;
        
        // Update all select options after adding new row
        this.updateSelectOptions();
    }
    
    /**
     * Remove a universe row
     */
    removeUniverseRow(btn) {
        if (!this.elements.container) return;
        
        const row = btn.closest('.universe-item-row');
        if (!row) return;
        
        if (this.elements.container.children.length > 1) {
            row.remove();
            // Update select options after removal (re-enable the removed universe)
            this.updateSelectOptions();
        } else {
            alert('At least one universe is required');
        }
    }
    
    /**
     * Get array of currently selected universe IDs (excluding empty selections)
     */
    getSelectedUniverseIds() {
        if (!this.elements.container) return [];
        
        const selectedIds = [];
        const rows = this.elements.container.querySelectorAll('.universe-item-row');
        
        rows.forEach((row) => {
            const select = row.querySelector('select[name="universe_ids[]"]');
            if (select && select.value && select.value !== '') {
                selectedIds.push(select.value);
            }
        });
        
        return selectedIds;
    }
    
    /**
     * Validate that a universe selection is not a duplicate
     */
    validateUniverseSelection(selectElement) {
        if (!selectElement || !selectElement.value || selectElement.value === '') {
            return; // Empty selection is fine
        }
        
        const selectedId = selectElement.value;
        const rows = this.elements.container.querySelectorAll('.universe-item-row');
        let duplicateFound = false;
        
        rows.forEach((row) => {
            const otherSelect = row.querySelector('select[name="universe_ids[]"]');
            if (otherSelect && otherSelect !== selectElement && otherSelect.value === selectedId) {
                duplicateFound = true;
            }
        });
        
        if (duplicateFound) {
            alert('This universe is already selected. Please choose a different universe.');
            selectElement.value = ''; // Clear the duplicate selection
        }
    }
    
    /**
     * Update all select options to disable already-selected universes
     */
    updateSelectOptions() {
        if (!this.elements.container) return;
        
        const selectedUniverseIds = this.getSelectedUniverseIds();
        const rows = this.elements.container.querySelectorAll('.universe-item-row');
        
        rows.forEach((row) => {
            const select = row.querySelector('select[name="universe_ids[]"]');
            if (!select) return;
            
            const currentValue = select.value;
            
            // Update each option
            Array.from(select.options).forEach((option) => {
                if (option.value === '' || option.value === currentValue) {
                    // Keep placeholder and current selection enabled
                    option.disabled = false;
                } else {
                    // Disable if already selected in another row
                    option.disabled = selectedUniverseIds.includes(option.value);
                }
            });
        });
    }
    
    /**
     * Handle save - collects universe IDs and primary index, then saves via AJAX
     */
    async handleSave(newValue, oldValue, editor) {
        console.log('🔵 InlineUniversesField.handleSave called', {
            fieldId: this.fieldId,
            taskId: this.taskId,
            newValue: newValue,
            oldValue: oldValue,
            hasEditor: !!editor,
            editorFieldId: editor?.fieldId
        });
        if (!this.elements.container) return false;
        
        // Collect all universe IDs and primary index
        const rows = this.elements.container.querySelectorAll('.universe-item-row');
        const universeIds = [];
        let primaryIndex = 0;
        
        rows.forEach((row, index) => {
            const select = row.querySelector('select[name="universe_ids[]"]');
            const primaryRadio = row.querySelector(`input[name="primary_universe"][value="${index}"]`);
            
            if (select && select.value && select.value !== '') {
                universeIds.push(select.value);
                if (primaryRadio && primaryRadio.checked) {
                    primaryIndex = universeIds.length - 1;
                }
            }
        });
        
        if (universeIds.length === 0) {
            alert('At least one universe is required');
            return false;
        }
        
        // Get the old primary universe ID (use stored initial value if available, otherwise current form state)
        const oldPrimaryUniverseId = this.initialPrimaryUniverseId || this.getCurrentPrimaryUniverseId();
        const newPrimaryUniverseId = universeIds[primaryIndex];
        
        // Save universes - we need to send both universe_ids and primary_universe
        const form = document.querySelector(`.task-edit-form-simple[data-task-id="${this.taskId}"]`);
        if (!form) return false;
        
        const formData = new FormData(form);
        formData.delete('universe_ids[]');
        formData.delete('primary_universe');
        
        universeIds.forEach(id => {
            formData.append('universe_ids[]', id);
        });
        formData.append('primary_universe', primaryIndex);
        
        if (!formData.has('_method')) {
            formData.append('_method', 'PUT');
        }
        
        const csrfToken = DOMUtils.getCSRFToken();
        if (!csrfToken) return false;
        
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
                defaultMessage: 'Error updating universes'
            });
            
            if (!result.success) {
                return false;
            }
            
            if (!result.data.success) {
                ErrorHandler.handleError(new Error('Universe update failed'), {
                    context: 'updating universes',
                    showAlert: true
                });
                return false;
            }
            
            // Update display after successful save
            setTimeout(() => {
                this.updateDisplay();
            }, 50);
            
            // If primary universe changed, move the task card to the new universe
            if (oldPrimaryUniverseId && newPrimaryUniverseId && oldPrimaryUniverseId !== newPrimaryUniverseId) {
                this.moveTaskCardToNewUniverse(newPrimaryUniverseId);
            }
            
            // Update the stored initial value for future comparisons
            this.initialPrimaryUniverseId = newPrimaryUniverseId;
            
            return true;
        } catch (error) {
            ErrorHandler.handleFetchError(error, {
                defaultMessage: 'Error updating universes'
            });
            return false;
        }
    }
    
    /**
     * Get the current primary universe ID from the form's current state
     * This reads the currently selected primary universe before any changes
     */
    getCurrentPrimaryUniverseId() {
        if (!this.elements.container) return null;
        
        // Find the currently checked primary radio button
        const checkedPrimaryRadio = this.elements.container.querySelector('input[name="primary_universe"]:checked');
        if (!checkedPrimaryRadio) return null;
        
        // Get the row containing this radio button
        const primaryRow = checkedPrimaryRadio.closest('.universe-item-row');
        if (!primaryRow) return null;
        
        // Get the select in this row
        const select = primaryRow.querySelector('select[name="universe_ids[]"]');
        if (!select || !select.value || select.value === '') return null;
        
        return select.value;
    }
    
    /**
     * Move the task card to the new primary universe's task list
     */
    moveTaskCardToNewUniverse(newUniverseId) {
        // Find the task card element by traversing up from the form
        const form = document.querySelector(`.task-edit-form-simple[data-task-id="${this.taskId}"]`);
        if (!form) {
            console.warn(`Task form not found for task ${this.taskId}`);
            return;
        }
        
        // Traverse up to find the task-item
        const taskCard = form.closest('.task-item');
        if (!taskCard) {
            console.warn(`Task card not found for task ${this.taskId}`);
            return;
        }
        
        // Find the new universe's task list
        const newUniverseTasksList = this.findUniverseTasksList(newUniverseId);
        if (!newUniverseTasksList) {
            console.warn(`Tasks list not found for universe ${newUniverseId}`);
            // If the universe doesn't exist in the DOM, we might need to reload or handle differently
            // For now, just log a warning
            return;
        }
        
        // Find the old tasks list (where the card currently is)
        const oldTasksList = taskCard.closest('.tasks-list');
        if (!oldTasksList) {
            console.warn(`Current tasks list not found for task ${this.taskId}`);
            return;
        }
        
        // Don't move if it's already in the right place
        if (oldTasksList === newUniverseTasksList) {
            return;
        }
        
        // Find the add-task-card in the new list (it should be first)
        const addTaskCard = newUniverseTasksList.querySelector('.add-task-card');
        
        // Move the task card to the new list
        // Insert after the add-task-card, or at the beginning if no add-task-card
        if (addTaskCard && addTaskCard.nextSibling) {
            newUniverseTasksList.insertBefore(taskCard, addTaskCard.nextSibling);
        } else if (addTaskCard) {
            newUniverseTasksList.appendChild(taskCard);
        } else {
            // No add-task-card, insert at the beginning
            newUniverseTasksList.insertBefore(taskCard, newUniverseTasksList.firstChild);
        }
        
        // Add a smooth transition effect
        taskCard.style.opacity = '0';
        taskCard.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            taskCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            taskCard.style.opacity = '1';
            taskCard.style.transform = 'translateY(0)';
        }, 10);
        
        // Scroll to the new position smoothly
        setTimeout(() => {
            taskCard.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
        }, 50);
        
        // Clean up transition styles after animation
        setTimeout(() => {
            taskCard.style.transition = '';
            taskCard.style.opacity = '';
            taskCard.style.transform = '';
        }, 350);
        
        Logger.debug(`Task card moved from universe ${oldTasksList.dataset?.universeId || 'unknown'} to universe ${newUniverseId}`);
    }
    
    /**
     * Find the tasks list for a given universe ID
     */
    findUniverseTasksList(universeId) {
        // Method 1: Look for add-task-card with data-universe-id matching
        const addTaskCard = document.querySelector(`.add-task-card[data-universe-id="${universeId}"]`);
        if (addTaskCard) {
            const tasksList = addTaskCard.closest('.tasks-list');
            if (tasksList) return tasksList;
        }
        
        // Method 2: Look for universe-view or universe-edit with data-universe-id
        const universeView = document.querySelector(`#universe-view-${universeId}`);
        if (universeView) {
            // Find the tasks-list that's a sibling or nearby
            const universeItem = universeView.closest('li');
            if (universeItem) {
                const tasksList = universeItem.querySelector('.tasks-list');
                if (tasksList) return tasksList;
            }
        }
        
        // Method 3: Search all tasks-lists and check their context
        const allTasksLists = document.querySelectorAll('.tasks-list');
        for (const tasksList of allTasksLists) {
            const addCard = tasksList.querySelector('.add-task-card[data-universe-id]');
            if (addCard && addCard.dataset.universeId === universeId) {
                return tasksList;
            }
        }
        
        return null;
    }

    /**
     * Cleanup method to prevent memory leaks
     * Removes event listeners and clears references
     */
    destroy() {
        // Remove document-level event delegation handlers
        if (this._addButtonClickHandler) {
            document.removeEventListener('click', this._addButtonClickHandler, true);
            this._addButtonClickHandler = null;
        }

        if (this._testHandler) {
            document.removeEventListener('click', this._testHandler, true);
            this._testHandler = null;
        }

        // Remove container listeners
        if (this.elements.container) {
            if (this._containerChangeHandler) {
                this.elements.container.removeEventListener('change', this._containerChangeHandler);
                this._containerChangeHandler = null;
            }
            if (this._containerClickHandler) {
                this.elements.container.removeEventListener('click', this._containerClickHandler);
                this._containerClickHandler = null;
            }
        }

        // Remove edit button listener
        const editBtn = document.querySelector(`#inline-view-${this.fieldId} .inline-field-edit-btn`);
        if (editBtn && this._editBtnClickHandler) {
            editBtn.removeEventListener('click', this._editBtnClickHandler);
            this._editBtnClickHandler = null;
        }

        // Clean up InlineFieldEditor if it exists
        if (window.inlineFieldEditors && window.inlineFieldEditors[this.fieldId]) {
            const editor = window.inlineFieldEditors[this.fieldId];
            if (editor && typeof editor.destroy === 'function') {
                editor.destroy();
            }
        }

        // Clear element references
        this.elements = null;
        this.config = null;

        Logger.debug('InlineUniversesField: Cleaned up', this.fieldId);
    }
}

// Expose to window for global access
window.InlineUniversesField = InlineUniversesField;
