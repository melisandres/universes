# Phase 3 Execution TODO: Universe Inline Editing

## Overview
This document breaks Phase 3 into very small, testable steps. **After each step, stop and verify before proceeding to the next step.**

**Goal**: Enable editing of universe fields (name, status, parent).

---

## Step 1: Create InlineEditableField Component (Text Input)
**Action**: Create a reusable inline editable field component for text inputs.

**Tasks**:
1. Create `public/js/InlineEditableField.js`
2. Component should accept props:
   - `fieldId` (string) - unique identifier
   - `label` (string) - field label
   - `value` (string) - current value
   - `onSave` (function) - callback when saving
   - `required` (boolean, optional) - whether field is required
3. Component should have:
   - View mode: shows label and value with edit button
   - Edit mode: shows input field with save/cancel buttons
   - Toggle between modes
4. Use CSS classes (no inline styles): `inline-field-view`, `inline-field-edit`, `inline-field-value`, `inline-field-edit-btn`, etc.

**Basic structure**:
```javascript
window.InlineEditableField = {
    props: {
        fieldId: String,
        label: String,
        value: String,
        onSave: Function,
        required: Boolean,
    },
    data() {
        return {
            isEditing: false,
            editValue: '',
        };
    },
    methods: {
        enterEditMode() { ... },
        cancelEdit() { ... },
        save() { ... }
    },
    template: `...`
};
```

**Verification**:
- ✅ Component file exists
- ✅ Component structure is defined
- ✅ No syntax errors

**Stop here and verify before proceeding.**

---

## Step 2: Create InlineEditableSelect Component
**Action**: Create a reusable inline editable field component for select dropdowns.

**Tasks**:
1. Create `public/js/InlineEditableSelect.js`
2. Component should accept props:
   - `fieldId` (string)
   - `label` (string)
   - `value` (string) - current selected value
   - `options` (object) - key-value pairs for options
   - `onSave` (function)
   - `formatValue` (function, optional) - function to format display value
3. Similar structure to InlineEditableField but with `<select>` instead of `<input>`

**Verification**:
- ✅ Component file exists
- ✅ Component structure is defined
- ✅ No syntax errors

**Stop here and verify before proceeding.**

---

## Step 3: Add Universe Name Field to Edit Mode
**Action**: Add the name field to UniverseCard edit mode using InlineEditableField.

**Tasks**:
1. In `UniverseCard.js`, import/register `InlineEditableField` component
2. In the edit mode template, add the name field:
   ```javascript
   <InlineEditableField
       :field-id="'universe-name-' + universe.id"
       label="Name"
       :value="universe.name"
       :on-save="handleNameSave"
       :required="true"
   />
   ```
3. Add `handleNameSave` method to UniverseCard (placeholder for now)

**Verification**:
- ✅ Name field appears in edit mode
- ✅ Field displays current universe name
- ✅ Edit button is visible
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 4: Implement Name Save Handler
**Action**: Implement the save handler for universe name that calls the API.

**Tasks**:
1. In `UniverseCard.js`, implement `handleNameSave(newValue, oldValue)`
2. Use `fetch` to call `PUT /universes/{id}` with JSON
3. Include CSRF token from meta tag
4. Use `ErrorHandler.js` for error handling
5. On success, emit event to parent to update universe name in data
6. Return boolean indicating success/failure

