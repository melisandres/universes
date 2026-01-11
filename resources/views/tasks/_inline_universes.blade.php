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
    <label class="inline-field-label">Universes</label>
    
    {{-- View Mode --}}
    <div id="{{ $viewId }}" class="inline-field-view">
        <span class="inline-field-value">{{ $displayValue }}</span>
        <button type="button" class="inline-field-edit-btn" data-field-id="{{ $fieldId }}" aria-label="Edit Universes">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
        </button>
    </div>
    
    {{-- Edit Mode --}}
    <div id="{{ $editId }}" class="inline-field-edit d-none">
        {{-- Hidden input for InlineFieldEditor compatibility (not used for actual value) --}}
        <input type="hidden" id="input-{{ $fieldId }}" value="" />
        <div id="universes-container-{{ $task->id }}">
            @if($universeItems->isNotEmpty())
                @foreach($universeItems as $index => $universeItem)
                    <div class="universe-item-row" data-index="{{ $index }}" style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                        <select name="universe_ids[]" class="universe-select" required style="padding: 0.35rem; flex: 1; max-width: 300px;">
                            <option value="">— select universe —</option>
                            @foreach ($universesForEdit as $u)
                                <option value="{{ $u->id }}" @selected($universeItem->universe_id == $u->id)>
                                    {{ $u->name }}
                                </option>
                            @endforeach
                        </select>
                        <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; white-space: nowrap;">
                            <input type="radio" name="primary_universe" value="{{ $index }}" @checked($universeItem->is_primary)>
                            Primary
                        </label>
                        <button type="button" class="remove-universe-btn" data-task-id="{{ $task->id }}" style="padding: 0.35rem 0.75rem; font-size: 0.9rem; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Remove</button>
                    </div>
                @endforeach
            @else
                <div class="universe-item-row" data-index="0" style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                    <select name="universe_ids[]" class="universe-select" required style="padding: 0.35rem; flex: 1; max-width: 300px;">
                        <option value="">— select universe —</option>
                        @foreach ($universesForEdit as $u)
                            <option value="{{ $u->id }}" @selected(isset($currentUniverse) && $currentUniverse->id == $u->id)>
                                {{ $u->name }}
                            </option>
                        @endforeach
                    </select>
                    <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; white-space: nowrap;">
                        <input type="radio" name="primary_universe" value="0" checked>
                        Primary
                    </label>
                    <button type="button" class="remove-universe-btn" data-task-id="{{ $task->id }}" style="padding: 0.35rem 0.75rem; font-size: 0.9rem; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Remove</button>
                </div>
            @endif
        </div>
        <button type="button" class="add-universe-btn" data-task-id="{{ $task->id }}" style="margin-top: 0.5rem; padding: 0.35rem 0.75rem; font-size: 0.85rem;">+ Add Universe</button>
        <div class="inline-field-actions" style="margin-top: 0.75rem;">
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
