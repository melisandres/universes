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

<div class="inline-editable-field" data-field-id="{{ $fieldId }}" data-no-auto-init="true">
    <label class="inline-field-label">Estimated Time</label>
    
    {{-- View Mode --}}
    <div id="{{ $viewId }}" class="inline-field-view">
        <span class="inline-field-value">{{ $displayValue }}</span>
        <button type="button" class="inline-field-edit-btn" data-field-id="{{ $fieldId }}" aria-label="Edit Estimated Time">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
        </button>
    </div>
    
    {{-- Edit Mode --}}
    <div id="{{ $editId }}" class="inline-field-edit d-none">
        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <input 
                type="number" 
                name="estimated_time" 
                id="input-{{ $fieldId }}"
                class="inline-field-input"
                value="{{ $displayTime }}" 
                data-original-minutes="{{ $task->estimated_time ?? 0 }}"
                min="0" 
                step="{{ $defaultStep }}"
                placeholder="Optional"
                style="flex: 1; min-width: 100px; max-width: 300px;"
            >
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; font-weight: normal; cursor: pointer; font-size: 0.9em;">
                    <input 
                        type="radio" 
                        name="time_unit" 
                        value="minutes" 
                        id="time-unit-minutes-{{ $fieldId }}"
                        @if($task->estimated_time && $task->estimated_time < 60) checked @endif
                    >
                    <span>Minutes</span>
                </label>
                <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; font-weight: normal; cursor: pointer; font-size: 0.9em;">
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
            <button type="button" class="inline-field-cancel-btn" data-field-id="{{ $fieldId }}">Cancel</button>
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
            const timeInput = document.getElementById('input-' + fieldId);
            const minutesRadio = document.getElementById('time-unit-minutes-' + fieldId);
            const hoursRadio = document.getElementById('time-unit-hours-' + fieldId);
            const unit = hoursRadio && hoursRadio.checked ? 'hours' : 'minutes';
            
            if (!timeInput || !timeInput.value) {
                // Clear estimated time
                const success = await TaskFieldSaver.saveField({{ $task->id }}, 'estimated_time', '', { timeUnit: 'hours' });
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
            
            const success = await TaskFieldSaver.saveField({{ $task->id }}, 'estimated_time', timeValue, { timeUnit: unit });
            
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
