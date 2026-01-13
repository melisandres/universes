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
    
    // Compute status for display - use the Task model's getComputedStatus() method
    // This ensures consistency and handles all the logic in one place
    // The hidden input uses $task->status directly, but for display we use computed status
    $computedStatus = $task->getComputedStatus();
@endphp

<li class="task-item task-status-{{ $computedStatus }} @if($task->created_at && $task->created_at->isToday()) task-created-today @endif">
    {{-- Simple View Mode --}}
    <div id="task-view-{{ $task->id }}" class="task-view task-status-{{ $computedStatus }}">
        <input type="checkbox" class="complete-task-checkbox" data-task-id="{{ $task->id }}" @checked($task->completed_at !== null)>
        @if($task->isRecurring())
            <span class="recurring-icon" title="Recurring">🔄</span>
        @else
            <span class="recurring-icon-placeholder"></span>
        @endif
        <strong class="task-name task-name-clickable" data-task-id="{{ $task->id }}">{{ $task->name }}</strong>
    </div>
    
    {{-- Simple Edit Mode --}}
    @if(isset($inlineEdit) && $inlineEdit)
        <div id="task-edit-{{ $task->id }}" class="task-edit-mode d-none" data-task-id="{{ $task->id }}">
            <div class="task-edit-header">
                <button type="button" class="task-close-edit-btn" data-task-id="{{ $task->id }}" aria-label="Close">×</button>
            </div>
            <div class="task-edit-cards-container">
                {{-- Left Card: Edit Form --}}
                <div class="task-edit-card">
                    <form method="POST" action="{{ route('tasks.update', $task) }}" class="task-edit-form-simple" data-task-id="{{ $task->id }}">
                        @csrf
                        @method('PUT')
                
                {{-- Name --}}
                <x-inline-editable-field
                    field-id="task-name-{{ $task->id }}"
                    label="Name"
                    value="{{ $task->name }}"
                    name="name"
                    type="text"
                    required
                />
                
                {{-- Description --}}
                <x-inline-editable-field
                    field-id="task-description-{{ $task->id }}"
                    label="Description"
                    value="{{ $task->description }}"
                    name="description"
                    type="textarea"
                    rows="3"
                    placeholder="No description"
                />
                
                {{-- Universes Selection --}}
                @php
                    $universesForInclude = $universes ?? \App\Models\Universe::orderBy('name')->get();
                @endphp
                @include('tasks._inline_universes', [
                    'task' => $task,
                    'universeItems' => $universeItems,
                    'universes' => $universesForInclude,
                    'currentUniverse' => $currentUniverse ?? null,
                    'fieldId' => 'universes-' . $task->id
                ])
                
                {{-- Estimated Time --}}
                @include('tasks._inline_estimated_time', [
                    'task' => $task,
                    'fieldId' => 'estimated-time-' . $task->id
                ])
                
                {{-- Recurring Task --}}
                @include('tasks._inline_recurring_task', [
                    'task' => $task,
                    'recurringTasks' => $recurringTasks ?? null,
                    'fieldId' => 'recurring-task-' . $task->id
                ])
                
                {{-- JSON data for JavaScript --}}
                <script type="application/json" id="universes-data-{{ $task->id }}">{!! json_encode(($universes ?? \App\Models\Universe::orderBy('name')->get())->pluck('name', 'id')) !!}</script>
                <script type="application/json" id="universe-index-data-{{ $task->id }}">{!! json_encode($universeItems->count()) !!}</script>
                
                {{-- Deadline --}}
                @include('tasks._inline_deadline', [
                    'task' => $task,
                    'fieldId' => 'deadline-' . $task->id
                ])
                
                <input type="hidden" name="status" value="{{ $task->status ?? 'open' }}">
                
                <div class="task-action-buttons">
                    <button type="button" class="skip-task-btn" data-task-id="{{ $task->id }}" data-is-recurring="{{ $task->isRecurring() ? '1' : '0' }}" data-is-completed="{{ $task->completed_at !== null ? '1' : '0' }}" data-is-skipped="{{ $task->skipped_at !== null ? '1' : '0' }}">Skip</button>
                    <button type="button" class="delete-task-btn" data-task-id="{{ $task->id }}">Delete</button>
                </div>
                    </form>
                </div>
                
                {{-- Right Card: Log Form --}}
                <div class="task-edit-card">
                    <form method="POST" action="{{ route('tasks.log', $task) }}" class="task-log-form">
                        @csrf
                        <div class="log-form-field">
                            <label class="log-form-label">Time:</label>
                            <div class="log-form-input-container">
                                <input type="number" 
                                       name="minutes" 
                                       id="log-minutes-{{ $task->id }}"
                                       data-original-minutes="0"
                                       min="0" 
                                       step="0.25"
                                       placeholder="Optional" 
                                       class="log-form-input">
                                <div class="log-form-radio-group">
                                    <label class="log-form-radio-label">
                                        <input type="radio" name="time_unit" value="minutes" id="log-time-unit-minutes-{{ $task->id }}">
                                        <span>Minutes</span>
                                    </label>
                                    <label class="log-form-radio-label">
                                        <input type="radio" name="time_unit" value="hours" id="log-time-unit-hours-{{ $task->id }}" checked>
                                        <span>Hours</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="log-form-field">
                            <label class="log-form-label">Notes:</label>
                            <textarea name="notes" rows="4" placeholder="Optional" class="log-form-textarea"></textarea>
                        </div>
                        <div class="log-form-actions">
                            <button type="submit" class="log-form-submit-btn">Log</button>
                            <button type="button" class="complete-and-log-btn" data-task-id="{{ $task->id }}">Complete & Log</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        {{-- Field initialization and save handlers are set up by TaskFieldInitializer.js and AddTaskCard.js --}}
    @endif
</li>

