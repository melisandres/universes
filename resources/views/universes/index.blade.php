@extends('layouts.app')

@section('title', 'Universes')

@section('content')
<h1 id="universes-heading">Universes</h1>

<a href="{{ route('universes.create') }}">+ New Universe</a>

<div id="universes-vue-app">
    <!-- Vue will render here -->
    <p>Loading...</p>
</div>

<script type="application/json" id="universes-initial-data">
{!! json_encode($initialData) !!}
</script>

<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<script src="{{ asset('js/InlineEditableField.js') }}"></script>
<script src="{{ asset('js/InlineEditableTextarea.js') }}"></script>
<script src="{{ asset('js/InlineEditableSelect.js') }}"></script>
<script src="{{ asset('js/InlineEditableRecurringTask.js') }}"></script>
<script src="{{ asset('js/InlineEditableEstimatedTime.js') }}"></script>
<script src="{{ asset('js/InlineEditableDeadline.js') }}"></script>
<script src="{{ asset('js/InlineEditableUniverses.js') }}"></script>
<script src="{{ asset('js/TaskCard.js') }}"></script>
<script src="{{ asset('js/SecondaryTaskCard.js') }}"></script>
<script src="{{ asset('js/UniverseCard.js') }}"></script>
<script src="{{ asset('js/UniversesView.js') }}"></script>
<script>
// Wait for everything to be ready
(function() {
    function initVueApp() {
        // Check if Vue is loaded
        if (typeof Vue === 'undefined') {
            console.error('Vue is not loaded!');
            setTimeout(initVueApp, 100);
            return;
        }
        
        // Check if components are loaded
        if (typeof window.UniversesView === 'undefined' || 
            typeof window.UniverseCard === 'undefined' ||
            typeof window.TaskCard === 'undefined' ||
            typeof window.SecondaryTaskCard === 'undefined') {
            setTimeout(initVueApp, 100);
            return;
        }
        
        // Set component references now that all are loaded
        window.UniverseCard.components.UniverseCard = window.UniverseCard;
        window.UniverseCard.components.TaskCard = window.TaskCard;
        window.UniverseCard.components.SecondaryTaskCard = window.SecondaryTaskCard;
        window.UniverseCard.components.InlineEditableField = window.InlineEditableField;
        window.UniverseCard.components.InlineEditableSelect = window.InlineEditableSelect;
        window.TaskCard.components.InlineEditableField = window.InlineEditableField;
        window.TaskCard.components.InlineEditableTextarea = window.InlineEditableTextarea;
        if (window.InlineEditableRecurringTask) {
            window.TaskCard.components.InlineEditableRecurringTask = window.InlineEditableRecurringTask;
        }
        if (window.InlineEditableEstimatedTime) {
            window.TaskCard.components.InlineEditableEstimatedTime = window.InlineEditableEstimatedTime;
        }
        if (window.InlineEditableDeadline) {
            window.TaskCard.components.InlineEditableDeadline = window.InlineEditableDeadline;
        }
        if (window.InlineEditableUniverses) {
            window.TaskCard.components.InlineEditableUniverses = window.InlineEditableUniverses;
        }
        window.UniversesView.components.UniverseCard = window.UniverseCard;
        
        try {
            const { createApp } = Vue;

            const initialDataEl = document.getElementById('universes-initial-data');
            if (!initialDataEl) {
                console.error('Initial data element not found!');
                return;
            }
            
            const initialData = JSON.parse(initialDataEl.textContent);

            const app = createApp({
                components: {
                    UniversesView: window.UniversesView
                },
                data() {
                    return {
                        universes: initialData.universes || [],
                        allUniverses: initialData.all_universes || [],
                        statuses: initialData.statuses || [],
                        recurringTasks: initialData.recurring_tasks || [],
                        expandedUniverseIds: [],
                        expandedTaskIds: [],
                    };
                },
                computed: {
                    totalUniverseCount() {
                        // Count all universes including nested children
                        const countUniverses = (universesArray) => {
                            let count = 0;
                            if (Array.isArray(universesArray)) {
                                universesArray.forEach(universe => {
                                    count++;
                                    if (universe.children && universe.children.length > 0) {
                                        count += countUniverses(universe.children);
                                    }
                                });
                            }
                            return count;
                        };
                        return countUniverses(this.universes);
                    }
                },
                methods: {
                    updateUniverseCount() {
                        const heading = document.getElementById('universes-heading');
                        if (heading) {
                            heading.textContent = `Universes (${this.totalUniverseCount})`;
                        }
                    },
                    toggleUniverseExpand(universeId) {
                        const index = this.expandedUniverseIds.indexOf(universeId);
                        if (index > -1) {
                            this.expandedUniverseIds.splice(index, 1);
                        } else {
                            this.expandedUniverseIds.push(universeId);
                        }
                    },
                    toggleTaskExpand(taskId) {
                        const index = this.expandedTaskIds.indexOf(taskId);
                        if (index > -1) {
                            this.expandedTaskIds.splice(index, 1);
                        } else {
                            this.expandedTaskIds.push(taskId);
                        }
                    },
                    // Find a universe by ID in the nested hierarchy and return its path (all parent IDs)
                    findUniversePath(universesArray, targetId, path = []) {
                        for (let universe of universesArray) {
                            const currentPath = [...path, universe.id];
                            if (universe.id === targetId) {
                                return currentPath;
                            }
                            if (universe.children && universe.children.length > 0) {
                                const found = this.findUniversePath(universe.children, targetId, currentPath);
                                if (found) {
                                    return found;
                                }
                            }
                        }
                        return null;
                    },
                    // Expand a universe and all its parent universes
                    expandUniverseAndParents(universeId) {
                        const path = this.findUniversePath(this.universes, universeId);
                        if (path) {
                            // Expand all universes in the path (parents first, then target)
                            path.forEach(id => {
                                if (!this.expandedUniverseIds.includes(id)) {
                                    this.expandedUniverseIds.push(id);
                                }
                            });
                            // Scroll to the universe after a short delay to allow DOM to update
                            this.$nextTick(() => {
                                setTimeout(() => {
                                    const element = document.querySelector(`[data-universe-id="${universeId}"]`);
                                    if (element) {
                                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                }, 100);
                            });
                        }
                    },
                    // Navigate to a task in its primary universe
                    navigateToTask(taskId, primaryUniverseId) {
                        // Only expand the task (universe expansion removed per user request)
                        if (!this.expandedTaskIds.includes(taskId)) {
                            this.expandedTaskIds.push(taskId);
                        }
                        
                        // Wait for Vue to update the DOM, then scroll to the task
                        this.$nextTick(() => {
                            // Use setTimeout to ensure DOM is fully rendered after expansion
                            setTimeout(() => {
                                // Try multiple strategies to find the task card element
                                let element = null;
                                
                                // Strategy 1: Find the task-edit div (expanded view) and get its parent li
                                const taskEdit = document.getElementById(`task-edit-${taskId}`);
                                if (taskEdit) {
                                    // Find the parent <li> element
                                    let parent = taskEdit.parentElement;
                                    while (parent && parent.tagName !== 'LI') {
                                        parent = parent.parentElement;
                                    }
                                    if (parent && parent.classList.contains('task-item')) {
                                        element = parent;
                                    }
                                }
                                
                                // Strategy 2: Find the task-view div and get its parent li
                                if (!element) {
                                    const taskView = document.getElementById(`task-view-${taskId}`);
                                    if (taskView) {
                                        let parent = taskView.parentElement;
                                        while (parent && parent.tagName !== 'LI') {
                                            parent = parent.parentElement;
                                        }
                                        if (parent && parent.classList.contains('task-item')) {
                                            element = parent;
                                        }
                                    }
                                }
                                
                                // Strategy 3: Find any element with data-task-id matching the task ID
                                if (!element) {
                                    const elements = document.querySelectorAll(`[data-task-id="${taskId}"]`);
                                    if (elements.length > 0) {
                                        // Find the closest task-item parent
                                        for (let el of elements) {
                                            let parent = el.closest('li.task-item');
                                            if (parent) {
                                                element = parent;
                                                break;
                                            }
                                        }
                                    }
                                }
                                
                                if (element) {
                                    element.scrollIntoView({ 
                                        behavior: 'smooth', 
                                        block: 'center',
                                        inline: 'nearest'
                                    });
                                } else {
                                    console.warn(`Task element not found for task ID: ${taskId}. The universe may be collapsed or the task may not be in the DOM yet.`);
                                }
                            }, 400); // Increased delay to ensure Vue has fully rendered
                        });
                    },
                    handleUniverseUpdated(update) {
                        // Check if parent changed - if so, move the universe
                        if (update.parentChanged && update.oldParentId !== undefined && update.newParentId !== undefined) {
                            this.handleUniverseMovedToParent({
                                universeId: update.id,
                                universe: update,
                                oldParentId: update.oldParentId,
                                newParentId: update.newParentId
                            });
                        } else {
                            // Normal update - just update the data
                            this.updateUniverseInArray(this.universes, update.id, update);
                        }
                        
                        // Also update in allUniverses array if it exists
                        if (this.allUniverses && Array.isArray(this.allUniverses)) {
                            const universe = this.allUniverses.find(u => u.id === update.id);
                            if (universe) {
                                Object.assign(universe, update);
                            }
                        }
                    },
                    updateUniverseInArray(universesArray, universeId, updates) {
                        for (let universe of universesArray) {
                            if (universe.id === universeId) {
                                Object.assign(universe, updates);
                                return true;
                            }
                            if (universe.children && universe.children.length > 0) {
                                if (this.updateUniverseInArray(universe.children, universeId, updates)) {
                                    return true;
                                }
                            }
                        }
                        return false;
                    },
                    handleUniverseDeleted(universeId) {
                        this.removeUniverseFromArray(this.universes, universeId);
                        // Also remove from allUniverses array
                        if (this.allUniverses && Array.isArray(this.allUniverses)) {
                            const index = this.allUniverses.findIndex(u => u.id === universeId);
                            if (index > -1) {
                                this.allUniverses.splice(index, 1);
                            }
                        }
                        // Update universe count
                        this.$nextTick(() => {
                            this.updateUniverseCount();
                        });
                    },
                    removeUniverseFromArray(universesArray, universeId) {
                        for (let i = 0; i < universesArray.length; i++) {
                            if (universesArray[i].id === universeId) {
                                universesArray.splice(i, 1);
                                return true;
                            }
                            if (universesArray[i].children && universesArray[i].children.length > 0) {
                                if (this.removeUniverseFromArray(universesArray[i].children, universeId)) {
                                    return true;
                                }
                            }
                        }
                        return false;
                    },
                    // Find a universe by ID in the nested hierarchy
                    findUniverseInArray(universesArray, universeId) {
                        // Ensure both are numbers for comparison
                        const searchId = Number(universeId);
                        for (let universe of universesArray) {
                            if (Number(universe.id) === searchId) {
                                return universe;
                            }
                            if (universe.children && universe.children.length > 0) {
                                const found = this.findUniverseInArray(universe.children, searchId);
                                if (found) {
                                    return found;
                                }
                            }
                        }
                        return null;
                    },
                    // Handle universe movement when parent changes
                    handleUniverseMovedToParent(data) {
                        const { universeId, universe, oldParentId, newParentId } = data;
                        
                        // Ensure IDs are numbers for comparison
                        const oldId = oldParentId === null ? null : Number(oldParentId);
                        const newId = newParentId === null ? null : Number(newParentId);
                        const universeIdNum = Number(universeId);
                        
                        // Find the universe in the old location
                        let universeToMove = null;
                        
                        if (oldId === null) {
                            // Universe was at root level
                            const index = this.universes.findIndex(u => Number(u.id) === universeIdNum);
                            if (index > -1) {
                                universeToMove = JSON.parse(JSON.stringify(this.universes[index]));
                                this.universes.splice(index, 1);
                            }
                        } else {
                            // Universe was a child
                            const oldParent = this.findUniverseInArray(this.universes, oldId);
                            if (oldParent && oldParent.children) {
                                const index = oldParent.children.findIndex(u => Number(u.id) === universeIdNum);
                                if (index > -1) {
                                    universeToMove = JSON.parse(JSON.stringify(oldParent.children[index]));
                                    oldParent.children.splice(index, 1);
                                }
                            }
                        }
                        
                        if (!universeToMove) {
                            console.warn('Universe not found in old location', { universeIdNum, oldId });
                            // Fallback: just update the data
                            this.updateUniverseInArray(this.universes, universeId, universe);
                            return;
                        }
                        
                        // Update universe data with new parent_id
                        universeToMove.parent_id = newId;
                        Object.assign(universeToMove, universe);
                        
                        // Add universe to new location
                        if (newId === null) {
                            // Move to root level
                            this.universes.push(universeToMove);
                            // Sort by name to maintain order
                            this.universes.sort((a, b) => a.name.localeCompare(b.name));
                        } else {
                            // Move to new parent
                            const newParent = this.findUniverseInArray(this.universes, newId);
                            if (!newParent) {
                                console.warn('New parent universe not found', { newId });
                                // Fallback: add to root
                                this.universes.push(universeToMove);
                                return;
                            }
                            
                            if (!newParent.children) {
                                newParent.children = [];
                            }
                            newParent.children.push(universeToMove);
                            // Sort by name to maintain order
                            newParent.children.sort((a, b) => a.name.localeCompare(b.name));
                        }
                        
                        // Ensure universe remains expanded if it was expanded
                        if (!this.expandedUniverseIds.includes(universeIdNum)) {
                            this.expandedUniverseIds.push(universeIdNum);
                        }
                        
                        // Update universe count
                        this.$nextTick(() => {
                            this.updateUniverseCount();
                            
                            // Scroll to the universe after Vue updates the DOM
                            setTimeout(() => {
                                // Try multiple strategies to find the universe element
                                let element = null;
                                
                                // Strategy 1: Find the universe-view div
                                const universeView = document.getElementById(`universe-view-${universeIdNum}`);
                                if (universeView) {
                                    let parent = universeView.closest('li');
                                    if (parent) {
                                        element = parent;
                                    }
                                }
                                
                                // Strategy 2: Find the universe-edit div
                                if (!element) {
                                    const universeEdit = document.getElementById(`universe-edit-${universeIdNum}`);
                                    if (universeEdit) {
                                        let parent = universeEdit.closest('li');
                                        if (parent) {
                                            element = parent;
                                        }
                                    }
                                }
                                
                                // Strategy 3: Find any element with data-universe-id matching
                                if (!element) {
                                    const elements = document.querySelectorAll(`[data-universe-id="${universeIdNum}"]`);
                                    if (elements.length > 0) {
                                        element = elements[0].closest('li');
                                    }
                                }
                                
                                if (element) {
                                    element.scrollIntoView({ 
                                        behavior: 'smooth', 
                                        block: 'center',
                                        inline: 'nearest'
                                    });
                                } else {
                                    console.warn(`Universe element not found for universe ID: ${universeIdNum}. The universe may be collapsed or not in the DOM yet.`);
                                }
                            }, 400); // Delay to ensure Vue has fully rendered
                        });
                    },
                    // Handle task movement when primary universe changes
                    handleTaskMovedToUniverse(data) {
                        const { taskId, task, oldUniverseId, newUniverseId } = data;
                        
                        // Ensure IDs are numbers for comparison
                        const oldId = Number(oldUniverseId);
                        const newId = Number(newUniverseId);
                        const taskIdNum = Number(taskId);
                        
                        // Find old and new universes
                        const oldUniverse = this.findUniverseInArray(this.universes, oldId);
                        const newUniverse = this.findUniverseInArray(this.universes, newId);
                        
                        if (!oldUniverse || !newUniverse) {
                            console.warn('Could not find old or new universe for task movement', { oldId, newId });
                            return;
                        }
                        
                        // Find the task in the old universe's primary_tasks
                        const taskIndex = oldUniverse.primary_tasks ? 
                            oldUniverse.primary_tasks.findIndex(t => Number(t.id) === taskIdNum) : -1;
                        
                        if (taskIndex === -1) {
                            console.warn('Task not found in old universe', { taskIdNum, oldId });
                            return;
                        }
                        
                        // Get the task object - create a deep copy to preserve all properties
                        const taskToMove = JSON.parse(JSON.stringify(oldUniverse.primary_tasks[taskIndex]));
                        
                        // Update task data with new universe_items and all other properties from the update
                        // This ensures we preserve any unsaved form field values
                        Object.assign(taskToMove, {
                            // Preserve all properties from the update (which includes current form values)
                            name: task.name || taskToMove.name,
                            description: task.description !== undefined ? task.description : taskToMove.description,
                            status: task.status || taskToMove.status,
                            computed_status: task.computed_status || taskToMove.computed_status,
                            deadline_at: task.deadline_at !== undefined ? task.deadline_at : taskToMove.deadline_at,
                            estimated_time: task.estimated_time !== undefined ? task.estimated_time : taskToMove.estimated_time,
                            recurring_task_id: task.recurring_task_id !== undefined ? task.recurring_task_id : taskToMove.recurring_task_id,
                            completed_at: task.completed_at !== undefined ? task.completed_at : taskToMove.completed_at,
                            skipped_at: task.skipped_at !== undefined ? task.skipped_at : taskToMove.skipped_at,
                            // Update universe_items
                            universe_items: task.universe_items || taskToMove.universe_items,
                            universeItems: task.universeItems || taskToMove.universeItems,
                            // Preserve form state if it exists (for unsaved form fields)
                            _formState: task._formState || taskToMove._formState
                        });
                        
                        // Remove task from old universe
                        oldUniverse.primary_tasks.splice(taskIndex, 1);
                        
                        // Add task to new universe at the beginning (newest first)
                        if (!newUniverse.primary_tasks) {
                            newUniverse.primary_tasks = [];
                        }
                        newUniverse.primary_tasks.unshift(taskToMove);
                        
                        // Ensure task remains expanded (don't expand universe - user clarified this)
                        if (!this.expandedTaskIds.includes(taskId)) {
                            this.expandedTaskIds.push(taskId);
                        }
                        
                        // Scroll to the task after Vue updates the DOM
                        this.$nextTick(() => {
                            setTimeout(() => {
                                // Try multiple strategies to find the task card element
                                let element = null;
                                
                                // Strategy 1: Find the task-edit div (expanded view) and get its parent li
                                const taskEdit = document.getElementById(`task-edit-${taskId}`);
                                if (taskEdit) {
                                    let parent = taskEdit.parentElement;
                                    while (parent && parent.tagName !== 'LI') {
                                        parent = parent.parentElement;
                                    }
                                    if (parent && parent.classList.contains('task-item')) {
                                        element = parent;
                                    }
                                }
                                
                                // Strategy 2: Find the task-view div and get its parent li
                                if (!element) {
                                    const taskView = document.getElementById(`task-view-${taskId}`);
                                    if (taskView) {
                                        let parent = taskView.parentElement;
                                        while (parent && parent.tagName !== 'LI') {
                                            parent = parent.parentElement;
                                        }
                                        if (parent && parent.classList.contains('task-item')) {
                                            element = parent;
                                        }
                                    }
                                }
                                
                                // Strategy 3: Find any element with data-task-id matching the task ID
                                if (!element) {
                                    const elements = document.querySelectorAll(`[data-task-id="${taskId}"]`);
                                    if (elements.length > 0) {
                                        for (let el of elements) {
                                            let parent = el.closest('li.task-item');
                                            if (parent) {
                                                element = parent;
                                                break;
                                            }
                                        }
                                    }
                                }
                                
                                if (element) {
                                    element.scrollIntoView({ 
                                        behavior: 'smooth', 
                                        block: 'center',
                                        inline: 'nearest'
                                    });
                                } else {
                                    console.warn(`Task element not found for task ID: ${taskId} after moving to new universe.`);
                                }
                            }, 400); // Delay to ensure Vue has fully rendered
                        });
                    }
                },
                mounted() {
                    // Load expanded universe IDs
                    const savedExpanded = sessionStorage.getItem('expandedUniverseIds');
                    if (savedExpanded) {
                        try {
                            const ids = JSON.parse(savedExpanded);
                            this.expandedUniverseIds = ids;
                        } catch (e) {
                            console.error('Error parsing saved expanded universes:', e);
                        }
                    }
                    
                    // Load expanded task IDs
                    const savedExpandedTasks = sessionStorage.getItem('expandedTaskIds');
                    if (savedExpandedTasks) {
                        try {
                            const ids = JSON.parse(savedExpandedTasks);
                            this.expandedTaskIds = ids;
                        } catch (e) {
                            console.error('Error parsing saved expanded tasks:', e);
                        }
                    }
                    
                    // Update universe count on mount
                    this.updateUniverseCount();
                },
                watch: {
                    totalUniverseCount() {
                        // Update count when it changes
                        this.updateUniverseCount();
                    },
                    expandedUniverseIds: {
                        handler(newIds) {
                            sessionStorage.setItem('expandedUniverseIds', JSON.stringify(newIds));
                        },
                        deep: true
                    },
                    expandedTaskIds: {
                        handler(newIds) {
                            sessionStorage.setItem('expandedTaskIds', JSON.stringify(newIds));
                        },
                        deep: true
                    }
                },
                template: '<UniversesView :universes="universes" :all-universes="allUniverses" :statuses="statuses" :recurring-tasks="recurringTasks" :expanded-universe-ids="expandedUniverseIds" :toggle-expand="toggleUniverseExpand" :expanded-task-ids="expandedTaskIds" :toggle-task-expand="toggleTaskExpand" :navigate-to-task="navigateToTask" :on-task-moved-to-universe="handleTaskMovedToUniverse" @universe-updated="handleUniverseUpdated" @universe-deleted="handleUniverseDeleted" @task-moved-to-universe="handleTaskMovedToUniverse" />'
            });


            const mountElement = document.getElementById('universes-vue-app');
            if (!mountElement) {
                console.error('Mount element not found!');
                return;
            }
            
            app.mount('#universes-vue-app');
        } catch (error) {
            console.error('Error mounting Vue app:', error);
            console.error(error.stack);
        }
    }
    
    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVueApp);
    } else {
        // DOM is already ready
        initVueApp();
    }
})();
</script>
@endsection

