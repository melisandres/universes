@extends('layouts.app')

@section('title', 'Today')

@section('content')
<div id="today-vue-app">
    <!-- Vue will render here -->
    <p>Loading...</p>
</div>

<script type="application/json" id="today-initial-data">
{!! json_encode($initialData) !!}
</script>

<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
<script src="{{ asset('js/InlineEditableField.js') }}"></script>
<script src="{{ asset('js/InlineEditableTextarea.js') }}"></script>
<script src="{{ asset('js/InlineEditableSelect.js') }}"></script>
<script src="{{ asset('js/InlineEditableRecurringTask.js') }}"></script>
<script src="{{ asset('js/InlineEditableEstimatedTime.js') }}"></script>
<script src="{{ asset('js/InlineEditableDeadline.js') }}"></script>
<script src="{{ asset('js/InlineEditableUniverses.js') }}"></script>
<script src="{{ asset('js/TaskCard.js') }}"></script>
<script src="{{ asset('js/TodayHeader.js') }}"></script>
<script src="{{ asset('js/TodayLogsPanel.js') }}"></script>
<script src="{{ asset('js/IdeaPoolCard.js') }}"></script>
<script src="{{ asset('js/IdeaPoolsSection.js') }}"></script>
<script src="{{ asset('js/InvisibleDeadlinesCard.js') }}"></script>
<script src="{{ asset('js/TodaySecondaryTaskRefs.js') }}"></script>
<script src="{{ asset('js/InlineEditableField.js') }}"></script>
<script src="{{ asset('js/InlineEditableSelect.js') }}"></script>
<script src="{{ asset('js/TodayNoDeadlineGroup.js') }}"></script>
<script src="{{ asset('js/TodayDeadlineGroup.js') }}"></script>
<script src="{{ asset('js/UniverseHeader.js') }}"></script>
<script src="{{ asset('js/SecondaryTaskCard.js') }}"></script>
<script src="{{ asset('js/UniverseCard.js') }}"></script>
<script src="{{ asset('js/TodayUniverseSection.js') }}"></script>
<script src="{{ asset('js/TodayMainColumn.js') }}"></script>
<script src="{{ asset('js/TodayFocusStrip.js') }}"></script>
<script src="{{ asset('js/TodayView.js') }}"></script>
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
        if (typeof window.TodayView === 'undefined' || 
            typeof window.TaskCard === 'undefined' ||
            typeof window.TodayHeader === 'undefined' ||
            typeof window.TodayFocusStrip === 'undefined' ||
            typeof window.TodayMainColumn === 'undefined' ||
            typeof window.TodayLogsPanel === 'undefined' ||
            typeof window.UniverseCard === 'undefined') {
            setTimeout(initVueApp, 100);
            return;
        }
        
        // Set component references (child components)
        // Root level
        window.TodayView.components.TodayHeader = window.TodayHeader;
        window.TodayView.components.TodayMainColumn = window.TodayMainColumn;
        window.TodayView.components.TodayLogsPanel = window.TodayLogsPanel;
        
        // Header level
        if (window.TodayHeader) {
            window.TodayHeader.components.TodayFocusStrip = window.TodayFocusStrip;
        }
        
        // Main column level
        if (window.TodayMainColumn) {
            window.TodayMainColumn.components.TodayUniverseSection = window.TodayUniverseSection;
            window.TodayMainColumn.components.InvisibleDeadlinesCard = window.InvisibleDeadlinesCard;
            window.TodayMainColumn.components.IdeaPoolsSection = window.IdeaPoolsSection;
        }
        
        // TodayView component references
        if (window.TodayView) {
            window.TodayView.components.TodayMainColumn = window.TodayMainColumn;
        }
        
        // Universe section level
        if (window.TodayUniverseSection) {
            window.TodayUniverseSection.components.UniverseCard = window.UniverseCard;
        }
        
        // UniverseCard component references (for Today view)
        if (window.UniverseCard) {
            window.UniverseCard.components.UniverseCard = window.UniverseCard;
            window.UniverseCard.components.UniverseHeader = window.UniverseHeader;
            window.UniverseCard.components.TaskCard = window.TaskCard;
            window.UniverseCard.components.SecondaryTaskCard = window.SecondaryTaskCard;
        }
        
        // UniverseHeader component references
        if (window.UniverseHeader) {
            window.UniverseHeader.components.InlineEditableField = window.InlineEditableField;
            window.UniverseHeader.components.InlineEditableSelect = window.InlineEditableSelect;
        }
        
        // Deadline groups
        if (window.TodayDeadlineGroup) {
            window.TodayDeadlineGroup.components.TaskCard = window.TaskCard;
        }
        if (window.TodayNoDeadlineGroup) {
            window.TodayNoDeadlineGroup.components.TaskCard = window.TaskCard;
        }
        
        // Idea pools
        if (window.IdeaPoolsSection) {
            window.IdeaPoolsSection.components.IdeaPoolCard = window.IdeaPoolCard;
        }
        
        // Set TaskCard component references
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
        
        try {
            const { createApp } = Vue;

            const initialDataEl = document.getElementById('today-initial-data');
            if (!initialDataEl) {
                console.error('Initial data element not found!');
                return;
            }
            
            const initialData = JSON.parse(initialDataEl.textContent);

            const app = createApp({
                components: {
                    TodayView: window.TodayView
                },
                data() {
                    // Load saved visibility state from localStorage
                    let savedVisibleUniverseIds = null;
                    try {
                        const saved = localStorage.getItem('todayFocusStripVisibleUniverseIds');
                        if (saved) {
                            savedVisibleUniverseIds = JSON.parse(saved);
                        }
                    } catch (e) {
                        console.error('Error loading saved visibility state:', e);
                    }
                    
                    // Start with server-provided visible universes
                    let visibleUniverses = initialData.visible_universes || [];
                    
                    // If we have saved state, filter visibleUniverses to match saved preferences
                    if (savedVisibleUniverseIds && savedVisibleUniverseIds.length > 0) {
                        const savedIds = new Set(savedVisibleUniverseIds.map(id => Number(id)));
                        visibleUniverses = visibleUniverses.filter(u => savedIds.has(Number(u.id)));
                    }
                    
                    return {
                        visibleUniverses: visibleUniverses,
                        invisibleDeadlines: initialData.invisible_deadlines || {},
                        ideaPools: initialData.idea_pools || [],
                        todayLogs: initialData.today_logs || [],
                        statuses: initialData.statuses || [],
                        allUniverses: initialData.all_universes || [],
                        recurringTasks: initialData.recurring_tasks || [],
                        expandedTaskIds: [],
                        expandedUniverseIds: [], // For universe header expand/collapse
                        allTasksExpanded: null, // null = use individual states, true = all expanded, false = all collapsed
                        // Store original visible universes data for toggling
                        originalVisibleUniverses: initialData.visible_universes || [],
                    };
                },
                methods: {
                    saveVisibility() {
                        try {
                            const visibleIds = this.visibleUniverses.map(u => Number(u.id));
                            localStorage.setItem('todayFocusStripVisibleUniverseIds', JSON.stringify(visibleIds));
                        } catch (e) {
                            console.error('Error saving visibility state:', e);
                        }
                    },
                    toggleTaskExpand(taskId) {
                        // Phase 1: stub - no functionality yet
                        const taskIdNum = Number(taskId);
                        const index = this.expandedTaskIds.indexOf(taskIdNum);
                        if (index > -1) {
                            this.expandedTaskIds.splice(index, 1);
                        } else {
                            this.expandedTaskIds.push(taskIdNum);
                        }
                    },
                    toggleUniverseExpand(universeId) {
                        const universeIdNum = Number(universeId);
                        const index = this.expandedUniverseIds.indexOf(universeIdNum);
                        if (index > -1) {
                            this.expandedUniverseIds.splice(index, 1);
                        } else {
                            this.expandedUniverseIds.push(universeIdNum);
                        }
                    },
                    handleUniverseUpdated(update) {
                        // Find and update the universe in visibleUniverses
                        const universe = this.visibleUniverses.find(u => u.id === update.id);
                        if (universe) {
                            Object.assign(universe, update);
                            // Save visibility state after update
                            this.saveVisibility();
                        }
                    },
                    handleUniverseDeleted(universeId) {
                        // Remove universe from visibleUniverses
                        const index = this.visibleUniverses.findIndex(u => u.id === universeId);
                        if (index > -1) {
                            this.visibleUniverses.splice(index, 1);
                            // Save visibility state after deletion
                            this.saveVisibility();
                        }
                    },
                    handleToggleUniverseVisibility(universeId) {
                        // Toggle universe visibility
                        const universeIdNum = Number(universeId);
                        const universe = this.allUniverses.find(u => u.id === universeIdNum);
                        if (!universe) return;
                        
                        // Check if universe is currently visible
                        const isVisible = this.visibleUniverses.some(vu => vu.id === universeIdNum);
                        
                        if (isVisible) {
                            // Remove from visible
                            const index = this.visibleUniverses.findIndex(u => u.id === universeIdNum);
                            if (index > -1) {
                                this.visibleUniverses.splice(index, 1);
                            }
                        } else {
                            // Add to visible - try to find full data from original visible universes
                            const originalUniverse = this.originalVisibleUniverses.find(u => u.id === universeIdNum);
                            
                            if (originalUniverse) {
                                // Use the full data structure from original visible universes
                                this.visibleUniverses.push({...originalUniverse});
                            } else {
                                // If not in original visible universes, create structure with empty tasks
                                // This universe was not visible on initial load, so it has no tasks loaded
                                this.visibleUniverses.push({
                                    id: universe.id,
                                    name: universe.name,
                                    status: universe.status,
                                    primary_tasks: [],
                                    secondary_tasks: []
                                });
                            }
                        }
                        
                        // Save visibility state to localStorage
                        this.saveVisibility();
                    },
                    handleIsolateUniverse(universeId) {
                        // Show only this universe (hide all others)
                        const universeIdNum = Number(universeId);
                        const universe = this.allUniverses.find(u => u.id === universeIdNum);
                        if (!universe) return;
                        
                        // Check if this universe is already in visibleUniverses
                        let targetUniverse = this.visibleUniverses.find(vu => vu.id === universeIdNum);
                        
                        // If not in visibleUniverses, try to get it from originalVisibleUniverses
                        if (!targetUniverse) {
                            const originalUniverse = this.originalVisibleUniverses.find(u => u.id === universeIdNum);
                            if (originalUniverse) {
                                targetUniverse = {...originalUniverse};
                            } else {
                                // Create minimal structure if not found
                                targetUniverse = {
                                    id: universe.id,
                                    name: universe.name,
                                    status: universe.status,
                                    primary_tasks: [],
                                    secondary_tasks: []
                                };
                            }
                        }
                        
                        if (targetUniverse) {
                            // Show only this one
                            this.visibleUniverses = [targetUniverse];
                        } else {
                            // If it doesn't exist, create minimal structure and show only this one
                            this.visibleUniverses = [{
                                id: universe.id,
                                name: universe.name,
                                status: universe.status,
                                primary_tasks: [],
                                secondary_tasks: []
                            }];
                        }
                        
                        // Save visibility state to localStorage
                        this.saveVisibility();
                    },
                    navigateToTask(taskId, primaryUniverseId) {
                        // Expand the task
                        const taskIdNum = Number(taskId);
                        if (!this.expandedTaskIds.some(id => Number(id) === taskIdNum)) {
                            this.expandedTaskIds.push(taskIdNum);
                        }
                        
                        // Optionally expand the universe if it's not visible
                        if (primaryUniverseId) {
                            const universeIdNum = Number(primaryUniverseId);
                            const isVisible = this.visibleUniverses.some(vu => vu.id === universeIdNum);
                            if (!isVisible) {
                                // Make universe visible
                                const originalUniverse = this.originalVisibleUniverses.find(u => u.id === universeIdNum);
                                if (originalUniverse) {
                                    this.visibleUniverses.push({...originalUniverse});
                                    this.saveVisibility();
                                }
                            }
                            
                            // Expand the universe
                            if (!this.expandedUniverseIds.some(id => Number(id) === universeIdNum)) {
                                this.expandedUniverseIds.push(universeIdNum);
                            }
                        }
                        
                        // Scroll to task after a delay to allow DOM to update
                        this.$nextTick(() => {
                            setTimeout(() => {
                                const taskEdit = document.getElementById(`task-edit-${taskId}`);
                                if (taskEdit) {
                                    taskEdit.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                            }, 400);
                        });
                    },
                    handleTaskMovedToUniverse(data) {
                        // Handle task movement between universes
                        // If task moved to a visible universe, refresh that universe's tasks
                        // If task moved from a visible universe, remove it from that universe's tasks
                        const { taskId, oldUniverseId, newUniverseId } = data;
                        
                        // Remove task from old universe if visible
                        const oldUniverse = this.visibleUniverses.find(u => u.id === oldUniverseId);
                        if (oldUniverse && oldUniverse.primary_tasks) {
                            const taskIndex = oldUniverse.primary_tasks.findIndex(t => t.id === taskId);
                            if (taskIndex > -1) {
                                oldUniverse.primary_tasks.splice(taskIndex, 1);
                            }
                        }
                        
                        // Add task to new universe if visible
                        const newUniverse = this.visibleUniverses.find(u => u.id === newUniverseId);
                        if (newUniverse) {
                            // Task will be loaded on next page refresh, or we could fetch it here
                            // For now, just ensure the universe is visible
                            if (!newUniverse.primary_tasks) {
                                newUniverse.primary_tasks = [];
                            }
                        } else {
                            // If new universe is not visible, check if we should make it visible
                            const originalUniverse = this.originalVisibleUniverses.find(u => u.id === newUniverseId);
                            if (originalUniverse) {
                                this.visibleUniverses.push({...originalUniverse});
                                this.saveVisibility();
                            }
                        }
                    }
                },
                template: '<TodayView :visible-universes="visibleUniverses" :invisible-deadlines="invisibleDeadlines" :idea-pools="ideaPools" :today-logs="todayLogs" :statuses="statuses" :all-universes="allUniverses" :recurring-tasks="recurringTasks" :expanded-task-ids="expandedTaskIds" :toggle-task-expand="toggleTaskExpand" :expanded-universe-ids="expandedUniverseIds" :toggle-universe-expand="toggleUniverseExpand" :navigate-to-task="navigateToTask" :on-task-moved-to-universe="handleTaskMovedToUniverse" :all-tasks-expanded="allTasksExpanded" @universe-updated="handleUniverseUpdated" @universe-deleted="handleUniverseDeleted" @toggle-universe-visibility="handleToggleUniverseVisibility" @isolate-universe="handleIsolateUniverse" />'
            });

            const mountElement = document.getElementById('today-vue-app');
            if (!mountElement) {
                console.error('Mount element not found!');
                return;
            }
            
            app.mount('#today-vue-app');
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

@push('styles')
<style>
.today-container {
    padding: 0;
}

.today-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    margin-left: -2rem;
    margin-right: -2rem;
    width: calc(100% + 4rem);
}

/* Today Focus Strip */
.today-focus-strip {
    display: flex;
    gap: 1.5rem;
    padding: 1.25rem;
    background: linear-gradient(to bottom, #ffffff, #f8f9fa);
    border-radius: 0;
    box-shadow: 0 4px 6px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.06);
    border: 1px solid #e9ecef;
    border-left: none;
    border-right: none;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    width: 100%;
}

.today-focus-strip::-webkit-scrollbar {
    height: 8px;
}

.today-focus-strip::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

.today-focus-strip::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
}

