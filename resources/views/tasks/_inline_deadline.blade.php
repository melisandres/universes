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

<div class="inline-editable-field" data-field-id="{{ $fieldId }}" data-task-id="{{ $task->id }}" data-no-auto-init="true">
    {{-- View Mode --}}
    <div id="{{ $viewId }}" class="inline-field-view inline-field-view-no-label">
        <span class="inline-field-value">{{ $displayValue }}</span>
        <button type="button" class="inline-field-edit-btn" data-field-id="{{ $fieldId }}" aria-label="Edit Deadline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
        </button>
    </div>
    
    {{-- Edit Mode --}}
    <div id="{{ $editId }}" class="inline-field-edit d-none">
        <div class="inline-field-deadline-container">
            <input 
                type="datetime-local" 
                name="deadline_at" 
                id="input-{{ $fieldId }}"
                class="inline-field-input inline-field-deadline-input"
                value="{{ $inputValue }}" 
                data-task-id="{{ $task->id }}"
            >
            <button 
                type="button" 
                class="btn-today" 
                data-task-id="{{ $task->id }}"
            >
                Today
            </button>
        </div>
        <div class="inline-field-actions">
            <button type="button" class="inline-field-save-btn" data-field-id="{{ $fieldId }}">Save</button>
        </div>
    </div>
</div>

{{-- Initialize with InlineDeadlineField class --}}
<script>
document.addEventListener('DOMContentLoaded', function() {
    const fieldId = '{{ $fieldId }}';
    const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
    
    if (fieldElement) {
        const config = {
            taskId: parseInt('{{ $task->id }}', 10)
        };
        new InlineDeadlineField(fieldId, config);
    }
});
</script>
