/**
 * InlineEstimatedTimeField - Manages inline editing for estimated time field
 * 
 * This class handles:
 * - Time input with unit selector (hours/minutes)
 * - Display formatting (e.g., "2.5 hours", "30 minutes", "Not set")
 * - Saving via TaskFieldSaver with timeUnit option
 */
class InlineEstimatedTimeField {
    constructor(fieldId, config = {}) {
        this.fieldId = fieldId;
        this.taskId = config.taskId;
        this.config = config;
        
        // Cache elements
        this.elements = {
            viewElement: document.getElementById(`inline-view-${fieldId}`),
            editElement: document.getElementById(`inline-edit-${fieldId}`),
            inputElement: document.getElementById(`input-${fieldId}`),
            valueElement: null,
            minutesRadio: document.getElementById(`time-unit-minutes-${fieldId}`),
            hoursRadio: document.getElementById(`time-unit-hours-${fieldId}`)
        };
        
        if (this.elements.viewElement) {
            this.elements.valueElement = this.elements.viewElement.querySelector('.inline-field-value');
        }
        
        this.init();
    }
    
    init() {
        if (!this.elements.viewElement || !this.elements.editElement || !this.elements.inputElement) {
            console.warn(`InlineEstimatedTimeField: Missing elements for field ${this.fieldId}`);
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
     * Setup all event listeners using event delegation
     * This ensures listeners work for dynamically added content
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
        
        // Update display when time input changes
        if (this.elements.inputElement) {
            this.elements.inputElement.addEventListener('input', () => {
                const editElement = document.getElementById(`inline-edit-${this.fieldId}`);
                if (editElement && !editElement.classList.contains('d-none')) {
                    this.updateDisplay();
                }
            });
        }
        
        // Use event delegation for radio buttons - attach to document
        // This ensures it works even if the edit element is hidden
        console.log('InlineEstimatedTimeField: Setting up event delegation for radio buttons on', this.fieldId, {
            editElement: !!this.elements.editElement,
            minutesRadio: !!this.elements.minutesRadio,
            hoursRadio: !!this.elements.hoursRadio,
            minutesRadioId: this.elements.minutesRadio?.id,
            hoursRadioId: this.elements.hoursRadio?.id
        });
        
        // Store a reference to this instance for the event handler
        const fieldId = this.fieldId;
        const instance = this;
        
        // Listen for change events on the document (capture phase to catch early)
        const changeHandler = function(e) {
            // Check if the changed element is a radio button for this field's time unit
            const isTimeUnitRadio = e.target.type === 'radio' && 
                                   (e.target.id === `time-unit-minutes-${fieldId}` || 
                                    e.target.id === `time-unit-hours-${fieldId}`);
            
            if (isTimeUnitRadio) {
                console.log('InlineEstimatedTimeField: Radio button changed via delegation', {
                    fieldId: fieldId,
                    radioId: e.target.id,
                    value: e.target.value,
                    checked: e.target.checked
                });
                
                // Update the cached radio references in case they were null before
                if (!instance.elements.minutesRadio && e.target.id === `time-unit-minutes-${fieldId}`) {
                    instance.elements.minutesRadio = e.target;
                }
                if (!instance.elements.hoursRadio && e.target.id === `time-unit-hours-${fieldId}`) {
                    instance.elements.hoursRadio = e.target;
                }
                
                instance.updateStepAttribute();
                instance.updateDisplay();
            }
        };
        
        // Attach to document with capture phase
        document.addEventListener('change', changeHandler, true);
        
        // Store handler for potential cleanup
        this._changeHandler = changeHandler;
    }
    
    /**
     * Get the currently selected unit (hours or minutes)
     */
    getSelectedUnit() {
        return (this.elements.hoursRadio && this.elements.hoursRadio.checked) ? 'hours' : 'minutes';
    }
    
    /**
     * Update the step attribute on the input based on the selected unit
     */
    updateStepAttribute() {
        TimeHelper.updateStepAttribute(
            this.elements.inputElement,
            this.elements.hoursRadio,
            this.elements.minutesRadio
        );
    }
    
    /**
     * Update the display value from form inputs
     */
    updateDisplay() {
        if (!this.elements.inputElement || !this.elements.valueElement) {
            return;
        }
        
        const timeValue = this.elements.inputElement.value;
        if (!timeValue || timeValue === '') {
            this.elements.valueElement.textContent = 'Not set';
            return;
        }
        
        const unit = this.getSelectedUnit();
        const numValue = parseFloat(timeValue);
        
        if (isNaN(numValue)) {
            this.elements.valueElement.textContent = 'Not set';
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
        if (!value || value === '') return 'Not set';
        
        const unit = this.getSelectedUnit();
        const numValue = parseFloat(value);
        
        if (isNaN(numValue)) return 'Not set';
        
        if (unit === 'hours') {
            return numValue + ' hours';
        } else {
            return numValue + ' minutes';
        }
    }
    
    /**
     * Handle save - extracts time value and unit, then saves via TaskFieldSaver
     */
    async handleSave(newValue, oldValue, editor) {
        if (!this.elements.inputElement) return false;
        
        const timeInput = this.elements.inputElement;
        const unit = this.getSelectedUnit();
        
        if (!timeInput.value || timeInput.value === '') {
            // Clear estimated time
            const success = await TaskFieldSaver.saveField(this.taskId, 'estimated_time', '', { timeUnit: 'hours' });
            if (success) {
                setTimeout(() => {
                    this.updateDisplay();
                }, 50);
                return true;
            }
            return false;
        }
        
        const timeValue = parseFloat(timeInput.value);
        if (isNaN(timeValue)) {
            return false;
        }
        
        const success = await TaskFieldSaver.saveField(this.taskId, 'estimated_time', timeValue, { timeUnit: unit });
        
        if (success) {
            console.log('InlineEstimatedTimeField: Save successful, updating display', { timeValue, unit });
            // Update display immediately and after a short delay to ensure DOM is ready
            this.updateDisplay();
            setTimeout(() => {
                this.updateDisplay();
            }, 100);
            return true;
        }
        
        return false;
    }
}

// Expose to window for global access
window.InlineEstimatedTimeField = InlineEstimatedTimeField;
