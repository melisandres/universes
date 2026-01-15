window.IdeaPoolsSection = {
    components: {
        IdeaPoolCard: null,
    },
    props: {
        ideaPools: Array,
    },
    template: `
        <div class="idea-pools-section">
            <h2>Idea Pools</h2>
            <div class="idea-pools-container">
                <IdeaPoolCard
                    v-for="pool in ideaPools"
                    :key="pool.id"
                    :idea-pool="pool"
                />
            </div>
        </div>
    `
};
