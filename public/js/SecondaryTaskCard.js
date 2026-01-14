window.SecondaryTaskCard = {
    props: {
        task: Object,
        navigateToTask: Function,
    },
    methods: {
        handleClick() {
            if (this.task.primary_universe && this.navigateToTask) {
                this.navigateToTask(this.task.id, this.task.primary_universe.id);
            }
        }
    },
    template: `
        <li class="task-item secondary-task-item" 
            :class="{ 'secondary-task-clickable': task.primary_universe && navigateToTask }"
            @click="handleClick">
            <span class="task-content">
                <em>
                    {{ task.name }}
                    <span v-if="task.primary_universe">
                        [see {{ task.primary_universe.name }}]
                    </span>
                </em>
            </span>
        </li>
    `
};
