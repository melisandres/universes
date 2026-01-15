window.InlineEditableDeadline = {
    props: {
        fieldId: {
            type: String,
            required: true
        },
        label: {
            type: String,
            default: ''
        },
        editModeLabel: {
            type: String,
            default: ''
        },
        value: {
            type: String,
            default: null // ISO datetime string or null
        },
        placeholder: {
            type: String,
            default: 'no deadline'
        },
        required: {
            type: Boolean,
            default: false
        },
        onSave: {
            type: Function,
            required: true
        }
    },
    data() {
        return {
            isEditing: false,
            editValue: '', // datetime-local format (YYYY-MM-DDTHH:mm)
            displayValue: ''
        };
    },
    mounted() {
        this.initializeFromValue();
        this.updateDisplayValue();
    },
    watch: {
        value(newValue) {
            this.initializeFromValue();
            this.updateDisplayValue();
        }
    },
    methods: {
        // Initialize editValue from the stored datetime value
        initializeFromValue() {
            if (!this.value || this.value === null || this.value === '') {
                this.editValue = '';
                return;
            }
            
            // Convert ISO datetime string to datetime-local format
            // Input might be ISO string (2024-01-15T17:00:00) or datetime-local (2024-01-15T17:00)
            const date = new Date(this.value);
            if (isNaN(date.getTime())) {
                this.editValue = '';
                return;
            }
            
            // Format as YYYY-MM-DDTHH:mm for datetime-local input
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            this.editValue = `${year}-${month}-${day}T${hours}:${minutes}`;
        },
        // Update display value from stored datetime
        updateDisplayValue() {
            if (!this.value || this.value === null || this.value === '') {
                this.displayValue = this.placeholder;
                return;
            }
            
            const date = new Date(this.value);
            if (isNaN(date.getTime())) {
                this.displayValue = this.placeholder;
                return;
            }
            
            // Format as "deadline: MMM DD, YYYY, HH:MM AM/PM"
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            
            this.displayValue = 'deadline: ' + formattedDate;
        },
        // Set deadline to today at 5:00 PM
        setToday() {
            const today = new Date();
            today.setHours(17, 0, 0, 0); // 5:00 PM
            
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const hours = String(today.getHours()).padStart(2, '0');
            const minutes = String(today.getMinutes()).padStart(2, '0');
            this.editValue = `${year}-${month}-${day}T${hours}:${minutes}`;
        },
        enterEditMode() {
            this.isEditing = true;
            this.initializeFromValue();
            // Focus the input after Vue updates
            this.$nextTick(() => {
                const input = this.$el.querySelector('.inline-field-deadline-input');
                if (input) {
                    input.focus();
                }
            });
        },
        cancelEdit() {
            this.isEditing = false;
            this.initializeFromValue(); // Reset to original saved value
            this.updateDisplayValue(); // Update display to show saved value
        },
        async save() {
            const deadlineValue = this.editValue === '' ? null : this.editValue;
            
            // If not empty, validate the date
            if (deadlineValue) {
                const date = new Date(deadlineValue);
                if (isNaN(date.getTime())) {
                    alert('Please enter a valid date and time');
                    return;
                }
            }
            
            // Convert datetime-local to ISO string for storage
            let isoValue = null;
            if (deadlineValue) {
                const date = new Date(deadlineValue);
                isoValue = date.toISOString();
            }
            
            // Call the onSave callback
            if (this.onSave) {
                const success = await this.onSave(isoValue, this.value);
                if (success) {
                    this.isEditing = false;
                    this.updateDisplayValue();
                    
                    // Update task status based on deadline if TaskStatusManager is available
                    if (window.TaskStatusManager && window.TaskStatusManager.updateFromDeadline) {
                        // Extract task ID from fieldId (format: 'deadline-{taskId}')
                        const taskIdMatch = this.fieldId.match(/deadline-(\d+)/);
                        if (taskIdMatch) {
                            const taskId = parseInt(taskIdMatch[1], 10);
                            window.TaskStatusManager.updateFromDeadline(taskId, deadlineValue || '');
                        }
                    }
                }
                // If save failed, stay in edit mode
            } else {
                this.cancelEdit();
            }
        }
    },
    template: `
        <div class="inline-editable-field" :data-field-id="fieldId">
            <!-- Label and Pencil (always visible if label exists, or visible in edit mode if editModeLabel exists) -->
            <div v-if="label || (editModeLabel && isEditing)" class="inline-field-label-row">
                <label class="inline-field-label">{{ label || editModeLabel }}</label>
                <button 
                    type="button" 
                    class="inline-field-edit-btn" 
                    :class="{ 'inline-field-cancel-btn': isEditing }"
                    :data-field-id="fieldId" 
                    :aria-label="isEditing ? 'Cancel' : 'Edit ' + (label || editModeLabel)"
                    @click.stop="isEditing ? cancelEdit() : enterEditMode()"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                    </svg>
                </button>
            </div>
            
            <!-- View Mode: Display value -->
            <div 
                v-if="!isEditing"
                :id="'inline-view-' + fieldId" 
                :class="['inline-field-view', { 'inline-field-view-no-label': !label }]"
            >
                <template v-if="!label">
                    <span class="inline-field-value" :data-placeholder="placeholder">{{ displayValue }}</span>
                    <button 
                        type="button" 
                        class="inline-field-edit-btn" 
                        :data-field-id="fieldId" 
                        aria-label="Edit"
                        @click.stop="enterEditMode()"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                    </button>
                </template>
                <template v-else>
                    <span class="inline-field-value" :data-placeholder="placeholder">{{ displayValue }}</span>
                </template>
            </div>
            
            <!-- Edit Mode: Datetime input with "Today" button -->
            <div 
                v-if="isEditing"
                :id="'inline-edit-' + fieldId" 
                class="inline-field-edit"
            >
                <div class="inline-field-deadline-container">
                    <input 
                        type="datetime-local" 
                        :id="'input-' + fieldId"
                        class="inline-field-input inline-field-deadline-input"
                        v-model="editValue"
                        :required="required"
                    >
                    <button 
                        type="button" 
                        class="btn-today" 
                        :data-task-id="fieldId.replace('deadline-', '')"
                        @click="setToday"
                    >
                        Today
                    </button>
                </div>
                <div class="inline-field-actions">
                    <button 
                        type="button" 
                        class="inline-field-save-btn" 
                        :data-field-id="fieldId"
                        @click="save"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    `
};