.today-focus-strip::-webkit-scrollbar-thumb:hover {
    background: #555;
}

/* Center content on larger screens */
@media (min-width: 830px) {
    .today-focus-strip {
        justify-content: center;
    }
}

.today-focus-strip::-webkit-scrollbar {
    height: 8px;
}

.today-focus-strip::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

.today-focus-strip::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
}

.today-focus-strip::-webkit-scrollbar-thumb:hover {
    background: #555;
}

.focus-strip-section {
    flex: 0 0 auto;
    min-width: 200px;
    background: white;
    border-radius: 8px;
    padding: 1rem;
    border: 2px solid;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    transition: transform 0.2s, box-shadow 0.2s;
}

.focus-strip-section:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.focus-strip-section--next-small-steps {
    border-color: #17a2b8;
}

.focus-strip-section--in-orbit {
    border-color: #28a745;
}

.focus-strip-section--in-focus {
    border-color: #ffc107;
}


.focus-strip-list {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.focus-strip-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0;
    border-radius: 6px;
    transition: background-color 0.2s;
}

.focus-strip-section--next-small-steps .focus-strip-item:hover {
    background-color: rgba(23, 162, 184, 0.1);
}

.focus-strip-section--in-focus .focus-strip-item:hover {
    background-color: rgba(255, 193, 7, 0.1);
}

