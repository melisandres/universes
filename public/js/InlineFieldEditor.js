/**
 * InlineFieldEditor - Reusable class for managing inline editable fields
 * 
 * This class handles the toggle between view and edit modes for inline editable fields.
 * It can work with individual fields or be integrated into a larger form context.
 */
class InlineFieldEditor {
    constructor(fieldId, options = {}) {
        this.fieldId = fieldId;
        this.options = {
            onSave: options.onSave || null, // Callback when save is clicked
            onCancel: options.onCancel || null, // Callback when cancel is clicked
            autoSave: options.autoSave || false, // Auto-save on blur/enter
            validate: options.validate || null, // Validation function
            formatValue: options.formatValue || null, // Format value for display
            ...options
        };
        
        this.viewElement = document.getElementById(`inline-view-${fieldId}`);
        this.editElement = document.getElementById(`inline-edit-${fieldId}`);
        this.inputElement = document.getElementById(`input-${fieldId}`);
        this.valueElement = this.viewElement?.querySelector('.inline-field-value');
        
        if (!this.viewElement || !this.editElement || !this.inputElement) {
            console.warn(`InlineFieldEditor: Missing elements for field ${fieldId}`);
            return;
        }
        
        this.originalValue = this.getInputValue();
        this.init();
    }
    
    init() {
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        // Edit button - toggle between edit and view mode (acts as cancel when in edit mode)
        const editBtn = document.querySelector(`.inline-field-edit-btn[data-field-id="${this.fieldId}"]`);
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                if (this.isEditing()) {
                    this.handleCancel();
                } else {
                    this.enterEditMode();
                }
            });
        }
        
        // Save button
        const saveBtn = this.editElement?.querySelector('.inline-field-save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.handleSave());
        }
        
        // Auto-save on Enter key
        if (this.inputElement && this.options.autoSave) {
            this.inputElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSave();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.handleCancel();
                }
            });
            
            // Auto-save on blur
            this.inputElement.addEventListener('blur', () => {
                if (this.isEditing()) {
                    this.handleSave();
                }
            });
        } else if (this.inputElement) {
            // Just handle Escape key
            this.inputElement.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    this.handleCancel();
                }
            });
        }
    }
    
    enterEditMode() {
        if (!this.viewElement || !this.editElement) return;
        
        this.originalValue = this.getInputValue();
        
        // Hide only the value display, keep label and pencil visible
        const valueElement = this.viewElement.querySelector('.inline-field-value');
        if (valueElement) {
            valueElement.style.display = 'none';
        }
        
        this.editElement.classList.remove('d-none');
        
        // Focus the input
        if (this.inputElement) {
            // Small delay to ensure element is visible
            setTimeout(() => {
                this.inputElement.focus();
                // Select all text for text inputs
                if (this.inputElement.type === 'text' || this.inputElement.type === 'number') {
                    this.inputElement.select();
                }
            }, 10);
        }
    }
    
    exitEditMode() {
        if (!this.viewElement || !this.editElement) return;
        
        // Show the value display again
        const valueElement = this.viewElement.querySelector('.inline-field-value');
        if (valueElement) {
            valueElement.style.display = '';
        }
        
        this.editElement.classList.add('d-none');
    }
    
    isEditing() {
        return this.editElement && !this.editElement.classList.contains('d-none');
    }
    
    getInputValue() {
        if (!this.inputElement) return '';
        
        if (this.inputElement.tagName === 'SELECT') {
            return this.inputElement.value;
        } else if (this.inputElement.tagName === 'TEXTAREA') {
            return this.inputElement.value;
        } else {
            return this.inputElement.value;
        }
    }
    
    updateDisplayValue(value) {
        if (this.valueElement) {
            const displayValue = this.options.formatValue 
                ? this.options.formatValue(value) 
                : (value || this.inputElement?.placeholder || 'Not set');
            this.valueElement.textContent = displayValue;
        }
    }
    
    handleSave() {
        const newValue = this.getInputValue();
        
        // Validate if validator provided
        if (this.options.validate) {
            const validationResult = this.options.validate(newValue);
            if (validationResult !== true) {
                alert(validationResult); // Or use a better notification system
                return;
            }
        }
        
        // Call onSave callback if provided
        if (this.options.onSave) {
            const result = this.options.onSave(newValue, this.originalValue, this);
            
            // If callback returns a promise, wait for it
            if (result instanceof Promise) {
                result.then((success) => {
                    if (success !== false) {
                        this.updateDisplayValue(newValue);
                        this.originalValue = newValue;
                        this.exitEditMode();
                    }
                }).catch((error) => {
                    console.error('Error saving field:', error);
                    alert('Error saving field. Please try again.');
                });
            } else if (result !== false) {
                this.updateDisplayValue(newValue);
                this.originalValue = newValue;
                this.exitEditMode();
            }
        } else {
            // No callback - just update display and exit
            this.updateDisplayValue(newValue);
            this.originalValue = newValue;
            this.exitEditMode();
        }
    }
    
    handleCancel() {
        // Restore original value
        if (this.inputElement) {
            if (this.inputElement.tagName === 'SELECT' || this.inputElement.tagName === 'TEXTAREA') {
                this.inputElement.value = this.originalValue;
            } else {
                this.inputElement.value = this.originalValue;
            }
        }
        
        // Call onCancel callback if provided
        if (this.options.onCancel) {
            this.options.onCancel(this.originalValue, this);
        }
        
        this.exitEditMode();
    }
    
    setValue(value) {
        if (this.inputElement) {
            if (this.inputElement.tagName === 'SELECT' || this.inputElement.tagName === 'TEXTAREA') {
                this.inputElement.value = value;
            } else {
                this.inputElement.value = value;
            }
        }
        this.updateDisplayValue(value);
        this.originalValue = value;
    }
    
    getValue() {
        return this.getInputValue();
    }
}

/**
 * Initialize all inline editable fields on the page
 */
document.addEventListener('DOMContentLoaded', function() {
    if (!window.inlineFieldEditors) {
        window.inlineFieldEditors = {};
    }
    
    // Auto-initialize fields with data-field-id attribute (skip if data-no-auto-init is set)
    document.querySelectorAll('.inline-editable-field[data-field-id]').forEach(field => {
        const fieldId = field.dataset.fieldId;
        const noAutoInit = field.dataset.noAutoInit === 'true';
        if (fieldId && !noAutoInit && !window.inlineFieldEditors[fieldId]) {
            window.inlineFieldEditors[fieldId] = new InlineFieldEditor(fieldId);
        }
    });
});
