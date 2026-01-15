window.TodayDeadlineGroup = {
    components: {
        TaskCard: null,
    },
    props: {
        groupLabel: String,
        tasks: Array,
        universeId: Number,
        allUniverses: Array,
        recurringTasks: Array,
        expandedTaskIds: Array,
        toggleTaskExpand: Function,
        groupClass: String,
    },
    template: `
        <div class="deadline-group" :data-group="groupClass">
            <div class="deadline-group-header">
                <button class="btn-toggle-group">▼</button>
                <span class="group-label" :class="groupClass">
                    {{ groupLabel }} ({{ tasks.length }})
                </span>
            </div>
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
