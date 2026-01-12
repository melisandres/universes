/**
 * AddTaskCardManager - OOP class for managing "+ add task" card functionality
 * 
 * When the "+ add task" card is clicked:
 * 1. Creates a new task via AJAX with default values
 * 2. Inserts the new task card HTML after the "+ add task" card
 * 3. Initializes all field classes and TaskCardEditor for the new task
 * 4. Expands the new task into edit mode
 */
class AddTaskCardManager {
    constructor() {
        this.init();
    }
    
    /**
     * Initialize event listeners for add task cards
     */
    init() {
        // Use event delegation to handle clicks on add task cards
        document.addEventListener('click', (e) => {
            const addTaskCard = e.target.closest('.add-task-card');
            if (!addTaskCard) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const universeId = parseInt(addTaskCard.dataset.universeId, 10);
            if (!universeId) {
                console.error('AddTaskCardManager: Add task card missing universe-id attribute');
                return;
            }
            
            this.handleAddTaskClick(addTaskCard, universeId);
        });
    }
    
    /**
     * Handle click on "+ add task" card
     * @param {HTMLElement} addTaskCard - The add task card element
     * @param {number} universeId - The universe ID to create the task in
     */
    async handleAddTaskClick(addTaskCard, universeId) {
        // Disable the card during creation
        addTaskCard.style.pointerEvents = 'none';
        addTaskCard.style.opacity = '0.6';
        
        const originalText = addTaskCard.querySelector('.add-task-name')?.textContent || 'add task';
        const nameElement = addTaskCard.querySelector('.add-task-name');
        if (nameElement) {
            nameElement.textContent = 'Creating...';
        }
        
        try {
            // Create the task
            const taskData = await this.createTask(universeId);
            
            // Insert the task card HTML
            const newTaskCard = this.insertTaskCard(addTaskCard, taskData.html);
            
            // Extract task ID
            const taskId = this.extractTaskId(newTaskCard);
            if (!taskId) {
                throw new Error('Could not find task ID in new task card');
            }
            
            // Initialize all field classes and TaskCardEditor
            await this.initializeTaskCard(newTaskCard, taskId);
            
        } catch (error) {
            console.error('AddTaskCardManager: Error creating task:', error);
            alert('Error creating task: ' + error.message);
        } finally {
            // Re-enable the card
            addTaskCard.style.pointerEvents = '';
            addTaskCard.style.opacity = '';
            if (nameElement) {
                nameElement.textContent = originalText;
            }
        }
    }
    
