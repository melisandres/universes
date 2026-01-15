window.TodayLogsPanel = {
    props: {
        todayLogs: Array,
    },
    template: `
        <div class="today-logs-panel">
            <div class="panel-header">
                <h3>Today's Logs</h3>
                <button class="btn-toggle-panel">−</button>
            </div>
            <div class="panel-content">
                <div class="logs-content">
                    <div class="logs-list">
                        <h4>Today's Activity</h4>
                        <div v-if="todayLogs.length === 0" class="no-logs">
                            <p>No logs yet today</p>
                        </div>
                        <div v-else>
                            <div 
                                v-for="log in todayLogs" 
                                :key="log.id"
                                class="log-item" 
                                :data-log-id="log.id">
                                <div class="log-header">
                                    <span class="log-time">{{ formatTime(log.created_at) }}</span>
                                    <span v-if="log.loggable_title" class="log-context">
                                        {{ getLoggableTypeLabel(log.loggable_type) }}: {{ log.loggable_title }}
                                    </span>
                                    <span v-else class="log-context">Standalone Log</span>
                                </div>
                                <div v-if="log.minutes" class="log-minutes">
                                    ⏱ {{ log.minutes }} minutes
                                </div>
                                <div v-if="log.notes" class="log-notes">{{ log.notes }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    methods: {
        formatTime(isoString) {
            if (!isoString) return '';
            const date = new Date(isoString);
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        },
        getLoggableTypeLabel(type) {
            if (type === 'App\\Models\\Task') {
                return 'Task';
            } else if (type === 'App\\Models\\Idea') {
                return 'Idea';
            }
            return 'Item';
        }
    }
};
