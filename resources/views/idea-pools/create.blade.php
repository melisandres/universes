@extends('layouts.app')

@section('title', 'New Idea Pool')

@section('content')
<h2>New Idea Pool</h2>

<form method="POST" action="{{ route('idea-pools.store') }}">
    @csrf

    <label>Name</label><br>
    <input type="text" name="name" required><br><br>

    <label>Description (optional)</label><br>
    <textarea name="description"></textarea><br><br>

    <label>Universes (optional)</label><br>
    <div id="universes-container">
        <div class="universe-item-row" data-index="0">
            <select name="universe_ids[]" class="universe-select">
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
    </div>
    <button type="button" onclick="addUniverseRow()" style="margin-top: 10px;">+ Add Universe</button><br><br>

    <button type="submit">Create Idea Pool</button>
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

