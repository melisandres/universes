# Task Card Inline Edit Implementation Guide

This guide shows you exactly how to apply the inline editable fields to your task card edit form.

## Overview

The inline editable fields will:
- Show a **presentation value** with a **pencil icon** in view mode
- Toggle to **edit mode** when the pencil is clicked
- Update the **display value** when saved (without submitting the form)
- The form's main **Save button** still submits everything via AJAX

## Step-by-Step Implementation

### Step 1: Simple Fields (Name, Description)

Replace the existing input fields with the inline editable component:

**Before:**
```blade
{{-- Name --}}
<div style="margin-bottom: 0.75rem;">
    <label style="display: block; margin-bottom: 0.25rem; font-size: 0.9em; font-weight: 600;">Name:</label>
    <input type="text" name="name" value="{{ $task->name }}" required style="width: 100%; max-width: 300px; padding: 0.35rem;">
</div>
```

**After:**
```blade
{{-- Name --}}
<x-inline-editable-field
    field-id="task-name-{{ $task->id }}"
    label="Name"
    value="{{ $task->name }}"
    name="name"
    type="text"
    required
/>
```

**Before:**
```blade
{{-- Description --}}
<div style="margin-bottom: 0.75rem;">
    <label style="display: block; margin-bottom: 0.25rem; font-size: 0.9em;">Description:</label>
    <textarea name="description" rows="3" placeholder="Optional" style="padding: 0.35rem; max-width: 300px; width: 100%;">{{ $task->description }}</textarea>
</div>
```

**After:**
```blade
{{-- Description --}}
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

### Step 2: Select Field (Recurring Task)

**Before:**
```blade
<div id="recurring-task-container-{{ $task->id }}" class="@if($task->recurring_task_id === null) d-none @endif" style="margin-bottom: 0.75rem;">
    <label style="display: block; margin-bottom: 0.25rem; font-size: 0.9em;">Linked Recurring Task:</label>
    <select name="recurring_task_id" style="padding: 0.35rem; max-width: 300px;">
        <option value="">— none —</option>
        @foreach ($recurringTasksForEdit as $rt)
            <option value="{{ $rt->id }}" @selected($task->recurring_task_id == $rt->id)>
                {{ $rt->name }}
            </option>
        @endforeach
    </select>
</div>
```

**After:**
```blade
<div id="recurring-task-container-{{ $task->id }}" class="@if($task->recurring_task_id === null) d-none @endif" style="margin-bottom: 0.75rem;">
    @php
        $recurringTaskOptions = ['' => '— none —'];
        foreach ($recurringTasksForEdit as $rt) {
            $recurringTaskOptions[$rt->id] = $rt->name;
        }
    @endphp
    <x-inline-editable-field
        field-id="recurring-task-{{ $task->id }}"
        label="Linked Recurring Task"
        value="{{ $task->recurring_task_id }}"
        name="recurring_task_id"
        type="select"
        :options="$recurringTaskOptions"
        placeholder="Not set"
    />
</div>
```

### Step 3: Complex Fields (Estimated Time, Deadline)

For complex fields that need special formatting or additional controls, use custom templates.

**Estimated Time - Before:**
```blade
{{-- Estimated Time --}}
<div style="margin-bottom: 0.75rem;">
    <label style="display: block; margin-bottom: 0.25rem; font-size: 0.9em;">Estimated Time:</label>
    <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        {{-- ... complex time input with unit selector ... --}}
    </div>
</div>
```

**Estimated Time - After:**
```blade
{{-- Estimated Time --}}
@include('tasks._inline_estimated_time', [
    'task' => $task,
    'fieldId' => 'estimated-time-' . $task->id
])
```

**Deadline - Before:**
```blade
<div id="deadline-container-{{ $task->id }}" class="@if($task->deadline_at === null) d-none @endif" style="margin-bottom: 0.75rem;">
    <label style="display: block; margin-bottom: 0.25rem; font-size: 0.9em;">Deadline:</label>
    <div style="display: flex; align-items: center; gap: 0.5rem;">
        <input type="datetime-local" name="deadline_at" id="deadline-{{ $task->id }}" value="{{ $task->deadline_at ? $task->deadline_at->format('Y-m-d\TH:i') : '' }}" style="padding: 0.35rem; flex: 1; max-width: 300px;" data-task-id="{{ $task->id }}" @disabled($task->deadline_at === null)>
        <button type="button" class="btn-today" data-task-id="{{ $task->id }}" style="padding: 0.35rem 0.75rem; font-size: 0.85rem; white-space: nowrap;">Today</button>
    </div>
</div>
```

**Deadline - After:**
```blade
<div id="deadline-container-{{ $task->id }}" class="@if($task->deadline_at === null) d-none @endif" style="margin-bottom: 0.75rem;">
    @include('tasks._inline_deadline', [
        'task' => $task,
        'fieldId' => 'deadline-' . $task->id
    ])
</div>
```

## How It Works

### Form Context Behavior

When used within a form (like your task edit form):

1. **View Mode**: Shows the formatted value with a pencil icon
2. **Edit Mode**: Shows the input field with Save/Cancel buttons
3. **Save Button**: Updates the display value and exits edit mode (does NOT submit the form)
4. **Cancel Button**: Reverts to original value and exits edit mode
5. **Form Submit**: The main form Save button submits all fields via AJAX as before

### No JavaScript Required (for simple fields)

Simple fields (text, textarea, select) work automatically - the `InlineFieldEditor` class auto-initializes them on page load.

### Custom Formatting (for complex fields)

Complex fields like Estimated Time and Deadline use custom JavaScript to format the display value:

```javascript
window.inlineFieldEditors[fieldId] = new InlineFieldEditor(fieldId, {
    formatValue: function(value) {
        // Custom formatting logic
        return formattedValue;
    }
});
```

## Complete Example

See `resources/views/tasks/_task_card_refactored_example.blade.php` for a complete example of the refactored task card.

## Fields to Keep As-Is

These fields don't need inline editing (they're already simple/appropriate):

- **Universes Selection**: Complex multi-select with add/remove - keep as-is
- **Recurring Checkbox**: Simple checkbox - keep as-is  
- **Deadline Checkbox**: Simple checkbox - keep as-is
- **Status Hidden Field**: Hidden input - keep as-is
- **Form Action Buttons**: Keep as-is

## Testing Checklist

After implementing:

- [ ] Name field shows value with pencil icon
- [ ] Clicking pencil shows input field
- [ ] Saving updates display value
- [ ] Canceling reverts to original value
- [ ] Form submission still works via main Save button
- [ ] Estimated time formats correctly (hours/minutes)
- [ ] Deadline formats correctly (readable date)
- [ ] All fields are included in form submission

## Next Steps

1. Start with simple fields (Name, Description)
2. Test that they work correctly
3. Add select field (Recurring Task)
4. Add complex fields (Estimated Time, Deadline) using the custom templates
5. Remove inline styles as you go (they're now in CSS)
