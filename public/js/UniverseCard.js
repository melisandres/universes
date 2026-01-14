window.UniverseCard = {
    components: {
        // These will be resolved at runtime by Vue
        UniverseCard: null,
        TaskCard: null,
        SecondaryTaskCard: null,
        InlineEditableField: null,
        InlineEditableSelect: null
    },
    props: {
        universe: Object,
        allUniverses: Array,
        statuses: Array,
        recurringTasks: Array,
        expandedUniverseIds: Array,
        toggleExpand: Function,
        expandedTaskIds: Array,
        toggleTaskExpand: Function,
        navigateToTask: Function,
        onTaskMovedToUniverse: Function,
        allTasksExpanded: Boolean,
    },
    computed: {
        isExpanded() {
            return this.expandedUniverseIds && this.expandedUniverseIds.includes(this.universe.id);
        },
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
        },
        taskCount() {
            const primaryCount = this.universe.primary_tasks ? this.universe.primary_tasks.length : 0;
            const secondaryCount = this.universe.secondary_tasks ? this.universe.secondary_tasks.length : 0;
            return primaryCount + secondaryCount;
        },
        tasksExpanded() {
            // Always use local state - global toggle updates local states via watcher
            return this.localTasksExpanded;
        }
    },
    data() {
        return {
            isCreatingTask: false,
            localTasksExpanded: true // Local state for individual toggle
        };
    },
    methods: {
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
        handleTaskUpdated(update) {
            // Check if primary universe changed
            if (update.primaryUniverseChanged && update.oldPrimaryUniverseId && update.newPrimaryUniverseId) {
                // Emit special event for task movement
                const eventData = {
                    taskId: update.id,
                    task: update,
                    oldUniverseId: update.oldPrimaryUniverseId,
                    newUniverseId: update.newPrimaryUniverseId
                };
                this.$emit('task-moved-to-universe', eventData);
                // Also call the callback directly if provided
                if (this.onTaskMovedToUniverse) {
                    this.onTaskMovedToUniverse(eventData);
                }
            } else {
                // Normal update - find and update task in universe.primary_tasks array
                const task = this.universe.primary_tasks.find(t => t.id === update.id);
                if (task) {
                    Object.assign(task, update);
                }
            }
        },
        handleTaskDeleted(taskId) {
            // Remove task from universe.primary_tasks array
            if (this.universe.primary_tasks) {
                const index = this.universe.primary_tasks.findIndex(t => t.id === taskId);
                if (index > -1) {
                    this.universe.primary_tasks.splice(index, 1);
                }
            }
        },
        async handleAddTaskClick(event) {
            event.preventDefault();
            event.stopPropagation();
            
            if (this.isCreatingTask) {
                return; // Prevent multiple clicks
            }
            
            this.isCreatingTask = true;
            
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
                const formData = new FormData();
                formData.append('name', 'new task');
                formData.append('universe_ids[]', this.universe.id.toString());
                formData.append('primary_universe', '0');
                formData.append('status', 'open');
                
                const response = await fetch('/tasks', {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken
                    },
                    body: formData
                });
                
                let result;
                if (window.ErrorHandler && ErrorHandler.handleResponse) {
                    result = await ErrorHandler.handleResponse(response, {
                        defaultMessage: 'Error creating task'
                    });
                } else {
                    const data = await response.json();
                    result = {
                        success: response.ok && data.success,
                        data: data
                    };
                    if (!result.success) {
                        alert(data.message || 'Error creating task');
                    }
                }
                
                if (result.success) {
                    const taskData = result.data.task;
                    
                    // Format task for Vue component
                    const formattedTask = {
                        id: taskData.id,
                        name: taskData.name,
                        description: taskData.description || '',
                        status: taskData.status || 'open',
                        computed_status: taskData.computed_status || 'open',
                        deadline_at: taskData.deadline_at || null,
                        estimated_time: taskData.estimated_time || null,
                        recurring_task_id: taskData.recurring_task_id || null,
                        completed_at: taskData.completed_at || null,
                        skipped_at: taskData.skipped_at || null,
                        universe_items: taskData.universe_items || taskData.universeItems || []
                    };
                    
                    // Add to universe's primary_tasks array at the beginning (newest first)
                    if (!this.universe.primary_tasks) {
                        this.universe.primary_tasks = [];
                    }
                    this.universe.primary_tasks.unshift(formattedTask);
                    
                    // Auto-expand the new task
                    this.$nextTick(() => {
                        if (this.toggleTaskExpand) {
                            this.toggleTaskExpand(formattedTask.id);
                            // The name field will auto-enter edit mode via the autoEdit prop
                        }
                    });
                }
            } catch (error) {
                if (window.ErrorHandler && ErrorHandler.handleError) {
                    ErrorHandler.handleError(error, {
                        context: 'creating task',
                        showAlert: true
                    });
                } else {
                    console.error('Error creating task:', error);
                    alert('Error: ' + (error.message || 'Error creating task'));
                }
            } finally {
                this.isCreatingTask = false;
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
        toggleTasksVisibility() {
            this.localTasksExpanded = !this.localTasksExpanded;
        }
    },
    template: `
        <li :class="'universe-card universe-status-' + universe.status.replace(/_/g, '-')">
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
                            @click="toggleExpand(universe.id)"
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
                            @click="toggleExpand(universe.id)"
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
            
            <div v-if="taskCount > 0" class="tasks-list-header">
                <div class="tasks-header-row">
                    <span class="tasks-label">{{ taskCount === 1 ? 'task' : 'tasks' }}</span>
                    <span class="tasks-count">({{ taskCount }})</span>
                    <button 
                        type="button" 
                        class="tasks-toggle-btn"
                        @click="toggleTasksVisibility"
                        :aria-expanded="tasksExpanded"
                        :aria-label="tasksExpanded ? 'Collapse tasks' : 'Expand tasks'">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline v-if="tasksExpanded" points="18 15 12 9 6 15"></polyline>
                            <polyline v-else points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
            <ul v-show="tasksExpanded" class="tasks-list">
                <li class="task-item add-task-card" 
                    :data-universe-id="universe.id"
                    :class="{ 'add-task-card--creating': isCreatingTask }"
                    @click="handleAddTaskClick">
                    <div class="task-view">
                        <span class="add-task-icon">+</span>
                        <span class="recurring-icon-placeholder"></span>
                        <strong class="task-name add-task-name">
                            {{ isCreatingTask ? 'Creating...' : 'add task' }}
                        </strong>
                    </div>
                </li>
                <TaskCard 
                    v-for="task in universe.primary_tasks" 
                    :key="task.id"
                    :task="task"
                    :recurring-tasks="recurringTasks"
                    :all-universes="allUniverses"
                    :expanded-task-ids="expandedTaskIds"
                    :toggle-task-expand="toggleTaskExpand"
                    @task-updated="handleTaskUpdated"
                    @task-deleted="handleTaskDeleted"
                />
                <SecondaryTaskCard 
                    v-for="task in universe.secondary_tasks" 
                    :key="task.id"
                    :task="task"
                    :navigate-to-task="navigateToTask"
                />
            </ul>
            
            <ul v-if="universe.children && universe.children.length > 0">
                <UniverseCard 
                    v-for="child in universe.children" 
                    :key="child.id"
                    :universe="child"
                    :all-universes="allUniverses"
                    :statuses="statuses"
                    :recurring-tasks="recurringTasks"
                    :expanded-universe-ids="expandedUniverseIds"
                    :toggle-expand="toggleExpand"
                    :expanded-task-ids="expandedTaskIds"
                    :toggle-task-expand="toggleTaskExpand"
                    :navigate-to-task="navigateToTask"
                    :on-task-moved-to-universe="onTaskMovedToUniverse"
                    :all-tasks-expanded="allTasksExpanded"
                    @universe-updated="$emit('universe-updated', $event)"
                    @universe-deleted="$emit('universe-deleted', $event)"
                    @task-moved-to-universe="$emit('task-moved-to-universe', $event)"
                />
            </ul>
        </li>
    `,
    watch: {
        allTasksExpanded(newVal) {
            // When global toggle changes, update local state to match
            // This allows global toggle to work while still allowing individual toggles
            if (newVal === true || newVal === false) {
                this.localTasksExpanded = newVal;
            }
        }
    }
};