**Code structure**:
```javascript
async handleNameSave(newValue, oldValue) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    if (!csrfToken) {
        ErrorHandler.handleError(new Error('CSRF token not found'));
        return false;
    }
    
    try {
        const response = await fetch(`/universes/${this.universe.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                name: newValue,
                status: this.universe.status,
                parent_id: this.universe.parent_id,
            })
        });
        
        const result = await ErrorHandler.handleResponse(response, {
            defaultMessage: 'Error updating universe name'
        });
        
        if (result.success) {
            // Emit event to update parent data
            this.$emit('universe-updated', {
                id: this.universe.id,
                name: newValue
            });
            return true;
        }
        return false;
    } catch (error) {
        ErrorHandler.handleError(error, {
            context: 'updating universe name',
            showAlert: true
        });
        return false;
    }
}
```

**Verification**:
- ✅ Save handler is implemented
- ✅ API call is made correctly
- ✅ Success updates the display
- ✅ Errors are handled gracefully

**Stop here and verify before proceeding.**

---

## Step 5: Add Universe Status Field to Edit Mode
**Action**: Add the status field to UniverseCard edit mode using InlineEditableSelect.

**Tasks**:
1. In `UniverseCard.js`, import/register `InlineEditableSelect` component
2. Prepare status options from `statuses` prop (format: replace underscores with spaces for display)
3. Add status field to edit mode:
   ```javascript
   <InlineEditableSelect
       :field-id="'universe-status-' + universe.id"
       label="Status"
       :value="universe.status"
       :options="statusOptions"
       :format-value="formatStatusValue"
       :on-save="handleStatusSave"
   />
   ```
4. Add computed property `statusOptions` to format options
5. Add `formatStatusValue` method
6. Add `handleStatusSave` method (placeholder)

**Verification**:
- ✅ Status field appears in edit mode
- ✅ Dropdown shows all status options
- ✅ Current status is selected
- ✅ Display value is formatted (underscores replaced with spaces)
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 6: Implement Status Save Handler
**Action**: Implement the save handler for universe status.

**Tasks**:
1. In `UniverseCard.js`, implement `handleStatusSave(newValue, oldValue)`
2. Similar to name save handler, but update `status` field
3. On success, emit event to update universe status in parent data
4. Update both the edit mode display and view mode display

**Verification**:
- ✅ Status saves correctly
- ✅ Display updates in both view and edit modes
- ✅ Errors are handled

**Stop here and verify before proceeding.**

---

## Step 7: Add Universe Parent Field to Edit Mode
**Action**: Add the parent field to UniverseCard edit mode using InlineEditableSelect.

**Tasks**:
1. In `UniverseCard.js`, prepare parent options from `allUniverses` prop
2. Filter out current universe from options (can't be its own parent)
3. Add "— none —" option for no parent
4. Add parent field to edit mode:
   ```javascript
   <InlineEditableSelect
       :field-id="'universe-parent-' + universe.id"
       label="Parent"
       :value="universe.parent_id || ''"
       :options="parentOptions"
       :format-value="formatParentValue"
       :on-save="handleParentSave"
   />
   ```
5. Add computed property `parentOptions`
6. Add `formatParentValue` method (shows "no parent" or "child of X")
7. Add `handleParentSave` method (placeholder)

**Verification**:
- ✅ Parent field appears in edit mode
- ✅ Dropdown shows all available universes (excluding current)
- ✅ Current parent is selected (or "— none —" if no parent)
- ✅ Display value is formatted correctly
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 8: Implement Parent Save Handler
**Action**: Implement the save handler for universe parent.

**Tasks**:
1. In `UniverseCard.js`, implement `handleParentSave(newValue, oldValue)`
2. Handle empty string as null (no parent)
3. On success, emit event to update universe parent_id in parent data
4. Update display value

**Verification**:
- ✅ Parent saves correctly
- ✅ Setting to "— none —" removes parent (sets to null)
- ✅ Setting to a universe sets it as parent
- ✅ Display updates correctly
- ✅ Errors are handled

**Stop here and verify before proceeding.**

---

## Step 9: Add Delete Button to Edit Mode
**Action**: Add delete button to universe edit mode.

**Tasks**:
1. In `UniverseCard.js`, add delete button in edit mode
2. Add confirmation dialog before deletion
3. Implement `handleDelete` method that:
   - Shows confirmation: `confirm('Are you sure?')`
   - Calls `DELETE /universes/{id}` API
   - On success, emits event to remove universe from parent data
   - Uses ErrorHandler for errors

**Code structure**:
```javascript
async handleDelete() {
    if (!confirm('Are you sure you want to delete this universe?')) {
        return;
    }
    
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    // ... API call ...
    // ... emit 'universe-deleted' event ...
}
```

**Verification**:
- ✅ Delete button appears in edit mode
- ✅ Confirmation dialog shows
- ✅ Deletion removes universe from list
- ✅ Errors are handled

**Stop here and verify before proceeding.**

---

## Step 10: Handle Universe Update Events in Parent
**Action**: Update parent component to handle universe update events.

**Tasks**:
1. In `UniversesView.js`, add event handlers for universe updates
2. Listen for `@universe-updated` and `@universe-deleted` events from UniverseCard
3. Update local data when events are received
4. For updates: find universe in data and update the field
5. For deletion: remove universe from data

**Code structure**:
```javascript
<UniverseCard 
    ...
    @universe-updated="handleUniverseUpdated"
    @universe-deleted="handleUniverseDeleted"
/>

methods: {
    handleUniverseUpdated(update) {
        // Find and update universe in universes array
    },
    handleUniverseDeleted(universeId) {
        // Remove universe from universes array
    }
}
```

**Verification**:
- ✅ Updates reflect in the UI immediately
- ✅ Deletions remove universes from display
- ✅ No page reload needed

**Stop here and verify before proceeding.**

---

## Step 11: Handle Nested Universe Updates
**Action**: Ensure updates work for nested (child) universes.

**Tasks**:
1. Test updating a child universe's name/status/parent
2. Verify the update propagates correctly through the nested structure
3. Ensure parent updates work when changing a child's parent

**Verification**:
- ✅ Child universe updates work
- ✅ Nested structure is maintained
- ✅ Parent changes work correctly

**Stop here and verify before proceeding.**

---

## Step 12: Test All Universe Editing Functionality
**Action**: Comprehensive testing of all universe editing features.

**Test Checklist**:
- ✅ Edit universe name → saves correctly
- ✅ Edit universe status → saves correctly, display updates
- ✅ Edit universe parent → saves correctly, display updates
- ✅ Set parent to "— none —" → removes parent correctly
- ✅ Delete universe → removes from list with confirmation
- ✅ Multiple universes can be edited simultaneously
- ✅ Nested universes can be edited
- ✅ Validation errors from backend are displayed
- ✅ Network errors are handled gracefully
- ✅ No console errors
- ✅ Visual appearance matches original

**Verification**:
- ✅ All tests pass
- ✅ Functionality matches original behavior

**Stop here and verify before proceeding.**

---

## Phase 3 Complete!

**Final Verification Checklist**:
- ✅ Universe name can be edited inline
- ✅ Universe status can be edited inline
- ✅ Universe parent can be edited inline
- ✅ Universe can be deleted with confirmation
- ✅ All changes save to backend
- ✅ UI updates immediately after save
- ✅ Errors are handled gracefully
- ✅ CSS classes used (no inline styles)
- ✅ No console errors

**Next Steps**: Once Phase 3 is verified complete, proceed to Phase 4: Task Card Expand/Collapse.
