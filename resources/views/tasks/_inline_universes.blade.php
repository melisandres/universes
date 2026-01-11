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

<div class="inline-editable-field" data-field-id="{{ $fieldId }}" data-no-auto-init="true">
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

{{-- Initialize with custom formatting --}}
<script>
document.addEventListener('DOMContentLoaded', function() {
    const fieldId = '{{ $fieldId }}';
    if (!window.inlineFieldEditors) window.inlineFieldEditors = {};
    
    // Function to update display value from form inputs
    function updateUniversesDisplay() {
        const container = document.getElementById('universes-container-{{ $task->id }}');
        const viewValue = document.querySelector(`#inline-view-${fieldId} .inline-field-value`);
        
        if (!container) {
            console.warn('Universes container not found');
            return;
        }
        
        if (!viewValue) {
            console.warn('View value element not found for field:', fieldId);
            return;
        }
        
        const rows = container.querySelectorAll('.universe-item-row');
        const universeNames = [];
        
        // Find which radio is checked for primary
        const checkedPrimaryRadio = container.querySelector('input[name="primary_universe"]:checked');
        const primaryIndex = checkedPrimaryRadio ? parseInt(checkedPrimaryRadio.value) : -1;
        
        rows.forEach((row, index) => {
            const select = row.querySelector('select[name="universe_ids[]"]');
            if (!select) return;
            
            if (select.value && select.value !== '') {
                const selectedOption = select.options[select.selectedIndex];
                const name = selectedOption ? selectedOption.text.trim() : '';
                if (name && name !== '— select universe —') {
                    const isPrimary = (index === primaryIndex);
                    universeNames.push(isPrimary ? '★ ' + name : name);
                }
            }
        });
        
        const displayText = universeNames.length > 0 ? universeNames.join(', ') : 'None';
        viewValue.textContent = displayText;
    }
    
    // Initialize the inline editor with custom handling
    // Note: This field has data-no-auto-init="true" so it won't be auto-initialized
    const editor = new InlineFieldEditor(fieldId, {
        formatValue: function(value) {
            // This won't be called for complex fields, but we need it for the interface
            return value || 'None';
        },
        onSave: async function(newValue, oldValue, editor) {
            const container = document.getElementById('universes-container-{{ $task->id }}');
            if (!container) return false;
            
            // Collect all universe IDs and primary index
            const rows = container.querySelectorAll('.universe-item-row');
            const universeIds = [];
            let primaryIndex = 0;
            
            rows.forEach((row, index) => {
                const select = row.querySelector('select[name="universe_ids[]"]');
                const primaryRadio = row.querySelector(`input[name="primary_universe"][value="${index}"]`);
                
                if (select && select.value && select.value !== '') {
                    universeIds.push(select.value);
                    if (primaryRadio && primaryRadio.checked) {
                        primaryIndex = universeIds.length - 1;
                    }
                }
            });
            
            if (universeIds.length === 0) {
                alert('At least one universe is required');
                return false;
            }
            
            // Save universes - we need to send both universe_ids and primary_universe
            // Since TaskFieldSaver uses FormData, we'll need to handle this specially
            const form = document.querySelector(`.task-edit-form-simple[data-task-id="{{ $task->id }}"]`);
            if (!form) return false;
            
            const formData = new FormData(form);
            formData.delete('universe_ids[]');
            formData.delete('primary_universe');
            
            universeIds.forEach(id => {
                formData.append('universe_ids[]', id);
            });
            formData.append('primary_universe', primaryIndex);
            
            if (!formData.has('_method')) {
                formData.append('_method', 'PUT');
            }
            
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            if (!csrfToken) return false;
            
            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json'
                    },
                    body: formData
                });
                
                if (response.redirected) return false;
                
                const data = await response.json();
                
                if (!response.ok || !data.success) {
                    let errorMessage = 'Error updating universes';
                    if (data.errors) {
                        errorMessage = Object.values(data.errors).flat().join('\n');
                    } else if (data.message) {
                        errorMessage = data.message;
                    }
                    alert('Error: ' + errorMessage);
                    return false;
                }
                
                setTimeout(function() {
                    updateUniversesDisplay();
                }, 50);
                return true;
            } catch (error) {
                console.error('Error saving universes:', error);
                alert('Error: ' + (error.message || 'Error updating universes'));
                return false;
            }
        }
    });
    
    window.inlineFieldEditors[fieldId] = editor;
    
    // Update display immediately on page load
    updateUniversesDisplay();
    
    // Also update when entering edit mode to reflect current state
    const editBtn = document.querySelector(`#inline-view-${fieldId} .inline-field-edit-btn`);
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            // Small delay to ensure edit mode is visible
            setTimeout(updateUniversesDisplay, 10);
        });
    }
    
    // Update display when universes change (add/remove/select change)
    const container = document.getElementById('universes-container-{{ $task->id }}');
    if (container) {
        // Use event delegation for dynamic content
        container.addEventListener('change', function(e) {
            if (e.target.matches('select[name="universe_ids[]"]') || e.target.matches('input[name="primary_universe"]')) {
                // Only update if we're in edit mode
                const editElement = document.getElementById('inline-edit-' + fieldId);
                if (editElement && !editElement.classList.contains('d-none')) {
                    updateUniversesDisplay();
                }
            }
        });
    }
    
    // Handle add universe button (if it exists, it's handled by TaskCardEditor, but we can update display)
    const addBtn = document.querySelector(`.add-universe-btn[data-task-id="{{ $task->id }}"]`);
    if (addBtn) {
        const originalClick = addBtn.onclick;
        addBtn.addEventListener('click', function() {
            // Wait a bit for the new row to be added
            setTimeout(updateUniversesDisplay, 100);
        });
    }
    
    // Handle remove universe button
    if (container) {
        container.addEventListener('click', function(e) {
            if (e.target.matches('.remove-universe-btn')) {
                // Wait a bit for the row to be removed
                setTimeout(updateUniversesDisplay, 100);
            }
        });
    }
});
</script>
