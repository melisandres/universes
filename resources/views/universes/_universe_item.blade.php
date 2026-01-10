<li>
    {{-- View Mode --}}
    <div id="universe-view-{{ $universe->id }}" class="universe-header" data-parent-id="{{ $universe->parent_id ?? '' }}">
        <span class="universe-name">{{ $universe->name }}</span> 
        <select name="status" class="status-dropdown universe-status-dropdown" data-universe-id="{{ $universe->id }}" data-update-url="{{ route('universes.update', $universe) }}">
            @foreach ($statuses as $status)
                <option value="{{ $status }}" @selected($universe->status === $status)>
                    {{ $status }}
                </option>
            @endforeach
        </select>
        <div class="btns universe-header-btns">
            <button type="button" class="edit-universe-btn universe-edit-btn" data-universe-id="{{ $universe->id }}">edit</button>
            <form action="{{ route('universes.destroy', $universe) }}" method="POST" class="inline-form">
                @csrf
                @method('DELETE')
                <button type="submit" onclick="return confirm('Are you sure?')">delete</button>
            </form>
        </div>
    </div>

    {{-- Edit Mode --}}
    <div id="universe-edit-{{ $universe->id }}" class="universe-edit-mode">
        <form method="POST" action="{{ route('universes.update', $universe) }}" class="inline-edit-form" data-universe-id="{{ $universe->id }}">
            @csrf
            @method('PUT')

            <label>Name:</label>
            <input type="text" name="name" value="{{ $universe->name }}" required class="universe-form-input">

            <label>Parent:</label>
            <select name="parent_id" class="universe-form-input">
                <option value="">— none —</option>
                @foreach ($allUniverses as $u)
                    @if($u->id != $universe->id)
                        <option value="{{ $u->id }}" @selected($universe->parent_id == $u->id)>
                            {{ $u->name }}
                        </option>
                    @endif
                @endforeach
            </select>

            <button type="submit">Save</button>
            <button type="button" class="cancel-edit-btn" data-universe-id="{{ $universe->id }}">Cancel</button>
        </form>
    </div>

    <a href="{{ route('tasks.create', ['universe_id' => $universe->id]) }}">
        + add task
    </a>

    @if($universe->relationLoaded('children') && $universe->children->isNotEmpty())
        <ul>
            @foreach($universe->children as $child)
                @include('universes._universe_item', ['universe' => $child, 'allUniverses' => $allUniverses, 'statuses' => $statuses])
            @endforeach
        </ul>
    @endif
</li>
@php
    // Get primary and secondary tasks
    $primaryTasks = $universe->relationLoaded('primaryTasks') ? $universe->primaryTasks->whereNull('completed_at') : collect();
    $secondaryTasks = $universe->relationLoaded('secondaryTasks') ? $universe->secondaryTasks->whereNull('completed_at') : collect();
    
    // For secondary tasks, we need to get their primary universe
    $secondaryTasksWithPrimary = collect();
    foreach ($secondaryTasks as $task) {
        $task->load('universeItems.universe');
        $primaryUniverseItem = $task->universeItems->where('is_primary', true)->first();
        if ($primaryUniverseItem) {
            $secondaryTasksWithPrimary->push([
                'task' => $task,
                'primary_universe' => $primaryUniverseItem->universe
            ]);
        }
    }
@endphp

@if($primaryTasks->isNotEmpty() || $secondaryTasksWithPrimary->isNotEmpty())
    <ul class="tasks-list">
        {{-- Primary tasks --}}
        @foreach ($primaryTasks as $task)
            @include('tasks._task_card_test', [
                'task' => $task,
                'inlineEdit' => true,
                'currentUniverse' => $universe,
                'referer' => request()->fullUrl(),
                'universes' => $allUniverses,
                'recurringTasks' => $recurringTasks
            ])
        @endforeach
        
        {{-- Secondary tasks --}}
        @foreach ($secondaryTasksWithPrimary as $item)
            <li class="task-item secondary-task-item">
                <span class="task-content">
                    <em>
                        {{ $item['task']->name }}
                        [see {{ $item['primary_universe']->name }}]
                    </em>
                </span>
            </li>
        @endforeach
    </ul>
@endif


