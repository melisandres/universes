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

    <label>Estimated Time (minutes)</label><br>
    <input type="number" name="estimated_time" min="0" placeholder="Optional"><br><br>

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
</script>
@endpush
@endsection
