# JavaScript Refactoring Plan - Inline Field Templates

## Current State Analysis

### Existing JS Files

#### 1. `InlineFieldEditor.js` (241 lines)
**Status**: ✅ Active and well-structured
**Purpose**: Core class for managing inline editable field behavior
**Key Features**:
- Toggle between view/edit modes
- Save/cancel handling
- Auto-initialization for fields without `data-no-auto-init="true"`
- Event listener management
- Value formatting and display updates

**No Deprecated Code Found**: All methods appear to be in use

**Potential Issues**:
- `getInputValue()` has redundant if/else for SELECT, TEXTAREA, and default (all return `this.inputElement.value`)
- Could be simplified to just `return this.inputElement?.value || '';`

#### 2. `TaskFieldSaver.js` (105 lines)
**Status**: ✅ Active and well-structured
**Purpose**: Utility for saving individual task fields via AJAX
**Key Features**:
- Handles special cases (universe_ids, estimated_time, deadline_at)
- FormData construction from existing form
- Error handling
- CSRF token management

**No Deprecated Code Found**: All functionality appears to be in use

**Potential Improvements**:
- Error handling pattern is duplicated with `UniverseFieldSaver.js`
- Could extract common error handling to a utility

#### 3. `UniverseFieldSaver.js` (135 lines)
**Status**: ✅ Active and well-structured
**Purpose**: Utility for saving individual universe fields via AJAX
**Key Features**:
- Reads current values from DOM
- Handles parent_id changes (requires page reload)
- Updates display without reload for name/status

**No Deprecated Code Found**: All functionality appears to be in use

**Duplication**:
- Error handling pattern duplicated with `TaskFieldSaver.js`
- CSRF token retrieval duplicated

#### 4. `TaskCardEditor.js` (936 lines)
**Status**: ⚠️ Partially Deprecated / Has Overlaps
**Purpose**: Manages task card editing functionality

**Active Features**:
- Edit mode toggle
- Universe add/remove rows (`addUniverseRow()`, `removeUniverseRow()`) - **OVERLAPS with inline_universes**
- "Today" button handler for deadline - **OVERLAPS with inline_deadline** (but different behavior: sets to 5pm vs current time)
- Status pill updates (`updateStatusPillFromDeadline()`)
- Complete checkbox handling
- Skip task button
- Delete task button
- Complete & Log button

**Potentially Deprecated** (Already Removed):
- `toggleRecurringTaskDropdown()` - REMOVED (now handled by inline editable)
- `toggleDeadlineInput()` - REMOVED (now handled by inline editable)
- `clearDeadlineIfUnchecked()` - REMOVED (now handled by inline editable)
- `handleFormSubmit()` - REMOVED (fields now save individually)
- Old recurring checkbox logic - REMOVED
- Old deadline checkbox logic - REMOVED

**Overlaps/Conflicts**:
1. **Universe Add/Remove**: 
   - `TaskCardEditor.addUniverseRow()` and `removeUniverseRow()` exist
   - `_inline_universes.blade.php` has event listeners for add/remove buttons
   - **Action**: Decide if TaskCardEditor methods should be used by InlineUniversesField, or if InlineUniversesField should have its own

2. **"Today" Button**:
   - `TaskCardEditor.setDeadlineToday()` sets deadline to 5pm today
   - `_inline_deadline.blade.php` sets deadline to current time
   - Both try to attach listeners to the same button
   - **Action**: InlineDeadlineField should handle its own "Today" button, TaskCardEditor's handler may conflict

3. **Status Pill Updates**:
   - `TaskCardEditor.updateStatusPillFromDeadline()` updates task status based on deadline
   - This should remain in TaskCardEditor as it's card-level functionality

### JavaScript in Blade Files (To Be Extracted)

#### 1. `_inline_universes.blade.php` (~187 lines of JS)
**Current Structure**:
- `updateUniversesDisplay()` function - formats and displays universe list
- `InlineFieldEditor` initialization with custom `onSave`
- Event listeners for:
  - Edit button click
  - Universe select/radio changes
  - Add/remove universe buttons
- Custom save logic that builds FormData for universe_ids array

**Dependencies**:
- Uses `TaskCardEditor.addUniverseRow()` and `TaskCardEditor.removeUniverseRow()` (or has its own?)
- Needs access to universe data (from JSON script tag)