{{-- Old scripts commented out - Vue handles this view now --}}
{{-- These scripts are still needed for other pages (Today, Tasks, etc.) --}}
{{-- 
@push('scripts')
<script src="{{ asset('js/AddTaskCard.js') }}"></script>
<script src="{{ asset('js/universes.js') }}"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Initialize inline editable fields for universe name, status, and parent
    setTimeout(function() {
        document.querySelectorAll('[data-field-id^="universe-name-"], [data-field-id^="universe-status-"], [data-field-id^="universe-parent-"]').forEach(function(field) {
            const fieldId = field.dataset.fieldId;
            if (!fieldId) return;
            
            // Extract universe ID from field ID
            const match = fieldId.match(/universe-(name|status|parent)-(\d+)/);
            if (!match) return;
            
            const universeId = parseInt(match[2], 10);
            const fieldType = match[1]; // 'name', 'status', or 'parent'
            
            if (window.inlineFieldEditors && window.inlineFieldEditors[fieldId]) {
                const editor = window.inlineFieldEditors[fieldId];
                
                // For status field, format the display value (replace underscores with spaces)
                if (fieldType === 'status') {
                    editor.options.formatValue = function(value) {
                        if (!value) return '';
                        return value.replace(/_/g, ' ');
                    };
                }
                // For parent field, format the display value
                else if (fieldType === 'parent') {
                    // Update display immediately on load
                    const updateParentDisplay = function() {
                        const select = document.getElementById('input-' + fieldId);
                        const viewValue = document.querySelector(`#inline-view-${fieldId} .inline-field-value`);
                        if (!select || !viewValue) return;
                        
                        const selectedValue = select.value || '';
                        if (!selectedValue || selectedValue === '') {
                            viewValue.textContent = 'no parent';
                            return;
                        }
                        
                        const selectedOption = select.options[select.selectedIndex];
                        const parentName = selectedOption ? selectedOption.text.trim() : '';
                        if (parentName && parentName !== '— none —') {
                            viewValue.textContent = 'child of ' + parentName;
                        } else {
                            viewValue.textContent = 'no parent';
                        }
                    };
                    
                    // Update display when select changes
                    const select = document.getElementById('input-' + fieldId);
                    if (select) {
                        select.addEventListener('change', updateParentDisplay);
                        // Update immediately
                        setTimeout(updateParentDisplay, 10);
                    }
                    
                    editor.options.formatValue = function(value) {
                        if (!value || value === '') return 'no parent';
                        const select = document.getElementById('input-' + fieldId);
                        if (select) {
                            const selectedOption = select.options[select.selectedIndex];
                            const parentName = selectedOption ? selectedOption.text.trim() : '';
                            if (parentName && parentName !== '— none —') {
                                return 'child of ' + parentName;
                            }
                        }
                        return 'no parent';
                    };
                }
                
                editor.options.onSave = async function(newValue, oldValue, editorInstance) {
                    let fieldName;
                    if (fieldType === 'name') {
                        fieldName = 'name';
                    } else if (fieldType === 'status') {
                        fieldName = 'status';
                    } else {
                        fieldName = 'parent_id';
                    }
                    const success = await UniverseFieldSaver.saveField(universeId, fieldName, newValue);
                    if (success) {
                        // For parent field, update display from select option text
                        if (fieldType === 'parent') {
                            const select = document.getElementById('input-' + fieldId);
                            if (select) {
                                const selectedOption = select.options[select.selectedIndex];
                                const parentName = selectedOption ? selectedOption.text.trim() : '';
                                const displayText = (!newValue || newValue === '' || parentName === '— none —') 
                                    ? 'no parent' 
                                    : 'child of ' + parentName;
                                editorInstance.updateDisplayValue(displayText);
                            }
                        } else if (fieldType === 'status') {
                            // Update both the inline field display and the non-expanded view display
                            // Replace underscores with spaces for display
                            const displayValue = newValue.replace(/_/g, ' ');
                            editorInstance.updateDisplayValue(displayValue);
                            const statusDisplay = document.querySelector(`#universe-view-${universeId} .universe-status-display`);
                            if (statusDisplay) {
                                statusDisplay.textContent = displayValue;
                            }
                        } else {
                            editorInstance.updateDisplayValue(newValue);
                        }
                        editorInstance.originalValue = newValue;
                        return true;
                    }
                    return false;
                };
            }
        });
    }, 100);
});
</script>
@endpush
--}}