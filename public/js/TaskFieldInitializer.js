/**
 * TaskFieldInitializer - Centralized initialization for task field classes
 * 
 * This handles initialization of all field-specific classes for tasks,
 * both on page load and for dynamically added content.
 * 
 * This replaces inline scripts in Blade templates, which don't work
 * for dynamically added content.
 */
class TaskFieldInitializer {
    /**
     * Initialize all field classes for a specific task
     * @param {number} taskId - The task ID
     * @param {HTMLElement} taskCard - Optional: the task card element (for scoped queries)
     */
    static initializeTaskFields(taskId, taskCard = null) {
        const scope = taskCard || document;
        
        // Initialize InlineUniversesField
        const universesFieldId = FieldUtils.getUniversesFieldId(taskId);
        const universesField = scope.querySelector(FieldUtils.getFieldSelector(universesFieldId));
        if (universesField && window.InlineUniversesField && !window.inlineFieldEditors?.[universesFieldId]) {
            const config = { taskId: taskId };
            new window.InlineUniversesField(universesFieldId, config);
        } else if (!universesField) {
            Logger.warn('TaskFieldInitializer: InlineUniversesField element not found', { universesFieldId, taskId, scope: scope === document ? 'document' : 'taskCard' });
        }
        
        // Initialize InlineDeadlineField
        const deadlineFieldId = FieldUtils.getDeadlineFieldId(taskId);
        const deadlineField = scope.querySelector(FieldUtils.getFieldSelector(deadlineFieldId));
        if (deadlineField && window.InlineDeadlineField && !window.inlineFieldEditors?.[deadlineFieldId]) {
            const config = { taskId: taskId };
            new window.InlineDeadlineField(deadlineFieldId, config);
        } else if (!deadlineField) {
            Logger.warn('TaskFieldInitializer: InlineDeadlineField element not found', { deadlineFieldId, taskId });
        }
        
        // Initialize InlineEstimatedTimeField
        const estimatedTimeFieldId = FieldUtils.getEstimatedTimeFieldId(taskId);
        const estimatedTimeField = scope.querySelector(FieldUtils.getFieldSelector(estimatedTimeFieldId));
        if (estimatedTimeField && window.InlineEstimatedTimeField && !window.inlineFieldEditors?.[estimatedTimeFieldId]) {
            const config = { taskId: taskId };
            new window.InlineEstimatedTimeField(estimatedTimeFieldId, config);
        } else if (!estimatedTimeField) {
            Logger.warn('TaskFieldInitializer: InlineEstimatedTimeField element not found', { estimatedTimeFieldId, taskId });
        }
        
        // Initialize InlineRecurringTaskField
        const recurringTaskFieldId = FieldUtils.getRecurringTaskFieldId(taskId);
        const recurringTaskField = scope.querySelector(FieldUtils.getFieldSelector(recurringTaskFieldId));
        if (recurringTaskField && window.InlineRecurringTaskField && !window.inlineFieldEditors?.[recurringTaskFieldId]) {
            const config = { taskId: taskId };
            new window.InlineRecurringTaskField(recurringTaskFieldId, config);
        } else if (!recurringTaskField) {
            Logger.warn('TaskFieldInitializer: InlineRecurringTaskField element not found', { recurringTaskFieldId, taskId });
        }
        
        // Initialize InlineLogTimeField (for the log form)
        const logTimeField = scope.querySelector(`.task-log-form [data-field-id^="log-time-${taskId}"]`);
        if (logTimeField && window.InlineLogTimeField) {
            const logTimeFieldId = logTimeField.dataset.fieldId;
            if (logTimeFieldId && !window.inlineFieldEditors?.[logTimeFieldId]) {
                const config = { taskId: taskId };
                new window.InlineLogTimeField(logTimeFieldId, config);
            }
        }
        
        // Initialize simple InlineFieldEditor instances for name and description
        // These are simple fields that don't have custom field classes
        // Note: InlineFieldEditor.js may have already auto-initialized these via DOMContentLoaded
        // If they don't exist, we create them. If they do exist, we'll update them with save handlers in setupSaveHandlers()
        const InlineFieldEditorClass = window.InlineFieldEditor || (typeof InlineFieldEditor !== 'undefined' ? InlineFieldEditor : null);
        
        if (InlineFieldEditorClass) {
            // Ensure window.inlineFieldEditors exists
            if (!window.inlineFieldEditors) {
                window.inlineFieldEditors = {};
            }
            
            // Name field
            const nameFieldId = FieldUtils.getTaskNameFieldId(taskId);
            const nameField = scope.querySelector(`[data-field-id="${nameFieldId}"]`);
            if (nameField) {
                if (!window.inlineFieldEditors[nameFieldId]) {
                    try {
                        window.inlineFieldEditors[nameFieldId] = new InlineFieldEditorClass(nameFieldId);
                    } catch (error) {
                        Logger.error('TaskFieldInitializer: Error initializing InlineFieldEditor for name', error);
                    }
                }
            }
            
            // Description field
            const descFieldId = FieldUtils.getTaskDescriptionFieldId(taskId);
            const descField = scope.querySelector(`[data-field-id="${descFieldId}"]`);
            if (descField) {
                if (!window.inlineFieldEditors[descFieldId]) {
                    try {
                        window.inlineFieldEditors[descFieldId] = new InlineFieldEditorClass(descFieldId);
                    } catch (error) {
                        Logger.error('TaskFieldInitializer: Error initializing InlineFieldEditor for description', error);
                    }
                }
            }
        }
    }
    