**To Extract**:
- Create `InlineUniversesField.js` class
- Move all display update logic
- Move all event listeners
- Move save handler (can use TaskFieldSaver but needs custom FormData building)
- Coordinate with TaskCardEditor for add/remove functionality

#### 2. `_inline_estimated_time.blade.php` (~127 lines of JS)
**Current Structure**:
- `updateEstimatedTimeDisplay()` function - formats time with unit
- `InlineFieldEditor` initialization
- Event listeners for:
  - Time input changes
  - Unit radio changes
  - Edit button click
- Save handler using `TaskFieldSaver.saveField()` with `timeUnit` option

**To Extract**:
- Create `InlineEstimatedTimeField.js` class
- Move display update logic
- Move event listeners
- Save handler can stay simple (uses TaskFieldSaver)

#### 3. `_inline_recurring_task.blade.php` (~86 lines of JS)
**Current Structure**:
- `updateRecurringTaskDisplay()` function - formats display text
- `InlineFieldEditor` initialization
- Event listeners for:
  - Select change
  - Edit button click
- Save handler using `TaskFieldSaver.saveField()`

**To Extract**:
- Create `InlineRecurringTaskField.js` class
- Move display update logic
- Move event listeners
- Save handler is straightforward

#### 4. `_inline_deadline.blade.php` (~128 lines of JS)
**Current Structure**:
- `updateDeadlineDisplay()` function - formats datetime
- `InlineFieldEditor` initialization
- Event listeners for:
  - Deadline input changes
  - Edit button click
  - "Today" button click
- Save handler using `TaskFieldSaver.saveField()`

**Dependencies**:
- "Today" button handler may overlap with `TaskCardEditor.js`

**To Extract**:
- Create `InlineDeadlineField.js` class
- Move display update logic
- Move event listeners (including "Today" button)
- Save handler is straightforward
- Check for duplication with TaskCardEditor's "Today" button handler

#### 5. `_inline_log_time.blade.php` (~83 lines of JS)
**Current Structure**:
- `updateLogTimeDisplay()` function - formats time with unit
- `InlineFieldEditor` initialization
- Event listeners for:
  - Time input changes
  - Unit radio changes
  - Edit button click
