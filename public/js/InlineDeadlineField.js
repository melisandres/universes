/**
 * InlineDeadlineField - Manages inline editing for deadline field
 * 
 * This class handles:
 * - Datetime-local input
 * - "Today" button that sets current date/time
 * - Display formatting ("no deadline" or "deadline: [formatted date]")
 * - Saving via TaskFieldSaver
 */
class InlineDeadlineField {
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
            todayBtn: null
        };
        
        if (this.elements.viewElement) {
            this.elements.valueElement = this.elements.viewElement.querySelector('.inline-field-value');
        }
        
        // Find the "Today" button
        if (this.taskId) {
            this.elements.todayBtn = document.querySelector(`.btn-today[data-task-id="${this.taskId}"]`);
        }
        
        this.init();
    }
    
    init() {
        if (!this.elements.viewElement || !this.elements.editElement || !this.elements.inputElement) {
            console.warn(`InlineDeadlineField: Missing elements for field ${this.fieldId}`);
            return;
        }
        
        this.setupEditor();
        this.setupEventListeners();
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
                setTimeout(() => this.updateDisplay(), 10);
            });
        }
        
        // Update display when deadline input changes
        if (this.elements.inputElement) {
            this.elements.inputElement.addEventListener('change', () => {
                const editElement = document.getElementById(`inline-edit-${this.fieldId}`);
                if (editElement && !editElement.classList.contains('d-none')) {
                    this.updateDisplay();
                }
            });
            
            this.elements.inputElement.addEventListener('input', () => {
                const editElement = document.getElementById(`inline-edit-${this.fieldId}`);
                if (editElement && !editElement.classList.contains('d-none')) {
                    this.updateDisplay();
                }
            });
        }
        
        // Use event delegation for "Today" button - attach to document
        // This ensures it works even if the edit element is hidden
        console.log('InlineDeadlineField: Setting up event delegation for today button on', this.fieldId, {
            editElement: !!this.elements.editElement,
            taskId: this.taskId,
            todayBtn: !!this.elements.todayBtn
        });
        
        // Store references for the event handler
        const fieldId = this.fieldId;
        const taskId = this.taskId;
        const instance = this;
        
        // Listen for click events on the document
        const clickHandler = function(e) {
            // Check if the clicked element is the today button for this task
            const todayBtn = e.target.closest('.btn-today[data-task-id]');
            if (todayBtn && todayBtn.dataset.taskId === taskId.toString()) {
                // Verify it's within our field's edit element
                const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
                if (fieldElement && fieldElement.contains(todayBtn)) {
                    e.preventDefault();
                    e.stopPropagation(); // Prevent TaskCardEditor from also handling this
                    console.log('InlineDeadlineField: Today button clicked via delegation', fieldId);
                    instance.setToday();
                }
            }
        };
        
        // Attach to document with capture phase
        document.addEventListener('click', clickHandler, true);
        
        // Store handler for potential cleanup
        this._todayButtonClickHandler = clickHandler;
    }
    
    /**
     * Set the deadline to today at 5:00 PM
     */
    setToday() {
        if (!this.elements.inputElement) {
            console.warn('InlineDeadlineField: Input element not found');
            return;
        }
        
        const today = new Date();
        today.setHours(17, 0, 0, 0); // 5:00 PM
        console.log('InlineDeadlineField: Setting today to', today);
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const hours = String(today.getHours()).padStart(2, '0');
        const minutes = String(today.getMinutes()).padStart(2, '0');
        const datetimeValue = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        this.elements.inputElement.value = datetimeValue;
        // Update display immediately
        setTimeout(() => this.updateDisplay(), 10);
    }
    
    /**
     * Update the display value from form inputs
     */
    updateDisplay() {
        if (!this.elements.inputElement || !this.elements.valueElement) {
            return;
        }
        
        const deadlineValue = this.elements.inputElement.value;
        if (!deadlineValue || deadlineValue === '') {
            this.elements.valueElement.textContent = 'no deadline';
            return;
        }
        
        // Convert datetime-local format (YYYY-MM-DDTHH:mm) to readable format
        const date = new Date(deadlineValue);
        if (isNaN(date.getTime())) {
            this.elements.valueElement.textContent = 'no deadline';
            return;
        }
        
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        this.elements.valueElement.textContent = 'deadline: ' + formattedDate;
    }
    
    /**
     * Format value for display
     */
    formatValue(value) {
        if (!value || value === '') return 'no deadline';
        
        // Convert datetime-local format (YYYY-MM-DDTHH:mm) to readable format
        const date = new Date(value);
        if (isNaN(date.getTime())) return 'no deadline';
        
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        return 'deadline: ' + formattedDate;
    }
    
    /**
     * Handle save - extracts deadline value and saves via TaskFieldSaver
     */
    async handleSave(newValue, oldValue, editor) {
        if (!this.elements.inputElement) return false;
        
        const deadlineValue = this.elements.inputElement.value || '';
        console.log('InlineDeadlineField: Saving deadline', { taskId: this.taskId, deadlineValue });
        const success = await TaskFieldSaver.saveField(this.taskId, 'deadline_at', deadlineValue);
        
        if (success) {
            console.log('InlineDeadlineField: Save successful, updating display');
            // Update display immediately and after a short delay to ensure DOM is ready
            this.updateDisplay();
            setTimeout(() => {
                this.updateDisplay();
            }, 100);
            
            // Update status field and CSS classes based on deadline
            if (window.TaskStatusManager) {
                window.TaskStatusManager.updateFromDeadline(this.taskId, deadlineValue);
            }
            
            return true;
        }
        
        console.warn('InlineDeadlineField: Save failed');
        return false;
    }
    
}

// Expose to window for global access
window.InlineDeadlineField = InlineDeadlineField;
