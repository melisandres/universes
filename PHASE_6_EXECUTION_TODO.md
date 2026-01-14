# Phase 6 Execution TODO: Task Inline Editing (Complex Fields)

## Overview
This document breaks Phase 6 into very small, testable steps. **After each step, stop and verify before proceeding to the next step.**

**Goal**: Enable editing of complex task fields (universes, deadline, estimated_time, recurring_task_id) in the task card edit mode.

**Note**: These fields are more complex than name/description and require custom Vue components that replicate the functionality of the existing JavaScript classes (`InlineUniversesField`, `InlineDeadlineField`, `InlineEstimatedTimeField`).

---

## Step 1: Create InlineEditableRecurringTask Component
**Action**: Create a Vue component for recurring task selection (select dropdown).

**Tasks**:
1. Create `public/js/InlineEditableRecurringTask.js`
2. Component should accept props:
   - `fieldId` (string) - unique identifier
   - `value` (number|null) - current recurring_task_id
   - `recurringTasks` (array) - list of available recurring tasks
   - `onSave` (function) - callback when saving
3. Component should have:
   - View mode: shows recurring task name or "Not set"
   - Edit mode: shows select dropdown with recurring tasks
   - Toggle between modes
4. Use CSS classes (no inline styles): same classes as InlineEditableSelect

**Code structure**:
```javascript
window.InlineEditableRecurringTask = {
    props: {
        fieldId: { type: String, required: true },
        value: { type: Number, default: null },
        recurringTasks: { type: Array, default: () => [] },
        onSave: { type: Function, required: true }
    },
    // Similar structure to InlineEditableSelect
};
```

**Verification**:
- ✅ Component file exists
- ✅ Component structure is defined
- ✅ No syntax errors

**Stop here and verify before proceeding.**

---

## Step 2: Register InlineEditableRecurringTask in TaskCard
**Action**: Make InlineEditableRecurringTask available in TaskCard component.

**Tasks**:
1. In `TaskCard.js`, add `InlineEditableRecurringTask` to the `components` object
2. In `resources/views/universes/index.blade.php`, load `InlineEditableRecurringTask.js` before `TaskCard.js`
3. In the initialization script, set the component reference

**Verification**:
- ✅ Component is registered
- ✅ Script is loaded
- ✅ Component reference is set
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 3: Add Recurring Task Field to Edit Mode
**Action**: Add the recurring task field to TaskCard edit mode.

**Tasks**:
1. In `TaskCard.js`, add recurring task field after description field
2. Pass `recurringTasks` prop from UniverseCard to TaskCard (need to add this prop)
3. Add placeholder `handleRecurringTaskSave` method

**Code structure**:
```javascript
<InlineEditableRecurringTask
    :field-id="'recurring-task-' + task.id"
    label="Recurring Task"
    :value="task.recurring_task_id"
    :recurring-tasks="recurringTasks"
    :on-save="handleRecurringTaskSave"
/>
```

**Verification**:
- ✅ Recurring task field appears in edit mode
- ✅ Field displays current recurring task (or "Not set")
- ✅ Edit button is visible
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 4: Pass RecurringTasks Prop to TaskCard
**Action**: Pass recurringTasks from UniverseCard to TaskCard.

**Tasks**:
1. In `UniverseCard.js`, pass `recurringTasks` prop to `TaskCard` components
2. In `TaskCard.js`, add `recurringTasks` to props

**Verification**:
- ✅ Prop is passed correctly
- ✅ TaskCard receives recurringTasks array
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 5: Implement Recurring Task Save Handler
**Action**: Implement the save handler for recurring task.

**Tasks**:
1. In `TaskCard.js`, implement `handleRecurringTaskSave(newValue, oldValue)`
2. Convert empty string/null to null (no recurring task)
3. Send minimal valid data (same pattern as name/description handlers)
4. On success, emit event to update task recurring_task_id in parent data

**Code structure**:
```javascript
async handleRecurringTaskSave(newValue, oldValue) {
    // Convert empty string to null
    const recurringTaskId = newValue === '' || newValue === null ? null : parseInt(newValue, 10);
    // ... API call similar to handleNameSave ...
    // Emit: { id: this.task.id, recurring_task_id: recurringTaskId }
}
```

**Verification**:
- ✅ Recurring task saves correctly
- ✅ Setting to "Not set" removes recurring task (sets to null)
- ✅ Setting to a recurring task saves correctly
- ✅ Display updates after save
- ✅ Errors are handled

**Stop here and verify before proceeding.**

---

