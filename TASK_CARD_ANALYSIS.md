# Task Card Analysis - Complete Feature Breakdown

## ✅ WORKING (Simple Test Version)
1. **Basic task display** - Name shown in view mode
2. **Simple edit form** - Name field only
3. **AJAX form submission** - Using fetch() with proper headers
4. **Edit/Cancel toggle** - Show/hide edit mode

## 🔍 COMPLEX VERSION FEATURES (To Add One by One)

### VIEW MODE (Lines 20-59)
- [ ] **Complete checkbox** (lines 22-31)
  - At far left of task
  - Has delay (1000ms) before completing
  - Disabled if already completed
  - Uses `data-complete-url` attribute
  
- [ ] **Recurring task indicator** (lines 34-36)
  - Shows 🔄 icon if `recurring_task_id` exists
  
- [ ] **Deadline display** (lines 38-40)
  - Shows "(due: YYYY-MM-DD HH:mm)" if deadline exists
  
- [ ] **Status badge** (line 41)
  - Shows `[{{ $task->status }}]`
  
- [ ] **Skip button** (lines 46-51)
  - Only shown if `isRecurring()` AND status !== 'skipped'
  - Regular form submission (not AJAX)
  
- [ ] **Eye icon button** (lines 53-57)
  - Toggles edit mode if `inlineEdit` is true
  - Links to edit page if `inlineEdit` is false

### EDIT MODE - LEFT CARD (Lines 70-193)

#### Form Setup
- [ ] **Form element** (line 74)
  - Class: `task-edit-form`
  - Data attribute: `data-task-id="{{ $task->id }}"`
  - Data attribute: `data-clear-deadline="true"`
  - Action: `route('tasks.update', $task)`
  - Method: POST with `@method('PUT')`
  
- [ ] **Hidden fields** (lines 77-80)
  - `referer` (if provided)
  - `status` (hidden input with id `status-input-{{ $task->id }}`)

#### Name Section (Lines 82-103)
- [ ] **Status pill** (line 87)
  - Shows computed status (open/late/completed/skipped)
  - Classes: `status-pill status-pill-{{ status }}`
  - ID: `status-pill-{{ $task->id }}`
  
- [ ] **Name input** (line 90)
  - Required field
  - Styled with inline styles
  
- [ ] **Recurring checkbox** (lines 93-96)
  - ID: `recurring-checkbox-{{ $task->id }}`
  - `onchange="toggleRecurringTaskDropdown({{ $task->id }})"`
  - Checked if `recurring_task_id !== null`
  
- [ ] **Deadline checkbox** (lines 97-100)
  - ID: `deadline-checkbox-{{ $task->id }}`
  - `onchange="toggleDeadlineInput({{ $task->id }})"`
  - Checked if `deadline_at !== null`

#### Estimated Time (Lines 105-109)
- [ ] **Number input** for estimated minutes
  - Optional field
  - Min: 0

#### Description (Lines 111-115)
- [ ] **Textarea** for description
  - Optional field
  - 3 rows

#### Deadline Section (Lines 117-124)
- [ ] **Container div** (line 118)
  - ID: `deadline-container-{{ $task->id }}`
  - Hidden if `deadline_at === null` (using `d-none` class)
  
- [ ] **Datetime-local input** (line 121)
  - ID: `deadline-{{ $task->id }}`
  - Data attribute: `data-task-id="{{ $task->id }}"`
  - Disabled if `deadline_at === null`
  - Format: `Y-m-d\TH:i`
  
- [ ] **Today button** (line 122)
  - Class: `btn-today`
  - Data attribute: `data-task-id="{{ $task->id }}"`
  - Sets deadline to today 5pm

#### Recurring Task Section (Lines 126-137)
- [ ] **Container div** (line 127)
  - ID: `recurring-task-container-{{ $task->id }}`
  - Hidden if `recurring_task_id === null` (using `d-none` class)
  
- [ ] **Select dropdown** (line 129)
  - Name: `recurring_task_id`
  - Options from `$recurringTasksForEdit`

#### Universes Section (Lines 139-180)
- [ ] **Container div** (line 142)
  - ID: `universes-container-{{ $task->id }}`
  - Class: `universes-container-inline`
  
- [ ] **Universe rows** (lines 143-177)
  - Each row has class `universe-item-row`
  - Data attribute: `data-index="{{ $index }}"`
  - Contains:
    - Select dropdown: `name="universe_ids[]"`
    - Radio button: `name="primary_universe"` with `value="{{ $index }}"`
    - Remove button: class `remove-universe-btn` with `data-task-id`
  
- [ ] **Add Universe button** (line 179)
  - Class: `add-universe-btn`
  - Data attribute: `data-task-id="{{ $task->id }}"`

#### Action Buttons (Lines 183-191)
- [ ] **Save button** (line 184)
  - Type: submit
  
