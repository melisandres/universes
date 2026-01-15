window.InlineEditableUniverses = {
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
            type: Array,
            default: () => [] // Array of { universe_id, is_primary }
        },
        allUniverses: {
            type: Array,
            required: true // Array of { id, name }
        },
        placeholder: {
            type: String,
            default: 'None'
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
            universeRows: [], // Array of { universeId: string, isPrimary: boolean, index: number }
            nextIndex: 0,
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
        },
        allUniverses() {
            // If universes list changes, update display
            this.updateDisplayValue();
        }
    },
    methods: {
        // Initialize universeRows from the value prop
        initializeFromValue() {
            if (!this.value || this.value.length === 0) {
                // If no universes, start with one empty row
                this.universeRows = [{ universeId: '', isPrimary: true, index: 0 }];
                this.nextIndex = 1;
                return;
            }
            
            // Sort by is_primary (primary first)
            const sorted = [...this.value].sort((a, b) => {
                if (a.is_primary && !b.is_primary) return -1;
                if (!a.is_primary && b.is_primary) return 1;
                return 0;
            });
            
            this.universeRows = sorted.map((item, idx) => ({
                universeId: String(item.universe_id),
                isPrimary: !!item.is_primary,
                index: idx
            }));
            this.nextIndex = this.universeRows.length;
        },
        // Update display value from universeRows
        updateDisplayValue() {
            if (this.universeRows.length === 0 || this.universeRows.every(row => !row.universeId)) {
                this.displayValue = this.placeholder;
                return;
            }
            
            const universeNames = [];
            this.universeRows.forEach(row => {
                if (row.universeId) {
                    const universe = this.allUniverses.find(u => String(u.id) === row.universeId);
                    if (universe) {
                        const name = row.isPrimary ? '★ ' + universe.name : universe.name;
                        universeNames.push(name);
                    }
                }
            });
            
            this.displayValue = universeNames.length > 0 ? universeNames.join(', ') : this.placeholder;
        },
        // Get available universes for a select (excluding already selected ones, except current)
        getAvailableUniverses(currentUniverseId) {
            const selectedIds = this.universeRows
                .map(row => row.universeId)
                .filter(id => id && id !== currentUniverseId);
            
            return this.allUniverses.map(universe => {
                const isDisabled = selectedIds.includes(String(universe.id));
                return {
                    id: universe.id,
                    name: universe.name,
                    disabled: isDisabled
                };
            });
        },
        // Add a new universe row
        addUniverseRow() {
            this.universeRows.push({
                universeId: '',
                isPrimary: false,
                index: this.nextIndex++
            });
        },
        // Remove a universe row
        removeUniverseRow(index) {
            if (this.universeRows.length <= 1) {
                alert('At least one universe is required');
                return;
            }
            
            const row = this.universeRows.find(r => r.index === index);
            if (row && row.isPrimary) {
                // If removing the primary, make the first remaining universe primary
                const remaining = this.universeRows.filter(r => r.index !== index);
                if (remaining.length > 0) {
                    remaining[0].isPrimary = true;
                }
            }
            
            this.universeRows = this.universeRows.filter(r => r.index !== index);
            this.updateDisplayValue();
        },
        // Handle universe selection change
        handleUniverseChange(rowIndex, newUniverseId) {
            const row = this.universeRows.find(r => r.index === rowIndex);
            if (!row) return;
            
            // Check for duplicates
            const isDuplicate = this.universeRows.some(r => 
                r.index !== rowIndex && r.universeId === newUniverseId && newUniverseId !== ''
            );
            
            if (isDuplicate) {
                alert('This universe is already selected. Please choose a different universe.');
                row.universeId = '';
                return;
            }
            
            row.universeId = newUniverseId;
            this.updateDisplayValue();
        },
        // Handle primary radio change
        handlePrimaryChange(rowIndex) {
            // Set all to false, then set the selected one to true
            this.universeRows.forEach(row => {
                row.isPrimary = (row.index === rowIndex);
            });
            this.updateDisplayValue();
        },
        enterEditMode() {
            this.isEditing = true;
            this.initializeFromValue();
        },
        cancelEdit() {
            this.isEditing = false;
            this.initializeFromValue(); // Reset to original saved value
            this.updateDisplayValue(); // Update display to show saved value
        },
        async save() {
            // Validate: at least one universe must be selected
            const selectedRows = this.universeRows.filter(row => row.universeId && row.universeId !== '');
            if (selectedRows.length === 0) {
                alert('At least one universe is required');
                return;
            }
            
            // Validate: exactly one primary
            const primaryRows = selectedRows.filter(row => row.isPrimary);
            if (primaryRows.length !== 1) {
                alert('Exactly one universe must be marked as primary');
                return;
            }
            
            // Build universe_ids array and find primary index
            const universeIds = selectedRows.map(row => parseInt(row.universeId, 10));
            const primaryIndex = universeIds.findIndex(id => {
                const row = selectedRows.find(r => String(r.universeId) === String(id));
                return row && row.isPrimary;
            });
            
            // Call the onSave callback
            if (this.onSave) {
                const success = await this.onSave(universeIds, primaryIndex, this.value);
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
            
            <!-- Edit Mode: Multiple universe selection -->
            <div 
                v-if="isEditing"
                :id="'inline-edit-' + fieldId" 
                class="inline-field-edit"
            >
                <div class="inline-field-universes-container" :id="'universes-container-' + fieldId.replace('universes-', '')">
                    <div 
                        v-for="row in universeRows" 
                        :key="row.index"
                        class="universe-item-row inline-universe-item-row"
                        :data-index="row.index"
                    >
                        <select 
                            :id="'universe-select-' + row.index"
                            name="universe_ids[]"
                            class="universe-select inline-universe-select"
                            v-model="row.universeId"
                            @change="handleUniverseChange(row.index, row.universeId)"
                            :required="required"
                        >
                            <option value="">— select universe —</option>
                            <option 
                                v-for="universe in getAvailableUniverses(row.universeId)"
                                :key="universe.id"
                                :value="String(universe.id)"
                                :disabled="universe.disabled"
                            >
                                {{ universe.name }}
                            </option>
                        </select>
                        <label class="inline-universe-primary-label">
                            <input 
                                type="radio" 
                                :name="'primary_universe-' + fieldId"
                                :value="row.index"
                                :checked="row.isPrimary"
                                @change="handlePrimaryChange(row.index)"
                            >
                            Primary
                        </label>
                        <button 
                            type="button" 
                            class="remove-universe-btn inline-universe-remove-btn"
                            :data-task-id="fieldId.replace('universes-', '')"
                            @click="removeUniverseRow(row.index)"
                        >
                            Remove
                        </button>
                    </div>
                </div>
                <button 
                    type="button" 
                    class="add-universe-btn inline-universe-add-btn"
                    :data-task-id="fieldId.replace('universes-', '')"
                    @click="addUniverseRow"
                >
                    + Add Universe
                </button>
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
