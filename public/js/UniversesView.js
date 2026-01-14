window.UniversesView = {
    components: {
        UniverseCard: null
    },
    props: {
        universes: Array,
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
    methods: {
        handleUniverseUpdated(update) {
            // Emit event to parent (main app) to update the data
            this.$emit('universe-updated', update);
        },
        handleUniverseDeleted(universeId) {
            // Emit event to parent (main app) to remove the universe
            this.$emit('universe-deleted', universeId);
        },
        handleTaskMovedToUniverse(data) {
            // Emit event to parent (main app) to handle task movement
            this.$emit('task-moved-to-universe', data);
        }
    },
    template: `
        <div class="universes-container">
            <div v-if="universes.length === 0" class="empty-state">
                <p class="empty-state__text">No universes found. Create your first universe to get started.</p>
            </div>
            <ul v-else>
                <UniverseCard 
                    v-for="universe in universes" 
                    :key="universe.id"
                    :universe="universe"
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
                    @universe-updated="handleUniverseUpdated"
                    @universe-deleted="handleUniverseDeleted"
                    @task-moved-to-universe="handleTaskMovedToUniverse"
                />
            </ul>
        </div>
    `
};
