/**
 * InlineLogTimeField - Manages inline editing for log time field
 * 
 * This class handles:
 * - Time input with unit selector (hours/minutes) for logging
 * - Display formatting (e.g., "2.5 hours", "30 minutes", "Not logged")
 * - Display-only save (doesn't save to server, just updates UI)
 */
class InlineLogTimeField {
    constructor(fieldId, config = {}) {
        this.fieldId = fieldId;
        this.taskId = config.taskId;
        this.config = config;
        
        // Cache elements
        this.elements = {
            viewElement: document.getElementById(`inline-view-${fieldId}`),
            editElement: document.getElementById(`inline-edit-${fieldId}`),
            inputElement: document.getElementById(`input-${fieldId}`),
            timeInput: null,
            valueElement: null,
            minutesRadio: document.getElementById(`log-time-unit-minutes-${fieldId}`),
            hoursRadio: document.getElementById(`log-time-unit-hours-${fieldId}`)
        };
        
        if (this.elements.viewElement) {
            this.elements.valueElement = this.elements.viewElement.querySelector('.inline-field-value');
        }
        
        // Find the time input (it has a different ID pattern)
        if (this.taskId) {
            this.elements.timeInput = document.getElementById(`log-minutes-${this.taskId}`);
        }
        
        this.init();
    }
    
    init() {
        if (!this.elements.viewElement || !this.elements.editElement || !this.elements.inputElement) {
            console.warn(`InlineLogTimeField: Missing elements for field ${this.fieldId}`);
            return;
        }
        
        if (!this.elements.timeInput) {
            console.warn(`InlineLogTimeField: Time input not found for task ${this.taskId}`);
            return;
        }
        
        this.setupEditor();
        this.setupEventListeners();
        this.updateStepAttribute(); // Set initial step based on selected unit
        this.updateDisplay();
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
                setTimeout(() => {
                    this.updateStepAttribute();
                    this.updateDisplay();
                }, 10);
            });
        }
        
        // Update display when time input changes
        if (this.elements.timeInput) {
            this.elements.timeInput.addEventListener('input', () => {
                const editElement = document.getElementById(`inline-edit-${this.fieldId}`);
                if (editElement && !editElement.classList.contains('d-none')) {
                    this.updateDisplay();
                }
            });
        }
        
        // Update display and step when unit radio changes
        if (this.elements.minutesRadio) {
            this.elements.minutesRadio.addEventListener('change', () => {
                this.updateStepAttribute();
                this.updateDisplay();
            });
        }
        
        if (this.elements.hoursRadio) {
            this.elements.hoursRadio.addEventListener('change', () => {
                this.updateStepAttribute();
                this.updateDisplay();
            });
        }
    }
    
    /**
     * Update the step attribute on the input based on the selected unit
     */
    updateStepAttribute() {
        TimeHelper.updateStepAttribute(
            this.elements.timeInput,
            this.elements.hoursRadio,
            this.elements.minutesRadio
        );
    }
    
    /**
     * Get the currently selected unit (hours or minutes)
     */
    getSelectedUnit() {
        return (this.elements.hoursRadio && this.elements.hoursRadio.checked) ? 'hours' : 'minutes';
    }
    
    /**
     * Update the display value from form inputs
     */
    updateDisplay() {
        if (!this.elements.timeInput || !this.elements.valueElement) {
            return;
        }
        
        const timeValue = this.elements.timeInput.value;
        if (!timeValue || timeValue === '') {
            this.elements.valueElement.textContent = 'Not logged';
            return;
        }
        
        const unit = this.getSelectedUnit();
        const numValue = parseFloat(timeValue);
        
        if (isNaN(numValue)) {
            this.elements.valueElement.textContent = 'Not logged';
            return;
        }
        
        if (unit === 'hours') {
            this.elements.valueElement.textContent = numValue + ' hours';
        } else {
            this.elements.valueElement.textContent = numValue + ' minutes';
        }
    }
    
    /**
     * Format value for display
     */
    formatValue(value) {
        return value || 'Not logged';
    }
    
    /**
     * Handle save - this is display-only, doesn't save to server
     * Just updates the display from current form state
     */
    handleSave(newValue, oldValue, editor) {
        // Update display from current form state
        setTimeout(() => {
            this.updateDisplay();
        }, 50);
        return true; // Allow UI update
    }
}