## Step 6: Create InlineEditableEstimatedTime Component
**Action**: Create a Vue component for estimated time with unit selector.

**Tasks**:
1. Create `public/js/InlineEditableEstimatedTime.js`
2. Component should accept props:
   - `fieldId` (string)
   - `value` (number|null) - estimated time in minutes
   - `onSave` (function)
3. Component should have:
   - View mode: shows formatted time (e.g., "2.5 hours", "30 minutes", "Not set")
   - Edit mode: shows number input with radio buttons for minutes/hours
   - Convert between minutes and hours for display/input
   - Format display value correctly
4. Use CSS classes (no inline styles)

**Code structure**:
```javascript
window.InlineEditableEstimatedTime = {
    props: {
        fieldId: { type: String, required: true },
        value: { type: Number, default: null }, // in minutes
        onSave: { type: Function, required: true }
    },
    data() {
        return {
            isEditing: false,
            editValue: '', // in the selected unit
            editUnit: 'hours', // 'hours' or 'minutes'
            displayValue: ''
        };
    },
    computed: {
        // Convert minutes to display format
    },
    methods: {
        // Convert between minutes and hours
        // Format display value
    }
};
```

**Verification**:
- ✅ Component file exists
- ✅ Component structure is defined
- ✅ Time conversion logic works
- ✅ No syntax errors

**Stop here and verify before proceeding.**

---

## Step 7: Register and Add Estimated Time Field
**Action**: Register component and add field to TaskCard edit mode.

**Tasks**:
1. Register `InlineEditableEstimatedTime` in TaskCard
2. Load script in `resources/views/universes/index.blade.php`
3. Add estimated time field to TaskCard edit mode
4. Add placeholder `handleEstimatedTimeSave` method

**Verification**:
- ✅ Component is registered
- ✅ Field appears in edit mode
- ✅ Field displays current estimated time
- ✅ Unit selector works (minutes/hours)
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 8: Implement Estimated Time Save Handler
**Action**: Implement the save handler for estimated time.

**Tasks**:
1. In `TaskCard.js`, implement `handleEstimatedTimeSave(newValue, oldValue)`
2. Convert time value from selected unit (hours/minutes) to minutes for storage
3. Send to API with `time_unit` option
4. On success, emit event to update task estimated_time in parent data

**Code structure**:
```javascript
async handleEstimatedTimeSave(timeValue, timeUnit) {
    // Convert to minutes
    const minutes = timeUnit === 'hours' ? timeValue * 60 : timeValue;
    // ... API call ...
    // Send: { estimated_time: minutes, time_unit: timeUnit }
    // Emit: { id: this.task.id, estimated_time: minutes }
}
```

**Verification**:
- ✅ Estimated time saves correctly
- ✅ Conversion between hours and minutes works
- ✅ Display updates after save
- ✅ Errors are handled

**Stop here and verify before proceeding.**

---

## Step 9: Create InlineEditableDeadline Component
**Action**: Create a Vue component for deadline with date/time picker and "Today" button.

**Tasks**:
1. Create `public/js/InlineEditableDeadline.js`
2. Component should accept props:
   - `fieldId` (string)
   - `value` (string|null) - ISO datetime string
   - `onSave` (function)
3. Component should have:
   - View mode: shows formatted date/time or "no deadline"
   - Edit mode: shows datetime-local input with "Today" button
   - "Today" button sets current date/time
   - Format display value (e.g., "deadline: Jan 15, 2024 2:30 PM")
4. Use CSS classes (no inline styles)

**Code structure**:
```javascript
window.InlineEditableDeadline = {
    props: {
        fieldId: { type: String, required: true },
        value: { type: String, default: null }, // ISO datetime string
        onSave: { type: Function, required: true }
    },
    methods: {
        setToday() {
            // Set to current date/time in datetime-local format
        },
        formatDisplayValue(datetimeString) {
            // Format: "deadline: Jan 15, 2024 2:30 PM"
        }
    }
};
```

**Verification**:
- ✅ Component file exists
- ✅ Component structure is defined
- ✅ "Today" button works
- ✅ Date formatting works
- ✅ No syntax errors

**Stop here and verify before proceeding.**

---

## Step 10: Register and Add Deadline Field
**Action**: Register component and add field to TaskCard edit mode.

**Tasks**:
1. Register `InlineEditableDeadline` in TaskCard
2. Load script in `resources/views/universes/index.blade.php`
3. Add deadline field to TaskCard edit mode
4. Add placeholder `handleDeadlineSave` method