- Simple save handler (just updates display, doesn't save to server)

**To Extract**:
- Create `InlineLogTimeField.js` class
- Move display update logic
- Move event listeners
- Save handler is simple

## Duplication Analysis

### Common Patterns (Repeated in ALL files)

1. **Initialization Boilerplate** (5 instances):
```javascript
document.addEventListener('DOMContentLoaded', function() {
    const fieldId = '{{ $fieldId }}';
    if (!window.inlineFieldEditors) window.inlineFieldEditors = {};
    window.inlineFieldEditors[fieldId] = new InlineFieldEditor(fieldId, { ... });
});
```

2. **Display Update on Edit Button Click** (5 instances):
```javascript
const editBtn = document.querySelector(`#inline-view-${fieldId} .inline-field-edit-btn`);
if (editBtn) {
    editBtn.addEventListener('click', function() {
        setTimeout(updateDisplay, 10);
    });
}
```

3. **Display Update on Page Load** (5 instances):
```javascript
updateDisplay();
```

4. **Save Handler Pattern** (5 instances):
```javascript
onSave: async function(newValue, oldValue, editor) {
    // ... field-specific value extraction ...
    const success = await TaskFieldSaver.saveField(...);
    if (success) {
        setTimeout(function() {
            updateDisplay();
        }, 50);
        return true;
    }
    return false;
}
```

5. **Event Listener Pattern** (4 instances - not in log_time):
```javascript
const input = document.getElementById('input-' + fieldId);
if (input) {
    input.addEventListener('change', function() {
        const editElement = document.getElementById('inline-edit-' + fieldId);
        if (editElement && !editElement.classList.contains('d-none')) {
            updateDisplay();
        }
    });
}
```

### Potential Overlaps

1. **Universe Add/Remove**: 
   - `TaskCardEditor.js` has `addUniverseRow()` and `removeUniverseRow()`
   - `_inline_universes.blade.php` may have its own handlers
   - **Action**: Consolidate into `InlineUniversesField.js` or coordinate usage

2. **"Today" Button**:
   - `TaskCardEditor.js` may have a "Today" button handler
   - `_inline_deadline.blade.php` has its own "Today" button handler
   - **Action**: Check for duplication, consolidate into `InlineDeadlineField.js`

## Proposed Refactoring Plan

### Phase 1: Create Field-Specific Classes

Create dedicated JS classes for each complex field:

1. **`InlineUniversesField.js`**
   - Handles universe selection with primary designation
   - Manages dynamic add/remove of universe rows
   - Custom FormData building for universe_ids array
   - Coordinates with or replaces TaskCardEditor's universe methods

2. **`InlineEstimatedTimeField.js`**
   - Handles time input with unit selector (hours/minutes)
   - Formats display with unit
   - Uses TaskFieldSaver with timeUnit option

3. **`InlineRecurringTaskField.js`**
   - Handles recurring task selection
   - Formats display as "non-recurring" or "recurring instance of [name]"
   - Uses TaskFieldSaver

4. **`InlineDeadlineField.js`**
   - Handles datetime-local input
   - Formats display as "no deadline" or "deadline: [formatted date]"
   - Handles "Today" button (consolidate with TaskCardEditor if needed)
   - Uses TaskFieldSaver

5. **`InlineLogTimeField.js`**
   - Handles log time input with unit selector
   - Formats display with unit
   - Simple save (just updates display, doesn't save to server)

### Phase 2: Create Helper Utilities (Optional, After Phase 1)

Create `InlineFieldHelper.js` with common utilities:
- `initializeField(fieldId, options)` - wraps common initialization
- `setupDisplayUpdater(fieldId, updateFn, elements)` - sets up common event listeners
- `createSaveHandler(taskId, fieldName, valueExtractor, displayUpdater)` - creates common save handler
- `getCsrfToken()` - common CSRF token retrieval
- `handleAjaxError(response, data)` - common error handling

### Phase 3: Update Blade Templates

Replace `<script>` tags with:
- Data attributes for configuration (taskId, fieldId, etc.)
- Single initialization call: `new Inline[FieldName]Field(fieldId, config)`

## Implementation Strategy

### Step 1: Analyze TaskCardEditor for Overlaps
- Check if universe add/remove in TaskCardEditor is still needed
- Check if "Today" button handler in TaskCardEditor is still used
- Document what can be removed from TaskCardEditor

### Step 2: Extract Universes Field (Most Complex)
- Create `InlineUniversesField.js`
- Move all JS from `_inline_universes.blade.php`
- Handle universe add/remove (either use TaskCardEditor methods or implement own)
- Update blade to use data attributes and single init call
- Test thoroughly

### Step 3: Extract Estimated Time Field
- Create `InlineEstimatedTimeField.js`
- Move all JS from `_inline_estimated_time.blade.php`
- Update blade template
- Test

### Step 4: Extract Recurring Task Field
- Create `InlineRecurringTaskField.js`
- Move all JS from `_inline_recurring_task.blade.php`
- Update blade template
- Test

### Step 5: Extract Deadline Field
- Create `InlineDeadlineField.js`
- Move all JS from `_inline_deadline.blade.php`
- Consolidate "Today" button handler (check TaskCardEditor)
- Update blade template
- Test

### Step 6: Extract Log Time Field
- Create `InlineLogTimeField.js`
- Move all JS from `_inline_log_time.blade.php`
- Update blade template
- Test

### Step 7: Clean Up TaskCardEditor
- Remove deprecated methods (if any)
- Update to use new field classes if needed
- Document remaining responsibilities

## Class Structure Template

Each field class should follow this pattern:

```javascript
/**
 * Inline[FieldName]Field - Manages inline editing for [field name]
 */
class Inline[FieldName]Field {
    constructor(fieldId, config = {}) {
        this.fieldId = fieldId;
        this.taskId = config.taskId;
        this.config = config;
        
        // Cache elements
        this.elements = {
            viewElement: document.getElementById(`inline-view-${fieldId}`),
            editElement: document.getElementById(`inline-edit-${fieldId}`),
            inputElement: document.getElementById(`input-${fieldId}`),
            valueElement: null
        };
        
        if (this.elements.viewElement) {
            this.elements.valueElement = this.elements.viewElement.querySelector('.inline-field-value');
        }
        
        this.init();
    }
    
    init() {
        if (!this.elements.viewElement || !this.elements.editElement || !this.elements.inputElement) {
            console.warn(`Inline[FieldName]Field: Missing elements for field ${this.fieldId}`);
            return;
        }
        
        this.setupEditor();
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    setupEditor() {
        if (!window.inlineFieldEditors) {
            window.inlineFieldEditors = {};
        }
        
        window.inlineFieldEditors[this.fieldId] = new InlineFieldEditor(this.fieldId, {
            formatValue: (value) => this.formatValue(value),
            onSave: (newValue, oldValue, editor) => this.handleSave(newValue, oldValue, editor)
        });
    }
    
    setupEventListeners() {
        // Set up all event listeners
        // - Edit button click
        // - Input/select changes
        // - Any field-specific buttons
    }
    
    updateDisplay() {
        // Update the display value based on current form state
    }
    
    getValue() {
        // Extract value from form inputs
    }
    
    formatValue(value) {
        // Format value for display
    }
    
    async handleSave(newValue, oldValue, editor) {
        // Handle save logic
        // - Extract value
        // - Call TaskFieldSaver.saveField()
        // - Update display on success
    }
}
```

## Data Attribute Strategy

Instead of Blade interpolation in JS, use data attributes:

```blade
<div class="inline-editable-field" 
     data-field-id="{{ $fieldId }}"
     data-task-id="{{ $task->id }}"
     data-no-auto-init="true">
```

Then in JS:
```javascript
const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
const taskId = parseInt(fieldElement.dataset.taskId, 10);
```

## Benefits

1. **Separation of Concerns**: JS logic separated from presentation
2. **Reusability**: Classes can be reused across different contexts
3. **Testability**: Classes can be unit tested
4. **Maintainability**: Changes to field logic only need to be made in one place
5. **Caching**: JS files can be cached separately from HTML
6. **Code Reduction**: ~605 lines of duplicated JS → ~300-400 lines of organized classes
7. **No Blade Syntax in JS**: All data passed via data attributes

## Potential Issues to Address

1. **Blade Syntax in JS**: ✅ Solved by using data attributes
2. **Initialization Timing**: ✅ Classes initialize in `init()` method, called in constructor
3. **Global State**: ✅ `window.inlineFieldEditors` registry maintained
4. **Task ID Extraction**: ✅ Consistent via data attributes
5. **Universe Data**: Need to pass via data attribute or JSON script tag
6. **Coordination with TaskCardEditor**: 
   - Universe add/remove: TaskCardEditor methods exist but may not be used by inline field
   - "Today" button: TaskCardEditor sets to 5pm, inline_deadline sets to current time - need to prevent conflicts
   - Status pill: TaskCardEditor should continue handling this (card-level concern)

## Recommendations

### For TaskCardEditor.js
1. **Remove or update "Today" button handler**: Since inline_deadline has its own handler, TaskCardEditor's may conflict. Either:
   - Remove TaskCardEditor's handler (if inline field handles it)
   - Or make TaskCardEditor's handler only work for non-inline deadline inputs

2. **Universe add/remove**: 
   - If InlineUniversesField will have its own add/remove, TaskCardEditor's methods may become unused
   - Or InlineUniversesField can call TaskCardEditor methods if they're available

3. **Status pill updates**: Keep in TaskCardEditor - this is card-level functionality

### For Field Classes
1. Each field class should be self-contained
2. Can optionally use TaskCardEditor methods if available (with checks)
3. Should handle their own event listeners to avoid conflicts

## File Organization

```
public/js/
├── InlineFieldEditor.js          (existing - core class)
├── TaskFieldSaver.js             (existing - utility)
├── UniverseFieldSaver.js         (existing - utility)
├── TaskCardEditor.js             (existing - may need cleanup)
├── InlineUniversesField.js       (new)
├── InlineEstimatedTimeField.js   (new)
├── InlineRecurringTaskField.js   (new)
├── InlineDeadlineField.js         (new)
├── InlineLogTimeField.js          (new)
└── InlineFieldHelper.js          (new - optional, after Phase 1)
```
