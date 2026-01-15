window.TodayFocusStrip = {
    props: {
        allUniverses: Array,
        visibleUniverses: Array,
    },
    computed: {
        // Group universes by the three relevant statuses
        universesByStatus() {
            const statuses = ['next_small_steps', 'in_focus', 'in_orbit'];
            const grouped = {};
            
            statuses.forEach(status => {
                grouped[status] = this.allUniverses
                    .filter(u => u.status === status)
                    .map(u => ({
                        id: u.id,
                        name: u.name,
                        status: u.status,
                        visible: this.isVisible(u.id),
                        taskCount: u.task_count || 0
                    }));
            });
            
            return grouped;
        },
        statusLabels() {
            return {
                'next_small_steps': 'Next Small Steps',
                'in_orbit': 'In Orbit',
                'in_focus': 'In Focus'
            };
        }
    },
    methods: {
        isVisible(universeId) {
            return this.visibleUniverses.some(vu => vu.id === universeId);
        },
        toggleVisibility(universeId) {
            // Emit event to parent to toggle visibility
            this.$emit('toggle-universe-visibility', universeId);
        },
        isolateUniverse(universeId) {
            // Emit event to parent to isolate this universe (show only this one)
            this.$emit('isolate-universe', universeId);
        }
    },
    template: `
        <div class="today-focus-strip">
            <div 
                v-for="status in ['next_small_steps', 'in_focus', 'in_orbit']"
                :key="status"
                class="focus-strip-section"
                :class="'focus-strip-section--' + status.replace(/_/g, '-')"
            >
                <div class="focus-strip-list">
                    <div 
                        v-for="universe in universesByStatus[status]"
                        :key="universe.id"
                        class="focus-strip-item"
                    >
                        <div class="focus-strip-item-content">
                            <span 
                                class="focus-strip-name"
                                :class="{ 'focus-strip-name--visible': universe.visible, 'focus-strip-name--hidden': !universe.visible }"
                                @click="toggleVisibility(universe.id)"
                            >
                                {{ universe.name }}
                            </span>
                            <span class="focus-strip-task-count">({{ universe.taskCount }})</span>
                        </div>
                        <button 
                            type="button"
                            @click="isolateUniverse(universe.id)"
                            class="focus-strip-isolate-btn"
                            :title="'Show only ' + universe.name"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                        </button>
                    </div>
                    <div v-if="!universesByStatus[status] || universesByStatus[status].length === 0" class="focus-strip-empty">
                        No universes
                    </div>
                </div>
            </div>
        </div>
    `
};
