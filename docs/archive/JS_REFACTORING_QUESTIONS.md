# Questions & Decisions for JS Refactoring

## Questions Identified

### 1. Universe Data Passing
**Question**: How should universe data be passed to `InlineUniversesField.js`?
- **Current**: JSON script tag (`<script type="application/json" id="universes-data-{{ $task->id }}">`)
- **Options**:
  - A) Keep JSON script tag (current approach - works well)
  - B) Use data attribute with JSON string (more complex parsing)
  - C) Fetch via AJAX (adds latency)

**Decision**: ✅ **Option A - Keep JSON script tag**
- Already working
- No parsing complexity
- Data available immediately
- Standard pattern in the codebase

### 2. TaskCardEditor Coordination
**Question**: Should field classes coordinate with TaskCardEditor or be independent?
- **Current**: TaskCardEditor has `addUniverseRow()` and `removeUniverseRow()` methods
- **Options**:
  - A) Field classes are completely independent (duplicate add/remove logic)
  - B) Field classes check for TaskCardEditor and use its methods if available
  - C) Move add/remove logic to field classes, TaskCardEditor uses them

**Decision**: ✅ **Option C - Move logic to field classes**
- Field classes should own their functionality
- TaskCardEditor can call field class methods if needed
- Better separation of concerns
- InlineUniversesField will have its own add/remove methods

### 3. "Today" Button Handler Conflict
**Question**: TaskCardEditor sets deadline to 5pm, inline_deadline sets to current time. How to resolve?
- **Current**: Both try to attach listeners to the same button
- **Options**:
  - A) Remove TaskCardEditor's handler (inline field owns it)
  - B) Make TaskCardEditor's handler only work for non-inline inputs
  - C) Consolidate into one handler with configurable time

**Decision**: ✅ **Option A - Remove TaskCardEditor's handler**
- InlineDeadlineField will handle the "Today" button
- TaskCardEditor can still update status pill after deadline changes
- Simpler ownership model

### 4. Initialization Order
**Question**: What order should classes initialize?
- **Dependencies**:
  - Field classes depend on `InlineFieldEditor`
  - Field classes depend on `TaskFieldSaver`
  - TaskCardEditor may depend on field classes (for status updates)

**Decision**: ✅ **Load order in main.js**:
1. InlineFieldEditor.js (core)
2. TaskFieldSaver.js (utility)
3. UniverseFieldSaver.js (utility)
4. Field-specific classes (InlineUniversesField, etc.)
5. TaskCardEditor.js (may use field classes)
6. Page-specific scripts (today.js, universes.js)

### 5. main.js Structure
**Question**: Should we create a main.js to centralize loading?
- **Benefits**:
  - Ensures proper load order
  - Centralizes initialization
  - Easier to manage dependencies
  - Can add initialization hooks

**Decision**: ✅ **Yes - Create main.js**
- Will handle:
  - Ensuring dependencies are loaded
  - Auto-initialization of field classes (if needed)
  - Providing initialization hooks for page-specific scripts
  - Error handling for missing dependencies

### 6. Data Attributes vs Blade Interpolation
**Question**: How to pass dynamic data (taskId, fieldId) to JS classes?
- **Current**: Blade interpolation in `<script>` tags
- **Options**:
  - A) Data attributes on HTML elements
  - B) JSON script tags
  - C) Global variables

**Decision**: ✅ **Option A - Data attributes**
- No Blade syntax in JS
- Cleaner separation
- Easier to test
- Already using this pattern in some places

### 7. Global State Management
**Question**: Should we keep `window.inlineFieldEditors` registry?
- **Current**: Global registry for field editors
- **Options**:
  - A) Keep global registry (current)
  - B) Use WeakMap for private storage
  - C) No registry, classes manage themselves

**Decision**: ✅ **Option A - Keep global registry**
- Already established pattern
- Useful for debugging
- Allows access from other scripts if needed
- Simple and effective

### 8. Error Handling
**Question**: Should we extract common error handling from TaskFieldSaver/UniverseFieldSaver?
- **Current**: Duplicated error handling in both classes
- **Options**:
  - A) Extract to utility function
  - B) Keep duplicated (simple enough)
  - C) Create base class

**Decision**: ✅ **Option B - Keep for now, extract later if needed**
- Error handling is simple
- Not a priority for Phase 1
- Can refactor in Phase 2 (helper utilities)

### 9. Testing Strategy
**Question**: How should we test each refactored field?
- **Options**:
  - A) Manual testing after each field
  - B) Automated tests (would require test setup)
  - C) Both

**Decision**: ✅ **Option A - Manual testing after each field**
- Faster iteration
- No test infrastructure needed
- Can add automated tests later if needed

### 10. Backward Compatibility
**Question**: Should we maintain backward compatibility during refactoring?
- **Current**: Inline scripts in blade files
- **Options**:
  - A) Replace all at once (bigger risk)
  - B) One field at a time (safer, testable)

**Decision**: ✅ **Option B - One field at a time**
- Lower risk
- Can test each field independently
- Easier to roll back if issues
- Matches our todo list approach

## Implementation Notes

### main.js Structure
```javascript
// main.js
(function() {
    'use strict';
    
    // Ensure dependencies are loaded
    const dependencies = [
        'InlineFieldEditor',
        'TaskFieldSaver',
        'UniverseFieldSaver'
    ];
    
    function checkDependencies() {
        const missing = dependencies.filter(dep => typeof window[dep] === 'undefined');
        if (missing.length > 0) {
            console.error('Missing dependencies:', missing);
            return false;
        }
        return true;
    }
    
    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        if (!checkDependencies()) {
            return;
        }
        
        // Initialize global registry if needed
        if (!window.inlineFieldEditors) {
            window.inlineFieldEditors = {};
        }
        
        // Auto-initialize field classes if they have auto-init capability
        // (Field classes will handle their own initialization)
    });
})();
```

### Data Attribute Pattern
```blade
{{-- In blade template --}}
<div class="inline-editable-field" 
     data-field-id="{{ $fieldId }}"
     data-task-id="{{ $task->id }}"
     data-no-auto-init="true">
```

```javascript
// In JS class
const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
const taskId = parseInt(fieldElement.dataset.taskId, 10);
```

### Field Class Initialization Pattern
```javascript
// In blade template (after field HTML)
<script>
document.addEventListener('DOMContentLoaded', function() {
    const fieldId = '{{ $fieldId }}';
    const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
    if (fieldElement) {
        const config = {
            taskId: parseInt(fieldElement.dataset.taskId, 10),
            // ... other config from data attributes
        };
        new InlineUniversesField(fieldId, config);
    }
});
</script>
```

Or better - use a data attribute for auto-initialization:
```blade
<div class="inline-editable-field" 
     data-field-id="{{ $fieldId }}"
     data-task-id="{{ $task->id }}"
     data-field-type="universes"
     data-no-auto-init="true">
```

```javascript
// In main.js or field class
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-field-type="universes"]').forEach(el => {
        const fieldId = el.dataset.fieldId;
        const config = {
            taskId: parseInt(el.dataset.taskId, 10)
        };
        new InlineUniversesField(fieldId, config);
    });
});
```

## Summary

All questions have been addressed with clear decisions. The refactoring can proceed with:
1. ✅ main.js for centralized loading
2. ✅ Data attributes for configuration
3. ✅ One field at a time approach
4. ✅ Field classes own their functionality
5. ✅ Manual testing after each field
6. ✅ Keep existing patterns (JSON script tags, global registry)