**Verification**:
- ✅ Component is registered
- ✅ Field appears in edit mode
- ✅ Field displays current deadline (or "no deadline")
- ✅ "Today" button works
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 11: Implement Deadline Save Handler
**Action**: Implement the save handler for deadline.

**Tasks**:
1. In `TaskCard.js`, implement `handleDeadlineSave(newValue, oldValue)`
2. Send datetime value to API
3. On success, emit event to update task deadline_at in parent data
4. Update display value

**Code structure**:
```javascript
async handleDeadlineSave(datetimeValue, oldValue) {
    // datetimeValue is in datetime-local format (YYYY-MM-DDTHH:mm)
    // ... API call ...
    // Send: { deadline_at: datetimeValue }
    // Emit: { id: this.task.id, deadline_at: datetimeValue }
}
```

**Verification**:
- ✅ Deadline saves correctly
- ✅ Setting to empty removes deadline (sets to null)
- ✅ Display updates after save
- ✅ Errors are handled

**Stop here and verify before proceeding.**

---

## Step 12: Create InlineEditableUniverses Component
**Action**: Create a Vue component for universe selection with multi-select and primary designation.

**Tasks**:
1. Create `public/js/InlineEditableUniverses.js`
2. Component should accept props:
   - `fieldId` (string)
   - `value` (array) - array of universe items with `universe_id` and `is_primary`
   - `allUniverses` (array) - list of all available universes
   - `onSave` (function)
3. Component should have:
   - View mode: shows universe names with ★ for primary (e.g., "★ Universe 1, Universe 2")
   - Edit mode: shows multiple select dropdowns with "Primary" radio buttons and "Remove" buttons
   - "Add Universe" button to add more universe rows
   - Dynamic add/remove of universe rows
4. Use CSS classes (no inline styles)

**Code structure**:
```javascript
window.InlineEditableUniverses = {
    props: {
        fieldId: { type: String, required: true },
        value: { type: Array, default: () => [] }, // universe_items array
        allUniverses: { type: Array, required: true },
        onSave: { type: Function, required: true }
    },
    data() {
        return {
            isEditing: false,
            editUniverseItems: [] // local copy for editing
        };
    },
    methods: {
        addUniverseRow() { ... },
        removeUniverseRow(index) { ... },
        formatDisplayValue() {
            // Format: "★ Universe 1, Universe 2"
        }
    }
};
```

**Verification**:
- ✅ Component file exists
- ✅ Component structure is defined
- ✅ Can add/remove universe rows
- ✅ Primary designation works
- ✅ No syntax errors

**Stop here and verify before proceeding.**

---

## Step 13: Register and Add Universes Field
**Action**: Register component and add field to TaskCard edit mode.

**Tasks**:
1. Register `InlineEditableUniverses` in TaskCard
2. Load script in `resources/views/universes/index.blade.php`
3. Pass `allUniverses` prop from UniverseCard to TaskCard (need to add this prop)
4. Add universes field to TaskCard edit mode
5. Add placeholder `handleUniversesSave` method

**Verification**:
- ✅ Component is registered
- ✅ Field appears in edit mode
- ✅ Field displays current universes with primary marked
- ✅ Can add/remove universes
- ✅ Primary designation works
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 14: Pass AllUniverses Prop to TaskCard
**Action**: Pass allUniverses from UniverseCard to TaskCard.

**Tasks**:
1. In `UniverseCard.js`, pass `allUniverses` prop to `TaskCard` components
2. In `TaskCard.js`, add `allUniverses` to props

**Verification**:
- ✅ Prop is passed correctly
- ✅ TaskCard receives allUniverses array
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 15: Implement Universes Save Handler
**Action**: Implement the save handler for universes.

**Tasks**:
1. In `TaskCard.js`, implement `handleUniversesSave(universeItems, primaryIndex)`
2. Extract `universe_ids` array and `primary_universe` index from universeItems
3. Send to API
4. On success, emit event to update task universe_items in parent data
5. **Important**: If primary universe changed, emit special event to move task card

**Code structure**:
```javascript
async handleUniversesSave(universeItems, primaryIndex) {
    const universeIds = universeItems.map(ui => ui.universe_id);
    const oldPrimaryUniverseId = this.task.universe_items?.find(ui => ui.is_primary)?.universe_id;
    const newPrimaryUniverseId = universeItems[primaryIndex]?.universe_id;
    
    // ... API call ...
    // Send: { universe_ids: universeIds, primary_universe: primaryIndex }
    
    if (result.success) {
        this.$emit('task-updated', {
            id: this.task.id,
            universe_items: universeItems
        });
        
        // If primary universe changed, emit special event
        if (oldPrimaryUniverseId !== newPrimaryUniverseId) {
            this.$emit('task-primary-universe-changed', {
                taskId: this.task.id,
                oldUniverseId: oldPrimaryUniverseId,
                newUniverseId: newPrimaryUniverseId
            });
        }
    }
}
```

