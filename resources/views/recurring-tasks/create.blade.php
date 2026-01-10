@extends('layouts.app')

@section('title', 'New Recurring Task')

@section('content')
<h2>New Recurring Task</h2>

<form method="POST" action="{{ route('recurring-tasks.store') }}">
    @csrf

    <label>Name</label><br>
    <input type="text" name="name" value="{{ old('name') }}" required><br><br>

    @php
        $recurringTask = null;
    @endphp
    @include('recurring-tasks._form')

    <label>Frequency</label><br>
    Every <input type="number" name="frequency_interval" min="1" value="{{ old('frequency_interval', 1) }}" required>
    <select name="frequency_unit" required>
        @foreach (['day','week','month'] as $unit)
            <option value="{{ $unit }}" @selected(old('frequency_unit') === $unit)>
                {{ ucfirst($unit) }}{{ old('frequency_interval', 1) != 1 ? 's' : '' }}
            </option>
        @endforeach
    </select><br><br>

    <label>Default Duration (minutes, optional)</label><br>
    <input type="number" name="default_duration_minutes" min="0" value="{{ old('default_duration_minutes') }}"><br><br>

    <label>Notes (optional)</label><br>
    <textarea name="notes">{{ old('notes') }}</textarea><br><br>

    <label>
        <input type="checkbox" name="active" value="1" @checked(old('active', true))>
        Active
    </label><br><br>

    <button type="submit">Create Recurring Task</button>
</form>

@push('scripts')
<script>
let universeIndex = 1;
const universes = {!! json_encode($universes->pluck('name', 'id')) !!};

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
        <select name="universe_ids[]" class="universe-select">
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

