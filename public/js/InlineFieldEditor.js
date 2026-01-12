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
        
        // Decode HTML entities in the initial display value
        // Blade templates HTML-encode values (e.g., ' becomes &#039;), so we need to decode them
        if (this.valueElement) {
            const initialText = this.valueElement.textContent;
            if (initialText && initialText.includes('&#')) {
                const decodedText = this.decodeHtmlEntities(initialText);
                if (decodedText !== initialText) {
                    this.valueElement.textContent = decodedText;
                }
            }
        }
    }
    
    attachEventListeners() {
        // Edit button - toggle between edit and view mode (acts as cancel when in edit mode)
        // NOTE: We're using event delegation now, so we don't attach individual listeners
        // This prevents double-handling and works for dynamically added content
        // The event delegation handler in the global scope handles all edit button clicks
        
        // Save button - we use event delegation, but also attach individual listener as fallback
        // This ensures it works even if event delegation fails
        const saveBtn = this.editElement?.querySelector('.inline-field-save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleSave();
            });
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
            // NOTE: We prevent blur from auto-saving if the user is clicking the edit button
            // This prevents unwanted saves when toggling edit mode
            this.inputElement.addEventListener('blur', (e) => {
                // Don't auto-save if the related target is the edit button (user clicked pencil)
                const relatedTarget = e.relatedTarget;
                if (relatedTarget && relatedTarget.classList.contains('inline-field-edit-btn')) {
                    return;
                }
                
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
        
        // Decode HTML entities in textarea/input before reading original value
        // This ensures we always work with raw, unencoded values and prevents double-encoding
        if (this.inputElement && (this.inputElement.tagName === 'TEXTAREA' || this.inputElement.tagName === 'INPUT')) {
            const currentValue = this.inputElement.value;
            const decodedValue = this.decodeHtmlEntities(currentValue);
            if (currentValue !== decodedValue) {
                // Update the input with decoded value if it was encoded
                this.inputElement.value = decodedValue;
            }
        }
        
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
        
        let value = this.inputElement.value;
        
        // Decode HTML entities from textarea/input values
        // This prevents double-encoding issues when Blade templates HTML-encode values
        if (this.inputElement.tagName === 'TEXTAREA' || this.inputElement.tagName === 'INPUT') {
            value = this.decodeHtmlEntities(value);
        }
        
        return value;
    }
    
    updateDisplayValue(value) {
        if (this.valueElement) {
            const displayValue = this.options.formatValue 
                ? this.options.formatValue(value) 
                : (value || this.inputElement?.placeholder || 'Not set');
            // Decode HTML entities to prevent double-encoding
            // Note: value should already be decoded from getInputValue(), but decode again to be safe
            const decodedValue = this.decodeHtmlEntities(displayValue);
            this.valueElement.textContent = decodedValue;
        }
    }
    
    /**
     * Decode HTML entities in a string
     * Prevents double-encoding issues when updating display values
     * Handles cases where Blade templates HTML-encode values in textarea content
     */
    decodeHtmlEntities(text) {
        if (!text || typeof text !== 'string') return text;
        
        // Use a temporary textarea to decode HTML entities
        // This handles entities like &#039; (apostrophe), &amp; (ampersand), etc.
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }
    
    handleSave() {
        console.log('InlineFieldEditor: handleSave called for', this.fieldId, {
            hasOnSave: !!this.options.onSave,
            onSaveType: typeof this.options.onSave
        });
        
        const newValue = this.getInputValue();
        console.log('InlineFieldEditor: New value', newValue);
        
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
            console.log('InlineFieldEditor: Calling onSave callback');
            const result = this.options.onSave(newValue, this.originalValue, this);
            
            // If callback returns a promise, wait for it
            if (result instanceof Promise) {
                result.then((success) => {
                    console.log('InlineFieldEditor: onSave promise resolved', success);
                    if (success !== false) {
                        this.updateDisplayValue(newValue);
                        this.originalValue = newValue;
                        this.exitEditMode();
                    } else {
                        console.warn('InlineFieldEditor: onSave returned false, not updating');
                    }
                }).catch((error) => {
                    console.error('InlineFieldEditor: Error saving field:', error);
                    alert('Error saving field. Please try again.');
                });
            } else if (result !== false) {
                console.log('InlineFieldEditor: onSave returned non-promise result', result);
                this.updateDisplayValue(newValue);
                this.originalValue = newValue;
                this.exitEditMode();
            } else {
                console.warn('InlineFieldEditor: onSave returned false, not updating');
            }
        } else {
            console.warn('InlineFieldEditor: No onSave callback, just updating display');
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
 * Event delegation for edit and save button clicks
 * This handles clicks on dynamically added content without needing to attach individual listeners
 */
document.addEventListener('click', function(e) {
    // Handle edit button clicks
    const editBtn = e.target.closest('.inline-field-edit-btn[data-field-id]');
    if (editBtn) {
        // Prevent the click from triggering other handlers
        e.stopPropagation();
        
        const fieldId = editBtn.dataset.fieldId;
        if (!fieldId) return;
        
        // Get or create the InlineFieldEditor instance
        if (!window.inlineFieldEditors) {
            window.inlineFieldEditors = {};
        }
        
        let editor = window.inlineFieldEditors[fieldId];
        
        // If editor doesn't exist, try to create it
        if (!editor) {
            // Check if the field exists
            const fieldElement = document.querySelector(`.inline-editable-field[data-field-id="${fieldId}"]`);
            if (!fieldElement) return;
            
            try {
                editor = new InlineFieldEditor(fieldId);
                window.inlineFieldEditors[fieldId] = editor;
            } catch (error) {
                console.warn('InlineFieldEditor: Could not create editor for field', fieldId, error);
                return;
            }
        }
        
        // Check current state and toggle
        const isCurrentlyEditing = editor.isEditing();
        
        if (isCurrentlyEditing) {
            // Field is in edit mode - cancel and close
            editor.handleCancel();
        } else {
            // Field is in view mode - open for editing
            editor.enterEditMode();
        }
        return;
    }
    
    // Handle save button clicks
    const saveBtn = e.target.closest('.inline-field-save-btn[data-field-id]');
    if (saveBtn) {
        e.preventDefault();
        e.stopPropagation();
        
        const fieldId = saveBtn.dataset.fieldId;
        if (!fieldId) return;
        
        // Get or create the InlineFieldEditor instance
        if (!window.inlineFieldEditors) {
            window.inlineFieldEditors = {};
        }
        
        let editor = window.inlineFieldEditors[fieldId];
        
        // If editor doesn't exist, try to create it
        // BUT: Only create if it's a simple field. Complex fields (universes, estimated-time, etc.)
        // should be initialized by their custom field classes, which set up the onSave callback.
        // If we create a new editor here, it will overwrite the one with the custom onSave callback.
        if (!editor) {
            // Check if the field exists
            const fieldElement = document.querySelector(`.inline-editable-field[data-field-id="${fieldId}"]`);
            if (!fieldElement) {
                console.warn('InlineFieldEditor: Field element not found for', fieldId);
                return;
            }
            
            // Check if this is a complex field that should be initialized by a custom class
            // Complex fields have data-no-auto-init="true" or are initialized by field-specific classes
            const isComplexField = fieldElement.dataset.noAutoInit === 'true' ||
                                   fieldId.startsWith('universes-') ||
                                   fieldId.startsWith('estimated-time-') ||
                                   fieldId.startsWith('recurring-task-') ||
                                   fieldId.startsWith('deadline-') ||
                                   fieldId.startsWith('log-time-');
            
            if (isComplexField) {
                console.warn('InlineFieldEditor: Complex field should be initialized by custom field class', fieldId);
                return;
            }
            
            try {
                editor = new InlineFieldEditor(fieldId);
                window.inlineFieldEditors[fieldId] = editor;
            } catch (error) {
                console.warn('InlineFieldEditor: Could not create editor for field', fieldId, error);
                return;
            }
        }
        
        // Call handleSave
        console.log('🟠 InlineFieldEditor: Calling handleSave', { 
            fieldId: fieldId, 
            hasEditor: !!editor,
            hasOnSave: !!editor?.options?.onSave,
            editorConstructor: editor?.constructor?.name,
            onSaveType: typeof editor?.options?.onSave
        });
        editor.handleSave();
    }
});

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
