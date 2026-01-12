/**
 * InlineRecurringTaskField - Manages inline editing for recurring task field
 * 
 * This class handles:
 * - Recurring task selection via dropdown
 * - Display formatting ("non-recurring" or "recurring instance of [task name]")
 * - Saving via TaskFieldSaver
 */
class InlineRecurringTaskField {
    constructor(fieldId, config = {}) {
        this.fieldId = fieldId;
        this.taskId = config.taskId;
        this.config = config;
        
        // Cache elements
        this.elements = {
            viewElement: document.getElementById(`inline-view-${fieldId}`),
            editElement: document.getElementById(`inline-edit-${fieldId}`),
            inputElement: document.getElementById(`input-${fieldId}`),
            selectElement: null,
            valueElement: null
        };
        
        if (this.elements.viewElement) {
            this.elements.valueElement = this.elements.viewElement.querySelector('.inline-field-value');
        }
        
        // Find the select element (it has a different ID pattern)
        if (this.taskId) {
            this.elements.selectElement = document.getElementById(`recurring-task-select-${this.taskId}`);
        }
        
        this.init();
    }
    
    init() {
        if (!this.elements.viewElement || !this.elements.editElement || !this.elements.inputElement) {
            Logger.warn(`InlineRecurringTaskField: Missing elements for field ${this.fieldId}`);
            return;
        }
        
        if (!this.elements.selectElement) {
            Logger.warn(`InlineRecurringTaskField: Select element not found for task ${this.taskId}`);
            return;
        }
        
        this.setupEditor();
        this.setupEventListeners();
        this.updateDisplay();
        this.updateSkipButton(); // Initialize skip button visibility
        this.updateRecurringIcon(); // Initialize recurring icon
    }
    
    /**
     * Setup InlineFieldEditor with custom handlers
     */
    setupEditor() {
        if (!window.inlineFieldEditors) {
            window.inlineFieldEditors = {};
        }
        
        window.inlineFieldEditors[this.fieldId] = new InlineFieldEditor(this.fieldId, {
            formatValue: (value) => this.formatValue(value),
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
                // Small delay to ensure edit mode is visible
                setTimeout(() => this.updateDisplay(), 10);
            });
        }
        
        // Update display and skip button when select changes
        if (this.elements.selectElement) {
            this.elements.selectElement.addEventListener('change', () => {
                const editElement = document.getElementById(`inline-edit-${this.fieldId}`);
                if (editElement && !editElement.classList.contains('d-none')) {
                    this.updateDisplay();
                    this.updateSkipButton();
                }
            });
        }
    }
    
    /**
     * Update the display value from form inputs
     */
    updateDisplay() {
        if (!this.elements.selectElement || !this.elements.valueElement) {
            return;
        }
        
        const selectedValue = this.elements.selectElement.value;
        const selectedOption = this.elements.selectElement.options[this.elements.selectElement.selectedIndex];
        const optionText = selectedOption ? selectedOption.text.trim() : '';
        
        // Update hidden input for InlineFieldEditor compatibility
        if (this.elements.inputElement) {
            this.elements.inputElement.value = selectedValue;
        }
        
        // Format display text
        if (!selectedValue || selectedValue === '' || optionText === '— none —') {
            this.elements.valueElement.textContent = 'non-recurring';
        } else {
            this.elements.valueElement.textContent = 'recurring instance of ' + optionText;
        }
    }
    
    /**
     * Format value for display
     */
    formatValue(value) {
        if (!value || value === '') return 'non-recurring';
        
        if (!this.elements.selectElement) return 'non-recurring';
        
        const selectedOption = this.elements.selectElement.options[this.elements.selectElement.selectedIndex];
        const optionText = selectedOption ? selectedOption.text.trim() : '';
        
        if (!value || value === '' || optionText === '— none —') {
            return 'non-recurring';
        } else {
            return 'recurring instance of ' + optionText;
        }
    }
    
    /**
     * Handle save - extracts selected value and saves via TaskFieldSaver
     */
    async handleSave(newValue, oldValue, editor) {
        if (!this.elements.selectElement) return false;
        
        const selectedValue = this.elements.selectElement.value || '';
        Logger.debug('InlineRecurringTaskField: Saving recurring task', { taskId: this.taskId, selectedValue });
        const success = await TaskFieldSaver.saveField(this.taskId, 'recurring_task_id', selectedValue);
        
        if (success) {
            Logger.debug('InlineRecurringTaskField: Save successful, updating display');
            // Update display immediately and after a short delay to ensure DOM is ready
            this.updateDisplay();
            this.updateRecurringIcon();
            setTimeout(() => {
                this.updateDisplay();
                this.updateSkipButton();
                this.updateRecurringIcon();
            }, 100);
            return true;
        }
        
        Logger.warn('InlineRecurringTaskField: Save failed');
        return false;
    }
    
    /**
     * Update the recurring icon in the collapsed task card view
     */
    updateRecurringIcon() {
        if (!this.taskId) return;
        
        // Find the task view element
        const taskView = document.getElementById(`task-view-${this.taskId}`);
        if (!taskView) return;
        
        // Find the recurring icon and placeholder
        const recurringIcon = taskView.querySelector('.recurring-icon');
        const recurringIconPlaceholder = taskView.querySelector('.recurring-icon-placeholder');
        
        // Determine if task is recurring
        const selectedValue = this.elements.selectElement ? this.elements.selectElement.value : '';
        const isRecurring = selectedValue && selectedValue !== '';
        
        if (isRecurring) {
            // Show icon, hide placeholder
            if (recurringIconPlaceholder) {
                recurringIconPlaceholder.style.visibility = 'hidden';
            }
            
            // Create or show recurring icon
            if (!recurringIcon) {
                // Create new icon if it doesn't exist
                const newIcon = document.createElement('span');
                newIcon.className = 'recurring-icon';
                newIcon.title = 'Recurring';
                newIcon.textContent = '🔄';
                
                // Insert after checkbox
                const checkbox = taskView.querySelector('.complete-task-checkbox');
                if (checkbox) {
                    checkbox.after(newIcon);
                }
            } else {
                recurringIcon.style.visibility = 'visible';
                recurringIcon.textContent = '🔄';
            }
        } else {
            // Hide icon, show placeholder
            if (recurringIcon) {
                recurringIcon.style.visibility = 'hidden';
                recurringIcon.textContent = '';
            }
            
            if (recurringIconPlaceholder) {
                recurringIconPlaceholder.style.visibility = 'hidden';
            } else {
                // Create placeholder if it doesn't exist
                const newPlaceholder = document.createElement('span');
                newPlaceholder.className = 'recurring-icon-placeholder';
                
                const checkbox = taskView.querySelector('.complete-task-checkbox');
                if (checkbox) {
                    checkbox.after(newPlaceholder);
                }
            }
        }
    }
    
    /**
     * Update skip button visibility based on recurring task status
     */
    updateSkipButton() {
        if (!this.taskId) return;
        
        const skipBtn = DOMUtils.findSkipTaskButton(this.taskId);
        if (!skipBtn) return;
        
        const selectedValue = this.elements.selectElement ? this.elements.selectElement.value : '';
        const isRecurring = selectedValue && selectedValue !== '';
        
        // Check if task is completed or skipped from data attributes
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
}

// Expose to window for global access
window.InlineRecurringTaskField = InlineRecurringTaskField;