**Verification**:
- ✅ Universes save correctly
- ✅ Primary universe designation saves correctly
- ✅ Display updates after save
- ✅ Errors are handled

**Stop here and verify before proceeding.**

---

## Step 16: Handle Task Primary Universe Change Event
**Action**: Handle the event when a task's primary universe changes to move the task card.

**Tasks**:
1. In `UniverseCard.js`, listen for `@task-primary-universe-changed` event from TaskCard
2. Add `handleTaskPrimaryUniverseChanged` method
3. Method should:
   - Find the task in current universe's primary_tasks
   - Remove it from current universe
   - Find the new universe in the data structure
   - Add task to new universe's primary_tasks
   - Emit event up to parent to update the data structure

**Code structure**:
```javascript
handleTaskPrimaryUniverseChanged(event) {
    const { taskId, oldUniverseId, newUniverseId } = event;
    
    // Find task in current universe
    const task = this.universe.primary_tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Remove from current universe
    const taskIndex = this.universe.primary_tasks.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
        this.universe.primary_tasks.splice(taskIndex, 1);
    }
    
    // Emit event to parent to add to new universe
    this.$emit('task-moved-to-universe', {
        task: task,
        fromUniverseId: oldUniverseId,
        toUniverseId: newUniverseId
    });
}
```

**Verification**:
- ✅ Task is removed from old universe
- ✅ Event is emitted to parent
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 17: Handle Task Move Event in UniversesView
**Action**: Handle task move event in UniversesView to update the data structure.

**Tasks**:
1. In `UniversesView.js`, listen for `@task-moved-to-universe` event from UniverseCard
2. Add `handleTaskMovedToUniverse` method
3. Method should:
   - Find the task in the universes tree
   - Remove it from old universe's primary_tasks
   - Add it to new universe's primary_tasks
   - Emit event to parent (main app) to update data

**Code structure**:
```javascript
handleTaskMovedToUniverse(event) {
    const { task, fromUniverseId, toUniverseId } = event;
    
    // Find and remove from old universe (recursively)
    this.removeTaskFromUniverse(this.universes, fromUniverseId, task.id);
    
    // Find and add to new universe (recursively)
    this.addTaskToUniverse(this.universes, toUniverseId, task);
    
    // Emit to parent
    this.$emit('task-moved-to-universe', event);
}
```

**Verification**:
- ✅ Task is moved correctly in data structure
- ✅ UI updates to show task in new location
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 18: Handle Task Move Event in Main App
**Action**: Handle task move event in main app to update the data.

**Tasks**:
1. In `resources/views/universes/index.blade.php`, add `handleTaskMovedToUniverse` method
2. Method should update the universes data structure
3. Update the template to listen for the event

**Verification**:
- ✅ Task move is handled correctly
- ✅ Data structure is updated
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 19: Test All Complex Fields
**Action**: Comprehensive testing of all complex task fields.

**Test Checklist**:
- ✅ Recurring task: can select, can clear, saves correctly
- ✅ Estimated time: can set in hours, can set in minutes, conversion works, saves correctly
- ✅ Deadline: can set date/time, "Today" button works, can clear, saves correctly
- ✅ Universes: can add universes, can remove universes, can set primary, saves correctly
- ✅ Task move: changing primary universe moves task card to new universe
- ✅ All fields update display after save
- ✅ Validation errors from backend are displayed
- ✅ Network errors are handled gracefully
- ✅ No console errors

**Verification**:
- ✅ All tests pass
- ✅ All fields work correctly
- ✅ Task movement works correctly

**Stop here and verify before proceeding.**

---

## Phase 6 Complete!

**Final Verification Checklist**:
- ✅ Recurring task can be edited inline
- ✅ Estimated time can be edited inline (with unit conversion)
- ✅ Deadline can be edited inline (with "Today" button)
- ✅ Universes can be edited inline (multi-select with primary)
- ✅ Task cards move when primary universe changes
- ✅ All changes save to backend
- ✅ UI updates immediately after save
- ✅ Errors are handled gracefully
- ✅ CSS classes used (no inline styles)
- ✅ No console errors
- ✅ Visual appearance matches original

**Next Steps**: Once Phase 6 is verified complete, proceed to Phase 7: Task Creation.
