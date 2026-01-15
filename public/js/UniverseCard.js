window.UniverseCard = {
    components: {
        // These will be resolved at runtime by Vue
        UniverseCard: null,
        UniverseHeader: null,
        TaskCard: null,
        SecondaryTaskCard: null,
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
            // Normalize IDs to numbers for consistent comparison
            const universeIdNum = Number(this.universe.id);
            return this.expandedUniverseIds && this.expandedUniverseIds.some(id => Number(id) === universeIdNum);
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
            localTasksExpanded: true, // Local state for individual toggle (will be loaded from sessionStorage in mounted)
            _isMounted: false, // Flag to prevent watcher from firing during initialization
            sortableInstance: null // SortableJS instance for tasks list
        };
    },
    methods: {
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
        toggleTasksVisibility() {
            this.localTasksExpanded = !this.localTasksExpanded;
            // Persist to sessionStorage (normalize ID to string for consistent key)
            const universeId = String(this.universe.id);
            sessionStorage.setItem(`universeTasksExpanded_${universeId}`, JSON.stringify(this.localTasksExpanded));
        },
        handleUniverseUpdated(update) {
            // Forward the event from UniverseHeader to parent
            this.$emit('universe-updated', update);
        },
        handleUniverseDeleted(universeId) {
            // Forward the event from UniverseHeader to parent
            this.$emit('universe-deleted', universeId);
        },
        initSortable() {
            // Only initialize if Sortable is available and tasks list exists
            if (typeof Sortable === 'undefined') {
                return;
            }

            this.$nextTick(() => {
                const tasksListElement = this.$el?.querySelector('.tasks-list');
                if (!tasksListElement || this.sortableInstance) {
                    return; // Already initialized or element not found
                }

                this.sortableInstance = Sortable.create(tasksListElement, {
                    animation: 150,
                    handle: '.task-drag-handle', // Only allow dragging by handle
                    filter: '.add-task-card', // Exclude add-task-card from sorting
                    ghostClass: 'task-item-ghost',
                    chosenClass: 'task-item-chosen',
                    dragClass: 'task-item-drag',
                    fallbackOnBody: true,
                    swapThreshold: 0.65,
                    forceFallback: true, // Better mobile support
                    onEnd: async (evt) => {
                        const { item, newIndex, oldIndex } = evt;
                        const taskId = parseInt(item.dataset.taskId, 10);
                        
                        if (!taskId) {
                            console.error('Task ID not found on dragged item');
                            return;
                        }

                        // If position didn't change, skip update
                        if (oldIndex === newIndex) {
                            return;
                        }

                        // Get ordered task IDs (excluding the add-task-card)
                        const orderedTaskIds = Array.from(
                            tasksListElement.querySelectorAll('.task-item[data-task-id]')
                        ).map(el => Number(el.dataset.taskId)).filter(Boolean);

                        // Find universe_item IDs for these tasks
                        const updates = [];
                        const universeId = Number(this.universe.id);

                        for (let index = 0; index < orderedTaskIds.length; index++) {
                            const taskId = orderedTaskIds[index];
                            const task = this.universe.primary_tasks.find(t => Number(t.id) === taskId);
                            if (task && task.universe_items && Array.isArray(task.universe_items)) {
                                const universeItem = task.universe_items.find(
                                    ui => Number(ui.universe_id) === universeId && ui.is_primary === true
                                );
                                if (universeItem && universeItem.id) {
                                    updates.push({
                                        universe_item_id: Number(universeItem.id),
                                        order: index * 100
                                    });
                                }
                            }
                        }

                        if (updates.length > 0) {
                            await this.persistTaskOrder(updates, universeId);
                        }
                    },
                });
            });
        },
        async persistTaskOrder(updates, universeId) {
            if (!updates.length) {
                return;
            }

            try {
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
                if (!csrfToken) {
                    throw new Error('CSRF token not found');
                }

                const response = await fetch('/tasks/update-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        universe_id: universeId,
                        updates,
                    })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || 'Failed to update task order');
                }
            } catch (error) {
                console.error('Error updating task order:', error);
                if (window.ErrorHandler && window.ErrorHandler.handleError) {
                    window.ErrorHandler.handleError(error, {
                        context: 'updating task order',
                        showAlert: true
                    });
                } else {
                    alert('Error updating task order: ' + error.message);
                }
            }
        },
        destroySortable() {
            if (this.sortableInstance) {
                this.sortableInstance.destroy();
                this.sortableInstance = null;
            }
        }
    },
    template: `
        <li :class="'universe-card universe-status-' + universe.status.replace(/_/g, '-')">
            <div class="universe-card-header-wrapper">
                <div class="universe-card-left">
                    <UniverseHeader
                        :universe="universe"
                        :statuses="statuses"
                        :all-universes="allUniverses"
                        :is-expanded="isExpanded"
                        :toggle-expand="toggleExpand"
                        @universe-updated="handleUniverseUpdated"
                        @universe-deleted="handleUniverseDeleted"
                    />
                </div>
                <div class="universe-card-divider"></div>
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
            <ul v-show="tasksExpanded" class="tasks-list" :data-universe-id="universe.id">
                <li class="task-item add-task-card" 
                    :data-universe-id="universe.id"
                    :class="{ 'add-task-card--creating': isCreatingTask }"
                    @click="handleAddTaskClick">
                    <div class="task-view">
                        <span class="add-task-icon">+</span>
                        <span class="recurring-icon-placeholder"></span>
                        <strong v-if="isCreatingTask" class="task-name add-task-name">
                            Creating...
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
    mounted() {
        // Load individual task visibility state from sessionStorage
        // Normalize universe ID to ensure consistent key format
        const universeId = String(this.universe.id);
        const savedState = sessionStorage.getItem(`universeTasksExpanded_${universeId}`);
        if (savedState !== null) {
            try {
                // Temporarily disable watcher during initialization
                this._isMounted = false;
                this.localTasksExpanded = JSON.parse(savedState);
            } catch (e) {
                console.error(`Error parsing saved task visibility state for universe ${universeId}:`, e);
            }
        }
        // Mark as mounted after loading saved state
        this.$nextTick(() => {
            this._isMounted = true;
            // Initialize SortableJS for tasks list
            if (this.localTasksExpanded) {
                this.initSortable();
            }
        });
    },
    beforeUnmount() {
        this.destroySortable();
    },
    watch: {
        allTasksExpanded(newVal) {
            // When global toggle changes, update local state to match
            // This allows global toggle to work while still allowing individual toggles
            // Only update if component is mounted (prevents overwriting during initialization)
            if (this._isMounted && (newVal === true || newVal === false)) {
                this.localTasksExpanded = newVal;
                // Persist to sessionStorage when global toggle changes (normalize ID to string)
                const universeId = String(this.universe.id);
                sessionStorage.setItem(`universeTasksExpanded_${universeId}`, JSON.stringify(this.localTasksExpanded));
            }
        },
        localTasksExpanded(newVal) {
            // Only persist if component is mounted (prevents overwriting during initialization)
            if (!this._isMounted) {
                return;
            }
            // Persist individual toggle state to sessionStorage (normalize ID to string)
            const universeId = String(this.universe.id);
            sessionStorage.setItem(`universeTasksExpanded_${universeId}`, JSON.stringify(newVal));
            
            // Initialize or destroy SortableJS based on visibility
            this.$nextTick(() => {
                if (newVal) {
                    this.initSortable();
                } else {
                    this.destroySortable();
                }
            });
        }
    }
};