    /**
     * Set up save handlers for name and description fields
     * This is called after fields are initialized
     * @param {number} taskId - The task ID
     */
    static setupSaveHandlers(taskId) {
        // Name field
        const nameFieldId = 'task-name-' + taskId;
        if (window.inlineFieldEditors && window.inlineFieldEditors[nameFieldId]) {
            const nameEditor = window.inlineFieldEditors[nameFieldId];
            
            // Add Enter key handler to save and exit edit mode
            if (nameEditor.inputElement && !nameEditor._enterHandler) {
                const enterHandler = (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        e.stopPropagation();
                        nameEditor.handleSave();
                    }
                };
                nameEditor.inputElement.addEventListener('keydown', enterHandler);
                nameEditor._enterHandler = enterHandler;
            }
            
            // Set up onSave callback
            if (!nameEditor.options.onSave) {
                nameEditor.options.onSave = async function(newValue, oldValue, editor) {
                    const TaskFieldSaverClass = window.TaskFieldSaver;
                    if (TaskFieldSaverClass && TaskFieldSaverClass.saveField) {
                        const success = await TaskFieldSaverClass.saveField(taskId, 'name', newValue);
                        if (success) {
                            editor.updateDisplayValue(newValue);
                            editor.originalValue = newValue;
                            
                            // Update the task card view name
                            const taskNameElement = FieldUtils.findTaskNameElement(taskId);
                            if (taskNameElement) {
                                taskNameElement.textContent = newValue;
                            }
                            
                            return true;
                        }
                    }
                    return false;
                };
            }
        }
        
        // Description field
        const descFieldId = 'task-description-' + taskId;
        if (window.inlineFieldEditors && window.inlineFieldEditors[descFieldId]) {
            const descEditor = window.inlineFieldEditors[descFieldId];
            
            // Add Ctrl+Enter (Cmd+Enter on Mac) handler to save and exit edit mode
            if (descEditor.inputElement && !descEditor._enterHandler) {
                const enterHandler = (e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        e.stopPropagation();
                        descEditor.handleSave();
                    }
                };
                descEditor.inputElement.addEventListener('keydown', enterHandler);
                descEditor._enterHandler = enterHandler;
            }
            
            // Set up onSave callback
            if (!descEditor.options.onSave) {
                descEditor.options.onSave = async function(newValue, oldValue, editor) {
                    const TaskFieldSaverClass = window.TaskFieldSaver;
                    if (TaskFieldSaverClass && TaskFieldSaverClass.saveField) {
                        const success = await TaskFieldSaverClass.saveField(taskId, 'description', newValue);
                        if (success) {
                            editor.updateDisplayValue(newValue);
                            editor.originalValue = newValue;
                            return true;
                        }
                    }
                    return false;
                };
            }
        }
        
        // Initialize skip button visibility
        const skipBtn = DOMUtils.findSkipTaskButton(taskId);
        if (skipBtn) {
            const isRecurring = skipBtn.dataset.isRecurring === '1';
            const isCompleted = skipBtn.dataset.isCompleted === '1';
            const isSkipped = skipBtn.dataset.isSkipped === '1';
            
            if (isRecurring && !isCompleted && !isSkipped) {
                skipBtn.style.display = 'inline-block';
            } else {
                skipBtn.style.display = 'none';
            }
        }
    }
    
    /**
     * Initialize all task fields on the page (for page load)
     */
    static async initializeAllTaskFields() {
        // Wait for dependencies to be ready
        const depsReady = await DependencyManager.waitForAll([
            'inlineFieldEditors',
            'inlineFieldEditorClass',
            'fieldClasses'
        ], 5000);
        
        if (!depsReady) {
            Logger.error('TaskFieldInitializer: Dependencies not ready after timeout');
            return;
        }
        
        // Find all task edit forms to get task IDs
        const taskForms = document.querySelectorAll('.task-edit-form-simple[data-task-id]');
        
        // Initialize fields for each task
        for (const form of taskForms) {
            const taskId = parseInt(form.dataset.taskId, 10);
            if (taskId) {
                this.initializeTaskFields(taskId);
            }
        }
        
        // Set up save handlers after fields are initialized
        // Wait a bit for field initialization to complete
        await new Promise(resolve => setTimeout(resolve, 50));
        
        for (const form of taskForms) {
            const taskId = parseInt(form.dataset.taskId, 10);
            if (taskId) {
                this.setupSaveHandlers(taskId);
            }
        }
    }
}

// Initialize all tasks on page load
// We wait for DOMContentLoaded to ensure all elements are present
// Then wait for dependencies to be ready before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        TaskFieldInitializer.initializeAllTaskFields();
    });
} else {
    // DOM is already ready
    TaskFieldInitializer.initializeAllTaskFields();
}

// Make it available globally
window.TaskFieldInitializer = TaskFieldInitializer;