    /**
     * Create a new task via AJAX
     * @param {number} universeId - The universe ID
     * @returns {Promise<Object>} Response data with task and HTML
     */
    async createTask(universeId) {
        const formData = new FormData();
        formData.append('name', 'new task');
        formData.append('universe_ids[]', universeId.toString());
        formData.append('primary_universe', '0');
        formData.append('status', 'open');
        formData.append('referer', window.location.href);
        formData.append('_token', document.querySelector('meta[name="csrf-token"]')?.content || '');
        
        const response = await fetch('/tasks', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': formData.get('_token')
            },
            body: formData
        });
        
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'Failed to create task');
        }
        
        const data = await response.json();
        
        if (!data.success || !data.html) {
            throw new Error(data.message || 'Invalid response from server');
        }
        
        return data;
    }
    
    /**
     * Insert the task card HTML into the DOM
     * @param {HTMLElement} addTaskCard - The add task card element
     * @param {string} html - The HTML string for the new task card
     * @returns {HTMLElement} The inserted task card element
     */
    insertTaskCard(addTaskCard, html) {
        // Create a temporary container to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html.trim();
        const newTaskCard = tempDiv.firstElementChild;
        
        if (!newTaskCard) {
            throw new Error('Invalid HTML returned from server');
        }
        
        // Insert the new task card after the add task card
        addTaskCard.parentNode.insertBefore(newTaskCard, addTaskCard.nextSibling);
        
        return newTaskCard;
    }
    
    /**
     * Extract task ID from the task card element
     * @param {HTMLElement} taskCard - The task card element
     * @returns {number|null} The task ID or null if not found
     */
    extractTaskId(taskCard) {
        // Try multiple selectors to find the task ID
        // The most reliable is the form, as it's always present in edit mode
        const taskEditForm = taskCard.querySelector('.task-edit-form-simple[data-task-id]');
        const taskEditMode = taskCard.querySelector('.task-edit-mode[data-task-id]');
        const taskNameClickable = taskCard.querySelector('.task-name-clickable[data-task-id]');
        const addUniverseBtn = taskCard.querySelector('.add-universe-btn[data-task-id]');
        
        // Try form first (most reliable)
        if (taskEditForm && taskEditForm.dataset.taskId) {
            const taskId = parseInt(taskEditForm.dataset.taskId, 10);
            console.log('AddTaskCardManager: Extracted task ID from form', taskId);
            return taskId;
        }
        
        // Try edit mode
        if (taskEditMode && taskEditMode.dataset.taskId) {
            const taskId = parseInt(taskEditMode.dataset.taskId, 10);
            console.log('AddTaskCardManager: Extracted task ID from edit mode', taskId);
            return taskId;
        }
        
        // Try task name
        if (taskNameClickable && taskNameClickable.dataset.taskId) {
            const taskId = parseInt(taskNameClickable.dataset.taskId, 10);
            console.log('AddTaskCardManager: Extracted task ID from task name', taskId);
            return taskId;
        }
        
        // Try add universe button as fallback
        if (addUniverseBtn && addUniverseBtn.dataset.taskId) {
            const taskId = parseInt(addUniverseBtn.dataset.taskId, 10);
            console.log('AddTaskCardManager: Extracted task ID from add universe button', taskId);
            return taskId;
        }
        
        console.error('AddTaskCardManager: Could not extract task ID from task card', taskCard);
        return null;
    }
    
    /**
     * Initialize all field classes and TaskCardEditor for a new task card
     * @param {HTMLElement} taskCard - The task card element
     * @param {number} taskId - The task ID
     */
    async initializeTaskCard(taskCard, taskId) {
        // Wait a bit for the HTML to be fully inserted into the DOM
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Initialize field-specific classes (must be before TaskCardEditor)
        // This returns the actual task ID from the HTML (in case there's a mismatch)
        const actualTaskId = this.initializeFieldClasses(taskCard, taskId);
        
        // Wait a bit for field classes to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Wait for TaskCardEditor to be available (with timeout)
        const TaskCardEditorClass = await this.waitForTaskCardEditor();
        if (!TaskCardEditorClass) {
            console.error('AddTaskCardManager: TaskCardEditor not available after waiting');
            return;
        }
        
        // Initialize TaskCardEditor with the actual task ID
        this.initializeTaskCardEditor(actualTaskId, TaskCardEditorClass);
        
        // Set skip button visibility (normally done in inline script)
        this.setSkipButtonVisibility(actualTaskId);
        
        // Expand the new task into edit mode
        this.expandTaskCard(actualTaskId);
        
        // Ensure all inline fields start in view mode (not edit mode)
        // This must be AFTER expanding the task card, because expansion might change field states
        // Individual fields should start collapsed even though the task card is expanded
        setTimeout(() => {
            this.ensureFieldsInViewMode(taskCard, actualTaskId);
            
            // Set up custom save handlers AFTER fields are initialized and in view mode
            // This ensures the editors are fully ready
            // Use TaskFieldInitializer if available, otherwise use our own method
            if (window.TaskFieldInitializer) {
                window.TaskFieldInitializer.setupSaveHandlers(actualTaskId);
            } else {
                this.setupSaveHandlers(actualTaskId);
            }
            
            // Open and focus the name field for immediate editing
            this.openAndFocusNameField(actualTaskId);
        }, 150);
    }
    
    /**
     * Open and focus the name field for a new task
     * @param {number} taskId - The task ID
     */
    openAndFocusNameField(taskId) {
        const nameFieldId = 'task-name-' + taskId;
        const nameEditor = window.inlineFieldEditors[nameFieldId];
        
        if (nameEditor) {
            // Enter edit mode
            nameEditor.enterEditMode();
            
            // Focus the input
            if (nameEditor.inputElement) {
                setTimeout(() => {
                    nameEditor.inputElement.focus();
                    nameEditor.inputElement.select();
                }, 50);
            }
        }
    }
    
    /**
     * Ensure all inline fields are in view mode (edit elements hidden)
     * @param {HTMLElement} taskCard - The task card element
     * @param {number} taskId - The task ID
     */
    ensureFieldsInViewMode(taskCard, taskId) {
        // Find all inline field edit elements and ensure they're hidden
        // EXCEPT the name field, which we want to open
        const editElements = taskCard.querySelectorAll('.inline-field-edit');
        const nameFieldEditId = `inline-edit-task-name-${taskId}`;
        
        editElements.forEach((editEl) => {
            // Skip the name field - we'll open it separately
            if (editEl.id === nameFieldEditId) {
                return;
            }
            
            // Hide all other edit elements
            if (!editEl.classList.contains('d-none')) {
                editEl.classList.add('d-none');
            }
        });
        
        // Ensure value elements are visible (except name field value, which will be hidden when we open it)
        const valueElements = taskCard.querySelectorAll('.inline-field-value');
        const nameFieldViewId = `inline-view-task-name-${taskId}`;
        
        valueElements.forEach((valueEl) => {
            // Skip the name field value - it will be hidden when we open the field
            if (valueEl.closest(`#${nameFieldViewId}`)) {
                return;
            }
            
            // Show all other value elements
            if (valueEl.style.display === 'none') {
                valueEl.style.display = '';
            }
        });
    }
    
    /**
     * Wait for TaskCardEditor class to be available
     * @param {number} maxWait - Maximum time to wait in milliseconds
     * @returns {Promise<Function|null>} The TaskCardEditor class or null
     */
    async waitForTaskCardEditor(maxWait = 2000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            // Check both window and global scope
            const TaskCardEditorClass = window.TaskCardEditor || (typeof TaskCardEditor !== 'undefined' ? TaskCardEditor : null);
            
            if (TaskCardEditorClass) {
                return TaskCardEditorClass;
            }
            
            // Wait 50ms before checking again
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        console.error('AddTaskCardManager: TaskCardEditor not found after waiting', maxWait, 'ms');
        return null;
    }
    
    /**
     * Initialize all field-specific classes
     * @param {HTMLElement} taskCard - The task card element
     * @param {number} taskId - The task ID
     */
    initializeFieldClasses(taskCard, taskId) {
        console.log('AddTaskCardManager: Initializing field classes', { 
            taskCard: taskCard, 
            extractedTaskId: taskId
        });
        
        // Get the task ID directly from the form (most reliable source)
        const taskEditForm = taskCard.querySelector('.task-edit-form-simple[data-task-id]');
        const taskIdFromForm = taskEditForm?.dataset?.taskId;
        
        // Use the task ID from the form if available (most reliable), otherwise use extracted
        const actualTaskId = taskIdFromForm ? parseInt(taskIdFromForm, 10) : taskId;
        
        if (actualTaskId !== taskId) {
            console.warn('AddTaskCardManager: Task ID mismatch, using form task ID', { 
                extracted: taskId, 
                form: taskIdFromForm,
                using: actualTaskId
            });
        } else {
            console.log('AddTaskCardManager: Task ID verified', { taskId: actualTaskId });
        }
        
        // Use TaskFieldInitializer to initialize all field classes
        // This ensures consistent initialization for both page load and dynamically added content
        // TaskFieldInitializer now handles both complex fields AND simple fields (name/description)
        if (window.TaskFieldInitializer) {
            console.log('AddTaskCardManager: Using TaskFieldInitializer for task', actualTaskId);
            window.TaskFieldInitializer.initializeTaskFields(actualTaskId, taskCard);
        } else {
            console.warn('AddTaskCardManager: TaskFieldInitializer not available, falling back to manual initialization');
            // Fallback to manual initialization if TaskFieldInitializer isn't loaded
            this.initializeFieldClassesManually(taskCard, actualTaskId);
            
            // Also initialize simple fields manually if TaskFieldInitializer isn't available
            const InlineFieldEditorClass = window.InlineFieldEditor || (typeof InlineFieldEditor !== 'undefined' ? InlineFieldEditor : null);
            
            const nameFieldId = 'task-name-' + actualTaskId;
            const nameField = taskCard.querySelector(`[data-field-id="${nameFieldId}"]`);
            if (nameField && InlineFieldEditorClass && !window.inlineFieldEditors?.[nameFieldId]) {
                try {
                    window.inlineFieldEditors[nameFieldId] = new InlineFieldEditorClass(nameFieldId);
                } catch (error) {
                    console.error('AddTaskCardManager: Error initializing InlineFieldEditor for name', error);
                }
            }
            
            const descFieldId = 'task-description-' + actualTaskId;
            const descField = taskCard.querySelector(`[data-field-id="${descFieldId}"]`);
            if (descField && InlineFieldEditorClass && !window.inlineFieldEditors?.[descFieldId]) {
                try {
                    window.inlineFieldEditors[descFieldId] = new InlineFieldEditorClass(descFieldId);
                } catch (error) {
                    console.error('AddTaskCardManager: Error initializing InlineFieldEditor for description', error);
                }
            }
        }
        
        // Return the actual task ID used
        return actualTaskId;
    }
    
    /**
     * Manual initialization fallback (if TaskFieldInitializer not available)
     * @private
     */
    initializeFieldClassesManually(taskCard, taskId) {
        const config = { taskId: taskId };
        
        // Initialize InlineUniversesField
        const universesFieldId = 'universes-' + taskId;
        const universesField = taskCard.querySelector(`[data-field-id="${universesFieldId}"]`);
        if (universesField && window.InlineUniversesField && !window.inlineFieldEditors?.[universesFieldId]) {
            new window.InlineUniversesField(universesFieldId, config);
        }
        
        // Initialize InlineDeadlineField
        const deadlineFieldId = 'deadline-' + taskId;
        const deadlineField = taskCard.querySelector(`[data-field-id="${deadlineFieldId}"]`);
        if (deadlineField && window.InlineDeadlineField && !window.inlineFieldEditors?.[deadlineFieldId]) {
            new window.InlineDeadlineField(deadlineFieldId, config);
        }
        
        // Initialize InlineEstimatedTimeField
        const estimatedTimeFieldId = 'estimated-time-' + taskId;
        const estimatedTimeField = taskCard.querySelector(`[data-field-id="${estimatedTimeFieldId}"]`);
        if (estimatedTimeField && window.InlineEstimatedTimeField && !window.inlineFieldEditors?.[estimatedTimeFieldId]) {
            new window.InlineEstimatedTimeField(estimatedTimeFieldId, config);
        }
        
        // Initialize InlineRecurringTaskField
        const recurringTaskFieldId = 'recurring-task-' + taskId;
        const recurringTaskField = taskCard.querySelector(`[data-field-id="${recurringTaskFieldId}"]`);
        if (recurringTaskField && window.InlineRecurringTaskField && !window.inlineFieldEditors?.[recurringTaskFieldId]) {
            new window.InlineRecurringTaskField(recurringTaskFieldId, config);
        }
        
        // Initialize InlineLogTimeField (for the log form)
        const logTimeField = taskCard.querySelector('.task-log-form [data-field-id^="log-time-"]');
        if (logTimeField && window.InlineLogTimeField) {
            const logTimeFieldId = logTimeField.dataset.fieldId;
            if (logTimeFieldId && !window.inlineFieldEditors?.[logTimeFieldId]) {
                new window.InlineLogTimeField(logTimeFieldId, config);
            }
        }
    }
    
    /**
     * Initialize TaskCardEditor for the new task
     * @param {number} taskId - The task ID
     * @param {Function} TaskCardEditorClass - The TaskCardEditor class
     */
    initializeTaskCardEditor(taskId, TaskCardEditorClass) {
        if (!TaskCardEditorClass) {
            console.error('AddTaskCardManager: TaskCardEditor class not provided');
            return;
        }
        
        if (window.taskCardEditors && window.taskCardEditors[taskId]) {
            console.warn('AddTaskCardManager: TaskCardEditor already exists for task', taskId);
            return;
        }
        
        console.log('AddTaskCardManager: Initializing TaskCardEditor', taskId);
        
        // Initialize TaskCardEditor
        if (!window.taskCardEditors) {
            window.taskCardEditors = {};
        }
        window.taskCardEditors[taskId] = new TaskCardEditorClass(taskId);
    }
    
    /**
     * Set up custom save handlers for name and description fields
     * @param {number} taskId - The task ID
     */
    setupSaveHandlers(taskId) {
        console.log('AddTaskCardManager: Setting up save handlers for task', taskId);
        
        const nameFieldId = 'task-name-' + taskId;
        if (window.inlineFieldEditors && window.inlineFieldEditors[nameFieldId]) {
            const nameEditor = window.inlineFieldEditors[nameFieldId];
            console.log('AddTaskCardManager: Found name editor', nameFieldId, nameEditor);
            
            // Add Enter key handler to save and exit edit mode
            // Remove any existing Enter handler first to avoid duplicates
            if (nameEditor.inputElement) {
                // Remove existing handler if it exists
                if (nameEditor._enterHandler) {
                    nameEditor.inputElement.removeEventListener('keydown', nameEditor._enterHandler);
                }
                
                // Store reference to the handler so we can remove it if needed
                const enterHandler = (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('AddTaskCardManager: Enter key pressed, calling handleSave');
                        nameEditor.handleSave();
                    }
                };
                nameEditor.inputElement.addEventListener('keydown', enterHandler);
                // Store handler reference for potential cleanup
                nameEditor._enterHandler = enterHandler;
            } else {
                console.warn('AddTaskCardManager: Name editor input element not found');
            }
            
            // Set the onSave callback
            nameEditor.options.onSave = async function(newValue, oldValue, editor) {
                console.log('AddTaskCardManager: Name onSave called', { newValue, oldValue, taskId });
                
                // Get TaskFieldSaver from window (should be available since it's loaded in layout)
                const TaskFieldSaverClass = window.TaskFieldSaver;
                
                if (TaskFieldSaverClass && TaskFieldSaverClass.saveField) {
                    const success = await TaskFieldSaverClass.saveField(taskId, 'name', newValue);
                    console.log('AddTaskCardManager: Name save result', success);
                    if (success) {
                        editor.updateDisplayValue(newValue);
                        editor.originalValue = newValue;
                        
                        // Update the task card view name
                        const taskNameElement = document.querySelector(`.task-name-clickable[data-task-id="${taskId}"]`);
                        if (taskNameElement) {
                            taskNameElement.textContent = newValue;
                            console.log('AddTaskCardManager: Updated task card view name');
                        } else {
                            console.warn('AddTaskCardManager: Task name element not found for', taskId);
                        }
                        
                        return true;
                    }
                } else {
                    console.error('AddTaskCardManager: TaskFieldSaver not available', {
                        windowTaskFieldSaver: !!window.TaskFieldSaver,
                        globalTaskFieldSaver: typeof TaskFieldSaver !== 'undefined',
                        TaskFieldSaverClass: TaskFieldSaverClass
                    });
                }
                return false;
            };
            
            console.log('AddTaskCardManager: Name editor onSave callback set', nameEditor.options.onSave);
        } else {
            console.warn('AddTaskCardManager: Name editor not found', nameFieldId);
        }
        
        const descFieldId = 'task-description-' + taskId;
        if (window.inlineFieldEditors && window.inlineFieldEditors[descFieldId]) {
            const descEditor = window.inlineFieldEditors[descFieldId];
            console.log('AddTaskCardManager: Found description editor', descFieldId, descEditor);
            
            // Add Ctrl+Enter (Cmd+Enter on Mac) handler to save and exit edit mode
            // For textareas, Enter creates new lines, so we use Ctrl+Enter to save
            if (descEditor.inputElement) {
                // Remove existing handler if it exists
                if (descEditor._enterHandler) {
                    descEditor.inputElement.removeEventListener('keydown', descEditor._enterHandler);
                }
                
                const enterHandler = (e) => {
                    // Ctrl+Enter or Cmd+Enter saves
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('AddTaskCardManager: Ctrl+Enter pressed in description, calling handleSave');
                        descEditor.handleSave();
                    }
                    // Regular Enter is allowed for new lines in textarea
                };
                descEditor.inputElement.addEventListener('keydown', enterHandler);
                descEditor._enterHandler = enterHandler;
            } else {
                console.warn('AddTaskCardManager: Description editor input element not found');
            }
            
            // Set the onSave callback
            descEditor.options.onSave = async function(newValue, oldValue, editor) {
                console.log('AddTaskCardManager: Description onSave called', { newValue, oldValue, taskId });
                
                // Get TaskFieldSaver from window (should be available since it's loaded in layout)
                const TaskFieldSaverClass = window.TaskFieldSaver;
                
                if (TaskFieldSaverClass && TaskFieldSaverClass.saveField) {
                    const success = await TaskFieldSaverClass.saveField(taskId, 'description', newValue);
                    console.log('AddTaskCardManager: Description save result', success);
                    if (success) {
                        editor.updateDisplayValue(newValue);
                        editor.originalValue = newValue;
                        return true;
                    }
                } else {
                    console.error('AddTaskCardManager: TaskFieldSaver not available', {
                        windowTaskFieldSaver: !!window.TaskFieldSaver,
                        globalTaskFieldSaver: typeof TaskFieldSaver !== 'undefined',
                        TaskFieldSaverClass: TaskFieldSaverClass
                    });
                }
                return false;
            };
            
            console.log('AddTaskCardManager: Description editor onSave callback set', descEditor.options.onSave);
        } else {
            console.warn('AddTaskCardManager: Description editor not found', descFieldId);
        }
    }
    
    /**
     * Set skip button visibility based on task attributes
     * @param {number} taskId - The task ID
     */
    setSkipButtonVisibility(taskId) {
        const skipBtn = document.querySelector(`.skip-task-btn[data-task-id="${taskId}"]`);
        if (!skipBtn) return;
        
        // Get values from data attributes
        const isRecurring = skipBtn.dataset.isRecurring === '1';
        const isCompleted = skipBtn.dataset.isCompleted === '1';
        const isSkipped = skipBtn.dataset.isSkipped === '1';
        
        // Show skip button only if:
        // 1. Task is recurring (has a recurring_task_id)
        // 2. Task is not completed
        // 3. Task is not already skipped
        if (isRecurring && !isCompleted && !isSkipped) {
            skipBtn.style.display = 'inline-block';
        } else {
            skipBtn.style.display = 'none';
        }
    }
    
    /**
     * Expand the task card into edit mode
     * @param {number} taskId - The task ID
     */
    expandTaskCard(taskId) {
        const editor = window.taskCardEditors[taskId];
        if (editor) {
            editor.toggleEditMode(true);
        }
    }
}

// Initialize AddTaskCardManager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.addTaskCardManager = new AddTaskCardManager();
    });
} else {
    // DOM is already ready
    window.addTaskCardManager = new AddTaskCardManager();
}
