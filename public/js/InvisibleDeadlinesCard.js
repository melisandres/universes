window.InvisibleDeadlinesCard = {
    props: {
        invisibleDeadlines: Object,
    },
    template: `
        <div class="invisible-deadlines-card">
            <div class="card-header">
                <button class="btn-collapse-card">▼</button>
                <h2>Deadlines from Other Universes</h2>
            </div>
            <div class="card-content">
                <div 
                    v-if="invisibleDeadlines.overdue && invisibleDeadlines.overdue.length > 0"
                    class="deadline-group" 
                    data-group="overdue">
                    <div class="deadline-group-header">
                        <button class="btn-toggle-group">▼</button>
                        <span class="group-label overdue">
                            Overdue ({{ invisibleDeadlines.overdue.length }})
                        </span>
                    </div>
                    <ul class="task-list">
                        <li 
                            v-for="item in invisibleDeadlines.overdue" 
                            :key="item.task.id"
                            class="task-item" 
                            :data-task-id="item.task.id">
                            <span class="task-content">
                                <strong>{{ item.task.name }}</strong>
                                <span class="universe-label">[{{ item.universe.name }}]</span>
                                <span class="task-deadline">({{ formatDate(item.task.deadline_at) }})</span>
                            </span>
                        </li>
                    </ul>
                </div>
                
                <div 
                    v-if="invisibleDeadlines.today && invisibleDeadlines.today.length > 0"
                    class="deadline-group" 
                    data-group="today">
                    <div class="deadline-group-header">
                        <button class="btn-toggle-group">▼</button>
                        <span class="group-label today">
                            Today ({{ invisibleDeadlines.today.length }})
                        </span>
                    </div>
                    <ul class="task-list">
                        <li 
                            v-for="item in invisibleDeadlines.today" 
                            :key="item.task.id"
                            class="task-item" 
                            :data-task-id="item.task.id">
                            <span class="task-content">
                                <strong>{{ item.task.name }}</strong>
                                <span class="universe-label">[{{ item.universe.name }}]</span>
                                <span class="task-deadline">({{ formatDate(item.task.deadline_at) }})</span>
                            </span>
                        </li>
                    </ul>
                </div>
                
                <div 
                    v-if="invisibleDeadlines.this_week && invisibleDeadlines.this_week.length > 0"
                    class="deadline-group" 
                    data-group="this_week">
                    <div class="deadline-group-header">
                        <button class="btn-toggle-group">▼</button>
                        <span class="group-label this-week">
                            This Week ({{ invisibleDeadlines.this_week.length }})
                        </span>
                    </div>
                    <ul class="task-list">
                        <li 
                            v-for="item in invisibleDeadlines.this_week" 
                            :key="item.task.id"
                            class="task-item" 
                            :data-task-id="item.task.id">
                            <span class="task-content">
                                <strong>{{ item.task.name }}</strong>
                                <span class="universe-label">[{{ item.universe.name }}]</span>
                                <span class="task-deadline">({{ formatDate(item.task.deadline_at) }})</span>
                            </span>
                        </li>
                    </ul>
                </div>
                
                <div 
                    v-if="invisibleDeadlines.next_week && invisibleDeadlines.next_week.length > 0"
                    class="deadline-group" 
                    data-group="next_week">
                    <div class="deadline-group-header">
                        <button class="btn-toggle-group">▼</button>
                        <span class="group-label next-week">
                            Next Week ({{ invisibleDeadlines.next_week.length }})
                        </span>
                    </div>
                    <ul class="task-list">
                        <li 
                            v-for="item in invisibleDeadlines.next_week" 
                            :key="item.task.id"
                            class="task-item" 
                            :data-task-id="item.task.id">
                            <span class="task-content">
                                <strong>{{ item.task.name }}</strong>
                                <span class="universe-label">[{{ item.universe.name }}]</span>
                                <span class="task-deadline">({{ formatDate(item.task.deadline_at) }})</span>
                            </span>
                        </li>
                    </ul>
                </div>
                
                <div 
                    v-if="invisibleDeadlines.later && invisibleDeadlines.later.length > 0"
                    class="deadline-group" 
                    data-group="later">
                    <div class="deadline-group-header">
                        <button class="btn-toggle-group">▼</button>
                        <span class="group-label later">
                            Later ({{ invisibleDeadlines.later.length }})
                        </span>
                    </div>
                    <ul class="task-list">
                        <li 
                            v-for="item in invisibleDeadlines.later" 
                            :key="item.task.id"
                            class="task-item" 
                            :data-task-id="item.task.id">
                            <span class="task-content">
                                <strong>{{ item.task.name }}</strong>
                                <span class="universe-label">[{{ item.universe.name }}]</span>
                                <span class="task-deadline">({{ formatDate(item.task.deadline_at) }})</span>
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    `,
    methods: {
        formatDate(isoString) {
            if (!isoString) return '';
            const date = new Date(isoString);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        }
    }
};
