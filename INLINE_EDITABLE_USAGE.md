# Inline Editable Fields - Usage Guide

This document explains how to use the reusable inline editable field components.

## Architecture Overview

The inline editable field system consists of three parts:

1. **Blade Component** (`resources/views/components/inline-editable-field.blade.php`)
   - Handles the HTML structure
   - Provides view/edit mode toggle UI
   - Supports multiple input types (text, textarea, select)

2. **JavaScript Class** (`public/js/InlineFieldEditor.js`)
   - Manages the toggle behavior
   - Handles save/cancel actions
   - Supports callbacks for custom save logic
   - Auto-initializes on page load

3. **CSS Styles** (`public/css/main.css`)
   - Provides consistent styling
   - Handles view/edit mode transitions

## Basic Usage

### Simple Text Field

```blade
@php
    $fieldId = 'task-name-' . $task->id;
@endphp

<x-inline-editable-field
    field-id="{{ $fieldId }}"
    label="Name"
    value="{{ $task->name }}"
    name="name"
    type="text"
    required
/>
```

### Textarea Field

```blade
<x-inline-editable-field
    field-id="task-description-{{ $task->id }}"
    label="Description"
    value="{{ $task->description }}"
    name="description"
    type="textarea"
    rows="3"
    placeholder="No description"
/>
```

### Select Field

```blade
@php
    $statusOptions = [
        'open' => 'Open',
        'completed' => 'Completed',
        'skipped' => 'Skipped'
    ];
@endphp

<x-inline-editable-field
    field-id="task-status-{{ $task->id }}"
    label="Status"
    value="{{ $task->status }}"
    name="status"
    type="select"
    :options="$statusOptions"
/>
```

## Advanced Usage with Custom Save Logic

### With AJAX Save

```blade
<x-inline-editable-field
    field-id="task-name-{{ $task->id }}"
    label="Name"
    value="{{ $task->name }}"
    name="name"
    type="text"
    required
/>
```

```javascript
// In your JavaScript file or script tag
document.addEventListener('DOMContentLoaded', function() {
    const fieldId = 'task-name-' + taskId;
    
    window.inlineFieldEditors[fieldId] = new InlineFieldEditor(fieldId, {
        onSave: async function(newValue, oldValue, editor) {
            try {
                const response = await fetch(`/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    body: JSON.stringify({ name: newValue })
                });
                
                if (!response.ok) {
                    throw new Error('Save failed');
                }
                
                return true; // Success
            } catch (error) {
                console.error('Error saving:', error);
                alert('Failed to save. Please try again.');
                return false; // Prevent UI update
            }
        }
    });
});
```

### With Validation

```javascript
window.inlineFieldEditors[fieldId] = new InlineFieldEditor(fieldId, {
    validate: function(value) {
        if (value.length < 3) {
            return 'Name must be at least 3 characters';
        }
        if (value.length > 100) {
            return 'Name must be less than 100 characters';
        }
        return true; // Valid
    },
    onSave: function(newValue, oldValue, editor) {
        // Save logic here
        return true;
    }
});
```

### With Custom Value Formatting

```javascript
window.inlineFieldEditors[fieldId] = new InlineFieldEditor(fieldId, {
    formatValue: function(value) {
        if (!value) return 'Not set';
        // Format time in minutes to "X hours Y minutes"
        const hours = Math.floor(value / 60);
        const minutes = value % 60;
        if (hours > 0 && minutes > 0) {
            return `${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h`;
        } else {
            return `${minutes}m`;
        }
    },
    onSave: function(newValue, oldValue, editor) {
        // Save logic
        return true;
    }
});
```

## Integration with Form Submission

If you want inline fields to be part of a larger form (like the task edit form), you can:

1. **Use the component without custom save logic** - The field will be part of the form and submitted normally
2. **Use auto-save mode** - Save individual fields as they're edited

### Auto-save Mode

```javascript
window.inlineFieldEditors[fieldId] = new InlineFieldEditor(fieldId, {
    autoSave: true, // Saves on blur or Enter key
    onSave: async function(newValue, oldValue, editor) {
        // Auto-save logic
        return true;
    }
});
```

## Custom Templates

For complex fields (like the time input with unit selector), you can use custom templates:

```blade
<x-inline-editable-field
    field-id="estimated-time-{{ $task->id }}"
    label="Estimated Time"
    value="{{ $task->estimated_time }}"
    name="estimated_time"
    custom-view="tasks._estimated_time_view"
    custom-edit="tasks._estimated_time_edit"
/>
```

Then create the custom templates in `resources/views/tasks/`:
- `_estimated_time_view.blade.php` - Display template
- `_estimated_time_edit.blade.php` - Edit template

## Best Practices

1. **Unique Field IDs**: Always use unique IDs, typically including the model ID
   ```blade
   field-id="field-name-{{ $model->id }}"
   ```

2. **Consistent Naming**: Use consistent naming patterns for easier JavaScript access
   ```blade
   field-id="task-{{ $field }}-{{ $task->id }}"
   ```

3. **Handle Empty Values**: Always provide a meaningful placeholder
   ```blade
   placeholder="Not set"
   ```

4. **Error Handling**: Always handle errors in your save callbacks
   ```javascript
   onSave: async function(newValue, oldValue, editor) {
       try {
           // Save logic
           return true;
       } catch (error) {
           console.error('Error:', error);
           alert('Failed to save');
           return false; // Prevents UI update
       }
   }
   ```

5. **Accessibility**: The component includes proper ARIA labels and keyboard support (Enter to save, Escape to cancel)

## Example: Refactoring Task Card

Here's how you could refactor the task card to use inline editable fields:

```blade
{{-- Before: Direct input --}}
<div style="margin-bottom: 0.75rem;">
    <label>Name:</label>
    <input type="text" name="name" value="{{ $task->name }}" required>
</div>

{{-- After: Inline editable --}}
<x-inline-editable-field
    field-id="task-name-{{ $task->id }}"
    label="Name"
    value="{{ $task->name }}"
    name="name"
    type="text"
    required
/>
```

The component automatically handles:
- View mode with pencil icon
- Edit mode with input and save/cancel buttons
- Toggle between modes
- Keyboard shortcuts (Enter/Escape)
