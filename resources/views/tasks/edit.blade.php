@extends('layouts.app')

@section('title', 'Edit Task')

@section('content')
<h2>Edit Task</h2>

<form method="POST" action="{{ route('tasks.update', $task) }}">
    @csrf
    @method('PUT')
    @if(isset($referer))
        <input type="hidden" name="referer" value="{{ $referer }}">
    @endif

    {{-- Name at the top with status pill --}}
    <div style="margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <span class="status-pill status-pill-{{ $task->getComputedStatus() }}" id="status-pill-edit">{{ $task->getComputedStatus() }}</span>
                    <label style="margin: 0;">Name</label>
                </div>
                @php
                    // Decode HTML entities to prevent double-encoding
                    // Decode iteratively to handle double/triple-encoded entities
                    $decodedName = $task->name;
                    $previousValue = '';
                    while ($decodedName !== $previousValue) {
                        $previousValue = $decodedName;
                        $decodedName = html_entity_decode($decodedName, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                    }
                @endphp
                <input type="text" name="name" value="{{ $decodedName }}" required style="width: 100%; max-width: 500px;">
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; padding-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; margin: 0; white-space: nowrap;">
                    <input type="checkbox" id="recurring-checkbox" @checked($task->recurring_task_id !== null) onchange="toggleRecurringTaskDropdown()">
                    Recurring
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; margin: 0; white-space: nowrap;">
                    <input type="checkbox" id="deadline-checkbox" @checked($task->deadline_at !== null) onchange="toggleDeadlineInputEdit()">
                    Deadline
                </label>
            </div>
        </div>
    </div>

    {{-- Estimated Time --}}
    <div style="margin-bottom: 1rem;">
        <label>Estimated Time:</label><br>
        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            @php
                $displayTime = null;
                $defaultStep = '0.25'; // Default to hours
                if ($task->estimated_time) {
                    if ($task->estimated_time >= 60) {
                        $displayTime = round($task->estimated_time / 60, 2);
                        $defaultStep = '0.25';
                    } else {
                        $displayTime = $task->estimated_time;
                        $defaultStep = '1';
                    }
                }
            @endphp
            <input type="number" 
                   name="estimated_time" 
                   id="estimated-time-edit"
                   value="{{ $displayTime }}" 
                   data-original-minutes="{{ $task->estimated_time ?? 0 }}"
                   min="0" 
                   step="{{ $defaultStep }}"
                   placeholder="Optional" 
                   style="max-width: 500px; flex: 1; min-width: 100px;">
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; font-weight: normal; cursor: pointer;">
                    <input type="radio" name="time_unit" value="minutes" id="time-unit-minutes-edit" @if($task->estimated_time && $task->estimated_time < 60) checked @endif>
                    <span>Minutes</span>
                </label>
                <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; font-weight: normal; cursor: pointer;">
                    <input type="radio" name="time_unit" value="hours" id="time-unit-hours-edit" @if(!$task->estimated_time || $task->estimated_time >= 60) checked @endif>
                    <span>Hours</span>
                </label>
            </div>
        </div>
    </div>

    {{-- Description --}}
    <div style="margin-bottom: 1rem;">
        <label>Description</label><br>
        @php
            // Decode HTML entities to prevent double-encoding
            // Decode iteratively to handle double/triple-encoded entities
            $decodedDescription = $task->description ?? '';
            $previousValue = '';
            while ($decodedDescription !== $previousValue) {
                $previousValue = $decodedDescription;
                $decodedDescription = html_entity_decode($decodedDescription, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            }
        @endphp
        <textarea name="description" rows="4" placeholder="Optional" style="max-width: 500px;">{{ $decodedDescription }}</textarea>
    </div>

    {{-- Deadline with Today button (only shown if checkbox is checked) --}}
    <div id="deadline-container-edit" class="@if($task->deadline_at === null) d-none @endif" style="margin-bottom: 1rem;">
        <label>Deadline</label><br>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="datetime-local" name="deadline_at" id="deadline-input" value="{{ $task->deadline_at ? $task->deadline_at->format('Y-m-d\TH:i') : '' }}" style="max-width: 500px;" onchange="updateStatusPillFromDeadlineEdit()">
            <button type="button" class="btn-today" onclick="setDeadlineTodayEdit()" style="padding: 0.5rem 1rem;">Today</button>
        </div>
    </div>

    {{-- Linked Recurring Task (only shown if checkbox is checked) --}}
    <div id="recurring-task-container" class="@if($task->recurring_task_id === null) d-none @endif" style="margin-bottom: 1rem;">
        <label>Linked Recurring Task</label><br>
        <select name="recurring_task_id" style="max-width: 500px;">
            <option value="">— none —</option>
            @foreach ($recurringTasks as $rt)
                <option value="{{ $rt->id }}" @selected($task->recurring_task_id == $rt->id)>
                    {{ $rt->name }}
                </option>
            @endforeach
        </select>
    </div>

    {{-- Universes Selection --}}
    <label>Universes</label><br>
    <div id="universes-container">
        @php
            $task->load('universeItems.universe');
            $universeItems = $task->universeItems->sortByDesc('is_primary');
        @endphp
        @foreach($universeItems as $index => $universeItem)
            <div class="universe-item-row" data-index="{{ $index }}">
                <select name="universe_ids[]" class="universe-select" required>
                    <option value="">— select universe —</option>
                    @foreach ($universes as $u)
                        <option value="{{ $u->id }}" @selected($universeItem->universe_id == $u->id)>
                            {{ $u->name }}
                        </option>
                    @endforeach
                </select>
                <label>
                    <input type="radio" name="primary_universe" value="{{ $index }}" @checked($universeItem->is_primary)>
                    Primary
                </label>
                <button type="button" class="remove-universe-btn" onclick="removeUniverseRow(this)">Remove</button>
            </div>
        @endforeach
        @if($universeItems->isEmpty())
            <div class="universe-item-row" data-index="0">
                <select name="universe_ids[]" class="universe-select" required>
                    <option value="">— select universe —</option>
                    @foreach ($universes as $u)
                        <option value="{{ $u->id }}">{{ $u->name }}</option>
                    @endforeach
                </select>
                <label>
                    <input type="radio" name="primary_universe" value="0" checked>
                    Primary
                </label>
                <button type="button" class="remove-universe-btn" onclick="removeUniverseRow(this)">Remove</button>
            </div>
        @endif
    </div>
    <button type="button" onclick="addUniverseRow()" style="margin-top: 10px;">+ Add Universe</button><br><br>

    <input type="hidden" name="status" value="{{ $task->status }}">
    <br>

    <button type="submit">Update</button>
</form>

<script type="application/json" id="universes-data">{!! json_encode($universes->pluck('name', 'id')) !!}</script>
<script type="application/json" id="universe-index-data">{!! json_encode($universeItems->count()) !!}</script>

@push('scripts')
<script>
let universeIndex = parseInt(document.getElementById('universe-index-data').textContent.trim());
const universes = JSON.parse(document.getElementById('universes-data').textContent);

function addUniverseRow() {
    const container = document.getElementById('universes-container');
    const newRow = document.createElement('div');
    newRow.className = 'universe-item-row';
    newRow.setAttribute('data-index', universeIndex);
    
    let optionsHtml = '<option value="">— select universe —</option>';
    for (const [id, name] of Object.entries(universes)) {
        optionsHtml += `<option value="${id}">${name}</option>`;
    }
    
    newRow.innerHTML = `
        <select name="universe_ids[]" class="universe-select" required>
            ${optionsHtml}
        </select>
        <label>
            <input type="radio" name="primary_universe" value="${universeIndex}">
            Primary
        </label>
        <button type="button" class="remove-universe-btn" onclick="removeUniverseRow(this)">Remove</button>
    `;
    
    container.appendChild(newRow);
    universeIndex++;
}

function removeUniverseRow(btn) {
    const container = document.getElementById('universes-container');
    if (container.children.length > 1) {
        btn.closest('.universe-item-row').remove();
    } else {
        alert('At least one universe is required');
    }
}

function toggleRecurringTaskDropdown() {
    const checkbox = document.getElementById('recurring-checkbox');
    const container = document.getElementById('recurring-task-container');
    if (checkbox && container) {
        container.style.display = checkbox.checked ? 'block' : 'none';
        // If unchecked, clear the recurring task selection
        if (!checkbox.checked) {
            const select = container.querySelector('select[name="recurring_task_id"]');
            if (select) {
                select.value = '';
            }
        }
    }
}

function setDeadlineTodayEdit() {
    const deadlineInput = document.getElementById('deadline-input');
    if (deadlineInput) {
        const today = new Date();
        today.setHours(17, 0, 0, 0); // 5pm
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const hours = String(today.getHours()).padStart(2, '0');
        const minutes = String(today.getMinutes()).padStart(2, '0');
        deadlineInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        updateStatusPillFromDeadlineEdit();
    }
}

function toggleDeadlineInputEdit() {
    const checkbox = document.getElementById('deadline-checkbox');
    const container = document.getElementById('deadline-container-edit');
    const deadlineInput = document.getElementById('deadline-input');
    if (checkbox && container && deadlineInput) {
        container.style.display = checkbox.checked ? 'block' : 'none';
        // If unchecked, clear the deadline
        if (!checkbox.checked) {
            deadlineInput.value = '';
            updateStatusPillFromDeadlineEdit();
        } else if (!deadlineInput.value) {
            // If checked but no value, set to today 5pm
            setDeadlineTodayEdit();
        }
    }
}

function updateStatusPillFromDeadlineEdit() {
    const deadlineInput = document.getElementById('deadline-input');
    const statusPill = document.getElementById('status-pill-edit');
    const statusInput = document.querySelector('input[name="status"]');
    if (deadlineInput && statusPill && statusInput) {
        const deadlineValue = deadlineInput.value;
        if (deadlineValue) {
            const deadline = new Date(deadlineValue);
            const now = new Date();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const deadlineDate = new Date(deadline);
            deadlineDate.setHours(0, 0, 0, 0);
            
            // Check if deadline is in the past (but not today)
            if (deadline < now && deadlineDate.getTime() !== today.getTime()) {
                statusPill.textContent = 'late';
                statusPill.className = 'status-pill status-pill-late';
                statusInput.value = 'late';
            } else {
                statusPill.textContent = 'open';
                statusPill.className = 'status-pill status-pill-open';
                if (statusInput.value === 'late') {
                    statusInput.value = 'open';
                }
            }
        } else {
            // No deadline, default to open
            statusPill.textContent = 'open';
            statusPill.className = 'status-pill status-pill-open';
            if (statusInput.value === 'late') {
                statusInput.value = 'open';
            }
        }
    }
}

// Time unit conversion for edit page
function updateStoredMinutesEdit() {
    const input = document.getElementById('estimated-time-edit');
    if (!input || !input.value) return;
    
    const currentValue = parseFloat(input.value);
    if (isNaN(currentValue)) return;
    
    const selectedUnit = document.querySelector('input[name="time_unit"]:checked')?.value || 'minutes';
    
    let minutes;
    if (selectedUnit === 'hours') {
        minutes = currentValue * 60;
    } else {
        minutes = currentValue;
    }
    
    input.dataset.storedMinutes = Math.round(minutes).toString();
}

function updateEstimatedTimeDisplayEdit(newUnit) {
    const input = document.getElementById('estimated-time-edit');
    if (!input) return;
    
    updateStoredMinutesEdit();
    
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

// Initialize time unit conversion
document.addEventListener('DOMContentLoaded', function() {
    const timeInput = document.getElementById('estimated-time-edit');
    const timeUnitRadios = document.querySelectorAll('input[name="time_unit"]');
    
    if (timeInput) {
        const originalMinutes = parseFloat(timeInput.dataset.originalMinutes) || 0;
        timeInput.dataset.storedMinutes = originalMinutes.toString();
        
        timeInput.addEventListener('input', updateStoredMinutesEdit);
    }
    
    timeUnitRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateEstimatedTimeDisplayEdit(e.target.value);
        });
    });
});
</script>
@endpush
@endsection
