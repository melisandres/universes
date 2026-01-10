@extends('layouts.app')

@section('title', 'New Idea')

@section('content')
<h2>New Idea</h2>

<form method="POST" action="{{ route('ideas.store') }}">
    @csrf

    <label>Idea Pools:</label><br>
    <div id="idea-pools-container">
        <div class="idea-pool-item-row" data-index="0" style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <select name="idea_pool_ids[]" class="idea-pool-select" required style="padding: 0.35rem; flex: 1; max-width: 300px;">
                <option value="">— select idea pool —</option>
                @foreach ($ideaPools as $pool)
                    <option value="{{ $pool->id }}" @selected($selectedPool == $pool->id)>
                        {{ $pool->name }}
                    </option>
                @endforeach
            </select>
            <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; white-space: nowrap;">
                <input type="radio" name="primary_pool_index" value="0" checked>
                Primary
            </label>
            <button type="button" class="remove-idea-pool-btn" style="padding: 0.35rem 0.75rem; font-size: 0.9rem; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Remove</button>
        </div>
    </div>
    <button type="button" class="add-idea-pool-btn" style="margin-top: 0.5rem; padding: 0.35rem 0.75rem; font-size: 0.85rem;">+ Add Idea Pool</button><br><br>

    <label>Title (optional)</label><br>
    <input type="text" name="title" value="{{ old('title') }}"><br><br>

    <label>Body</label><br>
    <textarea name="body" required>{{ old('body') }}</textarea><br><br>

    <label>Notes (optional)</label><br>
    <textarea name="notes">{{ old('notes') }}</textarea><br><br>

    <label>Status (optional)</label><br>
    <select name="status">
        <option value="">— none —</option>
        <option value="seed" @selected(old('status') == 'seed')>Seed</option>
        <option value="growing" @selected(old('status') == 'growing')>Growing</option>
        <option value="dormant" @selected(old('status') == 'dormant')>Dormant</option>
        <option value="active" @selected(old('status') == 'active')>Active</option>
    </select><br><br>

    <button type="submit">Create Idea</button>
</form>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('idea-pools-container');
    const addBtn = document.querySelector('.add-idea-pool-btn');
    let ideaPoolIndex = 1;
    const ideaPools = {!! json_encode($ideaPools->pluck('name', 'id')) !!};

    function addIdeaPoolRow() {
        const newRow = document.createElement('div');
        newRow.className = 'idea-pool-item-row';
        newRow.setAttribute('data-index', ideaPoolIndex);
        newRow.style.cssText = 'margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;';
        
        let optionsHtml = '<option value="">— select idea pool —</option>';
        for (const [id, name] of Object.entries(ideaPools)) {
            optionsHtml += `<option value="${id}">${name}</option>`;
        }
        
        newRow.innerHTML = `
            <select name="idea_pool_ids[]" class="idea-pool-select" required style="padding: 0.35rem; flex: 1; max-width: 300px;">
                ${optionsHtml}
            </select>
            <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; white-space: nowrap;">
                <input type="radio" name="primary_pool_index" value="${ideaPoolIndex}">
                Primary
            </label>
            <button type="button" class="remove-idea-pool-btn" style="padding: 0.35rem 0.75rem; font-size: 0.9rem; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Remove</button>
        `;
        
        container.appendChild(newRow);
        ideaPoolIndex++;
    }

    function removeIdeaPoolRow(btn) {
        if (container.children.length > 1) {
            btn.closest('.idea-pool-item-row').remove();
            updatePrimaryRadioButtons();
        } else {
            alert('At least one idea pool is required');
        }
    }

    function updatePrimaryRadioButtons() {
        const primaryRadios = container.querySelectorAll('input[name="primary_pool_index"]');
        let primaryFound = false;
        primaryRadios.forEach(radio => {
            if (radio.checked) {
                primaryFound = true;
            }
        });

        if (!primaryFound && primaryRadios.length > 0) {
            primaryRadios[0].checked = true;
        }
        // Update values to match current data-index
        container.querySelectorAll('.idea-pool-item-row').forEach((row, i) => {
            const radio = row.querySelector('input[name="primary_pool_index"]');
            if (radio) {
                radio.value = i;
            }
            row.setAttribute('data-index', i);
        });
    }

    if (addBtn) {
        addBtn.addEventListener('click', addIdeaPoolRow);
    }

    if (container) {
        container.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-idea-pool-btn')) {
                removeIdeaPoolRow(e.target);
            }
        });
    }
});
</script>
@endpush
@endsection

