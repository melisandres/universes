# Phase 5 Execution TODO: Task Inline Editing (Simple Fields)

## Overview
This document breaks Phase 5 into very small, testable steps. **After each step, stop and verify before proceeding to the next step.**

**Goal**: Enable editing of simple task fields (name, description) in the task card edit mode.

---

## Step 1: Register InlineEditableField Component in TaskCard
**Action**: Make InlineEditableField available in TaskCard component.

**Tasks**:
1. In `TaskCard.js`, add `InlineEditableField` to the `components` object (set to `null` initially)
2. In `resources/views/universes/index.blade.php`, ensure `InlineEditableField.js` is loaded before `TaskCard.js`
3. In the initialization script, set `window.TaskCard.components.InlineEditableField = window.InlineEditableField` after components are loaded

**Code structure**:
```javascript
// In TaskCard.js
window.TaskCard = {
    components: {
        InlineEditableField: null
    },
    // ... rest of component
};
```

**Verification**:
- ✅ InlineEditableField is registered in TaskCard components
- ✅ Script loading order is correct
- ✅ Component reference is set in initialization
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 2: Add Task Name Field to Edit Mode
**Action**: Add the name field to TaskCard edit mode using InlineEditableField.

**Tasks**:
1. In `TaskCard.js`, replace the placeholder "Edit mode (fields coming in Phase 5)" with the name field
2. Add InlineEditableField component for task name:
   ```javascript
   <InlineEditableField
       :field-id="'task-name-' + task.id"
       label="Name"
       :value="task.name"
       :on-save="handleNameSave"
       :required="true"
   />
   ```
3. Add placeholder `handleNameSave` method (will implement in Step 3)

**Code structure**:
```javascript
<div class="task-edit-card">
    <InlineEditableField
        :field-id="'task-name-' + task.id"
        label="Name"
        :value="task.name"
        :on-save="handleNameSave"
        :required="true"
    />
</div>
```

**Verification**:
- ✅ Name field appears in edit mode
- ✅ Field displays current task name
- ✅ Edit button is visible
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 3: Implement Name Save Handler
**Action**: Implement the save handler for task name that calls the API.

**Tasks**:
1. In `TaskCard.js`, implement `handleNameSave(newValue, oldValue)`
2. Use `fetch` to call `PUT /tasks/{id}` with JSON
3. Include CSRF token from meta tag
4. Send only the `name` field (other fields will be added in Phase 6)
5. Use `ErrorHandler.js` for error handling
6. On success, emit event to parent to update task name in data
7. Return boolean indicating success/failure

