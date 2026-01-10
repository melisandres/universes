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

<div class="inline-editable-field" data-field-id="{{ $fieldId }}" data-no-auto-init="true">
    <label class="inline-field-label">Time</label>
    
    {{-- View Mode --}}
    <div id="{{ $viewId }}" class="inline-field-view">
        <span class="inline-field-value">{{ $displayValue }}</span>
        <button type="button" class="inline-field-edit-btn" data-field-id="{{ $fieldId }}" aria-label="Edit Time">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
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
    function updateLogTimeDisplay() {
        const timeInput = document.getElementById('log-minutes-{{ $task->id }}');
        const viewValue = document.querySelector(`#inline-view-${fieldId} .inline-field-value`);
        
        if (!timeInput || !viewValue) return;
        
        const timeValue = timeInput.value;
        if (!timeValue || timeValue === '') {
            viewValue.textContent = 'Not logged';
            return;
        }
        
        // Find which unit is selected
        const minutesRadio = document.getElementById('log-time-unit-minutes-{{ $fieldId }}');
        const hoursRadio = document.getElementById('log-time-unit-hours-{{ $fieldId }}');
        const unit = hoursRadio && hoursRadio.checked ? 'hours' : 'minutes';
        
        const numValue = parseFloat(timeValue);
        if (isNaN(numValue)) {
            viewValue.textContent = 'Not logged';
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
            return value || 'Not logged';
        },
        onSave: function(newValue, oldValue, editor) {
            // Update display from current form state
            setTimeout(function() {
                updateLogTimeDisplay();
            }, 50);
            return true; // Allow UI update
        }
    });
    
    // Update display when time or unit changes
    const timeInput = document.getElementById('log-minutes-{{ $task->id }}');
    const minutesRadio = document.getElementById('log-time-unit-minutes-{{ $fieldId }}');
    const hoursRadio = document.getElementById('log-time-unit-hours-{{ $fieldId }}');
    
    if (timeInput) {
        timeInput.addEventListener('input', function() {
            const editElement = document.getElementById('inline-edit-' + fieldId);
            if (editElement && !editElement.classList.contains('d-none')) {
                updateLogTimeDisplay();
            }
        });
    }
    
    if (minutesRadio) {
        minutesRadio.addEventListener('change', updateLogTimeDisplay);
    }
    
    if (hoursRadio) {
        hoursRadio.addEventListener('change', updateLogTimeDisplay);
    }
    
    // Update display immediately on page load
    updateLogTimeDisplay();
    
    // Also update when entering edit mode
    const editBtn = document.querySelector(`#inline-view-${fieldId} .inline-field-edit-btn`);
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            setTimeout(updateLogTimeDisplay, 10);
        });
    }
});
</script>
