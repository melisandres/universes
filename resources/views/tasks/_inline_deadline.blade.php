{{-- Custom inline editable field for Deadline --}}
{{-- This handles the datetime-local input with "Today" button --}}

@php
    $fieldId = $fieldId ?? 'deadline-' . $task->id;
    $viewId = "inline-view-{$fieldId}";
    $editId = "inline-edit-{$fieldId}";
    
    // Format display value
    $displayValue = 'no deadline';
    $inputValue = '';
    if ($task->deadline_at) {
        $displayValue = 'deadline: ' . $task->deadline_at->format('M j, Y g:i A');
        $inputValue = $task->deadline_at->format('Y-m-d\TH:i');
    }
@endphp

<div class="inline-editable-field" data-field-id="{{ $fieldId }}" data-no-auto-init="true">
    {{-- View Mode --}}
    <div id="{{ $viewId }}" class="inline-field-view">
        <span class="inline-field-value">{{ $displayValue }}</span>
        <button type="button" class="inline-field-edit-btn" data-field-id="{{ $fieldId }}" aria-label="Edit Deadline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
        </button>
    </div>
    
    {{-- Edit Mode --}}
    <div id="{{ $editId }}" class="inline-field-edit d-none">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <input 
                type="datetime-local" 
                name="deadline_at" 
                id="input-{{ $fieldId }}"
                class="inline-field-input"
                value="{{ $inputValue }}" 
                data-task-id="{{ $task->id }}"
                style="flex: 1; max-width: 300px;"
            >
            <button 
                type="button" 
                class="btn-today" 
                data-task-id="{{ $task->id }}" 
                style="padding: 0.35rem 0.75rem; font-size: 0.85rem; white-space: nowrap;"
            >
                Today
            </button>
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
    function updateDeadlineDisplay() {
        const deadlineInput = document.getElementById('input-' + fieldId);
        const viewValue = document.querySelector(`#inline-view-${fieldId} .inline-field-value`);
        
        if (!deadlineInput || !viewValue) return;
        
        const deadlineValue = deadlineInput.value;
        if (!deadlineValue || deadlineValue === '') {
            viewValue.textContent = 'no deadline';
            return;
        }
        
        // Convert datetime-local format (YYYY-MM-DDTHH:mm) to readable format
        const date = new Date(deadlineValue);
        if (isNaN(date.getTime())) {
            viewValue.textContent = 'no deadline';
            return;
        }
        
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        viewValue.textContent = 'deadline: ' + formattedDate;
    }
    
    window.inlineFieldEditors[fieldId] = new InlineFieldEditor(fieldId, {
        formatValue: function(value) {
            if (!value || value === '') return 'no deadline';
            
            // Convert datetime-local format (YYYY-MM-DDTHH:mm) to readable format
            const date = new Date(value);
            if (isNaN(date.getTime())) return 'no deadline';
            
            const formattedDate = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            
            return 'deadline: ' + formattedDate;
        },
        onSave: async function(newValue, oldValue, editor) {
            const deadlineInput = document.getElementById('input-' + fieldId);
            if (!deadlineInput) return false;
            
            const deadlineValue = deadlineInput.value || '';
            const success = await TaskFieldSaver.saveField({{ $task->id }}, 'deadline_at', deadlineValue);
            
            if (success) {
                setTimeout(function() {
                    updateDeadlineDisplay();
                }, 50);
                return true;
            }
            return false;
        }
    });
    
    // Update display when deadline changes
    const deadlineInput = document.getElementById('input-' + fieldId);
    if (deadlineInput) {
        deadlineInput.addEventListener('change', function() {
            const editElement = document.getElementById('inline-edit-' + fieldId);
            if (editElement && !editElement.classList.contains('d-none')) {
                updateDeadlineDisplay();
            }
        });
        deadlineInput.addEventListener('input', function() {
            const editElement = document.getElementById('inline-edit-' + fieldId);
            if (editElement && !editElement.classList.contains('d-none')) {
                updateDeadlineDisplay();
            }
        });
    }
    
    // Update display immediately on page load
    updateDeadlineDisplay();
    
    // Also update when entering edit mode
    const editBtn = document.querySelector(`#inline-view-${fieldId} .inline-field-edit-btn`);
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            setTimeout(updateDeadlineDisplay, 10);
        });
    }
    
    // Handle "Today" button
    const todayBtn = document.querySelector(`.btn-today[data-task-id="{{ $task->id }}"]`);
    if (todayBtn) {
        todayBtn.addEventListener('click', function() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const datetimeValue = `${year}-${month}-${day}T${hours}:${minutes}`;
            
            const input = document.getElementById('input-' + fieldId);
            if (input) {
                input.value = datetimeValue;
                // Update display immediately
                setTimeout(updateDeadlineDisplay, 10);
            }
        });
    }
});
</script>
