# Inline Editing System Documentation

## Overview

The inline editing system provides a consistent, user-friendly way to edit task and universe fields directly in their display context. Fields are shown as text with a pencil icon, and clicking the pencil toggles them into editable form inputs.

## Architecture

### Core Components

1. **Blade Component**: `resources/views/components/inline-editable-field.blade.php`
   - Reusable Blade component for simple fields (text, textarea, select)
   - Handles view/edit mode toggle
   - Provides consistent UI structure

2. **JavaScript Classes**:
   - `InlineFieldEditor.js` - Core editor class for basic fields
   - `TaskFieldSaver.js` - AJAX utility for saving task fields
   - `UniverseFieldSaver.js` - AJAX utility for saving universe fields
   - `TimeHelper.js` - Utility for time unit conversions

3. **Field-Specific Classes** (for complex fields):
   - `InlineUniversesField.js` - Multiple universe selection with primary designation
   - `InlineEstimatedTimeField.js` - Time input with hours/minutes unit selector
   - `InlineRecurringTaskField.js` - Recurring task selection
   - `InlineDeadlineField.js` - Datetime input with "Today" button
   - `InlineLogTimeField.js` - Display-only time input for log form

4. **Card-Level Management**:
   - `TaskCardEditor.js` - Manages task card expand/collapse and action buttons
   - `main.js` - Initializes global registries and manages script loading order

## Usage

### Simple Fields (Name, Description)

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

### Complex Fields (Custom Templates)

For fields that need custom UI (multiple inputs, special formatting), use custom Blade templates:

```blade
@include('tasks._inline_universes', [
    'task' => $task,
    'universeItems' => $universeItems,
    'universes' => $universes,
    'fieldId' => 'universes-' . $task->id
])
```

The custom template should:
1. Use the `inline-editable-field` structure
2. Set `data-no-auto-init="true"` to prevent auto-initialization
3. Initialize the field-specific JavaScript class in a `<script>` tag

## Field Initialization

### Auto-Initialization

Simple fields are automatically initialized by `InlineFieldEditor.js` on page load. They must:
- Have a `data-field-id` attribute
- NOT have `data-no-auto-init="true"`

### Manual Initialization

Complex fields require manual initialization:

```javascript
document.addEventListener('DOMContentLoaded', function() {
    const fieldId = 'universes-123';
    const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
    
    if (fieldElement) {
        const config = {
            taskId: 123,
            // ... other config
        };
        new InlineUniversesField(fieldId, config);
    }
});
```

## Saving Fields

### Individual Field Saving

Each field saves independently via AJAX:

```javascript
// In the field's handleSave method
const success = await TaskFieldSaver.saveField(taskId, 'name', newValue);
```

### Save Handlers

Fields can define custom `onSave` handlers:

```javascript
editor.options.onSave = async function(newValue, oldValue, editor) {
    const success = await TaskFieldSaver.saveField(taskId, 'name', newValue);
    if (success) {
        editor.updateDisplayValue(newValue);
        editor.originalValue = newValue;
        return true;
    }
    return false;
};
```

## HTML Entity Handling

The system automatically handles HTML entity encoding/decoding:

- **Blade templates** HTML-encode values (e.g., `'` becomes `&#039;`)
- **JavaScript decodes** entities when reading from inputs
- **JavaScript decodes** entities when updating display values
- **FormData** is decoded before sending to server

This prevents double-encoding issues with special characters.

## Custom Field Development

### Creating a New Custom Field

1. **Create Blade Template** (`resources/views/tasks/_inline_myfield.blade.php`):
   ```blade
   <div class="inline-editable-field" data-field-id="{{ $fieldId }}" data-no-auto-init="true">
       <!-- View mode -->
       <div id="inline-view-{{ $fieldId }}" class="inline-field-view">
           <span class="inline-field-value">{{ $displayValue }}</span>
           <button type="button" class="inline-field-edit-btn">...</button>
       </div>
       
       <!-- Edit mode -->
       <div id="inline-edit-{{ $fieldId }}" class="inline-field-edit d-none">
           <!-- Custom input UI -->
           <input type="hidden" id="input-{{ $fieldId }}" value="" />
       </div>
   </div>
   
   <script>
   document.addEventListener('DOMContentLoaded', function() {
       new InlineMyField('{{ $fieldId }}', { /* config */ });
   });
   </script>
   ```

2. **Create JavaScript Class** (`public/js/InlineMyField.js`):
   ```javascript
   class InlineMyField {
       constructor(fieldId, config = {}) {
           this.fieldId = fieldId;
           this.taskId = config.taskId;
           this.init();
       }
       
       init() {
           this.cacheElements();
           this.setupEditor();
           this.setupEventListeners();
       }
       
       setupEditor() {
           window.inlineFieldEditors[this.fieldId] = new InlineFieldEditor(this.fieldId, {
               formatValue: (value) => this.formatValue(value),
               onSave: (newValue, oldValue, editor) => this.handleSave(newValue, oldValue, editor)
           });
       }
       
       handleSave(newValue, oldValue, editor) {
           // Custom save logic
           return TaskFieldSaver.saveField(this.taskId, 'field_name', newValue);
       }
   }
   ```

3. **Load Script** in `resources/views/layouts/app.blade.php`:
   ```blade
   <script src="{{ asset('js/InlineMyField.js') }}"></script>
   ```

## Script Loading Order

Scripts must load in this order (defined in `app.blade.php`):

1. Core dependencies: `InlineFieldEditor.js`, `TaskFieldSaver.js`, `UniverseFieldSaver.js`
2. Utilities: `TimeHelper.js`
3. Initialization: `main.js` (sets up registries)
4. Field classes: `InlineUniversesField.js`, `InlineEstimatedTimeField.js`, etc.
5. Card editors: `TaskCardEditor.js`
6. Page-specific: `@stack('scripts')`

## CSS Classes

### Component Classes

- `.inline-editable-field` - Main container
- `.inline-field-view` - View mode container
- `.inline-field-edit` - Edit mode container
- `.inline-field-value` - Display value span
- `.inline-field-label` - Field label
- `.inline-field-label-row` - Row containing label and pencil
- `.inline-field-edit-btn` - Pencil icon button
- `.inline-field-save-btn` - Save button
- `.inline-field-input` - Input/textarea/select elements

### State Classes

- `.d-none` - Hidden (Bootstrap utility)
- `.inline-field-view-no-label` - View mode without label

## Best Practices

1. **Always decode HTML entities** when reading from inputs or updating displays
2. **Use `data-no-auto-init="true"`** for custom fields to prevent conflicts
3. **Store field instances** in `window.inlineFieldEditors` registry
4. **Handle errors gracefully** - show alerts, don't crash
5. **Update display immediately** after successful save
6. **Preserve expanded state** when appropriate (e.g., universe cards)

## Troubleshooting

### Field not initializing
- Check that script is loaded in correct order
- Verify `data-field-id` is set correctly
- Check browser console for errors

### Double-encoding issues
- Ensure `decodeHtmlEntities()` is called when reading values
- Check that FormData decoding is working
- Verify server isn't encoding responses

### Conflicts with TaskCardEditor
- Use `closest('.inline-editable-field')` checks to skip handling
- Use `e.stopPropagation()` in custom field event handlers

## Related Files

- `INTEGRATION_TEST_CHECKLIST.md` - Manual testing checklist
- `public/css/main.css` - Styles for inline editing components
- `resources/views/tasks/_task_card.blade.php` - Task card implementation
- `resources/views/universes/_universe_item.blade.php` - Universe card implementation
