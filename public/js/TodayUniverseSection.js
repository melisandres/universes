window.TodayUniverseSection = {
    components: {
        UniverseCard: null,
    },
    props: {
        universe: Object,
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
    computed: {
        // Ensure universe has the correct structure (backend now provides primary_tasks directly)
        // Just ensure children is empty to prevent nested universes from showing
        normalizedUniverse() {
            return {
                ...this.universe,
                children: [] // Prevent nested universes from showing in Today view
            };
        }
    },
    methods: {
        handleUniverseUpdated(update) {
            // Emit event to parent to handle universe updates
            this.$emit('universe-updated', update);
        },
        handleUniverseDeleted(universeId) {
            // Emit event to parent to handle universe deletion
            this.$emit('universe-deleted', universeId);
        },
    },
    template: `
        <!-- Use UniverseCard directly - backend now provides same format as Universes view -->
        <UniverseCard
            :universe="normalizedUniverse"
            :all-universes="allUniverses"
            :statuses="statuses"
            :recurring-tasks="recurringTasks"
            :expanded-universe-ids="expandedUniverseIds"
            :toggle-expand="toggleUniverseExpand"
            :expanded-task-ids="expandedTaskIds"
            :toggle-task-expand="toggleTaskExpand"
            :navigate-to-task="navigateToTask"
            :on-task-moved-to-universe="onTaskMovedToUniverse"
            :all-tasks-expanded="allTasksExpanded"
            @universe-updated="handleUniverseUpdated"
            @universe-deleted="handleUniverseDeleted"
        />
    `
};
