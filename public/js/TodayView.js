window.TodayView = {
    components: {
        TodayHeader: null,
        TodayMainColumn: null,
        TodayLogsPanel: null,
    },
    props: {
        visibleUniverses: Array,
        invisibleDeadlines: Object,
        ideaPools: Array,
        todayLogs: Array,
        statuses: Array,
        allUniverses: Array,
        recurringTasks: Array,
        expandedTaskIds: Array,
        toggleTaskExpand: Function,
        expandedUniverseIds: Array,
        toggleUniverseExpand: Function,
        navigateToTask: Function,
        onTaskMovedToUniverse: Function,
        allTasksExpanded: [Boolean, null],
    },
    methods: {
        handleUniverseUpdated(update) {
            // Forward event to parent
            this.$emit('universe-updated', update);
        },
        handleUniverseDeleted(universeId) {
            // Forward event to parent
            this.$emit('universe-deleted', universeId);
        },
        handleToggleUniverseVisibility(universeId) {
            // Forward event to parent to handle visibility toggle
            this.$emit('toggle-universe-visibility', universeId);
        },
        handleIsolateUniverse(universeId) {
            // Forward event to parent to handle universe isolation
            this.$emit('isolate-universe', universeId);
        }
    },
    template: `
        <div class="today-container">
            <TodayHeader 
                :all-universes="allUniverses"
                :visible-universes="visibleUniverses"
                @toggle-universe-visibility="handleToggleUniverseVisibility"
                @isolate-universe="handleIsolateUniverse"
            />
            <div class="today-layout">
                <TodayMainColumn 
                    :visible-universes="visibleUniverses"
                    :invisible-deadlines="invisibleDeadlines"
                    :idea-pools="ideaPools"
                    :statuses="statuses"
                    :all-universes="allUniverses"
                    :recurring-tasks="recurringTasks"
                    :expanded-task-ids="expandedTaskIds"
                    :toggle-task-expand="toggleTaskExpand"
                    :expanded-universe-ids="expandedUniverseIds"
                    :toggle-universe-expand="toggleUniverseExpand"
                    :navigate-to-task="navigateToTask"
                    :on-task-moved-to-universe="onTaskMovedToUniverse"
                    :all-tasks-expanded="allTasksExpanded"
                    @universe-updated="handleUniverseUpdated"
                    @universe-deleted="handleUniverseDeleted"
                />
                <TodayLogsPanel :today-logs="todayLogs" />
            </div>
        </div>
    `
};
