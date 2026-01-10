<div class="invisible-deadlines-card">
    <div class="card-header">
        <button class="btn-collapse-card">▼</button>
        <h2>Deadlines from Other Universes</h2>
    </div>
    <div class="card-content" id="invisible-deadlines-content">
        @php
            $groupLabels = [
                'overdue' => 'Overdue',
                'today' => 'Today',
                'this_week' => 'This Week',
                'next_week' => 'Next Week',
                'later' => 'Later',
            ];
        @endphp

        @foreach(['overdue', 'today', 'this_week', 'next_week', 'later'] as $group)
            @if(!empty($tasks[$group]))
                <div class="deadline-group" data-group="{{ $group }}">
                    <div class="deadline-group-header">
                        <button class="btn-toggle-group">▼</button>
                        <span class="group-label {{ $group === 'overdue' ? 'overdue' : ($group === 'today' ? 'today' : '') }}">
                            {{ $groupLabels[$group] }} ({{ count($tasks[$group]) }})
                        </span>
                    </div>
                    <ul class="task-list">
                        @foreach($tasks[$group] as $item)
                            <li class="task-item" data-task-id="{{ $item['task']->id }}">
                                <span class="task-content">
                                    <strong>{{ $item['task']->name }}</strong>
                                    <span class="universe-label">[{{ $item['universe']->name }}]</span>
                                    <span class="task-deadline">({{ $item['task']->deadline_at->format('M j, Y') }})</span>
                                </span>
                            </li>
                        @endforeach
                    </ul>
                </div>
            @endif
        @endforeach
    </div>
</div>

<style>
.invisible-deadlines-card {
    background: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
}

.card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
}

.card-header h2 {
    margin: 0;
    font-size: 1.2em;
}

.btn-collapse-card {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.8em;
    padding: 2px 5px;
}

.universe-label {
    color: #666;
    font-size: 0.9em;
    font-weight: normal;
}

.card-content.collapsed {
    display: none;
}
</style>

