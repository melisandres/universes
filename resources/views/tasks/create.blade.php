@extends('layouts.app')

@section('title', 'New Task')

@section('content')
<h2>New Task</h2>

<form method="POST" action="{{ route('tasks.store') }}">
    @csrf
    <input type="hidden" name="referer" value="{{ request()->header('referer') }}">

    <label>Universes</label><br>
    <div id="universes-container">
        <div class="universe-item-row" data-index="0">
            <select name="universe_ids[]" class="universe-select" required>
                <option value="">— select universe —</option>
                @foreach ($universes as $u)
                    <option value="{{ $u->id }}" @selected($selectedUniverse == $u->id)>
                        {{ $u->name }}
                    </option>
                @endforeach
            </select>
            <label>
                <input type="radio" name="primary_universe" value="0" checked>
                Primary
            </label>
            <button type="button" class="remove-universe-btn" onclick="removeUniverseRow(this)">Remove</button>
        </div>
    </div>
    <button type="button" onclick="addUniverseRow()" style="margin-top: 10px;">+ Add Universe</button><br><br>

    <label>Name</label><br>
    <input type="text" name="name" required><br><br>

    <label>Estimated Time:</label><br>
    <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem;">
        <input type="number" 
               name="estimated_time" 
               id="estimated-time-create"
               data-original-minutes="0"
               min="0" 
               step="0.25"
               placeholder="Optional" 
               style="max-width: 500px; flex: 1; min-width: 100px;">
        <div style="display: flex; gap: 0.5rem; align-items: center;">
            <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; font-weight: normal; cursor: pointer;">
                <input type="radio" name="time_unit" value="minutes" id="time-unit-minutes-create">
                <span>Minutes</span>
            </label>
            <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; font-weight: normal; cursor: pointer;">
                <input type="radio" name="time_unit" value="hours" id="time-unit-hours-create" checked>
                <span>Hours</span>
            </label>
        </div>
    </div>

    <label>Description</label><br>
    <textarea name="description" rows="4" placeholder="Optional"></textarea><br><br>

    <label>Deadline</label><br>
    <input type="datetime-local" name="deadline_at"><br><br>

    <label>Linked Recurring Task (optional)</label><br>
    <select name="recurring_task_id">
        <option value="">— none —</option>
        @foreach ($recurringTasks as $rt)
            <option value="{{ $rt->id }}">{{ $rt->name }}</option>
        @endforeach
    </select><br><br>

    <label>Status</label><br>
    <select name="status">
        <option value="open" selected>Open</option>
        <option value="late">Late</option>
    </select><br><br>

    <button type="submit">Add task</button>
</form>

<script type="application/json" id="universes-data">{!! json_encode($universes->pluck('name', 'id')) !!}</script>

@push('scripts')
<script>
let universeIndex = 1;
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

// Time unit conversion for create page
function updateStoredMinutesCreate() {
    const input = document.getElementById('estimated-time-create');
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

function updateEstimatedTimeDisplayCreate(newUnit) {
    const input = document.getElementById('estimated-time-create');
    if (!input) return;
    
    updateStoredMinutesCreate();
    
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
    const timeInput = document.getElementById('estimated-time-create');
    const timeUnitRadios = document.querySelectorAll('input[name="time_unit"]');
    
    if (timeInput) {
        timeInput.dataset.storedMinutes = '0';
        timeInput.addEventListener('input', updateStoredMinutesCreate);
    }
    
    timeUnitRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateEstimatedTimeDisplayCreate(e.target.value);
        });
    });
});
</script>
@endpush
@endsection
