window.TodayNoDeadlineGroup = {
    components: {
        TaskCard: null,
    },
    props: {
        tasks: Array,
        universeId: Number,
        allUniverses: Array,
        recurringTasks: Array,
        expandedTaskIds: Array,
        toggleTaskExpand: Function,
    },
    template: `
        <div class="tasks-section">
            <h3 class="section-title">Tasks</h3>
            <ul class="task-list">
                <TaskCard
                    v-for="task in tasks"
                    :key="task.id"
                    :task="task"
                    :recurring-tasks="recurringTasks"
                    :all-universes="allUniverses"
                    :expanded-task-ids="expandedTaskIds"
                    :toggle-task-expand="toggleTaskExpand"
                />
            </ul>
        </div>
    `
};
