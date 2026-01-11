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

{{-- Initialize with custom formatting --}}
<script>
document.addEventListener('DOMContentLoaded', function() {
    const fieldId = '{{ $fieldId }}';
    if (!window.inlineFieldEditors) window.inlineFieldEditors = {};
    
    // Function to update display value from form inputs
    function updateEstimatedTimeDisplay() {
        const timeInput = document.getElementById('input-' + fieldId);
        const viewValue = document.querySelector(`#inline-view-${fieldId} .inline-field-value`);
        
        if (!timeInput || !viewValue) return;
        
        const timeValue = timeInput.value;
        if (!timeValue || timeValue === '') {
            viewValue.textContent = 'Not set';
            return;
        }
        
        // Find which unit is selected
        const minutesRadio = document.getElementById('time-unit-minutes-' + fieldId);
        const hoursRadio = document.getElementById('time-unit-hours-' + fieldId);
        const unit = hoursRadio && hoursRadio.checked ? 'hours' : 'minutes';
        
        const numValue = parseFloat(timeValue);
        if (isNaN(numValue)) {
            viewValue.textContent = 'Not set';
            return;
        }
        
        if (unit === 'hours') {
            viewValue.textContent = numValue + ' hours';
        } else {
            viewValue.textContent = numValue + ' minutes';
        }
    }
    
    // Initialize the inline editor
    window.inlineFieldEditors[fieldId] = new InlineFieldEditor(fieldId, {
        formatValue: function(value) {
            if (!value || value === '') return 'Not set';
            
            const timeInput = document.getElementById('input-' + fieldId);
            const minutesRadio = document.getElementById('time-unit-minutes-' + fieldId);
            const hoursRadio = document.getElementById('time-unit-hours-' + fieldId);
            const unit = hoursRadio && hoursRadio.checked ? 'hours' : 'minutes';
            
            const numValue = parseFloat(value);
            if (isNaN(numValue)) return 'Not set';
            
            if (unit === 'hours') {
                return numValue + ' hours';
            } else {
                return numValue + ' minutes';
            }
        },
        onSave: async function(newValue, oldValue, editor) {
            const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
            if (!fieldElement) return false;
            const taskId = parseInt(fieldElement.dataset.taskId, 10);
            
            const timeInput = document.getElementById('input-' + fieldId);
            const minutesRadio = document.getElementById('time-unit-minutes-' + fieldId);
            const hoursRadio = document.getElementById('time-unit-hours-' + fieldId);
            const unit = hoursRadio && hoursRadio.checked ? 'hours' : 'minutes';
            
            if (!timeInput || !timeInput.value) {
                // Clear estimated time
                const success = await TaskFieldSaver.saveField(taskId, 'estimated_time', '', { timeUnit: 'hours' });
                if (success) {
                    setTimeout(function() {
                        updateEstimatedTimeDisplay();
                    }, 50);
                    return true;
                }
                return false;
            }
            
            const timeValue = parseFloat(timeInput.value);
            if (isNaN(timeValue)) {
                return false;
            }
            
            const success = await TaskFieldSaver.saveField(taskId, 'estimated_time', timeValue, { timeUnit: unit });
            
            if (success) {
                setTimeout(function() {
                    updateEstimatedTimeDisplay();
                }, 50);
                return true;
            }
            return false;
        }
    });
    
    // Update display when time or unit changes
    const timeInput = document.getElementById('input-' + fieldId);
    const minutesRadio = document.getElementById('time-unit-minutes-' + fieldId);
    const hoursRadio = document.getElementById('time-unit-hours-' + fieldId);
    
    if (timeInput) {
        timeInput.addEventListener('input', function() {
            const editElement = document.getElementById('inline-edit-' + fieldId);
            if (editElement && !editElement.classList.contains('d-none')) {
                updateEstimatedTimeDisplay();
            }
        });
    }
    
    if (minutesRadio) {
        minutesRadio.addEventListener('change', updateEstimatedTimeDisplay);
    }
    
    if (hoursRadio) {
        hoursRadio.addEventListener('change', updateEstimatedTimeDisplay);
    }
    
    // Update display immediately on page load
    updateEstimatedTimeDisplay();
    
    // Also update when entering edit mode
    const editBtn = document.querySelector(`#inline-view-${fieldId} .inline-field-edit-btn`);
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            setTimeout(updateEstimatedTimeDisplay, 10);
        });
    }
});
</script>
