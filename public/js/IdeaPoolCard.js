window.IdeaPoolCard = {
    props: {
        ideaPool: Object,
    },
    template: `
        <div class="idea-pool-card" :data-pool-id="ideaPool.id">
            <div class="pool-header">
                <button class="btn-expand-pool">▼</button>
                <h3 class="pool-name">{{ ideaPool.name }}</h3>
                <span v-if="ideaPool.primary_universe" class="pool-universe">
                    {{ ideaPool.primary_universe.name }}
                </span>
            </div>
            <div class="pool-content" style="display: none;">
                <div v-if="ideaPool.ideas && ideaPool.ideas.length > 0" class="ideas-list">
                    <span 
                        v-for="idea in ideaPool.ideas" 
                        :key="idea.id"
                        class="idea-pill" 
                        :data-idea-id="idea.id">
                        {{ idea.title || (idea.body ? idea.body.substring(0, 30) : '') }}
                    </span>
                </div>
                <p v-else class="no-ideas">No ideas in this pool</p>
                <a :href="'/ideas/create?idea_pool_id=' + ideaPool.id" class="btn-add-idea">+ Add Idea</a>
            </div>
        </div>
    `
};