.focus-strip-section--in-orbit .focus-strip-item:hover {
    background-color: rgba(40, 167, 69, 0.1);
}

.focus-strip-item-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
}

.focus-strip-name {
    font-size: 0.9rem;
    user-select: none;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s;
}

.focus-strip-name--visible {
    color: #212529;
    font-weight: 600;
}

.focus-strip-name--hidden {
    color: #adb5bd;
    font-weight: 400;
}

.focus-strip-task-count {
    font-size: 0.85rem;
    color: #6c757d;
    margin-left: 0.25rem;
    font-weight: 600;
    flex-shrink: 0;
}

.focus-strip-empty {
    font-size: 0.85rem;
    color: #adb5bd;
    font-style: italic;
    padding: 0.5rem;
    text-align: center;
}

.focus-strip-isolate-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6c757d;
    border-radius: 6px;
    transition: all 0.2s;
    opacity: 0.7;
    flex-shrink: 0;
}

.focus-strip-isolate-btn:hover {
    opacity: 1;
    color: #007bff;
    background-color: #e7f3ff;
    transform: scale(1.1);
}

.focus-strip-isolate-btn svg {
    width: 16px;
    height: 16px;
}

.today-layout {
    display: grid;
    grid-template-columns: 1fr 350px 300px;
    gap: 20px;
    align-items: start;
/*     padding: 0 2rem;
    max-width: 100%;
    overflow-x: hidden; */
}

.today-main {
    min-width: 0;
}

.today-task-panel,
.today-logs-panel {
    background: #f5f5f5;
    border-radius: 8px;
    padding: 15px;
    position: sticky;
    top: 20px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #ddd;
}

.panel-header h3 {
    margin: 0;
    font-size: 1.2em;
}

.btn-close-panel,
.btn-toggle-panel {
    background: none;
    border: none;
    font-size: 1.5em;
    cursor: pointer;
    padding: 0 5px;
}

.btn-close-panel:hover,
.btn-toggle-panel:hover {
    opacity: 0.7;
}

.panel-content {
    /* Content styles */
}

@media (max-width: 1200px) {
    .today-layout {
        grid-template-columns: 1fr;
    }
    
    .today-task-panel,
    .today-logs-panel {
        position: relative;
        top: 0;
        max-height: none;
    }
}

</style>
@endpush

@push('scripts')
<script src="{{ asset('js/today.js') }}"></script>
@endpush

