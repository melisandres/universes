{{-- Custom inline editable field for Log Time --}}
{{-- This handles the time input with unit selector (minutes/hours) for logging --}}

@php
    $fieldId = $fieldId ?? 'log-time-' . $task->id;
    $viewId = "inline-view-{$fieldId}";
    $editId = "inline-edit-{$fieldId}";
    
    // Format display value - log time starts empty
    $displayValue = 'Not logged';
    $displayTime = '';
    $defaultUnit = 'hours'; // Default to hours for logging
@endphp

<div class="inline-editable-field" data-field-id="{{ $fieldId }}" data-task-id="{{ $task->id }}" data-no-auto-init="true">
    <label class="inline-field-label">Time</label>
    
    {{-- View Mode --}}
    <div id="{{ $viewId }}" class="inline-field-view">
        <span class="inline-field-value">{{ $displayValue }}</span>
        <button type="button" class="inline-field-edit-btn" data-field-id="{{ $fieldId }}" aria-label="Edit Time">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
        </button>
    </div>
    
    {{-- Edit Mode --}}
    <div id="{{ $editId }}" class="inline-field-edit d-none">
        {{-- Hidden input for InlineFieldEditor compatibility --}}
        <input type="hidden" id="input-{{ $fieldId }}" value="" />
        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <input 
                type="number" 
                name="minutes" 
                id="log-minutes-{{ $task->id }}"
                class="inline-field-input"
                data-original-minutes="0"
                min="0" 
                step="0.25"
                placeholder="Optional"
                style="flex: 1; min-width: 100px; max-width: 300px;"
            >
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; font-weight: normal; cursor: pointer; font-size: 0.9em;">
                    <input 
                        type="radio" 
                        name="time_unit" 
                        value="minutes" 
                        id="log-time-unit-minutes-{{ $fieldId }}"
                    >
                    <span>Minutes</span>
                </label>
                <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; font-weight: normal; cursor: pointer; font-size: 0.9em;">
                    <input 
                        type="radio" 
                        name="time_unit" 
                        value="hours" 
                        id="log-time-unit-hours-{{ $fieldId }}"
                        checked
                    >
                    <span>Hours</span>
                </label>
            </div>
        </div>
        <div class="inline-field-actions">
            <button type="button" class="inline-field-save-btn" data-field-id="{{ $fieldId }}">Save</button>
        </div>
    </div>
</div>

{{-- Initialize with InlineLogTimeField class --}}
<script>
document.addEventListener('DOMContentLoaded', function() {
    const fieldId = '{{ $fieldId }}';
    const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
    
    if (fieldElement) {
        const config = {
            taskId: parseInt('{{ $task->id }}', 10)
        };
        new InlineLogTimeField(fieldId, config);
    }
});
</script>
