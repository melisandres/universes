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
                <div style="margin-bottom: 0.75rem;">
                    <label style="display: block; margin-bottom: 0.25rem; font-size: 0.9em; font-weight: 600;">Name:</label>
                    <input type="text" name="name" value="{{ $task->name }}" required style="width: 100%; max-width: 300px; padding: 0.35rem;">
                </div>
                
                {{-- Estimated Time --}}
                <div style="margin-bottom: 0.75rem;">
                    <label style="display: block; margin-bottom: 0.25rem; font-size: 0.9em;">Estimated Time (minutes):</label>
                    <input type="number" name="estimated_time" value="{{ $task->estimated_time }}" min="0" placeholder="Optional" style="padding: 0.35rem; max-width: 300px;">
                </div>
                
                {{-- Description --}}
                <div style="margin-bottom: 0.75rem;">
                    <label style="display: block; margin-bottom: 0.25rem; font-size: 0.9em;">Description:</label>
                    <textarea name="description" rows="3" placeholder="Optional" style="padding: 0.35rem; max-width: 300px; width: 100%;">{{ $task->description }}</textarea>
                </div>
                
                {{-- Recurring checkbox --}}
                <div style="margin-bottom: 0.75rem;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; margin: 0; white-space: nowrap; font-size: 0.9em;">
                        <input type="checkbox" id="recurring-checkbox-{{ $task->id }}" @checked($task->recurring_task_id !== null) data-task-id="{{ $task->id }}">
                        Recurring
                    </label>
                </div>
                
                {{-- Recurring task dropdown (hidden by default if no recurring task) --}}
                <div id="recurring-task-container-{{ $task->id }}" class="@if($task->recurring_task_id === null) d-none @endif" style="margin-bottom: 0.75rem;">
                    <label style="display: block; margin-bottom: 0.25rem; font-size: 0.9em;">Linked Recurring Task:</label>
                    <select name="recurring_task_id" style="padding: 0.35rem; max-width: 300px;">
                        <option value="">— none —</option>
                        @php
                            $recurringTasksForEdit = $recurringTasks ?? \App\Models\RecurringTask::where('active', true)->get();
                        @endphp
                        @foreach ($recurringTasksForEdit as $rt)
                            <option value="{{ $rt->id }}" @selected($task->recurring_task_id == $rt->id)>
                                {{ $rt->name }}
                            </option>
                        @endforeach
                    </select>
                </div>
                
                {{-- JSON data for JavaScript --}}
                <script type="application/json" id="universes-data-{{ $task->id }}">{!! json_encode(($universes ?? \App\Models\Universe::orderBy('name')->get())->pluck('name', 'id')) !!}</script>
                <script type="application/json" id="universe-index-data-{{ $task->id }}">{!! json_encode($universeItems->count()) !!}</script>
                
                {{-- Deadline checkbox --}}
                <div style="margin-bottom: 0.75rem;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; margin: 0; white-space: nowrap; font-size: 0.9em;">
                        <input type="checkbox" id="deadline-checkbox-{{ $task->id }}" @checked($task->deadline_at !== null) data-task-id="{{ $task->id }}">
                        Deadline
                    </label>
                </div>
                
                {{-- Deadline input (hidden by default if no deadline) --}}
                <div id="deadline-container-{{ $task->id }}" class="@if($task->deadline_at === null) d-none @endif" style="margin-bottom: 0.75rem;">
                    <label style="display: block; margin-bottom: 0.25rem; font-size: 0.9em;">Deadline:</label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="datetime-local" name="deadline_at" id="deadline-{{ $task->id }}" value="{{ $task->deadline_at ? $task->deadline_at->format('Y-m-d\TH:i') : '' }}" style="padding: 0.35rem; flex: 1; max-width: 300px;" data-task-id="{{ $task->id }}" @disabled($task->deadline_at === null)>
                        <button type="button" class="btn-today" data-task-id="{{ $task->id }}" style="padding: 0.35rem 0.75rem; font-size: 0.85rem; white-space: nowrap;">Today</button>
                    </div>
                </div>
                
                {{-- Universes Selection --}}
                <div style="margin-bottom: 0.75rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9em; font-weight: 600;">Universes:</label>
                    <div id="universes-container-{{ $task->id }}">
                        @php
                            $universesForEdit = $universes ?? \App\Models\Universe::orderBy('name')->get();
                        @endphp
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
                        <div style="margin-bottom: 0.75rem;">
                            <label style="display: block; margin-bottom: 0.25rem; font-size: 0.9em; font-weight: 600;">Minutes:</label>
                            <input type="number" name="minutes" min="0" placeholder="Optional" style="padding: 0.35rem; width: 100%; max-width: 300px;">
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
        
        {{-- JavaScript is now in TaskCardEditorTest.js --}}
    @endif
</li>

