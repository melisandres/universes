<div class="universe-card" data-universe-id="{{ $universe->id }}" id="universe-card-{{ $universe->id }}">
    <div class="universe-card-header">
        <div class="universe-header-left">
            <button class="btn-collapse-universe" data-universe-id="{{ $universe->id }}">▼</button>
            <h2 class="universe-name">{{ $universe->name }}</h2>
            <select name="status" class="status-dropdown universe-status-dropdown" 
                    data-universe-id="{{ $universe->id }}" 
                    data-update-url="{{ route('universes.update', $universe) }}">
                @foreach ($statuses as $status)
                    <option value="{{ $status }}" @selected($universe->status === $status)>
                        {{ $status }}
                    </option>
                @endforeach
            </select>
        </div>
        <div class="universe-header-right">
            <button class="btn-isolate-universe" data-universe-id="{{ $universe->id }}" title="Isolate this universe">
                🔍
            </button>
            <a href="{{ route('tasks.create', ['universe_id' => $universe->id]) }}" class="btn-add-task">+ Task</a>
        </div>
    </div>

    <div class="universe-card-content" id="universe-content-{{ $universe->id }}">
        <!-- Tasks grouped by deadline -->
        @php
            $hasTasks = !empty($tasks['overdue']) || !empty($tasks['today']) || 
                       !empty($tasks['this_week']) || !empty($tasks['next_week']) || 
                       !empty($tasks['later']) || !empty($tasks['no_deadline']);
        @endphp

        @if($hasTasks)
            <div class="tasks-section">
                <h3 class="section-title">Due by</h3>

                <!-- Overdue -->
                @if(!empty($tasks['overdue']))
                    <div class="deadline-group" data-group="overdue">
                        <div class="deadline-group-header">
                            <button class="btn-toggle-group">▼</button>
                            <span class="group-label overdue">Overdue ({{ count($tasks['overdue']) }})</span>
                        </div>
                        <ul class="task-list" id="group-overdue-{{ $universe->id }}">
                            @foreach($tasks['overdue'] as $task)
                                @include('today._task_item', ['task' => $task, 'universe' => $universe])
                            @endforeach
                        </ul>
                    </div>
                @endif

                <!-- Today -->
                @if(!empty($tasks['today']))
                    <div class="deadline-group" data-group="today">
                        <div class="deadline-group-header">
                            <button class="btn-toggle-group">▼</button>
                            <span class="group-label today">Today ({{ count($tasks['today']) }})</span>
                        </div>
                        <ul class="task-list" id="group-today-{{ $universe->id }}">
                            @foreach($tasks['today'] as $task)
                                @include('today._task_item', ['task' => $task, 'universe' => $universe])
                            @endforeach
                        </ul>
                    </div>
                @endif

                <!-- This Week -->
                @if(!empty($tasks['this_week']))
                    <div class="deadline-group" data-group="this_week">
                        <div class="deadline-group-header">
                            <button class="btn-toggle-group">▼</button>
                            <span class="group-label this-week">This Week ({{ count($tasks['this_week']) }})</span>
                        </div>
                        <ul class="task-list" id="group-this-week-{{ $universe->id }}">
                            @foreach($tasks['this_week'] as $task)
                                @include('today._task_item', ['task' => $task, 'universe' => $universe])
                            @endforeach
                        </ul>
                    </div>
                @endif

                <!-- Next Week -->
                @if(!empty($tasks['next_week']))
                    <div class="deadline-group" data-group="next_week">
                        <div class="deadline-group-header">
                            <button class="btn-toggle-group">▼</button>
                            <span class="group-label next-week">Next Week ({{ count($tasks['next_week']) }})</span>
                        </div>
                        <ul class="task-list" id="group-next-week-{{ $universe->id }}">
                            @foreach($tasks['next_week'] as $task)
                                @include('today._task_item', ['task' => $task, 'universe' => $universe])
                            @endforeach
                        </ul>
                    </div>
                @endif

                <!-- Later -->
                @if(!empty($tasks['later']))
                    <div class="deadline-group" data-group="later">
                        <div class="deadline-group-header">
                            <button class="btn-toggle-group">▼</button>
                            <span class="group-label later">Later ({{ count($tasks['later']) }})</span>
                        </div>
                        <ul class="task-list" id="group-later-{{ $universe->id }}">
                            @foreach($tasks['later'] as $task)
                                @include('today._task_item', ['task' => $task, 'universe' => $universe])
                            @endforeach
                        </ul>
                    </div>
                @endif
            </div>
        @endif

        <!-- Tasks without deadlines (general list) -->
        @if(!empty($tasks['no_deadline']))
            <div class="tasks-section">
                <h3 class="section-title">Tasks</h3>
                <ul class="task-list">
                    @foreach($tasks['no_deadline'] as $task)
                        @include('today._task_item', ['task' => $task, 'universe' => $universe])
                    @endforeach
                </ul>
            </div>
        @endif

        <!-- Secondary task references -->
        @if(!empty($secondaryTaskRefs))
            <div class="secondary-tasks-section">
                <h3 class="section-title">Related Tasks</h3>
                <ul class="task-list secondary-task-list">
                    @foreach($secondaryTaskRefs as $ref)
                        <li class="task-item secondary-task-item">
                            <span class="task-content">
                                <em>
                                    {{ $ref['task']->name }}
                                    <span class="see-in-universe">[see {{ $ref['primary_universe']->name }}]</span>
                                </em>
                            </span>
                        </li>
                    @endforeach
                </ul>
            </div>
        @endif
    </div>
</div>

<style>
.universe-card {
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
}

.universe-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
}

.universe-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
}

.universe-header-right {
    display: flex;
    align-items: center;
    gap: 10px;
}

.universe-name {
    margin: 0;
    font-size: 1.3em;
}

.btn-collapse-universe,
.btn-toggle-group {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.8em;
    padding: 2px 5px;
}

.btn-isolate-universe {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2em;
    padding: 5px;
}

.btn-add-task {
    padding: 5px 10px;
    background: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-size: 0.9em;
}

.tasks-section {
    margin-bottom: 20px;
}

.section-title {
    font-size: 1em;
    margin: 15px 0 10px 0;
    color: #666;
}

.deadline-group {
    margin-bottom: 10px;
}

.deadline-group-header {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px;
    cursor: pointer;
}

.deadline-group-header:hover {
    background: #f5f5f5;
}

.group-label {
    font-weight: 600;
}

.group-label.overdue {
    color: #dc3545;
}

.group-label.today {
    color: #ff9800;
}

.task-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.task-item {
    padding: 8px;
    margin: 5px 0;
    border-left: 3px solid transparent;
    cursor: pointer;
}

.task-item:hover {
    background: #f5f5f5;
    border-left-color: #007bff;
}

.task-item.secondary-task-item {
    opacity: 0.6;
    font-style: italic;
}

.see-in-universe {
    color: #999;
    font-size: 0.9em;
}

.task-content {
    display: block;
}

.universe-card-content.collapsed {
    display: none;
}

.deadline-group.collapsed .task-list {
    display: none;
}

.deadline-group.collapsed .btn-toggle-group {
    transform: rotate(-90deg);
}
</style>

