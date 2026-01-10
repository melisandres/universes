@php
    // Ensure task has universe items loaded
    if (!$task->relationLoaded('universeItems')) {
        $task->load('universeItems.universe');
    }
    $universeItems = $task->universeItems->sortByDesc('is_primary');
    $primaryIndex = 0;
    if ($universeItems->isNotEmpty()) {
        foreach ($universeItems as $index => $universeItem) {
            if ($universeItem->is_primary) {
                $primaryIndex = $index;
                break;
            }
        }
    }
@endphp

<li class="task-item">
    {{-- View Mode --}}
    <div id="task-view-{{ $task->id }}" class="task-view">
        {{-- Complete checkbox at far left --}}
        <input 
            type="checkbox" 
            class="task-complete-checkbox" 
            id="complete-checkbox-{{ $task->id }}"
            data-task-id="{{ $task->id }}"
            data-complete-url="{{ route('tasks.complete', $task) }}"
            data-is-completed="{{ $task->getComputedStatus() === 'completed' ? 'true' : 'false' }}"
            @checked($task->getComputedStatus() === 'completed')
            @disabled($task->getComputedStatus() === 'completed')
        >
        
        <span class="task-content">
            @if($task->recurring_task_id)
                <span class="recurring-task-indicator" title="Recurring task instance">🔄</span>
            @endif
            <strong>{{ $task->name }}</strong>
            @if($task->deadline_at)
                <span class="task-deadline">(due: {{ $task->deadline_at->format('Y-m-d H:i') }})</span>
            @endif
            <span class="task-status-badge">[{{ $task->status }}]</span>
        </span>
        
        <div class="btns task-actions">
            
            @if($task->isRecurring() && $task->status !== 'skipped')
                <form method="POST" action="{{ route('tasks.skip', $task) }}" class="inline-form">
                    @csrf
                    <button type="submit">Skip</button>
                </form>
            @endif
            
            @if(isset($inlineEdit) && $inlineEdit)
                <button type="button" class="btn-link edit-task-btn" data-task-id="{{ $task->id }}" title="View/Edit">👁️</button>
            @else
                <a href="{{ route('tasks.edit', ['task' => $task, 'referer' => isset($referer) ? $referer : request()->fullUrl()]) }}" class="btn-link" title="View/Edit">👁️</a>
            @endif
        </div>
    </div>
    
    {{-- Edit Mode (for inline editing - used in universes view) --}}
    @if(isset($inlineEdit) && $inlineEdit)
        @php
            // Get universes and recurring tasks if not provided
            $universesForEdit = $universes ?? \App\Models\Universe::orderBy('name')->get();
            $recurringTasksForEdit = $recurringTasks ?? \App\Models\RecurringTask::where('active', true)->get();
        @endphp
        <script type="application/json" id="universes-data-{{ $task->id }}">{!! json_encode($universesForEdit->pluck('name', 'id')) !!}</script>
        <script type="application/json" id="universe-index-data-{{ $task->id }}">{!! json_encode($universeItems->count()) !!}</script>
        <div id="task-edit-{{ $task->id }}" class="task-edit-mode d-none">
            <div class="task-edit-cards-container">
                {{-- Left Card: Edit Form --}}
                <div class="task-edit-card">
                    <form method="POST" action="{{ route('tasks.update', $task) }}" class="task-edit-form" data-task-id="{{ $task->id }}" data-clear-deadline="true">
                        @csrf
                        @method('PUT')
                @if(isset($referer))
                    <input type="hidden" name="referer" value="{{ $referer }}">
                @endif
                <input type="hidden" name="status" id="status-input-{{ $task->id }}" value="{{ $task->status }}">
                
                {{-- Name at the top with status pill --}}
                <div class="task-edit-form-field">
                    <div class="task-edit-name-section">
                        <div class="task-edit-name-input-wrapper">
                            <div class="task-edit-name-label-row">
                                <span class="status-pill status-pill-{{ $task->getComputedStatus() }}" id="status-pill-{{ $task->id }}">{{ $task->getComputedStatus() }}</span>
                                <label class="task-edit-label-inline task-edit-label-bold-inline">Name:</label>
                            </div>
                            <input type="text" name="name" value="{{ $task->name }}" required class="task-edit-input-full">
                        </div>
                        <div class="task-edit-checkbox-column">
                            <label class="task-edit-label-checkbox">
                                <input type="checkbox" id="recurring-checkbox-{{ $task->id }}" @checked($task->recurring_task_id !== null) data-task-id="{{ $task->id }}" data-action="toggle-recurring">
                                Recurring
                            </label>
                            <label class="task-edit-label-checkbox">
                                <input type="checkbox" id="deadline-checkbox-{{ $task->id }}" @checked($task->deadline_at !== null) data-task-id="{{ $task->id }}" data-action="toggle-deadline">
                                Deadline
                            </label>
                        </div>
                    </div>
                </div>
                
                {{-- Estimated Time --}}
                <div class="task-edit-form-field">
                    <label class="task-edit-label">Estimated Time (minutes):</label>
                    <input type="number" name="estimated_time" value="{{ $task->estimated_time }}" min="0" placeholder="Optional" class="task-edit-input">
                </div>
                
                {{-- Description --}}
                <div class="task-edit-form-field">
                    <label class="task-edit-label">Description:</label>
                    <textarea name="description" rows="3" placeholder="Optional" class="task-edit-textarea">{{ $task->description }}</textarea>
                </div>
                
                {{-- Deadline with Today button (only shown if checkbox is checked) --}}
                <div id="deadline-container-{{ $task->id }}" class="task-edit-form-field @if($task->deadline_at === null) d-none @endif">
                    <label class="task-edit-label">Deadline:</label>
                    <div class="task-edit-deadline-row">
                        <input type="datetime-local" name="deadline_at" id="deadline-{{ $task->id }}" value="{{ $task->deadline_at ? $task->deadline_at->format('Y-m-d\TH:i') : '' }}" class="task-edit-deadline-input" data-task-id="{{ $task->id }}" @disabled($task->deadline_at === null)>
                        <button type="button" class="btn-today" data-task-id="{{ $task->id }}">Today</button>
                    </div>
                </div>
                
                {{-- Linked Recurring Task (only shown if checkbox is checked) --}}
                <div id="recurring-task-container-{{ $task->id }}" class="task-edit-form-field @if($task->recurring_task_id === null) d-none @endif">
                    <label class="task-edit-label">Linked Recurring Task:</label>
                    <select name="recurring_task_id" class="task-edit-select">
                        <option value="">— none —</option>
                        @foreach ($recurringTasksForEdit as $rt)
                            <option value="{{ $rt->id }}" @selected($task->recurring_task_id == $rt->id)>
                                {{ $rt->name }}
                            </option>
                        @endforeach
                    </select>
                </div>
                
                {{-- Universes Selection --}}
                <div class="task-edit-form-field">
                    <label class="task-edit-label-bold-large">Universes:</label>
                    <div id="universes-container-{{ $task->id }}" class="universes-container-inline">
                        @if($universeItems->isNotEmpty())
                            @foreach($universeItems as $index => $universeItem)
                                <div class="universe-item-row" data-index="{{ $index }}">
                                    <select name="universe_ids[]" class="universe-select" required>
                                        <option value="">— select universe —</option>
                                        @foreach ($universesForEdit as $u)
                                            <option value="{{ $u->id }}" @selected($universeItem->universe_id == $u->id)>
                                                {{ $u->name }}
                                            </option>
                                        @endforeach
                                    </select>
                                    <label class="task-edit-universe-label">
                                        <input type="radio" name="primary_universe" value="{{ $index }}" @checked($universeItem->is_primary)>
                                        Primary
                                    </label>
                                    <button type="button" class="remove-universe-btn" data-task-id="{{ $task->id }}">Remove</button>
                                </div>
                            @endforeach
                        @else
                            <div class="universe-item-row" data-index="0">
                                <select name="universe_ids[]" class="universe-select" required>
                                    <option value="">— select universe —</option>
                                    @foreach ($universesForEdit as $u)
                                        <option value="{{ $u->id }}" @selected(isset($currentUniverse) && $currentUniverse->id == $u->id)>
                                            {{ $u->name }}
                                        </option>
                                    @endforeach
                                </select>
                                <label class="task-edit-universe-label">
                                    <input type="radio" name="primary_universe" value="0" checked>
                                    Primary
                                </label>
                                <button type="button" class="remove-universe-btn" data-task-id="{{ $task->id }}">Remove</button>
                            </div>
                        @endif
                    </div>
                    <button type="button" class="add-universe-btn task-edit-add-universe-btn" data-task-id="{{ $task->id }}">+ Add Universe</button>
                </div>
                
                
                <div class="btns task-edit-action-buttons">
                    <button type="submit" class="task-edit-btn">Save</button>
                    <button type="button" class="cancel-task-edit-btn task-edit-btn" data-task-id="{{ $task->id }}">Cancel</button>
                    <form method="POST" action="{{ route('tasks.destroy', $task) }}" class="task-edit-inline-form task-delete-form" data-task-id="{{ $task->id }}">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="task-edit-btn-delete">Delete</button>
                    </form>
                </div>
                    </form>
                </div>
                
                {{-- Right Card: Log Form --}}
                <div class="task-edit-card">
                    <form method="POST" action="{{ route('tasks.log', $task) }}" class="task-log-form">
                        @csrf
                        <div class="task-edit-form-field">
                            <label class="task-edit-label-bold">Minutes:</label>
                            <input type="number" name="minutes" min="0" placeholder="Optional" class="task-log-input">
                        </div>
                        <div class="task-edit-form-field">
                            <label class="task-edit-label-bold">Notes:</label>
                            <textarea name="notes" rows="4" placeholder="Optional" class="task-edit-textarea-vertical"></textarea>
                        </div>
                        <div class="btns task-edit-action-buttons">
                            <button type="submit" class="task-edit-btn">Log</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        <script type="application/json" id="task-id-data-{{ $task->id }}">{!! json_encode($task->id) !!}</script>
    @endif
</li>

