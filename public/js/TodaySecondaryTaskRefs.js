window.TodaySecondaryTaskRefs = {
    props: {
        secondaryTaskRefs: Array,
    },
    template: `
        <div class="secondary-tasks-section">
            <h3 class="section-title">Related Tasks</h3>
            <ul class="task-list secondary-task-list">
                <li 
                    v-for="ref in secondaryTaskRefs" 
                    :key="ref.task.id"
                    class="task-item secondary-task-item">
                    <span class="task-content">
                        <em>
                            {{ ref.task.name }}
                            <span class="see-in-universe">[see {{ ref.primary_universe.name }}]</span>
                        </em>
                    </span>
                </li>
            </ul>
        </div>
    `
};
