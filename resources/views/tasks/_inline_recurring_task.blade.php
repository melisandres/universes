{{-- Custom inline editable field for Recurring Task --}}
{{-- This handles the recurring task selection --}}

@php
    $fieldId = $fieldId ?? 'recurring-task-' . $task->id;
    $viewId = "inline-view-{$fieldId}";
    $editId = "inline-edit-{$fieldId}";
    
    // Format display value
    $displayValue = 'non-recurring';
    $recurringTasksForEdit = $recurringTasks ?? \App\Models\RecurringTask::where('active', true)->get();
    
    if ($task->recurring_task_id) {
        $selectedRecurringTask = $recurringTasksForEdit->firstWhere('id', $task->recurring_task_id);
        $displayValue = $selectedRecurringTask ? 'recurring instance of ' . $selectedRecurringTask->name : 'non-recurring';
    }
    
    // Build options array for select
    $recurringTaskOptions = ['' => '— none —'];
    foreach ($recurringTasksForEdit as $rt) {
        $recurringTaskOptions[$rt->id] = $rt->name;
    }
@endphp

<div class="inline-editable-field" data-field-id="{{ $fieldId }}" data-no-auto-init="true">
    {{-- View Mode --}}
    <div id="{{ $viewId }}" class="inline-field-view inline-field-view-no-label">
        <span class="inline-field-value">{{ $displayValue }}</span>
        <button type="button" class="inline-field-edit-btn" data-field-id="{{ $fieldId }}" aria-label="Edit Recurring Task">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
        </button>
    </div>
    
    {{-- Edit Mode --}}
    <div id="{{ $editId }}" class="inline-field-edit d-none">
        {{-- Hidden input for InlineFieldEditor compatibility --}}
        <input type="hidden" id="input-{{ $fieldId }}" value="{{ $task->recurring_task_id ?? '' }}" />
        <select 
            name="recurring_task_id" 
            id="recurring-task-select-{{ $task->id }}"
            class="inline-field-input"
        >
            @foreach($recurringTaskOptions as $optionValue => $optionLabel)
                <option value="{{ $optionValue }}" @selected($task->recurring_task_id == $optionValue)>
                    {{ $optionLabel }}
                </option>
            @endforeach
        </select>
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
    function updateRecurringTaskDisplay() {
        const select = document.getElementById('recurring-task-select-{{ $task->id }}');
        const viewValue = document.querySelector(`#inline-view-${fieldId} .inline-field-value`);
        const hiddenInput = document.getElementById('input-' + fieldId);
        
        if (!select || !viewValue) return;
        
        const selectedValue = select.value;
        const selectedOption = select.options[select.selectedIndex];
        const optionText = selectedOption ? selectedOption.text.trim() : '';
        
        // Update hidden input for InlineFieldEditor compatibility
        if (hiddenInput) {
            hiddenInput.value = selectedValue;
        }
        
        // Format display text
        if (!selectedValue || selectedValue === '' || optionText === '— none —') {
            viewValue.textContent = 'non-recurring';
        } else {
            viewValue.textContent = 'recurring instance of ' + optionText;
        }
    }
    
    // Initialize the inline editor
    window.inlineFieldEditors[fieldId] = new InlineFieldEditor(fieldId, {
        formatValue: function(value) {
            if (!value || value === '') return 'non-recurring';
            
            const select = document.getElementById('recurring-task-select-{{ $task->id }}');
            if (!select) return 'non-recurring';
            
            const selectedOption = select.options[select.selectedIndex];
            const optionText = selectedOption ? selectedOption.text.trim() : '';
            
            if (!value || value === '' || optionText === '— none —') {
                return 'non-recurring';
            } else {
                return 'recurring instance of ' + optionText;
            }
        },
        onSave: async function(newValue, oldValue, editor) {
            const select = document.getElementById('recurring-task-select-{{ $task->id }}');
            if (!select) return false;
            
            const selectedValue = select.value || '';
            const success = await TaskFieldSaver.saveField({{ $task->id }}, 'recurring_task_id', selectedValue);
            
            if (success) {
                setTimeout(function() {
                    updateRecurringTaskDisplay();
                }, 50);
                return true;
            }
            return false;
        }
    });
    
    // Update display when select changes
    const select = document.getElementById('recurring-task-select-{{ $task->id }}');
    if (select) {
        select.addEventListener('change', function() {
            const editElement = document.getElementById('inline-edit-' + fieldId);
            if (editElement && !editElement.classList.contains('d-none')) {
                updateRecurringTaskDisplay();
            }
        });
    }
    
    // Update display immediately on page load
    updateRecurringTaskDisplay();
    
    // Also update when entering edit mode
    const editBtn = document.querySelector(`#inline-view-${fieldId} .inline-field-edit-btn`);
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            setTimeout(updateRecurringTaskDisplay, 10);
        });
    }
});
</script>
