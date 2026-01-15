@extends('layouts.app')

@section('title', 'Logs')

@section('content')
<h1>Logs</h1>

<div style="margin-bottom: 20px;">
    <h3>New Log</h3>
    <form method="POST" action="{{ route('logs.store') }}" id="new-log-form" style="margin-bottom: 20px;">
        @csrf
        
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Log Type:</label>
        <div style="margin-bottom: 1rem;">
            <label style="display: inline-flex; align-items: center; margin-right: 1rem;">
                <input type="radio" name="log_type" value="task" checked style="margin-right: 0.25rem;">
                Task
            </label>
            <label style="display: inline-flex; align-items: center; margin-right: 1rem;">
                <input type="radio" name="log_type" value="idea" style="margin-right: 0.25rem;">
                Idea
            </label>
            <label style="display: inline-flex; align-items: center; margin-right: 1rem;">
                <input type="radio" name="log_type" value="universe" style="margin-right: 0.25rem;">
                Universe
            </label>
            <label style="display: inline-flex; align-items: center;">
                <input type="radio" name="log_type" value="other" style="margin-right: 0.25rem;">
                Other (Standalone)
            </label>
        </div>

        <div id="task-select-container" style="margin-bottom: 1rem;">
            <label>Task:</label><br>
            <select name="task_id" id="task-select">
                <option value="">— select task —</option>
                @foreach ($tasksByUniverse as $universeName => $universeTasks)
                    <optgroup label="{{ $universeName }}">
                        @foreach ($universeTasks as $task)
                            <option value="{{ $task->id }}">{{ $task->name }}</option>
                        @endforeach
                    </optgroup>
                @endforeach
            </select>
        </div>

        <div id="idea-select-container" style="margin-bottom: 1rem; display: none;">
            <label>Idea:</label><br>
            <select name="idea_id" id="idea-select">
                <option value="">— select idea —</option>
                @foreach ($ideasByPool as $poolName => $poolIdeas)
                    <optgroup label="{{ $poolName }}">
                        @foreach ($poolIdeas as $idea)
                            <option value="{{ $idea->id }}">{{ $idea->title }}</option>
                        @endforeach
                    </optgroup>
                @endforeach
            </select>
        </div>

        <div id="universe-select-container" style="margin-bottom: 1rem; display: none;">
            <label>Universe:</label><br>
            <select name="universe_id" id="universe-select">
                <option value="">— select universe —</option>
                @foreach ($universes as $universe)
                    <option value="{{ $universe->id }}">{{ $universe->name }}</option>
                @endforeach
            </select>
        </div>

        <input type="hidden" name="loggable_type" id="loggable-type-input" value="App\Models\Task">
        <input type="hidden" name="loggable_id" id="loggable-id-input" value="">

        <label>Time:</label><br>
        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem;">
            <input type="number" 
                   name="minutes" 
                   id="log-minutes-create"
                   data-original-minutes="0"
                   min="0" 
                   step="0.25"
                   value=""
                   style="flex: 1; min-width: 100px;">
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; font-weight: normal; cursor: pointer;">
                    <input type="radio" name="time_unit" value="minutes" id="log-time-unit-minutes-create">
                    <span>Minutes</span>
                </label>
                <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; font-weight: normal; cursor: pointer;">
                    <input type="radio" name="time_unit" value="hours" id="log-time-unit-hours-create" checked>
                    <span>Hours</span>
                </label>
            </div>
        </div>

        <label>Notes</label><br>
        <textarea name="notes"></textarea><br><br>

        <button type="submit">Create Log</button>
    </form>
</div>

@if($logs->isEmpty())
    <p>No logs found.</p>
