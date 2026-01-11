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
                
                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
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
                        <div style="margin-bottom: 0.75rem;">
                            <label style="display: block; margin-bottom: 0.25rem; font-size: 0.9em; font-weight: 600;">Notes:</label>
                            <textarea name="notes" rows="4" placeholder="Optional" style="padding: 0.35rem; width: 100%; max-width: 300px; resize: vertical;"></textarea>
                        </div>
                        <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                            <button type="submit" style="padding: 0.35rem 0.75rem;">Log</button>
                            <button type="button" class="complete-and-log-btn" data-task-id="{{ $task->id }}" style="padding: 0.35rem 0.75rem; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Complete and Log</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        {{-- Initialize inline editable fields with individual save functionality --}}
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            const taskId = {{ $task->id }};
            
            // Wait a bit for auto-initialization to complete
            setTimeout(function() {
                // Name field
                const nameFieldId = 'task-name-' + taskId;
                if (window.inlineFieldEditors && window.inlineFieldEditors[nameFieldId]) {
                    const nameEditor = window.inlineFieldEditors[nameFieldId];
                    nameEditor.options.onSave = async function(newValue, oldValue, editor) {
                        const success = await TaskFieldSaver.saveField(taskId, 'name', newValue);
                        if (success) {
                            editor.updateDisplayValue(newValue);
                            editor.originalValue = newValue;
                            return true;
                        }
                        return false;
                    };
                }
                
                // Description field
                const descFieldId = 'task-description-' + taskId;
                if (window.inlineFieldEditors && window.inlineFieldEditors[descFieldId]) {
                    const descEditor = window.inlineFieldEditors[descFieldId];
                    descEditor.options.onSave = async function(newValue, oldValue, editor) {
                        const success = await TaskFieldSaver.saveField(taskId, 'description', newValue);
                        if (success) {
                            editor.updateDisplayValue(newValue);
                            editor.originalValue = newValue;
                            return true;
                        }
                        return false;
                    };
                }
            }, 100);
        });
        </script>
    @endif
</li>

