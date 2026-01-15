window.UniverseHeader = {
    components: {
        InlineEditableField: null,
        InlineEditableSelect: null
    },
    props: {
        universe: Object,
        statuses: Array,
        allUniverses: Array,
        isExpanded: Boolean,
        toggleExpand: Function,
    },
    data() {
        return {
            logTime: '',
            logTimeUnit: 'hours',
            logNotes: ''
        };
    },
    mounted() {
        // Debug: Check if props are received
        console.log('UniverseHeader mounted for universe:', this.universe.id);
        console.log('toggleExpand function:', this.toggleExpand);
        console.log('isExpanded prop:', this.isExpanded, 'type:', typeof this.isExpanded);
    },
    computed: {
        statusOptions() {
            const options = {};
            if (this.statuses && Array.isArray(this.statuses)) {
                this.statuses.forEach(status => {
                    options[status] = status.replace(/_/g, ' ');
                });
            }
            return options;
        },
        parentOptions() {
            const options = { '': '— none —' };
            if (this.allUniverses && Array.isArray(this.allUniverses)) {
                this.allUniverses.forEach(u => {
                    // Don't include current universe (can't be its own parent)
                    if (u.id !== this.universe.id) {
                        options[u.id] = u.name;
                    }
                });
            }
            return options;
        }
    },
    methods: {
        handleToggleClick() {
            console.log('UniverseHeader handleToggleClick called for universe:', this.universe.id);
            console.log('toggleExpand function:', this.toggleExpand);
            console.log('isExpanded prop value:', this.isExpanded);
            if (this.toggleExpand && typeof this.toggleExpand === 'function') {
                this.toggleExpand(this.universe.id);
            } else {
                console.error('toggleExpand is not a function!', this.toggleExpand);
            }
        },
        formatStatusValue(value) {
            if (!value) return '';
            return value.replace(/_/g, ' ');
        },
        formatParentValue(value) {
            if (!value || value === '' || value === null) {
                return 'no parent';
            }
            // Convert to number for comparison if needed
            const valueNum = typeof value === 'string' ? parseInt(value, 10) : value;
            // Find the parent name from allUniverses
            const parent = this.allUniverses?.find(u => {
                const uId = typeof u.id === 'string' ? parseInt(u.id, 10) : u.id;
                return uId === valueNum;
            });
            if (parent) {
                return 'child of ' + parent.name;
            }
            return 'no parent';
        },
        async handleParentSave(newValue, oldValue) {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            if (!csrfToken) {
                if (window.ErrorHandler) {
                    ErrorHandler.handleError(new Error('CSRF token not found'));
                } else {
                    console.error('CSRF token not found');
                }
                return false;
            }
            
            // Convert empty string to null (no parent)
            // Also convert to number if it's a string number
            const parentId = newValue === '' ? null : (typeof newValue === 'string' && newValue !== '' ? Number(newValue) : (typeof newValue === 'number' ? newValue : Number(newValue)));
            
            try {
                const response = await fetch(`/universes/${this.universe.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        name: this.universe.name,
                        status: this.universe.status,
                        parent_id: parentId,
                    })
                });
                
                let result;
                if (window.ErrorHandler && ErrorHandler.handleResponse) {
                    result = await ErrorHandler.handleResponse(response, {
                        defaultMessage: 'Error updating universe parent'
                    });
                } else {
                    const data = await response.json();
                    result = {
                        success: response.ok && data.success,
                        data: data
                    };
                    if (!result.success) {
                        alert(data.message || 'Error updating universe parent');
                    }
                }
                
                if (result.success) {
                    // Capture old parent ID BEFORE updating (normalize empty string to null, ensure it's a number)
                    let oldParentId = (this.universe.parent_id === '' || this.universe.parent_id === null || this.universe.parent_id === undefined) ? null : Number(this.universe.parent_id);
                    // Ensure newParentId is also a number or null
                    const newParentId = parentId === null ? null : Number(parentId);
                    const parentChanged = oldParentId !== newParentId;
                    
                    // Update local universe object immediately
                    this.universe.parent_id = parentId;
                    
                    // Emit event to update parent data
                    // Include flag if parent changed for movement handling
                    const updateData = {
                        id: this.universe.id,
                        parent_id: parentId === null ? '' : parentId,
                        parentChanged: parentChanged,
                        oldParentId: oldParentId,
                        newParentId: newParentId
                    };
                    
                    this.$emit('universe-updated', updateData);
                    return true;
                }
                return false;
            } catch (error) {
                if (window.ErrorHandler && ErrorHandler.handleError) {
                    ErrorHandler.handleError(error, {
                        context: 'updating universe parent',
                        showAlert: true
                    });
                } else {
                    console.error('Error updating universe parent:', error);
                    alert('Error: ' + (error.message || 'Error updating universe parent'));
                }
                return false;
            }
        },
        async handleDelete() {
            if (!confirm('Are you sure you want to delete this universe?')) {
                return;
            }
            
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            if (!csrfToken) {
                if (window.ErrorHandler) {
                    ErrorHandler.handleError(new Error('CSRF token not found'));
                } else {
                    console.error('CSRF token not found');
                }
                return;
            }
            
            try {
                const response = await fetch(`/universes/${this.universe.id}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                });
                
                let result;
                if (window.ErrorHandler && ErrorHandler.handleResponse) {
                    result = await ErrorHandler.handleResponse(response, {
                        defaultMessage: 'Error deleting universe'
                    });
                } else {
                    const data = await response.json();
                    result = {
                        success: response.ok,
                        data: data
                    };
                    if (!result.success) {
                        alert(data.message || 'Error deleting universe');
                    }
                }
                
                if (result.success) {
                    // Emit event to remove universe from parent data
                    this.$emit('universe-deleted', this.universe.id);
                }
            } catch (error) {
                if (window.ErrorHandler && ErrorHandler.handleError) {
                    ErrorHandler.handleError(error, {
                        context: 'deleting universe',
                        showAlert: true
                    });
                } else {
                    console.error('Error deleting universe:', error);
                    alert('Error: ' + (error.message || 'Error deleting universe'));
                }
            }
        },
        async handleStatusSave(newValue, oldValue) {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            if (!csrfToken) {
                if (window.ErrorHandler) {
                    ErrorHandler.handleError(new Error('CSRF token not found'));
                } else {
                    console.error('CSRF token not found');
                }
                return false;
            }
            
            try {
                const response = await fetch(`/universes/${this.universe.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        name: this.universe.name,
                        status: newValue,
                        parent_id: this.universe.parent_id,
                    })
                });
                
                let result;
                if (window.ErrorHandler && ErrorHandler.handleResponse) {
                    result = await ErrorHandler.handleResponse(response, {
                        defaultMessage: 'Error updating universe status'
                    });
                } else {
                    const data = await response.json();
                    result = {
                        success: response.ok && data.success,
                        data: data
                    };
                    if (!result.success) {
                        alert(data.message || 'Error updating universe status');
                    }
                }
                
                if (result.success) {
                    // Update local universe object immediately
                    this.universe.status = newValue;
                    // Emit event to update parent data
                    this.$emit('universe-updated', {
                        id: this.universe.id,
                        status: newValue
                    });
                    return true;
                }
                return false;
            } catch (error) {
                if (window.ErrorHandler && ErrorHandler.handleError) {
                    ErrorHandler.handleError(error, {
                        context: 'updating universe status',
                        showAlert: true
                    });
                } else {
                    console.error('Error updating universe status:', error);
                    alert('Error: ' + (error.message || 'Error updating universe status'));
                }
                return false;
            }
        },
        async handleNameSave(newValue, oldValue) {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            if (!csrfToken) {
                if (window.ErrorHandler) {
                    ErrorHandler.handleError(new Error('CSRF token not found'));
                } else {
                    console.error('CSRF token not found');
                }
                return false;
            }
            
            try {
                const response = await fetch(`/universes/${this.universe.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        name: newValue,
                        status: this.universe.status,
                        parent_id: this.universe.parent_id,
                    })
                });
                
                let result;
                if (window.ErrorHandler && ErrorHandler.handleResponse) {
                    result = await ErrorHandler.handleResponse(response, {
                        defaultMessage: 'Error updating universe name'
                    });
                } else {
                    // Fallback if ErrorHandler not available
                    const data = await response.json();
                    result = {
                        success: response.ok && data.success,
                        data: data
                    };
                    if (!result.success) {
                        alert(data.message || 'Error updating universe name');
                    }
                }
                
                if (result.success) {
                    // Update local universe object immediately
                    this.universe.name = newValue;
                    // Emit event to update parent data
                    this.$emit('universe-updated', {
                        id: this.universe.id,
                        name: newValue
                    });
                    return true;
                }
                return false;
            } catch (error) {
                if (window.ErrorHandler && ErrorHandler.handleError) {
                    ErrorHandler.handleError(error, {
                        context: 'updating universe name',
                        showAlert: true
                    });
                } else {
                    console.error('Error updating universe name:', error);
                    alert('Error: ' + (error.message || 'Error updating universe name'));
                }
                return false;
            }
        },
        async handleLogTime(event) {
            event.preventDefault();
            
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            if (!csrfToken) {
                if (window.ErrorHandler) {
                    ErrorHandler.handleError(new Error('CSRF token not found'));
                } else {
                    console.error('CSRF token not found');
                }
                return;
            }
            
            // Convert time to minutes
            let minutes = null;
            if (this.logTime && this.logTime !== '') {
                const timeValue = parseFloat(this.logTime);
                if (!isNaN(timeValue) && timeValue > 0) {
                    if (this.logTimeUnit === 'hours') {
                        minutes = Math.round(timeValue * 60);
                    } else {
                        minutes = Math.round(timeValue);
                    }
                }
            }
            
            try {
                const response = await fetch(`/universes/${this.universe.id}/log`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        minutes: minutes,
                        time_unit: this.logTimeUnit,
                        notes: this.logNotes || null
                    })
                });
                
                let result;
                if (window.ErrorHandler && ErrorHandler.handleResponse) {
                    result = await ErrorHandler.handleResponse(response, {
                        defaultMessage: 'Error logging time'
                    });
                } else {
                    const data = await response.json();
                    result = {
                        success: response.ok && data.success,
                        data: data
                    };
                    if (!result.success) {
                        alert(data.message || 'Error logging time');
                    }
                }
                
                if (result.success) {
                    // Clear form
                    this.logTime = '';
                    this.logNotes = '';
                    this.logTimeUnit = 'hours';
                    
                    // Show success message or refresh logs panel if needed
                    if (window.ErrorHandler && ErrorHandler.showSuccess) {
                        ErrorHandler.showSuccess('Time logged successfully');
                    }
                }
            } catch (error) {
                if (window.ErrorHandler && ErrorHandler.handleError) {
                    ErrorHandler.handleError(error, {
                        context: 'logging time',
                        showAlert: true
                    });
                } else {
                    console.error('Error logging time:', error);
                    alert('Error: ' + (error.message || 'Error logging time'));
                }
            }
        }
    },
    template: `
        <div :id="'universe-view-' + universe.id" 
             class="universe-header" 
             :class="{ 'd-none': isExpanded }"
             :data-parent-id="universe.parent_id || ''" 
             :data-universe-id="universe.id">
            <div class="universe-status-row">
                <div class="universe-status-display">{{ universe.status.replace(/_/g, ' ') }}</div>
                <button type="button" 
                        class="universe-edit-toggle-btn" 
                        :data-universe-id="universe.id" 
                        @click="handleToggleClick"
                        aria-label="Edit universe">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                    </svg>
                </button>
            </div>
            <div class="universe-name-row">
                <strong class="universe-name">{{ universe.name }}</strong>
            </div>
        </div>
        
        <!-- Expandable Edit Mode -->
        <div :id="'universe-edit-' + universe.id" 
             class="universe-edit-mode" 
             :class="{ 'd-none': !isExpanded }"
             :data-universe-id="universe.id">
            <div class="universe-edit-header">
                <button type="button" 
                        class="universe-close-edit-btn" 
                        :data-universe-id="universe.id" 
                        @click="handleToggleClick"
                        aria-label="Close">×</button>
            </div>
            
            <!-- Status Field -->
            <InlineEditableSelect
                :field-id="'universe-status-' + universe.id"
                label=""
                edit-mode-label="Status"
                :value="universe.status"
                :options="statusOptions"
                :format-value="formatStatusValue"
                :on-save="handleStatusSave"
            />
            
            <!-- Name Field -->
            <InlineEditableField
                :field-id="'universe-name-' + universe.id"
                label="Name"
                :value="universe.name"
                :on-save="handleNameSave"
                :required="true"
            />
            
            <!-- Parent Field -->
            <InlineEditableSelect
                :field-id="'universe-parent-' + universe.id"
                label="Parent"
                :value="universe.parent_id || ''"
                :options="parentOptions"
                :format-value="(val) => formatParentValue(val)"
                :on-save="handleParentSave"
            />
            
            <!-- Log Time Form -->
            <div class="universe-log-section">
                <h4 class="universe-log-title">Log Time</h4>
                <form class="universe-log-form" @submit.prevent="handleLogTime">
                    <div class="log-form-field">
                        <label class="log-form-label">Time:</label>
                        <div class="log-form-input-container">
                            <input 
                                type="number" 
                                :id="'log-minutes-' + universe.id"
                                v-model="logTime"
                                min="0" 
                                step="0.25"
                                placeholder="Optional" 
                                class="log-form-input"
                            >
                            <div class="log-form-radio-group">
                                <label class="log-form-radio-label">
                                    <input 
                                        type="radio" 
                                        :name="'time_unit-' + universe.id" 
                                        value="minutes" 
                                        :id="'log-time-unit-minutes-' + universe.id"
                                        v-model="logTimeUnit"
                                    >
                                    <span>Minutes</span>
                                </label>
                                <label class="log-form-radio-label">
                                    <input 
                                        type="radio" 
                                        :name="'time_unit-' + universe.id" 
                                        value="hours" 
                                        :id="'log-time-unit-hours-' + universe.id"
                                        v-model="logTimeUnit"
                                    >
                                    <span>Hours</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="log-form-field">
                        <label class="log-form-label">Notes:</label>
                        <textarea 
                            rows="4" 
                            placeholder="Optional" 
                            class="log-form-textarea"
                            v-model="logNotes"
                        ></textarea>
                    </div>
                    <div class="log-form-actions">
                        <button type="submit" class="log-form-submit-btn">Log</button>
                    </div>
                </form>
            </div>
            
            <!-- Delete Button -->
            <div class="universe-edit-actions">
                <button 
                    type="button" 
                    @click="handleDelete"
                >
                    Delete
                </button>
            </div>
        </div>
    `
};
