window.InlineEditableRecurringTask = {
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
            type: Number,
            default: null
        },
        placeholder: {
            type: String,
            default: 'Not set'
        },
        recurringTasks: {
            type: Array,
            default: () => []
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
    computed: {
        // Convert recurringTasks array to options object for select
        options() {
            const opts = { '': this.placeholder };
            if (this.recurringTasks && Array.isArray(this.recurringTasks)) {
                this.recurringTasks.forEach(task => {
                    if (task && task.id !== undefined && task.name) {
                        opts[task.id] = task.name;
                    }
                });
            }
            return opts;
        }
    },
    mounted() {
        this.updateDisplayValue();
        this.editValue = this.value ? String(this.value) : '';
    },
    watch: {
        value(newValue) {
            // Update editValue and displayValue when prop changes
            this.editValue = newValue ? String(newValue) : '';
            this.updateDisplayValue();
        },
        recurringTasks() {
            this.updateDisplayValue();
        }
    },
    methods: {
        updateDisplayValue() {
            if (!this.value || this.value === null) {
                this.displayValue = this.placeholder;
                return;
            }
            
            // Find the recurring task by ID
            const task = this.recurringTasks?.find(t => t && t.id === this.value);
            if (task && task.name) {
                this.displayValue = task.name;
            } else {
                this.displayValue = this.placeholder;
            }
        },
        enterEditMode() {
            this.isEditing = true;
            this.editValue = this.value ? String(this.value) : '';
            // Focus the select after Vue updates
            this.$nextTick(() => {
                const select = this.$el.querySelector('.inline-field-input');
                if (select) {
                    select.focus();
                }
            });
        },
        cancelEdit() {
            this.isEditing = false;
            this.editValue = this.value ? String(this.value) : ''; // Reset to original saved value
            this.updateDisplayValue(); // Update display to show saved value
        },
        async save() {
            const newValue = this.editValue === '' ? null : parseInt(this.editValue, 10);
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
                    this.editValue = newValue ? String(newValue) : ''; // Sync editValue with saved value
                    this.updateDisplayValue();
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
                    @click="isEditing ? cancelEdit() : enterEditMode()"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                    </svg>
                </button>
            </div>
            
            <!-- View Mode: Display value -->
            <div 
                v-show="!isEditing"
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
                        @click="enterEditMode()"
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
            
            <!-- Edit Mode: Form select -->
            <div 
                v-show="isEditing"
                :id="'inline-edit-' + fieldId" 
                class="inline-field-edit"
            >
                <select 
                    :id="'input-' + fieldId"
                    class="inline-field-input"
                    v-model="editValue"
                    :required="required"
                >
                    <option 
                        v-for="(optionLabel, optionValue) in options" 
                        :key="optionValue" 
                        :value="optionValue"
                    >
                        {{ optionLabel }}
                    </option>
                </select>
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
