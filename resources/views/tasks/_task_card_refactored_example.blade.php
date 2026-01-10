{{-- EXAMPLE: Refactored Task Card using Inline Editable Fields --}}
{{-- This shows how to apply the inline editable components to the task card --}}

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
    
    // Prepare data for inline editable fields
    $universesForEdit = $universes ?? \App\Models\Universe::orderBy('name')->get();
    $recurringTasksForEdit = $recurringTasks ?? \App\Models\RecurringTask::where('active', true)->get();
    
    // Format estimated time for display
    $estimatedTimeDisplay = 'Not set';
    if ($task->estimated_time) {
        if ($task->estimated_time >= 60) {
            $estimatedTimeDisplay = round($task->estimated_time / 60, 2) . ' hours';
        } else {
            $estimatedTimeDisplay = $task->estimated_time . ' minutes';
        }
    }
    
    // Format deadline for display
    $deadlineDisplay = 'Not set';
    if ($task->deadline_at) {
        $deadlineDisplay = $task->deadline_at->format('M j, Y g:i A');
    }
@endphp

<li class="task-item task-status-{{ $task->getComputedStatus() }} @if($task->created_at && $task->created_at->isToday()) task-created-today @endif">
    {{-- Simple View Mode --}}
    <div id="task-view-{{ $task->id }}" class="task-view task-status-{{ $task->getComputedStatus() }}">
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
        <div id="task-edit-{{ $task->id }}" class="task-edit-mode d-none">
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
                        
                        {{-- Universes Selection (keeping as-is for now - complex field) --}}
                        <div style="margin-bottom: 0.75rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9em; font-weight: 600;">Universes:</label>
                            <div id="universes-container-{{ $task->id }}">
                                @if($universeItems->isNotEmpty())
                                    @foreach($universeItems as $index => $universeItem)
                                        <div class="universe-item-row" data-index="{{ $index }}" style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                            <select name="universe_ids[]" class="universe-select" required style="padding: 0.35rem; flex: 1; max-width: 300px;">
                                                <option value="">— select universe —</option>
                                                @foreach ($universesForEdit as $u)
                                                    <option value="{{ $u->id }}" @selected($universeItem->universe_id == $u->id)>
                                                        {{ $u->name }}
                                                    </option>
                                                @endforeach
                                            </select>
                                            <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; white-space: nowrap;">
                                                <input type="radio" name="primary_universe" value="{{ $index }}" @checked($universeItem->is_primary)>
                                                Primary
                                            </label>
                                            <button type="button" class="remove-universe-btn" data-task-id="{{ $task->id }}" style="padding: 0.35rem 0.75rem; font-size: 0.9rem; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Remove</button>
                                        </div>
                                    @endforeach
                                @else
                                    <div class="universe-item-row" data-index="0" style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                        <select name="universe_ids[]" class="universe-select" required style="padding: 0.35rem; flex: 1; max-width: 300px;">
                                            <option value="">— select universe —</option>
                                            @foreach ($universesForEdit as $u)
                                                <option value="{{ $u->id }}" @selected(isset($currentUniverse) && $currentUniverse->id == $u->id)>
                                                    {{ $u->name }}
                                                </option>
                                            @endforeach
                                        </select>
                                        <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; white-space: nowrap;">
                                            <input type="radio" name="primary_universe" value="0" checked>
                                            Primary
                                        </label>
                                        <button type="button" class="remove-universe-btn" data-task-id="{{ $task->id }}" style="padding: 0.35rem 0.75rem; font-size: 0.9rem; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Remove</button>
                                    </div>
                                @endif
                            </div>
                            <button type="button" class="add-universe-btn" data-task-id="{{ $task->id }}" style="margin-top: 0.5rem; padding: 0.35rem 0.75rem; font-size: 0.85rem;">+ Add Universe</button>
                        </div>
                        
                        {{-- Estimated Time (using custom template - see below) --}}
                        @include('tasks._inline_estimated_time', [
                            'task' => $task,
                            'fieldId' => 'estimated-time-' . $task->id
                        ])
                        
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
                        
                        {{-- Recurring checkbox (keeping as-is - checkbox doesn't need inline edit) --}}
                        <div style="margin-bottom: 0.75rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; margin: 0; white-space: nowrap; font-size: 0.9em;">
                                <input type="checkbox" id="recurring-checkbox-{{ $task->id }}" @checked($task->recurring_task_id !== null) data-task-id="{{ $task->id }}">
                                Recurring
                            </label>
                        </div>
                        
                        {{-- Recurring task dropdown --}}
                        <div id="recurring-task-container-{{ $task->id }}" class="@if($task->recurring_task_id === null) d-none @endif" style="margin-bottom: 0.75rem;">
                            @php
                                $recurringTaskOptions = ['' => '— none —'];
                                foreach ($recurringTasksForEdit as $rt) {
                                    $recurringTaskOptions[$rt->id] = $rt->name;
                                }
                                $recurringTaskDisplay = $task->recurring_task_id 
                                    ? ($recurringTasksForEdit->firstWhere('id', $task->recurring_task_id)?->name ?? 'Not set')
                                    : 'Not set';
                            @endphp
                            <x-inline-editable-field
                                field-id="recurring-task-{{ $task->id }}"
                                label="Linked Recurring Task"
                                value="{{ $task->recurring_task_id }}"
                                name="recurring_task_id"
                                type="select"
                                :options="$recurringTaskOptions"
                                placeholder="Not set"
                            />
                        </div>
                        
                        {{-- JSON data for JavaScript --}}
                        <script type="application/json" id="universes-data-{{ $task->id }}">{!! json_encode($universesForEdit->pluck('name', 'id')) !!}</script>
                        <script type="application/json" id="universe-index-data-{{ $task->id }}">{!! json_encode($universeItems->count()) !!}</script>
                        
                        {{-- Deadline checkbox --}}
                        <div style="margin-bottom: 0.75rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; margin: 0; white-space: nowrap; font-size: 0.9em;">
                                <input type="checkbox" id="deadline-checkbox-{{ $task->id }}" @checked($task->deadline_at !== null) data-task-id="{{ $task->id }}">
                                Deadline
                            </label>
                        </div>
                        
                        {{-- Deadline input (using custom template) --}}
                        <div id="deadline-container-{{ $task->id }}" class="@if($task->deadline_at === null) d-none @endif" style="margin-bottom: 0.75rem;">
                            @include('tasks._inline_deadline', [
                                'task' => $task,
                                'fieldId' => 'deadline-' . $task->id
                            ])
                        </div>
                        
                        <input type="hidden" name="status" value="{{ $task->status ?? 'open' }}">
                        
                        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                            <button type="submit">Save</button>
                            @if($task->isRecurring() && $task->completed_at === null && $task->skipped_at === null)
                                <button type="button" class="skip-task-btn" data-task-id="{{ $task->id }}">Skip</button>
                            @endif
                            <button type="button" class="delete-task-btn" data-task-id="{{ $task->id }}" style="background-color: #dc3545; color: white; border: none; padding: 0.35rem 0.75rem; border-radius: 4px; cursor: pointer;">Delete</button>
                            <button type="button" class="cancel-edit-btn" data-task-id="{{ $task->id }}">Cancel</button>
                        </div>
                    </form>
                </div>
                
                {{-- Right Card: Log Form --}}
                <div class="task-edit-card">
                    <form method="POST" action="{{ route('tasks.log', $task) }}" class="task-log-form">
                        @csrf
                        {{-- Log form fields can also use inline editable if desired --}}
                        <div style="margin-bottom: 0.75rem;">
                            <label style="display: block; margin-bottom: 0.25rem; font-size: 0.9em; font-weight: 600;">Time:</label>
                            <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                                <input type="number" 
                                       name="minutes" 
                                       id="log-minutes-{{ $task->id }}"
                                       data-original-minutes="0"
                                       min="0" 
                                       step="0.25"
                                       placeholder="Optional" 
                                       style="padding: 0.35rem; flex: 1; min-width: 100px; max-width: 300px;">
                                <div style="display: flex; gap: 0.5rem; align-items: center;">
                                    <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; font-weight: normal; cursor: pointer; font-size: 0.9em;">
                                        <input type="radio" name="time_unit" value="minutes" id="log-time-unit-minutes-{{ $task->id }}">
                                        <span>Minutes</span>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; font-weight: normal; cursor: pointer; font-size: 0.9em;">
                                        <input type="radio" name="time_unit" value="hours" id="log-time-unit-hours-{{ $task->id }}" checked>
                                        <span>Hours</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <x-inline-editable-field
                            field-id="log-notes-{{ $task->id }}"
                            label="Notes"
                            value=""
                            name="notes"
                            type="textarea"
                            rows="4"
                            placeholder="Optional"
                        />
                        <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                            <button type="submit" style="padding: 0.35rem 0.75rem;">Log</button>
                            <button type="button" class="complete-and-log-btn" data-task-id="{{ $task->id }}" style="padding: 0.35rem 0.75rem; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Complete and Log</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    @endif
</li>
