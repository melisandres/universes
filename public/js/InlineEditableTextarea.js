window.InlineEditableTextarea = {
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
            default: ''
        },
        placeholder: {
            type: String,
            default: 'Not set'
        },
        rows: {
            type: Number,
            default: 3
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
            editValue: '',
            displayValue: ''
        };
    },
    mounted() {
        this.displayValue = this.value || this.placeholder;
        this.editValue = this.value;
    },
    watch: {
        value(newValue) {
            this.displayValue = newValue || this.placeholder;
            this.editValue = newValue;
        }
    },
    methods: {
        enterEditMode() {
            this.isEditing = true;
            this.editValue = this.value;
            // Focus the textarea after Vue updates
            this.$nextTick(() => {
                const textarea = this.$el.querySelector('.inline-field-input');
                if (textarea) {
                    textarea.focus();
                }
            });
        },
        cancelEdit() {
            this.isEditing = false;
            this.editValue = this.value; // Reset to original saved value
            this.displayValue = this.value || this.placeholder; // Update display to show saved value
        },
        async save() {
            const newValue = this.editValue.trim();
            const oldValue = this.value;
            
            // Don't save if value hasn't changed
            if (newValue === oldValue) {
                this.cancelEdit();
                return;
            }
            
            // Call the onSave callback
            if (this.onSave) {
                const success = await this.onSave(newValue, oldValue);
                if (success) {
                    this.isEditing = false;
                    this.editValue = newValue; // Sync editValue with saved value
                    this.displayValue = newValue || this.placeholder;
                }
                // If save failed, stay in edit mode so user can fix it
            } else {
                this.cancelEdit();
            }
        },
        handleKeydown(event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.cancelEdit();
            }
            // Note: Enter key submits for input, but for textarea we allow Enter for new lines
            // User can use Ctrl+Enter or click Save button
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
                    @click="isEditing ? cancelEdit() : enterEditMode()"
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
            
            <!-- Edit Mode: Form textarea -->
            <div 
                v-if="isEditing"
                :id="'inline-edit-' + fieldId" 
                class="inline-field-edit"
            >
                <textarea 
                    :id="'input-' + fieldId"
                    class="inline-field-input"
                    v-model="editValue"
                    @keydown="handleKeydown"
                    :rows="rows"
                    :required="required"
                ></textarea>
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
