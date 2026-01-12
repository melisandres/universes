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
            console.warn(`InlineRecurringTaskField: Missing elements for field ${this.fieldId}`);
            return;
        }
        
        if (!this.elements.selectElement) {
            console.warn(`InlineRecurringTaskField: Select element not found for task ${this.taskId}`);
            return;
        }
        
        this.setupEditor();
        this.setupEventListeners();
        this.updateDisplay();
        this.updateSkipButton(); // Initialize skip button visibility
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
        const success = await TaskFieldSaver.saveField(this.taskId, 'recurring_task_id', selectedValue);
        
        if (success) {
            setTimeout(() => {
                this.updateDisplay();
                this.updateSkipButton();
            }, 50);
            return true;
        }
        
        return false;
    }
    
    /**
     * Update skip button visibility based on recurring task status
     */
    updateSkipButton() {
        if (!this.taskId) return;
        
        const skipBtn = document.querySelector(`.skip-task-btn[data-task-id="${this.taskId}"]`);
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