**Code structure**:
```javascript
async handleNameSave(newValue, oldValue) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    if (!csrfToken) {
        if (window.ErrorHandler) {
            ErrorHandler.handleError(new Error('CSRF token not found'));
        } else {
            console.error('CSRF token not found');
        }
        return false;
    }
    
    try {
        const response = await fetch(`/tasks/${this.task.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                name: newValue,
                // For now, send minimal data - will add other fields in Phase 6
                universe_ids: [this.task.universe_items?.[0]?.universe_id || 1],
                primary_universe: 0,
            })
        });
        
        let result;
        if (window.ErrorHandler && ErrorHandler.handleResponse) {
            result = await ErrorHandler.handleResponse(response, {
                defaultMessage: 'Error updating task name'
            });
        } else {
            const data = await response.json();
            result = {
                success: response.ok && data.success,
                data: data
            };
            if (!result.success) {
                alert(data.message || 'Error updating task name');
            }
        }
        
        if (result.success) {
            // Emit event to update parent data
            this.$emit('task-updated', {
                id: this.task.id,
                name: newValue
            });
            return true;
        }
        return false;
    } catch (error) {
        if (window.ErrorHandler && ErrorHandler.handleError) {
            ErrorHandler.handleError(error, {
                context: 'updating task name',
                showAlert: true
            });
        } else {
            console.error('Error updating task name:', error);
            alert('Error: ' + (error.message || 'Error updating task name'));
        }
        return false;
    }
}
```

**Note**: The API requires `universe_ids` and `primary_universe`, so we need to send minimal valid data. We'll improve this in Phase 6 when we add universe editing.

**Verification**:
- ✅ Save handler is implemented
- ✅ API call is made correctly
- ✅ Success updates the display
- ✅ Errors are handled gracefully
- ✅ Task name updates in view mode after save

**Stop here and verify before proceeding.**

---

## Step 4: Create InlineEditableTextarea Component
**Action**: Create a reusable inline editable field component for textarea inputs.

**Tasks**:
1. Create `public/js/InlineEditableTextarea.js`
2. Component should be similar to `InlineEditableField` but use `<textarea>` instead of `<input>`
3. Accept props:
   - `fieldId` (string) - unique identifier
   - `label` (string) - field label
   - `value` (string) - current value
   - `onSave` (function) - callback when saving
   - `placeholder` (string, optional) - placeholder text
   - `rows` (number, optional) - number of rows (default: 3)
4. Use CSS classes (no inline styles): same classes as InlineEditableField

**Code structure**:
```javascript
window.InlineEditableTextarea = {
    props: {
        fieldId: { type: String, required: true },
        label: { type: String, default: '' },
        value: { type: String, default: '' },
        placeholder: { type: String, default: 'Not set' },
        rows: { type: Number, default: 3 },
        onSave: { type: Function, required: true }
    },
    // Similar structure to InlineEditableField but with textarea
    template: `
        <!-- Similar to InlineEditableField but with textarea instead of input -->
    `
};
```

**Verification**:
- ✅ Component file exists
- ✅ Component structure is defined
- ✅ Uses textarea element
- ✅ No syntax errors

**Stop here and verify before proceeding.**

---

## Step 5: Register InlineEditableTextarea in TaskCard
**Action**: Make InlineEditableTextarea available in TaskCard component.

**Tasks**:
1. In `TaskCard.js`, add `InlineEditableTextarea` to the `components` object
2. In `resources/views/universes/index.blade.php`, load `InlineEditableTextarea.js` before `TaskCard.js`
3. In the initialization script, set the component reference

**Verification**:
- ✅ InlineEditableTextarea is registered
- ✅ Script is loaded
- ✅ Component reference is set
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 6: Add Task Description Field to Edit Mode
**Action**: Add the description field to TaskCard edit mode using InlineEditableTextarea.

**Tasks**:
1. In `TaskCard.js`, add description field after the name field:
   ```javascript
   <InlineEditableTextarea
       :field-id="'task-description-' + task.id"
       label="Description"
       :value="task.description || ''"
       :on-save="handleDescriptionSave"
       placeholder="No description"
       :rows="3"
   />
   ```
2. Add placeholder `handleDescriptionSave` method (will implement in Step 7)

**Verification**:
- ✅ Description field appears in edit mode
- ✅ Field displays current task description (or empty if none)
- ✅ Edit button is visible
- ✅ Textarea has correct number of rows
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 7: Implement Description Save Handler
**Action**: Implement the save handler for task description.

**Tasks**:
1. In `TaskCard.js`, implement `handleDescriptionSave(newValue, oldValue)`
2. Similar to name save handler, but update `description` field
3. Send minimal valid data (same as name handler for now)
4. On success, emit event to update task description in parent data

**Code structure**:
```javascript
async handleDescriptionSave(newValue, oldValue) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    if (!csrfToken) {
        if (window.ErrorHandler) {
            ErrorHandler.handleError(new Error('CSRF token not found'));
        } else {
            console.error('CSRF token not found');
        }
        return false;
    }
    
    try {
        const response = await fetch(`/tasks/${this.task.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                name: this.task.name,
                description: newValue,
                universe_ids: [this.task.universe_items?.[0]?.universe_id || 1],
                primary_universe: 0,
            })
        });
        
        let result;
        if (window.ErrorHandler && ErrorHandler.handleResponse) {
            result = await ErrorHandler.handleResponse(response, {
                defaultMessage: 'Error updating task description'
            });
        } else {
            const data = await response.json();
            result = {
                success: response.ok && data.success,
                data: data
            };
            if (!result.success) {
                alert(data.message || 'Error updating task description');
            }
        }
        
        if (result.success) {
            this.$emit('task-updated', {
                id: this.task.id,
                description: newValue
            });
            return true;
        }
        return false;
    } catch (error) {
        if (window.ErrorHandler && ErrorHandler.handleError) {
            ErrorHandler.handleError(error, {
                context: 'updating task description',
                showAlert: true
            });
        } else {
            console.error('Error updating task description:', error);
            alert('Error: ' + (error.message || 'Error updating task description'));
        }
        return false;
    }
}
```

**Verification**:
- ✅ Description saves correctly
- ✅ Display updates after save
- ✅ Errors are handled

**Stop here and verify before proceeding.**

---

## Step 8: Handle Task Update Events in Parent Components
**Action**: Update parent components to handle task update events.

**Tasks**:
1. In `UniverseCard.js`, listen for `@task-updated` event from TaskCard
2. Add `handleTaskUpdated` method to update task in `universe.primary_tasks` array
3. In `UniversesView.js`, pass through the event handler (or handle it there)
4. Update the task object in the data when event is received

**Code structure**:
```javascript
// In UniverseCard.js
<TaskCard 
    ...
    @task-updated="handleTaskUpdated"
/>

methods: {
    // ... existing methods ...
    handleTaskUpdated(update) {
        // Find and update task in universe.primary_tasks array
        const task = this.universe.primary_tasks.find(t => t.id === update.id);
        if (task) {
            Object.assign(task, update);
        }
    }
}
```

**Verification**:
- ✅ Updates reflect in the UI immediately
- ✅ Task name updates in view mode
- ✅ No page reload needed

**Stop here and verify before proceeding.**

---

## Step 9: Test Task Name Editing
**Action**: Comprehensive testing of task name editing.

**Test Checklist**:
- ✅ Can click edit button on name field
- ✅ Can edit task name
- ✅ Can save task name
- ✅ Name updates in view mode after save
- ✅ Name updates in edit mode after save
- ✅ Validation errors from backend are displayed
- ✅ Network errors are handled gracefully
- ✅ No console errors

**Verification**:
- ✅ All tests pass
- ✅ Functionality works as expected

**Stop here and verify before proceeding.**

---

## Step 10: Test Task Description Editing
**Action**: Comprehensive testing of task description editing.

**Test Checklist**:
- ✅ Can click edit button on description field
- ✅ Can edit task description (textarea)
- ✅ Can save task description
- ✅ Description updates after save
- ✅ Empty description shows placeholder
- ✅ Multi-line descriptions work correctly
- ✅ Validation errors from backend are displayed
- ✅ Network errors are handled gracefully
- ✅ No console errors

**Verification**:
- ✅ All tests pass
- ✅ Functionality works as expected

**Stop here and verify before proceeding.**

---

## Step 11: Test Both Fields Together
**Action**: Test editing both name and description fields.

**Test Checklist**:
- ✅ Can edit name and description in the same edit session
- ✅ Can save name, then edit description, then save description
- ✅ Both fields update correctly
- ✅ No conflicts between field saves
- ✅ No console errors

**Verification**:
- ✅ All tests pass
- ✅ Both fields work together correctly

**Stop here and verify before proceeding.**

---

## Phase 5 Complete!

**Final Verification Checklist**:
- ✅ Task name can be edited inline
- ✅ Task description can be edited inline
- ✅ All changes save to backend
- ✅ UI updates immediately after save
- ✅ Errors are handled gracefully
- ✅ CSS classes used (no inline styles)
- ✅ No console errors
- ✅ Visual appearance matches original

**Next Steps**: Once Phase 5 is verified complete, proceed to Phase 6: Task Inline Editing (Complex Fields) - universes, deadline, estimated_time, recurring_task_id.
