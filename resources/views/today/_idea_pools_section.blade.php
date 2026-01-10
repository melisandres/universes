<div class="idea-pools-section">
    <h2>Idea Pools</h2>
    <div class="idea-pools-container">
        @foreach($ideaPools as $pool)
            <div class="idea-pool-card" data-pool-id="{{ $pool->id }}">
                <div class="pool-header">
                    <button class="btn-expand-pool">▼</button>
                    <h3 class="pool-name">{{ $pool->name }}</h3>
                    @php
                        $primaryUniverse = $pool->universeItems->where('is_primary', true)->first();
                    @endphp
                    @if($primaryUniverse)
                        <span class="pool-universe">{{ $primaryUniverse->universe->name }}</span>
                    @endif
                </div>
                <div class="pool-content" id="pool-content-{{ $pool->id }}" style="display: none;">
                    @if($pool->ideas->isNotEmpty())
                        <div class="ideas-list">
                            @foreach($pool->ideas as $idea)
                                <span class="idea-pill" data-idea-id="{{ $idea->id }}">
                                    {{ $idea->title ?: substr($idea->body, 0, 30) }}
                                </span>
                            @endforeach
                        </div>
                    @else
                        <p class="no-ideas">No ideas in this pool</p>
                    @endif
                    <a href="{{ route('ideas.create', ['idea_pool_id' => $pool->id]) }}" class="btn-add-idea">+ Add Idea</a>
                </div>
            </div>
        @endforeach
    </div>
</div>

<style>
.idea-pools-section {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 2px solid #ddd;
}

.idea-pools-section h2 {
    margin-bottom: 15px;
}

.idea-pools-container {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
}

.idea-pool-card {
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    min-width: 250px;
    flex: 1 1 300px;
}

.pool-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}

.btn-expand-pool {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.8em;
    padding: 2px 5px;
}

.pool-name {
    margin: 0;
    font-size: 1.1em;
    flex: 1;
}

.pool-universe {
    color: #666;
    font-size: 0.9em;
}

.ideas-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;
}

.idea-pill {
    display: inline-block;
    padding: 5px 12px;
    background: #e3f2fd;
    border-radius: 20px;
    font-size: 0.9em;
    cursor: pointer;
}

.idea-pill:hover {
    background: #bbdefb;
}

.btn-add-idea {
    display: inline-block;
    padding: 5px 10px;
    background: #4caf50;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-size: 0.9em;
}

.no-ideas {
    color: #999;
    font-style: italic;
    margin: 10px 0;
}
</style>

