@extends('layouts.app')

@section('title', 'Edit Idea Pool')

@section('content')
<h2>Edit Idea Pool</h2>

<form method="POST" action="{{ route('idea-pools.update', $ideaPool) }}">
    @csrf
    @method('PUT')

    <label>Name</label><br>
    <input type="text" name="name" value="{{ $ideaPool->name }}" required><br><br>

    <label>Description (optional)</label><br>
    <textarea name="description">{{ $ideaPool->description }}</textarea><br><br>

    <label>Universes (optional)</label><br>
    <div id="universes-container">
        @php
            $universeItems = $ideaPool->universeItems->sortByDesc('is_primary');
        @endphp
        @foreach($universeItems as $index => $universeItem)
            <div class="universe-item-row" data-index="{{ $index }}">
                <select name="universe_ids[]" class="universe-select">
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
        @endif
    </div>
    <button type="button" onclick="addUniverseRow()" style="margin-top: 10px;">+ Add Universe</button><br><br>

    <button type="submit">Update Idea Pool</button>
</form>

@push('scripts')
<script>
let universeIndex = {{ $ideaPool->universeItems->count() }};
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

