window.TodayHeader = {
    components: {
        TodayFocusStrip: null,
    },
    props: {
        allUniverses: Array,
        visibleUniverses: Array,
    },
    methods: {
        handleToggleUniverseVisibility(universeId) {
            this.$emit('toggle-universe-visibility', universeId);
        },
        handleIsolateUniverse(universeId) {
            this.$emit('isolate-universe', universeId);
        }
    },
    template: `
        <div class="today-header">
            <TodayFocusStrip 
                :all-universes="allUniverses"
                :visible-universes="visibleUniverses"
                @toggle-universe-visibility="handleToggleUniverseVisibility"
                @isolate-universe="handleIsolateUniverse"
            />
        </div>
    `
};
