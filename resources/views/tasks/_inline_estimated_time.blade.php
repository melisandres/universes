{{-- Custom inline editable field for Estimated Time --}}
{{-- This handles the time input with unit selector (minutes/hours) --}}

@php
    $fieldId = $fieldId ?? 'estimated-time-' . $task->id;
    $viewId = "inline-view-{$fieldId}";
    $editId = "inline-edit-{$fieldId}";
    
    // Format display value
    $displayValue = 'Not set';
    $displayTime = null;
    $defaultStep = '0.25';
    $defaultUnit = 'hours';
    
    if ($task->estimated_time) {
        if ($task->estimated_time >= 60) {
            $displayTime = round($task->estimated_time / 60, 2);
            $displayValue = $displayTime . ' hours';
            $defaultStep = '0.25';
            $defaultUnit = 'hours';
        } else {
            $displayTime = $task->estimated_time;
            $displayValue = $displayTime . ' minutes';
            $defaultStep = '1';
            $defaultUnit = 'minutes';
        }
    }
@endphp

<div class="inline-editable-field" data-field-id="{{ $fieldId }}" data-task-id="{{ $task->id }}" data-no-auto-init="true">
    {{-- Label and Pencil (always visible) --}}
    <div class="inline-field-label-row">
        <label class="inline-field-label">Estimated Time</label>
        <button type="button" class="inline-field-edit-btn" data-field-id="{{ $fieldId }}" aria-label="Edit Estimated Time">
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
        <div class="inline-field-time-container">
            <input 
                type="number" 
                name="estimated_time" 
                id="input-{{ $fieldId }}"
                class="inline-field-input inline-field-time-input"
                value="{{ $displayTime }}" 
                data-original-minutes="{{ $task->estimated_time ?? 0 }}"
                min="0" 
                step="{{ $defaultStep }}"
                placeholder="Optional"
            >
            <div class="inline-field-unit-selector">
                <label class="inline-field-radio-label">
                    <input 
                        type="radio" 
                        name="time_unit" 
                        value="minutes" 
                        id="time-unit-minutes-{{ $fieldId }}"
                        @if($task->estimated_time && $task->estimated_time < 60) checked @endif
                    >
                    <span>Minutes</span>
                </label>
                <label class="inline-field-radio-label">
                    <input 
                        type="radio" 
                        name="time_unit" 
                        value="hours" 
                        id="time-unit-hours-{{ $fieldId }}"
                        @if(!$task->estimated_time || $task->estimated_time >= 60) checked @endif
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

{{-- Initialize with InlineEstimatedTimeField class --}}
<script>
document.addEventListener('DOMContentLoaded', function() {
    const fieldId = '{{ $fieldId }}';
    const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
    
    if (fieldElement) {
        const config = {
            taskId: parseInt('{{ $task->id }}', 10)
        };
        new InlineEstimatedTimeField(fieldId, config);
    }
});
</script>
