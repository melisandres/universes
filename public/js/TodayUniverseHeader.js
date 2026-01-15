window.TodayUniverseHeader = {
    props: {
        universe: Object,
        statuses: Array,
    },
    template: `
        <div class="universe-card-header">
            <div class="universe-header-left">
                <h2 class="universe-name">{{ universe.name }}</h2>
                <select name="status" class="status-dropdown universe-status-dropdown" 
                        :data-universe-id="universe.id">
                    <option 
                        v-for="status in statuses" 
                        :key="status"
                        :value="status"
                        :selected="universe.status === status">
                        {{ status }}
                    </option>
                </select>
            </div>
            <div class="universe-header-right">
                <button class="btn-isolate-universe" :data-universe-id="universe.id" title="Isolate this universe">
                    🔍
                </button>
                <a :href="'/tasks/create?universe_id=' + universe.id" class="btn-add-task">+ Task</a>
            </div>
        </div>
    `
};
