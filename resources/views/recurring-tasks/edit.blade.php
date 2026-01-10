@extends('layouts.app')

@section('title', 'Edit Recurring Task')

@section('content')
<h2>Edit Recurring Task</h2>

<form method="POST" action="{{ route('recurring-tasks.update', $recurringTask) }}">
    @csrf
    @method('PUT')

    @include('recurring-tasks._form')

    <button type="submit">Update Recurring Task</button>
</form>

@push('scripts')
<script>
let universeIndex = {{ $recurringTask->universeItems->count() }};
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

