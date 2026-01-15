window.TodayMainColumn = {
    components: {
        TodayUniverseSection: null,
        InvisibleDeadlinesCard: null,
        IdeaPoolsSection: null,
    },
    props: {
        visibleUniverses: Array,
        invisibleDeadlines: Object,
        ideaPools: Array,
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
            // Emit event to parent
            this.$emit('universe-updated', update);
        },
        handleUniverseDeleted(universeId) {
            // Emit event to parent
            this.$emit('universe-deleted', universeId);
        }
    },
    template: `
        <div class="today-main">
            <div v-if="visibleUniverses.length === 0" class="empty-state">
                <p>No visible universes. Update universe statuses to see them here.</p>
            </div>
            <ul v-else>
                <TodayUniverseSection
                    v-for="universe in visibleUniverses"
                    :key="universe.id"
                    :universe="universe"
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
            </ul>
            
            <InvisibleDeadlinesCard
                v-if="hasInvisibleDeadlines"
                :invisible-deadlines="invisibleDeadlines"
            />
            
            <IdeaPoolsSection
                v-if="ideaPools.length > 0"
                :idea-pools="ideaPools"
            />
        </div>
    `,
    computed: {
        hasInvisibleDeadlines() {
            return Object.keys(this.invisibleDeadlines).some(key => {
                const group = this.invisibleDeadlines[key];
                return Array.isArray(group) && group.length > 0;
            });
        }
    }
};