- [ ] **Cancel button** (line 185)
  - Class: `cancel-task-edit-btn`
  - Data attribute: `data-task-id="{{ $task->id }}"`
  
- [ ] **Delete form** (lines 186-190)
  - Action: `route('tasks.destroy', $task)`
  - Method: DELETE
  - Has confirmation dialog

### EDIT MODE - RIGHT CARD (Lines 195-211)
- [ ] **Log form** (line 197)
  - Class: `task-log-form`
  - Action: `route('tasks.log', $task)`
  - Method: POST
  
- [ ] **Minutes input** (line 201)
  - Number input, min: 0
  
- [ ] **Notes textarea** (line 205)
  - 4 rows
  
- [ ] **Log button** (line 208)
  - Type: submit

### JAVASCRIPT - Data Passing (Lines 68-69, 215)
- [ ] **JSON script tags** (lines 68-69)
  - `universes-data-{{ $task->id }}` - Universe names/IDs
  - `universe-index-data-{{ $task->id }}` - Current index count
  - `task-id-data-{{ $task->id }}` - Task ID (line 215)

### JAVASCRIPT - Global Functions (Lines 217-424)
- [ ] **Window globals initialization** (lines 220-225)
  - `window.taskUniverseData = {}`
  - `window.taskUniverseIndex = {}`
  
- [ ] **Data parsing** (lines 228-245)
  - Parses JSON from script tags
  - Stores in window globals
  
- [ ] **addUniverseRowInline()** (lines 248-293)
  - Creates new universe row dynamically
  - Updates `window.taskUniverseIndex[taskId]`
  
- [ ] **removeUniverseRowInline()** (lines 296-304)
  - Removes row (but keeps at least one)
  
- [ ] **toggleRecurringTaskDropdown()** (lines 308-323)
  - Shows/hides recurring task container
  - Clears selection if unchecked
  
- [ ] **setDeadlineToday()** (lines 328-344)
  - Sets deadline input to today 5pm
  - Calls `updateStatusPillFromDeadline()`
  
- [ ] **updateStatusPillFromDeadline()** (lines 347-384)
  - Updates status pill based on deadline
  - Sets status to "late" if past (not today)
  - Updates hidden status input
  
- [ ] **Form submit listener** (lines 386-394)
  - Calls `clearDeadlineIfUnchecked()` before submit
  - Prevents submit if function returns false
  
- [ ] **Deadline input change listener** (lines 396-401)
  - Calls `updateStatusPillFromDeadline()` on change
  
- [ ] **Today button click listener** (lines 403-408)
  - Calls `setDeadlineToday()`
  
- [ ] **Remove universe button listeners** (lines 410-415)
  - Calls `removeUniverseRowInline()`
  
- [ ] **Add universe button listener** (lines 417-422)
  - Calls `addUniverseRowInline()`

### JAVASCRIPT - Global Functions (Lines 429-461)
- [ ] **toggleDeadlineInput()** (lines 433-458)
  - Shows/hides deadline container
  - Clears/disables deadline if unchecked
  - Enables/sets today if checked

### JAVASCRIPT - Complete Checkbox (Lines 464-565)
- [ ] **initTaskCompleteCheckbox()** (lines 468-537)
  - Initializes all `.task-complete-checkbox` elements
  - Prevents double initialization
  - Sets up change listener with 1000ms delay
  - Creates form and submits on timeout
  
- [ ] **clearDeadlineIfUnchecked()** (lines 548-563)
  - Clears deadline value if checkbox unchecked
  - Disables input if unchecked
  - Returns true

### EXTERNAL INTEGRATION
- [ ] **universes.js event handlers** (lines 195-333 in universes.js)
  - Listens for `.task-edit-form` submit
  - Uses fetch() with AJAX headers
  - Handles redirects and JSON responses
  - Reloads page on success

## 🐛 POTENTIAL ISSUES

1. **Multiple event listeners** - Both inline script AND universes.js might be attaching to the same form
2. **Form class conflict** - `.task-edit-form` is used by universes.js
3. **Inline event handlers** - `onchange` attributes might conflict with addEventListener
4. **Data attribute conflicts** - Multiple scripts accessing same elements
5. **Form submission order** - `clearDeadlineIfUnchecked()` might interfere
6. **JSON parsing** - Multiple script tags with JSON data
7. **Window globals** - Multiple tasks might overwrite each other's data

## 🎯 TESTING STRATEGY

Start with simple test, then add features one by one:
1. ✅ Basic form (DONE)
2. Add name + status pill
3. Add estimated time + description
4. Add deadline checkbox + input + Today button
5. Add recurring checkbox + dropdown
6. Add universes selection (one row)
7. Add universe add/remove functionality
8. Add two-card layout (edit + log)
9. Add complete checkbox with delay
10. Add all view mode features
11. Test with universes.js integration