@else
    @foreach ($logs as $date => $dateLogs)
        <h2>{{ \Carbon\Carbon::parse($date)->format('F j, Y') }}</h2>
        <ul>
            @foreach ($dateLogs as $log)
                <li>
                    <div class="log-item" data-log-id="{{ $log->id }}">
                        <div class="log-view" id="log-view-{{ $log->id }}">
                            @if($log->task)
                                @php
                                    $log->task->load('universeItems.universe');
                                    $primaryUniverse = $log->task->universeItems->where('is_primary', true)->first();
                                    $secondaryUniverses = $log->task->universeItems->where('is_primary', false);
                                @endphp
                                <strong>Task: {{ $log->task->name }}</strong>
                                @if($primaryUniverse)
                                    (<strong>{{ $primaryUniverse->universe->name }}</strong>
                                    @if($secondaryUniverses->isNotEmpty())
                                        <span class="secondary-universes">
                                            @foreach($secondaryUniverses as $secondary)
                                                <span class="secondary-universe">{{ $secondary->universe->name }}</span>
                                            @endforeach
                                        </span>
                                    @endif
                                    )
                                @endif<br>
                            @elseif($log->idea)
                                @php
                                    // Load idea pools with their universe relationships
                                    if (!$log->idea->relationLoaded('ideaPools')) {
                                        $log->idea->load('ideaPools.universeItems.universe');
                                    }
                                    // Get primary pool from the loaded collection
                                    $ideaPool = $log->idea->ideaPools->where('pivot.primary_pool', true)->first();
                                    $primaryUniverse = null;
                                    if ($ideaPool && $ideaPool->relationLoaded('universeItems')) {
                                        $primaryUniverse = $ideaPool->universeItems->where('is_primary', true)->first();
                                    }
                                @endphp
                                <strong>Idea: {{ $log->idea->title }}</strong>
                                @if($ideaPool)
                                    (Pool: <strong>{{ $ideaPool->name }}</strong>
                                    @if($primaryUniverse)
                                        in <strong>{{ $primaryUniverse->universe->name }}</strong>
                                    @endif
                                    )
                                @endif<br>
                            @elseif($log->universe)
                                <strong>Universe: {{ $log->universe->name }}</strong><br>
                            @else
                                <strong>Standalone Log</strong><br>
                            @endif
                            @if($log->minutes)
                                Time spent: {{ $log->minutes }} minutes<br>
                            @endif
                            @if($log->notes)
                                Notes: {{ $log->notes }}<br>
                            @endif
                            Created at: {{ $log->created_at->format('Y-m-d H:i') }}<br>
                            
                            <div class="btns" style="margin-top: 10px;">
                                <button type="button" class="edit-log-btn" data-log-id="{{ $log->id }}">Edit</button>
                                <form method="POST" action="{{ route('logs.destroy', $log) }}" class="inline-form">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" onclick="return confirm('Are you sure?')">Delete</button>
                                </form>
                            </div>
                        </div>

                        <div class="log-edit" id="log-edit-{{ $log->id }}" style="display: none;">
                            <form method="POST" action="{{ route('logs.update', $log) }}" class="edit-log-form" data-log-id="{{ $log->id }}">
                                @csrf
                                @method('PUT')

                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Log Type:</label>
                                <div style="margin-bottom: 1rem;">
                                    <label style="display: inline-flex; align-items: center; margin-right: 1rem;">
                                        <input type="radio" name="log_type_{{ $log->id }}" value="task" @checked($log->loggable_type === 'App\Models\Task') style="margin-right: 0.25rem;">
                                        Task
                                    </label>
                                    <label style="display: inline-flex; align-items: center; margin-right: 1rem;">
                                        <input type="radio" name="log_type_{{ $log->id }}" value="idea" @checked($log->loggable_type === 'App\Models\Idea') style="margin-right: 0.25rem;">
                                        Idea
                                    </label>
                                    <label style="display: inline-flex; align-items: center; margin-right: 1rem;">
                                        <input type="radio" name="log_type_{{ $log->id }}" value="universe" @checked($log->loggable_type === 'App\Models\Universe') style="margin-right: 0.25rem;">
                                        Universe
                                    </label>
                                    <label style="display: inline-flex; align-items: center;">
                                        <input type="radio" name="log_type_{{ $log->id }}" value="other" @checked($log->loggable_type !== 'App\Models\Task' && $log->loggable_type !== 'App\Models\Idea' && $log->loggable_type !== 'App\Models\Universe') style="margin-right: 0.25rem;">
                                        Other (Standalone)
                                    </label>
                                </div>

                                <div class="task-select-container-edit" id="task-select-container-edit-{{ $log->id }}" style="margin-bottom: 1rem; @if($log->loggable_type !== 'App\Models\Task') display: none; @endif">
                                    <label>Task:</label><br>
                                    <select name="task_id_edit_{{ $log->id }}" class="task-select-edit">
                                        <option value="">— select task —</option>
                                        @foreach ($tasksByUniverse as $universeName => $universeTasks)
                                            <optgroup label="{{ $universeName }}">
                                                @foreach ($universeTasks as $task)
                                                    <option value="{{ $task->id }}" @selected($log->loggable_type === 'App\Models\Task' && $log->loggable_id == $task->id)>
                                                        {{ $task->name }}
                                                    </option>
                                                @endforeach
                                            </optgroup>
                                        @endforeach
                                    </select>
                                </div>

                                <div class="idea-select-container-edit" id="idea-select-container-edit-{{ $log->id }}" style="margin-bottom: 1rem; @if($log->loggable_type !== 'App\Models\Idea') display: none; @endif">
                                    <label>Idea:</label><br>
                                    <select name="idea_id_edit_{{ $log->id }}" class="idea-select-edit">
                                        <option value="">— select idea —</option>
                                        @foreach ($ideasByPool as $poolName => $poolIdeas)
                                            <optgroup label="{{ $poolName }}">
                                                @foreach ($poolIdeas as $idea)
                                                    <option value="{{ $idea->id }}" @selected($log->loggable_type === 'App\Models\Idea' && $log->loggable_id == $idea->id)>
                                                        {{ $idea->title }}
                                                    </option>
                                                @endforeach
                                            </optgroup>
                                        @endforeach
                                    </select>
                                </div>

                                <div class="universe-select-container-edit" id="universe-select-container-edit-{{ $log->id }}" style="margin-bottom: 1rem; @if($log->loggable_type !== 'App\Models\Universe') display: none; @endif">
                                    <label>Universe:</label><br>
                                    <select name="universe_id_edit_{{ $log->id }}" class="universe-select-edit">
                                        <option value="">— select universe —</option>
                                        @foreach ($universes as $universe)
                                            <option value="{{ $universe->id }}" @selected($log->loggable_type === 'App\Models\Universe' && $log->loggable_id == $universe->id)>
                                                {{ $universe->name }}
                                            </option>
                                        @endforeach
                                    </select>
                                </div>

                                <input type="hidden" name="loggable_type" class="loggable-type-input-edit" value="{{ $log->loggable_type ?? 'App\Models\Task' }}">
                                <input type="hidden" name="loggable_id" class="loggable-id-input-edit" value="{{ $log->loggable_id ?? '' }}"><br><br>

                                @php
                                    $logDisplayTime = null;
                                    $logDefaultStep = '0.25'; // Default to hours
                                    if ($log->minutes) {
                                        if ($log->minutes >= 60) {
                                            $logDisplayTime = round($log->minutes / 60, 2);
                                            $logDefaultStep = '0.25';
                                        } else {
                                            $logDisplayTime = $log->minutes;
                                            $logDefaultStep = '1';
                                        }
                                    }
                                @endphp
                                <label>Time:</label><br>
                                <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem;">
                                    <input type="number" 
                                           name="minutes" 
                                           id="log-minutes-edit-{{ $log->id }}"
                                           data-original-minutes="{{ $log->minutes ?? 0 }}"
                                           min="0" 
                                           step="{{ $logDefaultStep }}"
                                           value="{{ $logDisplayTime }}"
                                           style="flex: 1; min-width: 100px;">
                                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                                        <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; font-weight: normal; cursor: pointer;">
                                            <input type="radio" name="time_unit" value="minutes" id="log-time-unit-minutes-edit-{{ $log->id }}" @if($log->minutes && $log->minutes < 60) checked @endif>
                                            <span>Minutes</span>
                                        </label>
                                        <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; font-weight: normal; cursor: pointer;">
                                            <input type="radio" name="time_unit" value="hours" id="log-time-unit-hours-edit-{{ $log->id }}" @if(!$log->minutes || $log->minutes >= 60) checked @endif>
                                            <span>Hours</span>
                                        </label>
                                    </div>
                                </div>

                                <label>Notes</label><br>
                                <textarea name="notes">{{ $log->notes }}</textarea><br><br>

                                <button type="submit">Update</button>
                                <button type="button" class="cancel-edit-log-btn" data-log-id="{{ $log->id }}">Cancel</button>
                            </form>
                        </div>
                    </div>
                </li>
            @endforeach
        </ul>
    @endforeach
