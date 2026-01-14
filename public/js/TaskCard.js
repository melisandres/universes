window.TaskCard = {
    components: {
        InlineEditableField: null,
        InlineEditableTextarea: null,
        InlineEditableRecurringTask: null,
        InlineEditableEstimatedTime: null,
        InlineEditableDeadline: null,
        InlineEditableUniverses: null
    },
    props: {
        task: Object,
        recurringTasks: Array,
        allUniverses: Array,
        expandedTaskIds: Array,
        toggleTaskExpand: Function,
    },
    computed: {
        computedStatus() {
            // Priority: completed > skipped > late > open
            if (this.task.completed_at) {
                return 'completed';
            }
            if (this.task.skipped_at) {
                return 'skipped';
            }
            // Check if status is explicitly 'late'
            if (this.task.status === 'late') {
                return 'late';
            }
            // Check deadline to determine if task is late
            if (this.task.deadline_at) {
                const deadline = new Date(this.task.deadline_at);
                const now = new Date();
                // Compare dates (ignore time for "today" check)
                const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                // If deadline is before today, it's "late"
                if (deadlineDate < today) {
                    return 'late';
                }
            }
            // Return the stored status or default to 'open'
            return this.task.status || this.task.computed_status || 'open';
        },
        isRecurring() {
            return !!this.task.recurring_task_id;
        },
        isCompleted() {
            return !!this.task.completed_at;
        },
        isSkipped() {
            return !!this.task.skipped_at;
        },
        isExpanded() {
            return this.expandedTaskIds && this.expandedTaskIds.includes(this.task.id);
        },
        shouldAutoEditName() {
            // Auto-edit name field if task name is the default "new task"
            return this.task.name === 'new task';
        }
    },
    data() {
        // Restore form state from task object if it exists (for task movement)
        const formState = this.task._formState || {};
        return {
            logTime: formState.logTime || '',
            logTimeUnit: formState.logTimeUnit || 'hours',
            logNotes: formState.logNotes || ''
        };
    },
    mounted() {
        // Restore form state after component is mounted (for task movement)
        if (this.task._formState) {
            // Restore log form fields
            this.logTime = this.task._formState.logTime || '';
            this.logTimeUnit = this.task._formState.logTimeUnit || 'hours';
            this.logNotes = this.task._formState.logNotes || '';
            
            // Restore inline editable field values by updating task properties
            // Then trigger edit mode for fields that were being edited
            const fieldsToRestore = {
                'name': 'task-name',
                'description': 'task-description',
                'recurring-task': 'recurring-task',
                'estimated-time': 'estimated-time',
                'deadline': 'deadline'
            };
            
            // Update task properties with unsaved values (if they exist)
            Object.keys(fieldsToRestore).forEach(fieldName => {
                const unsavedValue = this.task._formState[fieldName];
                if (unsavedValue !== undefined) {
                    // Map field names to task properties
                    if (fieldName === 'name') {
                        this.task.name = unsavedValue;
                    } else if (fieldName === 'description') {
                        this.task.description = unsavedValue;
                    } else if (fieldName === 'recurring-task') {
                        this.task.recurring_task_id = unsavedValue ? parseInt(unsavedValue) : null;
                    } else if (fieldName === 'estimated-time') {
                        // Estimated time might need special handling
                        // For now, just store it
                    } else if (fieldName === 'deadline') {
                        this.task.deadline_at = unsavedValue || null;
                    }
                }
            });
            
            // After Vue updates, enter edit mode for fields that were being edited
            this.$nextTick(() => {
                const taskId = this.task.id;
                Object.keys(fieldsToRestore).forEach(fieldName => {
                    const fieldId = fieldsToRestore[fieldName] + '-' + taskId;
                    const isEditing = this.task._formState[fieldName + '_isEditing'];
                    
                    if (isEditing) {
                        // Enter edit mode by clicking the edit button
                        setTimeout(() => {
                            const editBtn = document.querySelector(`[data-field-id="${fieldId}"].inline-field-edit-btn:not(.inline-field-cancel-btn)`);
                            if (editBtn) {
                                editBtn.click();
                            }
                        }, 100);
                    }
                });
            });
        }
    },
    methods: {
        handleTaskNameClick(event) {
            event.preventDefault();
            event.stopPropagation();
            this.toggleTaskExpand(this.task.id);
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
            
            // Get universe_ids from task - check both possible property names
            const universeItems = this.task.universe_items || this.task.universeItems || [];
            const universeIds = universeItems.length > 0 
                ? universeItems.map(ui => ui.universe_id)
                : [this.task.universe_id] || [1]; // Fallback to universe 1 if none found
            
            // Find primary universe index
            let primaryIndex = 0;
            if (universeItems.length > 0) {
                const primaryItem = universeItems.find(ui => ui.is_primary);
                if (primaryItem) {
                    primaryIndex = universeItems.findIndex(ui => ui.universe_id === primaryItem.universe_id);
                }
            }
            
            try {
                const response = await fetch(`/tasks/${this.task.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        name: newValue,
                        description: this.task.description || '',
                        universe_ids: universeIds,
                        primary_universe: primaryIndex,
                    })
                });
                
                let result;
                if (window.ErrorHandler && ErrorHandler.handleResponse) {
                    result = await ErrorHandler.handleResponse(response, {
                        defaultMessage: 'Error updating task name'
                    });
                } else {
                    const data = await response.json();
                    result = {
                        success: response.ok && data.success,
                        data: data
                    };
                    if (!result.success) {
                        alert(data.message || 'Error updating task name');
                    }
                }
                
                if (result.success) {
                    // Emit event to update parent data
                    this.$emit('task-updated', {
                        id: this.task.id,
                        name: newValue
                    });
                    return true;
                }
                return false;
            } catch (error) {
                if (window.ErrorHandler && ErrorHandler.handleError) {
                    ErrorHandler.handleError(error, {
                        context: 'updating task name',
                        showAlert: true
                    });
                } else {
                    console.error('Error updating task name:', error);
                    alert('Error: ' + (error.message || 'Error updating task name'));
                }
                return false;
            }
        },
        async handleDescriptionSave(newValue, oldValue) {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            if (!csrfToken) {
                if (window.ErrorHandler) {
                    ErrorHandler.handleError(new Error('CSRF token not found'));
                } else {
                    console.error('CSRF token not found');
                }
                return false;
            }
            
            // Get universe_ids from task
            const universeItems = this.task.universe_items || this.task.universeItems || [];
            const universeIds = universeItems.length > 0 
                ? universeItems.map(ui => ui.universe_id)
                : [this.task.universe_id] || [1];
            
            // Find primary universe index
            let primaryIndex = 0;
            if (universeItems.length > 0) {
                const primaryItem = universeItems.find(ui => ui.is_primary);
                if (primaryItem) {
                    primaryIndex = universeItems.findIndex(ui => ui.universe_id === primaryItem.universe_id);
                }
            }
            
            try {
                const response = await fetch(`/tasks/${this.task.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        name: this.task.name,
                        description: newValue,
                        universe_ids: universeIds,
                        primary_universe: primaryIndex,
                    })
                });
                
                let result;
                if (window.ErrorHandler && ErrorHandler.handleResponse) {
                    result = await ErrorHandler.handleResponse(response, {
                        defaultMessage: 'Error updating task description'
                    });
                } else {
                    const data = await response.json();
                    result = {
                        success: response.ok && data.success,
                        data: data
                    };
                    if (!result.success) {
                        alert(data.message || 'Error updating task description');
                    }
                }
                
                if (result.success) {
                    this.$emit('task-updated', {
                        id: this.task.id,
                        description: newValue
                    });
                    return true;
                }
                return false;
            } catch (error) {
                if (window.ErrorHandler && ErrorHandler.handleError) {
                    ErrorHandler.handleError(error, {
                        context: 'updating task description',
                        showAlert: true
                    });
                } else {
                    console.error('Error updating task description:', error);
                    alert('Error: ' + (error.message || 'Error updating task description'));
                }
                return false;
            }
        },
        async handleRecurringTaskSave(newValue, oldValue) {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            if (!csrfToken) {
                if (window.ErrorHandler) {
                    ErrorHandler.handleError(new Error('CSRF token not found'));
                } else {
                    console.error('CSRF token not found');
                }
                return false;
            }
            
            // Convert empty string/null to null (no recurring task)
            const recurringTaskId = newValue === '' || newValue === null ? null : parseInt(newValue, 10);
            
            // Get universe_ids from task
            const universeItems = this.task.universe_items || this.task.universeItems || [];
            const universeIds = universeItems.length > 0 
                ? universeItems.map(ui => ui.universe_id)
                : [this.task.universe_id] || [1];
            
            // Find primary universe index
            let primaryIndex = 0;
            if (universeItems.length > 0) {
                const primaryItem = universeItems.find(ui => ui.is_primary);
                if (primaryItem) {
                    primaryIndex = universeItems.findIndex(ui => ui.universe_id === primaryItem.universe_id);
                }
            }
            
            try {
                const response = await fetch(`/tasks/${this.task.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        name: this.task.name,
                        description: this.task.description || '',
                        universe_ids: universeIds,
                        primary_universe: primaryIndex,
                        recurring_task_id: recurringTaskId,
                    })
                });
                
                let result;
                if (window.ErrorHandler && ErrorHandler.handleResponse) {
                    result = await ErrorHandler.handleResponse(response, {
                        defaultMessage: 'Error updating recurring task'
                    });
                } else {
                    const data = await response.json();
                    result = {
                        success: response.ok && data.success,
                        data: data
                    };
                    if (!result.success) {
                        alert(data.message || 'Error updating recurring task');
                    }
                }
                
                if (result.success) {
                    // Update local task object
                    this.task.recurring_task_id = recurringTaskId;
                    // Emit event to update parent data
                    this.$emit('task-updated', {
                        id: this.task.id,
                        recurring_task_id: recurringTaskId
                    });
                    return true;
                }
                return false;
            } catch (error) {
                if (window.ErrorHandler && ErrorHandler.handleError) {
                    ErrorHandler.handleError(error, {
                        context: 'updating recurring task',
                        showAlert: true
                    });
                } else {
                    console.error('Error updating recurring task:', error);
                    alert('Error: ' + (error.message || 'Error updating recurring task'));
                }
                return false;
            }
        },
        async handleEstimatedTimeSave(minutes, oldMinutes, timeUnit) {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            if (!csrfToken) {
                if (window.ErrorHandler) {
                    ErrorHandler.handleError(new Error('CSRF token not found'));
                } else {
                    console.error('CSRF token not found');
                }
                return false;
            }
            
            // Get universe_ids from task
            const universeItems = this.task.universe_items || this.task.universeItems || [];
            const universeIds = universeItems.length > 0 
                ? universeItems.map(ui => ui.universe_id)
                : [this.task.universe_id] || [1];
            
            // Find primary universe index
            let primaryIndex = 0;
            if (universeItems.length > 0) {
                const primaryItem = universeItems.find(ui => ui.is_primary);
                if (primaryItem) {
                    primaryIndex = universeItems.findIndex(ui => ui.universe_id === primaryItem.universe_id);
                }
            }
            
            try {
                const response = await fetch(`/tasks/${this.task.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        name: this.task.name,
                        description: this.task.description || '',
                        universe_ids: universeIds,
                        primary_universe: primaryIndex,
                        estimated_time: minutes,
                        time_unit: timeUnit || 'hours',
                    })
                });
                
                let result;
                if (window.ErrorHandler && ErrorHandler.handleResponse) {
                    result = await ErrorHandler.handleResponse(response, {
                        defaultMessage: 'Error updating estimated time'
                    });
                } else {
                    const data = await response.json();
                    result = {
                        success: response.ok && data.success,
                        data: data
                    };
                    if (!result.success) {
                        alert(data.message || 'Error updating estimated time');
                    }
                }
                
                if (result.success) {
                    // Update local task object
                    this.task.estimated_time = minutes;
                    // Emit event to update parent data
                    this.$emit('task-updated', {
                        id: this.task.id,
                        estimated_time: minutes
                    });
                    return true;
                }
                return false;
            } catch (error) {
                if (window.ErrorHandler && ErrorHandler.handleError) {
                    ErrorHandler.handleError(error, {
                        context: 'updating estimated time',
                        showAlert: true
                    });
                } else {
                    console.error('Error updating estimated time:', error);
                    alert('Error: ' + (error.message || 'Error updating estimated time'));
                }
                return false;
            }
        },
        async handleDeadlineSave(isoValue, oldIsoValue) {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            if (!csrfToken) {
                if (window.ErrorHandler) {
                    ErrorHandler.handleError(new Error('CSRF token not found'));
                } else {
                    console.error('CSRF token not found');
                }
                return false;
            }
            
            // Get universe_ids from task
            const universeItems = this.task.universe_items || this.task.universeItems || [];
            const universeIds = universeItems.length > 0 
                ? universeItems.map(ui => ui.universe_id)
                : [this.task.universe_id] || [1];
            
            // Find primary universe index
            let primaryIndex = 0;
            if (universeItems.length > 0) {
                const primaryItem = universeItems.find(ui => ui.is_primary);
                if (primaryItem) {
                    primaryIndex = universeItems.findIndex(ui => ui.universe_id === primaryItem.universe_id);
                }
            }
            
            try {
                // Convert ISO string to datetime-local format for the API
                let deadlineValue = null;
                if (isoValue) {
                    const date = new Date(isoValue);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    deadlineValue = `${year}-${month}-${day}T${hours}:${minutes}`;
                }
                
                const response = await fetch(`/tasks/${this.task.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        name: this.task.name,
                        description: this.task.description || '',
                        universe_ids: universeIds,
                        primary_universe: primaryIndex,
                        deadline_at: deadlineValue,
                    })
                });
                
                let result;
                if (window.ErrorHandler && ErrorHandler.handleResponse) {
                    result = await ErrorHandler.handleResponse(response, {
                        defaultMessage: 'Error updating deadline'
                    });
                } else {
                    const data = await response.json();
                    result = {
                        success: response.ok && data.success,
                        data: data
                    };
                    if (!result.success) {
                        alert(data.message || 'Error updating deadline');
                    }
                }
                
                if (result.success) {
                    // Update local task object
                    this.task.deadline_at = isoValue;
                    // Recalculate status based on deadline
                    this.updateStatusFromDeadline(isoValue);
                    // Emit event to update parent data
                    this.$emit('task-updated', {
                        id: this.task.id,
                        deadline_at: isoValue,
                        status: this.task.status,
                        computed_status: this.computedStatus
                    });
                    return true;
                }
                return false;
            } catch (error) {
                if (window.ErrorHandler && ErrorHandler.handleError) {
                    ErrorHandler.handleError(error, {
                        context: 'updating deadline',
                        showAlert: true
                    });
                } else {
                    console.error('Error updating deadline:', error);
                    alert('Error: ' + (error.message || 'Error updating deadline'));
                }
                return false;
            }
        },
        // Capture unsaved edit values from all inline editable fields
        captureUnsavedEditValues() {
            const formState = {
                logTime: this.logTime,
                logTimeUnit: this.logTimeUnit,
                logNotes: this.logNotes
            };
            
            // Capture values from inline editable fields by querying their input elements
            // These fields use field-id pattern: 'task-{field}-{taskId}'
            const taskId = this.task.id;
            const fieldIds = [
                'task-name-' + taskId,
                'task-description-' + taskId,
                'recurring-task-' + taskId,
                'estimated-time-' + taskId,
                'deadline-' + taskId
            ];
            
            fieldIds.forEach(fieldId => {
                const input = document.getElementById('input-' + fieldId);
                if (input) {
                    const fieldName = fieldId.replace('task-', '').replace('-' + taskId, '');
                    // Check if the field is in edit mode by checking if edit div is visible
                    const editDiv = document.getElementById('inline-edit-' + fieldId);
                    if (editDiv) {
                        const isVisible = editDiv.offsetParent !== null && 
                                         !editDiv.classList.contains('d-none') &&
                                         window.getComputedStyle(editDiv).display !== 'none';
                        
                        if (isVisible) {
                            formState[fieldName] = input.value;
                            formState[fieldName + '_isEditing'] = true;
                            console.log(`Captured unsaved value for ${fieldName}:`, input.value);
                        }
                    }
                }
            });
            
            console.log('Captured form state:', formState);
            return formState;
        },
        async handleUniversesSave(universeIds, primaryIndex, oldUniverseItems) {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            if (!csrfToken) {
                if (window.ErrorHandler) {
                    ErrorHandler.handleError(new Error('CSRF token not found'));
                } else {
                    console.error('CSRF token not found');
                }
                return false;
            }
            
            // Get old primary universe ID (ensure it's a number for comparison)
            const oldPrimaryUniverseId = oldUniverseItems && oldUniverseItems.length > 0
                ? Number(oldUniverseItems.find(item => item.is_primary)?.universe_id)
                : null;
            
            // Get new primary universe ID (ensure it's a number for comparison)
            const newPrimaryUniverseId = Number(universeIds[primaryIndex]);
            
            console.log('Universe save - checking for primary change:', {
                oldPrimaryUniverseId,
                newPrimaryUniverseId,
                oldUniverseItems,
                universeIds,
                primaryIndex,
                willChange: oldPrimaryUniverseId && newPrimaryUniverseId && oldPrimaryUniverseId !== newPrimaryUniverseId
            });
            
            try {
                const response = await fetch(`/tasks/${this.task.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        name: this.task.name,
                        description: this.task.description || '',
                        universe_ids: universeIds,
                        primary_universe: primaryIndex,
                    })
                });
                
                let result;
                if (window.ErrorHandler && ErrorHandler.handleResponse) {
                    result = await ErrorHandler.handleResponse(response, {
                        defaultMessage: 'Error updating universes'
                    });
                } else {
                    const data = await response.json();
                    result = {
                        success: response.ok && data.success,
                        data: data
                    };
                    if (!result.success) {
                        alert(data.message || 'Error updating universes');
                    }
                }
                
                if (result.success) {
                    // Update local task object with new universe_items
                    const newUniverseItems = universeIds.map((universeId, index) => ({
                        universe_id: universeId,
                        is_primary: index === primaryIndex
                    }));
                    this.task.universe_items = newUniverseItems;
                    this.task.universeItems = newUniverseItems;
                    
                    // Check if primary universe actually changed
                    const primaryUniverseChanged = oldPrimaryUniverseId && newPrimaryUniverseId && 
                                                   oldPrimaryUniverseId !== newPrimaryUniverseId;
                    
                    console.log('Emitting task-updated event:', {
                        taskId: this.task.id,
                        primaryUniverseChanged,
                        oldPrimaryUniverseId,
                        newPrimaryUniverseId
                    });
                    
                    // Capture all unsaved edit values before emitting
                    // Use $nextTick to ensure DOM is fully rendered, then capture
                    this.$nextTick(() => {
                        const formState = this.captureUnsavedEditValues();
                        
                        // Emit event to update parent data
                        this.$emit('task-updated', {
                            id: this.task.id,
                            name: this.task.name,
                            description: this.task.description,
                            status: this.task.status,
                            computed_status: this.computedStatus,
                            deadline_at: this.task.deadline_at,
                            estimated_time: this.task.estimated_time,
                            recurring_task_id: this.task.recurring_task_id,
                            completed_at: this.task.completed_at,
                            skipped_at: this.task.skipped_at,
                            universe_items: newUniverseItems,
                            universeItems: newUniverseItems,
                            // Include form state to preserve unsaved form fields
                            _formState: formState,
                            // Include flag if primary universe changed
                            primaryUniverseChanged: primaryUniverseChanged,
                            oldPrimaryUniverseId: oldPrimaryUniverseId,
                            newPrimaryUniverseId: newPrimaryUniverseId
                        });
                    });
                    return true;
                }
                return false;
            } catch (error) {
                if (window.ErrorHandler && ErrorHandler.handleError) {
                    ErrorHandler.handleError(error, {
                        context: 'updating universes',
                        showAlert: true
                    });
                } else {
                    console.error('Error updating universes:', error);
                    alert('Error: ' + (error.message || 'Error updating universes'));
                }
                return false;
            }
        },
        updateStatusFromDeadline(deadlineValue) {
            // Update status based on deadline (matches backend logic)
            if (!deadlineValue || deadlineValue === null) {
                // No deadline - set to open if not completed/skipped
                if (!this.task.completed_at && !this.task.skipped_at) {
                    this.task.status = 'open';
                }
                return;
            }
            
            const deadline = new Date(deadlineValue);
            if (isNaN(deadline.getTime())) {
                return;
            }
            
            const now = new Date();
            // Compare dates (ignore time for "today" check)
            const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            // Only update status if task is not completed or skipped
            if (!this.task.completed_at && !this.task.skipped_at) {
                // If deadline is before today, it's "late"
                if (deadlineDate < today) {
                    this.task.status = 'late';
                } else {
                    // Deadline is today or in future - set to open
                    this.task.status = 'open';
                }
            }
        },
        async handleCompleteTask(event) {
            const checked = event.target.checked;
            
            // If unchecking, don't do anything (completion is one-way)
            if (!checked) {
                // Revert checkbox state
                event.target.checked = true;
                return;
            }
            
            // If already completed, don't do anything
            if (this.isCompleted) {
                return;
            }
            
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            if (!csrfToken) {
                if (window.ErrorHandler) {
                    ErrorHandler.handleError(new Error('CSRF token not found'));
                } else {
                    console.error('CSRF token not found');
                }
                // Revert checkbox state
                event.target.checked = false;
                return;
            }
            
            try {
                const response = await fetch(`/tasks/${this.task.id}/complete`, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                });
                
                let result;
                if (window.ErrorHandler && ErrorHandler.handleResponse) {
                    result = await ErrorHandler.handleResponse(response, {
                        defaultMessage: 'Error completing task'
                    });
                } else {
                    const data = await response.json();
                    result = {
                        success: response.ok && data.success,
                        data: data
                    };
                    if (!result.success) {
                        alert(data.message || 'Error completing task');
                    }
                }
                
                if (result.success) {
                    // Update local task state
                    this.task.completed_at = new Date().toISOString();
                    this.task.status = 'completed';
                    // Emit event to update parent
                    this.$emit('task-updated', {
                        id: this.task.id,
                        completed_at: this.task.completed_at,
                        status: this.task.status,
                        computed_status: this.computedStatus
                    });
                } else {
                    // Revert checkbox state on error
                    event.target.checked = false;
                }
            } catch (error) {
                // Revert checkbox state on error
                event.target.checked = false;
                if (window.ErrorHandler && ErrorHandler.handleError) {
                    ErrorHandler.handleError(error, {
                        context: 'completing task',
                        showAlert: true
                    });
                } else {
                    console.error('Error completing task:', error);
                    alert('Error: ' + (error.message || 'Error completing task'));
                }
            }
        },
        async handleSkipTask() {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            if (!csrfToken) {
                if (window.ErrorHandler) {
                    ErrorHandler.handleError(new Error('CSRF token not found'));
                } else {
                    console.error('CSRF token not found');
                }
                return;
            }
            
            // Determine if we're skipping or unskipping
            const isCurrentlySkipped = !!this.task.skipped_at;
            
            try {
                const response = await fetch(`/tasks/${this.task.id}/skip`, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                });
                
                let result;
                if (window.ErrorHandler && ErrorHandler.handleResponse) {
                    result = await ErrorHandler.handleResponse(response, {
                        defaultMessage: isCurrentlySkipped ? 'Error unskipping task' : 'Error skipping task'
                    });
                } else {
                    const data = await response.json();
                    result = {
                        success: response.ok && data.success,
                        data: data
                    };
                    if (!result.success) {
                        alert(data.message || (isCurrentlySkipped ? 'Error unskipping task' : 'Error skipping task'));
                    }
                }
                
                if (result.success) {
                    // Update local task state - toggle skip status
                    if (isCurrentlySkipped) {
                        // Unskip: clear skipped_at and reset status
                        this.task.skipped_at = null;
                        this.task.status = 'open';
                    } else {
                        // Skip: set skipped_at and status
                        this.task.skipped_at = new Date().toISOString();
                        this.task.status = 'skipped';
                    }
                    // Emit event to update parent
                    this.$emit('task-updated', {
                        id: this.task.id,
                        skipped_at: this.task.skipped_at,
                        status: this.task.status,
                        computed_status: this.computedStatus
                    });
                    // Only close edit mode if skipping (not unskipping)
                    if (!isCurrentlySkipped && this.toggleTaskExpand) {
                        this.toggleTaskExpand(this.task.id);
                    }
                }
            } catch (error) {
                if (window.ErrorHandler && ErrorHandler.handleError) {
                    ErrorHandler.handleError(error, {
                        context: isCurrentlySkipped ? 'unskipping task' : 'skipping task',
                        showAlert: true
                    });
                } else {
                    console.error('Error toggling skip status:', error);
                    alert('Error: ' + (error.message || (isCurrentlySkipped ? 'Error unskipping task' : 'Error skipping task')));
                }
            }
        },
        async handleDeleteTask() {
            if (!confirm('Are you sure you want to delete this task?')) {
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
                const response = await fetch(`/tasks/${this.task.id}`, {
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
                        defaultMessage: 'Error deleting task'
                    });
                } else {
                    const data = await response.json();
                    result = {
                        success: response.ok && data.success,
                        data: data
                    };
                    if (!result.success) {
                        alert(data.message || 'Error deleting task');
                    }
                }
                
                if (result.success) {
                    // Emit event to remove task from parent
                    this.$emit('task-deleted', this.task.id);
                }
            } catch (error) {
                if (window.ErrorHandler && ErrorHandler.handleError) {
                    ErrorHandler.handleError(error, {
                        context: 'deleting task',
                        showAlert: true
                    });
                } else {
                    console.error('Error deleting task:', error);
                    alert('Error: ' + (error.message || 'Error deleting task'));
                }
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
                const response = await fetch(`/tasks/${this.task.id}/log`, {
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
        },
        async handleCompleteAndLog() {
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
                
                // Log time first (if provided)
                if (minutes !== null) {
                    const logResponse = await fetch(`/tasks/${this.task.id}/log`, {
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
                    
                    if (!logResponse.ok) {
                        const logData = await logResponse.json();
                        throw new Error(logData.message || 'Error logging time');
                    }
                }
                
                // Then complete the task
                const completeResponse = await fetch(`/tasks/${this.task.id}/complete`, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                });
                
                let result;
                if (window.ErrorHandler && ErrorHandler.handleResponse) {
                    result = await ErrorHandler.handleResponse(completeResponse, {
                        defaultMessage: 'Error completing task'
                    });
                } else {
                    const data = await completeResponse.json();
                    result = {
                        success: completeResponse.ok && data.success,
                        data: data
                    };
                    if (!result.success) {
                        alert(data.message || 'Error completing task');
                    }
                }
                
                if (result.success) {
                    // Update local task state
                    this.task.completed_at = new Date().toISOString();
                    this.task.status = 'completed';
                    // Clear form
                    this.logTime = '';
                    this.logNotes = '';
                    // Emit event to update parent
                    this.$emit('task-updated', {
                        id: this.task.id,
                        completed_at: this.task.completed_at,
                        status: this.task.status,
                        computed_status: this.computedStatus
                    });
                    // Close edit mode
                    if (this.toggleTaskExpand) {
                        this.toggleTaskExpand(this.task.id);
                    }
                }
            } catch (error) {
                if (window.ErrorHandler && ErrorHandler.handleError) {
                    ErrorHandler.handleError(error, {
                        context: 'completing and logging task',
                        showAlert: true
                    });
                } else {
                    console.error('Error completing and logging task:', error);
                    alert('Error: ' + (error.message || 'Error completing and logging task'));
                }
            }
        }
    },
    template: `
        <li :class="['task-item', 'task-status-' + computedStatus, isCompleted ? 'task-completed' : '']">
            <!-- View Mode -->
            <div :id="'task-view-' + task.id" 
                 :class="['task-view', 'task-status-' + computedStatus, { 'd-none': isExpanded }]">
                <input 
                    type="checkbox" 
                    class="complete-task-checkbox" 
                    :data-task-id="task.id"
                    :checked="isCompleted"
                    @change="handleCompleteTask"
                />
                <span v-if="isRecurring" class="recurring-icon" title="Recurring">🔄</span>
                <span v-else class="recurring-icon-placeholder"></span>
                <strong class="task-name task-name-clickable" 
                        :data-task-id="task.id"
                        @click="handleTaskNameClick">
                    {{ task.name }}
                </strong>
            </div>
            
            <!-- Edit Mode -->
            <div :id="'task-edit-' + task.id" 
                 class="task-edit-mode" 
                 :class="{ 'd-none': !isExpanded }"
                 :data-task-id="task.id">
                <div class="task-edit-header">
                    <button type="button" 
                            class="task-close-edit-btn" 
                            :data-task-id="task.id" 
                            @click="toggleTaskExpand(task.id)"
                            aria-label="Close">×</button>
                </div>
                <div class="task-edit-cards-container">
                    <div class="task-edit-card">
                        <!-- Name Field -->
                        <InlineEditableField
                            :field-id="'task-name-' + task.id"
                            label="Name"
                            :value="task.name"
                            :on-save="handleNameSave"
                            :required="true"
                            :auto-edit="shouldAutoEditName && isExpanded"
                        />
                        
                        <!-- Description Field -->
                        <InlineEditableTextarea
                            :field-id="'task-description-' + task.id"
                            label="Description"
                            :value="task.description || ''"
                            :on-save="handleDescriptionSave"
                            placeholder="No description"
                            :rows="3"
                        />
                        
                        <!-- Recurring Task Field -->
                        <InlineEditableRecurringTask
                            :field-id="'recurring-task-' + task.id"
                            label="Recurring Task"
                            :value="task.recurring_task_id"
                            :recurring-tasks="recurringTasks || []"
                            :on-save="handleRecurringTaskSave"
                        />
                        
                        <!-- Estimated Time Field -->
                        <InlineEditableEstimatedTime
                            :field-id="'estimated-time-' + task.id"
                            label="Estimated Time"
                            :value="task.estimated_time"
                            :on-save="handleEstimatedTimeSave"
                        />
                        
                        <!-- Deadline Field -->
                        <InlineEditableDeadline
                            :field-id="'deadline-' + task.id"
                            :value="task.deadline_at"
                            :on-save="handleDeadlineSave"
                            edit-mode-label="Deadline"
                        />
                        
                        <!-- Universes Field -->
                        <InlineEditableUniverses
                            :field-id="'universes-' + task.id"
                            label="Universes"
                            :value="task.universe_items || task.universeItems || []"
                            :all-universes="allUniverses || []"
                            :on-save="handleUniversesSave"
                        />
                        
                        <!-- Task Action Buttons -->
                        <div class="task-action-buttons">
                            <button type="button" 
                                    class="skip-task-btn" 
                                    :data-task-id="task.id"
                                    v-if="!isCompleted || isSkipped"
                                    @click="handleSkipTask">
                                {{ isSkipped ? 'Unskip' : 'Skip' }}
                            </button>
                            <button type="button" 
                                    class="delete-task-btn" 
                                    :data-task-id="task.id"
                                    @click="handleDeleteTask">
                                Delete
                            </button>
                        </div>
                    </div>
                    
                    <!-- Right Card: Log Form -->
                    <div class="task-edit-card">
                        <form class="task-log-form" @submit.prevent="handleLogTime">
                            <div class="log-form-field">
                                <label class="log-form-label">Time:</label>
                                <div class="log-form-input-container">
                                    <input 
                                        type="number" 
                                        name="minutes" 
                                        :id="'log-minutes-' + task.id"
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
                                                :name="'time_unit-' + task.id" 
                                                value="minutes" 
                                                :id="'log-time-unit-minutes-' + task.id"
                                                v-model="logTimeUnit"
                                            >
                                            <span>Minutes</span>
                                        </label>
                                        <label class="log-form-radio-label">
                                            <input 
                                                type="radio" 
                                                :name="'time_unit-' + task.id" 
                                                value="hours" 
                                                :id="'log-time-unit-hours-' + task.id"
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
                                    name="notes" 
                                    rows="4" 
                                    placeholder="Optional" 
                                    class="log-form-textarea"
                                    v-model="logNotes"
                                ></textarea>
                            </div>
                            <div class="log-form-actions">
                                <button type="submit" class="log-form-submit-btn">Log</button>
                                <button type="button" class="complete-and-log-btn" @click="handleCompleteAndLog">Complete & Log</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </li>
    `
};
