window.InlineEditableEstimatedTime = {
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
            default: null // in minutes
        },
        placeholder: {
            type: String,
            default: 'Not set'
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
            editValue: '', // in the selected unit
            editUnit: 'hours', // 'hours' or 'minutes'
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
    computed: {
        // Get step value based on selected unit
        stepValue() {
            return this.editUnit === 'hours' ? '0.25' : '1';
        }
    },
    methods: {
        // Initialize editValue and editUnit from the stored minutes value
        initializeFromValue() {
            if (!this.value || this.value === null) {
                this.editValue = '';
                this.editUnit = 'hours'; // Default to hours
                return;
            }
            
            // If >= 60 minutes, default to hours; otherwise minutes
            if (this.value >= 60) {
                this.editUnit = 'hours';
                this.editValue = (this.value / 60).toFixed(2).replace(/\.?0+$/, ''); // Remove trailing zeros
            } else {
                this.editUnit = 'minutes';
                this.editValue = String(this.value);
            }
        },
        // Update display value from stored minutes
        updateDisplayValue() {
            if (!this.value || this.value === null) {
                this.displayValue = this.placeholder;
                return;
            }
            
            if (this.value >= 60) {
                const hours = (this.value / 60).toFixed(2).replace(/\.?0+$/, '');
                this.displayValue = hours + ' hours';
            } else {
                this.displayValue = this.value + ' minutes';
            }
        },
        // Handle unit change - convert the current value
        handleUnitChange(newUnit) {
            if (!this.editValue || this.editValue === '') {
                this.editUnit = newUnit;
                return;
            }
            
            const numValue = parseFloat(this.editValue);
            if (isNaN(numValue)) {
                this.editUnit = newUnit;
                return;
            }
            
            // Convert between units
            if (this.editUnit === 'hours' && newUnit === 'minutes') {
                // Convert hours to minutes
                this.editValue = String(Math.round(numValue * 60));
            } else if (this.editUnit === 'minutes' && newUnit === 'hours') {
                // Convert minutes to hours
                this.editValue = (numValue / 60).toFixed(2).replace(/\.?0+$/, '');
            }
            
            this.editUnit = newUnit;
        },
        enterEditMode() {
            this.isEditing = true;
            this.initializeFromValue();
            // Focus the input after Vue updates
            this.$nextTick(() => {
                const input = this.$el.querySelector('.inline-field-time-input');
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
            const timeValue = this.editValue === '' ? null : parseFloat(this.editValue);
            
            // Validate
            if (this.editValue !== '' && (isNaN(timeValue) || timeValue < 0)) {
                alert('Please enter a valid time value');
                return;
            }
            
            // Convert to minutes for storage
            let minutes = null;
            if (timeValue !== null && !isNaN(timeValue)) {
                if (this.editUnit === 'hours') {
                    minutes = Math.round(timeValue * 60);
                } else {
                    minutes = Math.round(timeValue);
                }
            }
            
            // Call the onSave callback with minutes and unit
            if (this.onSave) {
                const success = await this.onSave(minutes, this.value, this.editUnit);
                if (success) {
                    this.isEditing = false;
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
            
            <!-- Edit Mode: Form input with unit selector -->
            <div 
                v-show="isEditing"
                :id="'inline-edit-' + fieldId" 
                class="inline-field-edit"
            >
                <div class="inline-field-time-container">
                    <input 
                        type="number" 
                        :id="'input-' + fieldId"
                        class="inline-field-input inline-field-time-input"
                        v-model="editValue"
                        :min="0"
                        :step="stepValue"
                        :required="required"
                        placeholder="Optional"
                    >
                    <div class="inline-field-unit-selector">
                        <label class="inline-field-radio-label">
                            <input 
                                type="radio" 
                                :name="'time_unit-' + fieldId" 
                                value="minutes" 
                                :id="'time-unit-minutes-' + fieldId"
                                :checked="editUnit === 'minutes'"
                                @change="handleUnitChange('minutes')"
                            >
                            <span>Minutes</span>
                        </label>
                        <label class="inline-field-radio-label">
                            <input 
                                type="radio" 
                                :name="'time_unit-' + fieldId" 
                                value="hours" 
                                :id="'time-unit-hours-' + fieldId"
                                :checked="editUnit === 'hours'"
                                @change="handleUnitChange('hours')"
                            >
                            <span>Hours</span>
                        </label>
                    </div>
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