@endif
@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Handle log type radio buttons
    const logTypeRadios = document.querySelectorAll('input[name="log_type"]');
    const taskSelectContainer = document.getElementById('task-select-container');
    const ideaSelectContainer = document.getElementById('idea-select-container');
    const universeSelectContainer = document.getElementById('universe-select-container');
    const taskSelect = document.getElementById('task-select');
    const ideaSelect = document.getElementById('idea-select');
    const universeSelect = document.getElementById('universe-select');
    const loggableTypeInput = document.getElementById('loggable-type-input');
    const loggableIdInput = document.getElementById('loggable-id-input');
    const newLogForm = document.getElementById('new-log-form');

    logTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'task') {
                taskSelectContainer.style.display = 'block';
                ideaSelectContainer.style.display = 'none';
                universeSelectContainer.style.display = 'none';
                loggableTypeInput.value = 'App\Models\Task';
                loggableIdInput.value = taskSelect.value || '';
                ideaSelect.value = '';
                universeSelect.value = '';
            } else if (this.value === 'idea') {
                taskSelectContainer.style.display = 'none';
                ideaSelectContainer.style.display = 'block';
                universeSelectContainer.style.display = 'none';
                loggableTypeInput.value = 'App\Models\Idea';
                loggableIdInput.value = ideaSelect.value || '';
                taskSelect.value = '';
                universeSelect.value = '';
            } else if (this.value === 'universe') {
                taskSelectContainer.style.display = 'none';
                ideaSelectContainer.style.display = 'none';
                universeSelectContainer.style.display = 'block';
                loggableTypeInput.value = 'App\Models\Universe';
                loggableIdInput.value = universeSelect.value || '';
                taskSelect.value = '';
                ideaSelect.value = '';
            } else {
                // Other/Standalone
                taskSelectContainer.style.display = 'none';
                ideaSelectContainer.style.display = 'none';
                universeSelectContainer.style.display = 'none';
                loggableTypeInput.value = '';
                loggableIdInput.value = '';
                taskSelect.value = '';
                ideaSelect.value = '';
                universeSelect.value = '';
            }
        });
    });

    // Update loggable_id when selects change
    if (taskSelect) {
        taskSelect.addEventListener('change', function() {
            if (document.querySelector('input[name="log_type"]:checked').value === 'task') {
                loggableIdInput.value = this.value || '';
            }
        });
    }

    if (ideaSelect) {
        ideaSelect.addEventListener('change', function() {
            if (document.querySelector('input[name="log_type"]:checked').value === 'idea') {
                loggableIdInput.value = this.value || '';
            }
        });
    }

    if (universeSelect) {
        universeSelect.addEventListener('change', function() {
            if (document.querySelector('input[name="log_type"]:checked').value === 'universe') {
                loggableIdInput.value = this.value || '';
            }
        });
    }

    // Handle form submission - ensure loggable_id is set correctly
    if (newLogForm) {
        newLogForm.addEventListener('submit', function(e) {
            const selectedType = document.querySelector('input[name="log_type"]:checked').value;
            if (selectedType === 'task') {
                loggableIdInput.value = taskSelect.value || '';
            } else if (selectedType === 'idea') {
                loggableIdInput.value = ideaSelect.value || '';
            } else if (selectedType === 'universe') {
                loggableIdInput.value = universeSelect.value || '';
            } else {
                loggableIdInput.value = '';
            }
        });
    }

    // Handle edit form log type changes
    document.querySelectorAll('.edit-log-form').forEach(form => {
        const logId = form.dataset.logId;
        const logTypeRadios = form.querySelectorAll(`input[name="log_type_${logId}"]`);
        const taskContainer = document.getElementById(`task-select-container-edit-${logId}`);
        const ideaContainer = document.getElementById(`idea-select-container-edit-${logId}`);
        const universeContainer = document.getElementById(`universe-select-container-edit-${logId}`);
        const taskSelect = form.querySelector(`.task-select-edit`);
        const ideaSelect = form.querySelector(`.idea-select-edit`);
        const universeSelect = form.querySelector(`.universe-select-edit`);
        const loggableTypeInput = form.querySelector('.loggable-type-input-edit');
        const loggableIdInput = form.querySelector('.loggable-id-input-edit');

        logTypeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'task') {
                    taskContainer.style.display = 'block';
                    ideaContainer.style.display = 'none';
                    if (universeContainer) universeContainer.style.display = 'none';
                    loggableTypeInput.value = 'App\Models\Task';
                    loggableIdInput.value = taskSelect.value || '';
                    ideaSelect.value = '';
                    if (universeSelect) universeSelect.value = '';
                } else if (this.value === 'idea') {
                    taskContainer.style.display = 'none';
                    ideaContainer.style.display = 'block';
                    if (universeContainer) universeContainer.style.display = 'none';
                    loggableTypeInput.value = 'App\Models\Idea';
                    loggableIdInput.value = ideaSelect.value || '';
                    taskSelect.value = '';
                    if (universeSelect) universeSelect.value = '';
                } else if (this.value === 'universe') {
                    taskContainer.style.display = 'none';
                    ideaContainer.style.display = 'none';
                    if (universeContainer) universeContainer.style.display = 'block';
                    loggableTypeInput.value = 'App\Models\Universe';
                    loggableIdInput.value = universeSelect ? universeSelect.value || '' : '';
                    taskSelect.value = '';
                    ideaSelect.value = '';
                } else {
                    taskContainer.style.display = 'none';
                    ideaContainer.style.display = 'none';
                    if (universeContainer) universeContainer.style.display = 'none';
                    loggableTypeInput.value = '';
                    loggableIdInput.value = '';
                    taskSelect.value = '';
                    ideaSelect.value = '';
                    if (universeSelect) universeSelect.value = '';
                }
            });
        });

        // Update loggable_id when selects change
        if (taskSelect) {
            taskSelect.addEventListener('change', function() {
                if (form.querySelector(`input[name="log_type_${logId}"]:checked`).value === 'task') {
                    loggableIdInput.value = this.value || '';
                }
            });
        }

        if (ideaSelect) {
            ideaSelect.addEventListener('change', function() {
                if (form.querySelector(`input[name="log_type_${logId}"]:checked`).value === 'idea') {
                    loggableIdInput.value = this.value || '';
                }
            });
        }

        if (universeSelect) {
            universeSelect.addEventListener('change', function() {
                if (form.querySelector(`input[name="log_type_${logId}"]:checked`).value === 'universe') {
                    loggableIdInput.value = this.value || '';
                }
            });
        }

        // Handle form submission
        form.addEventListener('submit', function(e) {
            const selectedType = form.querySelector(`input[name="log_type_${logId}"]:checked`).value;
            if (selectedType === 'task') {
                loggableIdInput.value = taskSelect.value || '';
            } else if (selectedType === 'idea') {
                loggableIdInput.value = ideaSelect.value || '';
            } else if (selectedType === 'universe') {
                loggableIdInput.value = universeSelect ? universeSelect.value || '' : '';
            } else {
                loggableIdInput.value = '';
            }
        });
    });

    // Handle edit button clicks
    document.querySelectorAll('.edit-log-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const logId = this.dataset.logId;
            const viewMode = document.getElementById('log-view-' + logId);
            const editMode = document.getElementById('log-edit-' + logId);
            
            viewMode.style.display = 'none';
            editMode.style.display = 'block';
        });
    });
    
    // Handle cancel button clicks
    document.querySelectorAll('.cancel-edit-log-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const logId = this.dataset.logId;
            const viewMode = document.getElementById('log-view-' + logId);
            const editMode = document.getElementById('log-edit-' + logId);
            
            viewMode.style.display = 'block';
            editMode.style.display = 'none';
        });
    });
    
    // Time unit conversion for log forms
    function updateLogStoredMinutes(input) {
        if (!input || !input.value) return;
        
        const currentValue = parseFloat(input.value);
        if (isNaN(currentValue)) return;
        
        const form = input.closest('form');
        const selectedUnit = form?.querySelector('input[name="time_unit"]:checked')?.value || 'hours';
        
        let minutes;
        if (selectedUnit === 'hours') {
            minutes = currentValue * 60;
        } else {
            minutes = currentValue;
        }
        
        input.dataset.storedMinutes = Math.round(minutes).toString();
    }
    
    function updateLogTimeDisplay(newUnit, input) {
        if (!input) return;
        
        updateLogStoredMinutes(input);
        
        const storedMinutes = parseFloat(input.dataset.storedMinutes) || 0;
        
        if (!storedMinutes) {
            input.step = newUnit === 'hours' ? '0.25' : '1';
            return;
        }
        
        if (newUnit === 'hours') {
            const hours = storedMinutes / 60;
            input.value = parseFloat(hours.toFixed(2));
            input.step = '0.25';
        } else {
            input.value = Math.round(storedMinutes);
            input.step = '1';
        }
    }
    
    // Initialize time unit conversion for create log form
    const createLogMinutesInput = document.getElementById('log-minutes-create');
    const createLogTimeUnitRadios = document.querySelectorAll('input[name="time_unit"][id^="log-time-unit-"]');
    
    if (createLogMinutesInput) {
        createLogMinutesInput.dataset.storedMinutes = '0';
        createLogMinutesInput.addEventListener('input', () => updateLogStoredMinutes(createLogMinutesInput));
    }
    
    createLogTimeUnitRadios.forEach(radio => {
        if (radio.id.includes('create')) {
            radio.addEventListener('change', (e) => {
                updateLogTimeDisplay(e.target.value, createLogMinutesInput);
            });
        }
    });
    
    // Initialize time unit conversion for edit log forms
    document.querySelectorAll('input[name="minutes"][id^="log-minutes-edit-"]').forEach(input => {
        const logId = input.id.replace('log-minutes-edit-', '');
        const originalMinutes = parseFloat(input.dataset.originalMinutes) || 0;
        input.dataset.storedMinutes = originalMinutes.toString();
        
        input.addEventListener('input', () => updateLogStoredMinutes(input));
        
        const editRadios = document.querySelectorAll(`input[name="time_unit"][id^="log-time-unit-"][id$="-${logId}"]`);
        editRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateLogTimeDisplay(e.target.value, input);
            });
        });
    });
});
</script>
@endpush

