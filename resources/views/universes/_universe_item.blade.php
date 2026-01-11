<li>
    {{-- Simple View Mode --}}
    <div id="universe-view-{{ $universe->id }}" class="universe-header" data-parent-id="{{ $universe->parent_id ?? '' }}" data-universe-id="{{ $universe->id }}" data-update-url="{{ route('universes.update', $universe) }}">
        {{-- Status Display (non-editable) --}}
        <div class="universe-status-display">{{ str_replace('_', ' ', $universe->status) }}</div>
        
        <div class="universe-name-row">
            <strong class="universe-name">{{ $universe->name }}</strong>
            <button type="button" class="universe-edit-toggle-btn" data-universe-id="{{ $universe->id }}" aria-label="Edit universe">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
            </button>
        </div>
    </div>
    
    {{-- Expandable Edit Mode --}}
    <div id="universe-edit-{{ $universe->id }}" class="universe-edit-mode d-none" data-universe-id="{{ $universe->id }}">
        <div class="universe-edit-header">
            <button type="button" class="universe-close-edit-btn" data-universe-id="{{ $universe->id }}" aria-label="Close">×</button>
        </div>
        {{-- Status --}}
        @php
            $statusOptions = [];
            foreach ($statuses as $status) {
                $statusOptions[$status] = str_replace('_', ' ', $status);
            }
        @endphp
        <x-inline-editable-field
            field-id="universe-status-{{ $universe->id }}"
            label=""
            value="{{ $universe->status }}"
            name="status"
            type="select"
            :options="$statusOptions"
            :custom-display-value="str_replace('_', ' ', $universe->status)"
        />
        
        {{-- Name --}}
        <x-inline-editable-field
            field-id="universe-name-{{ $universe->id }}"
            label="Name"
            value="{{ $universe->name }}"
            name="name"
            type="text"
            required
        />
        
        {{-- Parent --}}
        @php
            $parentOptions = ['' => '— none —'];
            foreach ($allUniverses as $u) {
                if ($u->id != $universe->id) {
                    $parentOptions[$u->id] = $u->name;
                }
            }
            $parentValue = $universe->parent_id ?? '';
            $parentDisplayValue = $parentValue ? ('child of ' . ($allUniverses->firstWhere('id', $parentValue)->name ?? '— none —')) : 'no parent';
        @endphp
        <x-inline-editable-field
            field-id="universe-parent-{{ $universe->id }}"
            label="Parent"
            value="{{ $parentValue }}"
            placeholder="{{ $parentDisplayValue }}"
            name="parent_id"
            type="select"
            :options="$parentOptions"
            :custom-display-value="$parentDisplayValue"
        />
        
        {{-- Delete Button --}}
        <div class="universe-edit-actions">
            <form action="{{ route('universes.destroy', $universe) }}" method="POST" class="inline-form">
                @csrf
                @method('DELETE')
                <button type="submit" onclick="return confirm('Are you sure?')">Delete</button>
            </form>
        </div>
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
            @include('tasks._task_card', [
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


