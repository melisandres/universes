{{-- Custom inline editable field for Universes --}}
{{-- This handles multiple universe selection with primary designation --}}

@php
    $fieldId = $fieldId ?? 'universes-' . $task->id;
    $viewId = "inline-view-{$fieldId}";
    $editId = "inline-edit-{$fieldId}";
    
    // Format display value - show all universes with primary marked
    $displayValue = 'None';
    $universesForEdit = $universes ?? \App\Models\Universe::orderBy('name')->get();
    
    if ($universeItems->isNotEmpty()) {
        $universeNames = [];
        foreach ($universeItems as $universeItem) {
            $name = $universeItem->universe->name ?? 'Unknown';
            if ($universeItem->is_primary) {
                $name = '★ ' . $name; // Star for primary
            }
            $universeNames[] = $name;
        }
        $displayValue = implode(', ', $universeNames);
    }
@endphp

<div class="inline-editable-field" data-field-id="{{ $fieldId }}" data-task-id="{{ $task->id }}" data-no-auto-init="true">
    {{-- Label and Pencil (always visible) --}}
    <div class="inline-field-label-row">
        <label class="inline-field-label">Universes</label>
        <button type="button" class="inline-field-edit-btn" data-field-id="{{ $fieldId }}" aria-label="Edit Universes">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
        </button>
    </div>
    
    {{-- View Mode --}}
    <div id="{{ $viewId }}" class="inline-field-view">
        <span class="inline-field-value">{{ $displayValue }}</span>
    </div>
    
    {{-- Edit Mode --}}
    <div id="{{ $editId }}" class="inline-field-edit d-none">
        {{-- Hidden input for InlineFieldEditor compatibility (not used for actual value) --}}
        <input type="hidden" id="input-{{ $fieldId }}" value="" />
        <div id="universes-container-{{ $task->id }}">
            @if($universeItems->isNotEmpty())
                @foreach($universeItems as $index => $universeItem)
                    <div class="universe-item-row inline-universe-item-row" data-index="{{ $index }}">
                        <select name="universe_ids[]" class="universe-select inline-universe-select" required>
                            <option value="">— select universe —</option>
                            @foreach ($universesForEdit as $u)
                                <option value="{{ $u->id }}" @selected($universeItem->universe_id == $u->id)>
                                    {{ $u->name }}
                                </option>
                            @endforeach
                        </select>
                        <label class="inline-universe-primary-label">
                            <input type="radio" name="primary_universe" value="{{ $index }}" @checked($universeItem->is_primary)>
                            Primary
                        </label>
                        <button type="button" class="remove-universe-btn inline-universe-remove-btn" data-task-id="{{ $task->id }}">Remove</button>
                    </div>
                @endforeach
            @else
                <div class="universe-item-row inline-universe-item-row" data-index="0">
                    <select name="universe_ids[]" class="universe-select inline-universe-select" required>
                        <option value="">— select universe —</option>
                        @foreach ($universesForEdit as $u)
                            <option value="{{ $u->id }}" @selected(isset($currentUniverse) && $currentUniverse->id == $u->id)>
                                {{ $u->name }}
                            </option>
                        @endforeach
                    </select>
                    <label class="inline-universe-primary-label">
                        <input type="radio" name="primary_universe" value="0" checked>
                        Primary
                    </label>
                    <button type="button" class="remove-universe-btn inline-universe-remove-btn" data-task-id="{{ $task->id }}">Remove</button>
                </div>
            @endif
        </div>
        <button type="button" class="add-universe-btn inline-universe-add-btn" data-task-id="{{ $task->id }}">+ Add Universe</button>
        <div class="inline-field-actions inline-field-actions-spaced">
            <button type="button" class="inline-field-save-btn" data-field-id="{{ $fieldId }}">Save</button>
        </div>
    </div>
</div>

{{-- Initialize with InlineUniversesField class --}}
<script>
document.addEventListener('DOMContentLoaded', function() {
    const fieldId = '{{ $fieldId }}';
    const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
    
    if (fieldElement) {
        const config = {
            taskId: parseInt('{{ $task->id }}', 10)
        };
        new InlineUniversesField(fieldId, config);
    }
});
</script>
