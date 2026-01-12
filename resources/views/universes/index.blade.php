@extends('layouts.app')

@section('title', 'Universes')

@section('content')
<h1>Universes</h1>

<a href="{{ route('universes.create') }}">+ New Universe</a>

<ul>
@foreach ($universes as $universe)
    @include('universes._universe_item', ['universe' => $universe, 'allUniverses' => $allUniverses, 'statuses' => $statuses, 'recurringTasks' => $recurringTasks])
@endforeach
</ul>
@endsection

@push('scripts')
<script src="{{ asset('js/AddTaskCard.js') }}"></script>
<script src="{{ asset('js/universes.js') }}"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Initialize inline editable fields for universe name, status, and parent
    setTimeout(function() {
        document.querySelectorAll('[data-field-id^="universe-name-"], [data-field-id^="universe-status-"], [data-field-id^="universe-parent-"]').forEach(function(field) {
            const fieldId = field.dataset.fieldId;
            if (!fieldId) return;
            
            // Extract universe ID from field ID
            const match = fieldId.match(/universe-(name|status|parent)-(\d+)/);
            if (!match) return;
            
            const universeId = parseInt(match[2], 10);
            const fieldType = match[1]; // 'name', 'status', or 'parent'
            
            if (window.inlineFieldEditors && window.inlineFieldEditors[fieldId]) {
                const editor = window.inlineFieldEditors[fieldId];
                
                // For status field, format the display value (replace underscores with spaces)
                if (fieldType === 'status') {
                    editor.options.formatValue = function(value) {
                        if (!value) return '';
                        return value.replace(/_/g, ' ');
                    };
                }
                // For parent field, format the display value
                else if (fieldType === 'parent') {
                    // Update display immediately on load
                    const updateParentDisplay = function() {
                        const select = document.getElementById('input-' + fieldId);
                        const viewValue = document.querySelector(`#inline-view-${fieldId} .inline-field-value`);
                        if (!select || !viewValue) return;
                        
                        const selectedValue = select.value || '';
                        if (!selectedValue || selectedValue === '') {
                            viewValue.textContent = 'no parent';
                            return;
                        }
                        
                        const selectedOption = select.options[select.selectedIndex];
                        const parentName = selectedOption ? selectedOption.text.trim() : '';
                        if (parentName && parentName !== '— none —') {
                            viewValue.textContent = 'child of ' + parentName;
                        } else {
                            viewValue.textContent = 'no parent';
                        }
                    };
                    
                    // Update display when select changes
                    const select = document.getElementById('input-' + fieldId);
                    if (select) {
                        select.addEventListener('change', updateParentDisplay);
                        // Update immediately
                        setTimeout(updateParentDisplay, 10);
                    }
                    
                    editor.options.formatValue = function(value) {
                        if (!value || value === '') return 'no parent';
                        const select = document.getElementById('input-' + fieldId);
                        if (select) {
                            const selectedOption = select.options[select.selectedIndex];
                            const parentName = selectedOption ? selectedOption.text.trim() : '';
                            if (parentName && parentName !== '— none —') {
                                return 'child of ' + parentName;
                            }
                        }
                        return 'no parent';
                    };
                }
                
                editor.options.onSave = async function(newValue, oldValue, editorInstance) {
                    let fieldName;
                    if (fieldType === 'name') {
                        fieldName = 'name';
                    } else if (fieldType === 'status') {
                        fieldName = 'status';
                    } else {
                        fieldName = 'parent_id';
                    }
                    const success = await UniverseFieldSaver.saveField(universeId, fieldName, newValue);
                    if (success) {
                        // For parent field, update display from select option text
                        if (fieldType === 'parent') {
                            const select = document.getElementById('input-' + fieldId);
                            if (select) {
                                const selectedOption = select.options[select.selectedIndex];
                                const parentName = selectedOption ? selectedOption.text.trim() : '';
                                const displayText = (!newValue || newValue === '' || parentName === '— none —') 
                                    ? 'no parent' 
                                    : 'child of ' + parentName;
                                editorInstance.updateDisplayValue(displayText);
                            }
                        } else if (fieldType === 'status') {
                            // Update both the inline field display and the non-expanded view display
                            // Replace underscores with spaces for display
                            const displayValue = newValue.replace(/_/g, ' ');
                            editorInstance.updateDisplayValue(displayValue);
                            const statusDisplay = document.querySelector(`#universe-view-${universeId} .universe-status-display`);
                            if (statusDisplay) {
                                statusDisplay.textContent = displayValue;
                            }
                        } else {
                            editorInstance.updateDisplayValue(newValue);
                        }
                        editorInstance.originalValue = newValue;
                        return true;
                    }
                    return false;
                };
            }
        });
    }, 100);
});
</script>
@endpush
