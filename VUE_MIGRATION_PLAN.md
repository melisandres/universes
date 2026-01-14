# Vue Migration Plan: Universes View

## Understanding of the Goal

The goal is to migrate **only the Universes view** (`/universes`) from server-rendered Blade templates to a Vue-powered frontend. This is a focused, incremental migration that will:
- Simplify UI state management (expand/collapse, selection, inline edits)
- Reduce backend complexity by moving rendering logic to Vue
- Keep the rest of the application unchanged (no SPA conversion, no Inertia)
- Maintain all existing functionality while improving maintainability

The Vue component will be mounted on a single route as an isolated frontend surface, receiving data via JSON from Laravel and handling all UI interactions client-side.

---

## Current State Analysis

### Backend (Laravel)
- **Controller**: `UniverseController@index` loads:
  - Root universes (no parent) with recursive children
  - Primary and secondary tasks (filtered: `completed_at IS NULL`)
  - All universes (for parent dropdown)
  - Recurring tasks (for task inline editing)
  - Status options array
- **Data Structure**:
  - Hierarchical universes (parent-child relationships)
  - Tasks linked via `universe_items` polymorphic table
  - Tasks have complex fields: name, description, universes (multi-select with primary), deadline, estimated_time, recurring_task_id
- **Update Endpoints**: 
  - `PUT /universes/{id}` (already returns JSON for AJAX)
  - `PUT /tasks/{id}` (handles task updates)
  - `POST /tasks` (creates new tasks)
  - `POST /tasks/{id}/log` (logs time)

### Frontend (Current JavaScript)
- **Universe Interactions**:
  - Expand/collapse universe edit mode (`universes.js`)
  - Inline editing of universe name, status, parent (`InlineFieldEditor` + `UniverseFieldSaver`)
- **Task Interactions**:
  - Expand/collapse task cards (`TaskCardEditor`)
  - Inline editing of multiple task fields (name, description, universes, deadline, estimated_time, recurring_task_id)
  - Add new tasks via "+ add task" card (`AddTaskCardManager`)
  - Complete/skip/delete tasks (`TaskStatusManager`)
  - Log time (`InlineLogTimeField`)
- **Complex State**:
  - Multiple task cards can be expanded simultaneously
  - Task cards can move between universes when primary universe changes
  - Field editors initialized dynamically for new tasks
  - Session storage for expanded universe state

### UI Components
- Universe cards with view/edit modes
- Task cards with view/edit modes
- Inline editable fields (text, textarea, select, complex multi-select)
- "+ add task" card
- Secondary task references (showing primary universe)

---

## Migration Plan: Phased Approach

### Phase 1: Setup & Read-Only Display
**Goal**: Get Vue mounted and displaying universes/tasks without any interactions.

**Tasks**:
1. Install Vue 3 via CDN (`https://unpkg.com/vue@3/dist/vue.global.js`)
2. Create JSON endpoint: `GET /api/universes` (or modify existing `index` to return JSON when `Accept: application/json` header is present)
3. Create minimal Blade view that mounts Vue component
4. Create Vue component structure (as JavaScript objects, not .vue files):
   - `UniversesView` (main component)
   - `UniverseCard` (universe item, recursive for children)
   - `TaskCard` (task item, view mode only)
   - `SecondaryTaskCard` (read-only reference)
5. Render universe hierarchy (read-only) using existing CSS classes
6. Render tasks under each universe (read-only) using existing CSS classes
7. Match existing CSS classes/structure for visual parity
8. **No inline styles** - all styling via CSS classes following BEM conventions

**Deliverable**: Page loads and displays universes/tasks exactly as before, but rendered by Vue.

**Validation**: Visual comparison with original, no console errors.

---

### Phase 2: Universe Expand/Collapse
**Goal**: Add universe edit mode expand/collapse functionality.

**Tasks**:
1. Add reactive state for expanded universe IDs
2. Toggle universe edit mode on button click
3. Show/hide edit form based on state using CSS classes (e.g., `d-none`)
4. Persist expanded state in sessionStorage (match current behavior)
5. Use CSS classes for show/hide, no inline styles

**Deliverable**: Can expand/collapse universe edit forms.

**Validation**: Universe cards expand/collapse correctly, state persists on page reload.

---

### Phase 3: Universe Inline Editing
**Goal**: Enable editing of universe fields (name, status, parent).

**Tasks**:
1. Create inline editable components for:
   - Universe name (text input)
   - Universe status (select dropdown)
   - Universe parent (select dropdown)
2. Implement save handlers that call `PUT /universes/{id}` with JSON
3. Use `ErrorHandler.js` for error handling
4. Update local state on successful save
5. Handle validation errors from backend via ErrorHandler
6. Update display values after save
7. Use CSS classes for styling, no inline styles

**Deliverable**: Can edit universe name, status, and parent inline.

**Validation**: Changes save correctly, validation errors display, UI updates immediately.

---

### Phase 4: Task Card Expand/Collapse
**Goal**: Add task card expand/collapse functionality.

**Tasks**:
1. Add reactive state for expanded task IDs
2. Toggle task edit mode on task name click
3. Show/hide edit form based on state using CSS classes (e.g., `d-none`)
4. Support multiple expanded task cards simultaneously
5. Use CSS classes for styling, no inline styles

**Deliverable**: Can expand/collapse task cards.

**Validation**: Multiple task cards can be expanded at once, expand/collapse works smoothly.

---

### Phase 5: Task Inline Editing (Simple Fields)
**Goal**: Enable editing of simple task fields (name, description).

**Tasks**:
1. Create inline editable components for:
   - Task name (text input)
   - Task description (textarea)
2. Implement save handlers that call `PUT /tasks/{id}` with JSON
3. Use `ErrorHandler.js` for error handling
4. Update local state on successful save
5. Handle validation errors via ErrorHandler
6. Use CSS classes for styling, no inline styles

**Deliverable**: Can edit task name and description inline.

**Validation**: Changes save correctly, UI updates immediately.

---

### Phase 6: Task Inline Editing (Complex Fields)

**JavaScript Exclusion Roadmap for Phase 6**

**Summary of All JavaScript Files:**

| File | Status | Phase | Reason |
|------|--------|-------|--------|
| `InlineFieldEditor.js` | Excluded | Phase 5 | Vue handles inline editing |
| `UniverseFieldSaver.js` | Excluded | Phase 5 | Vue handles universe editing |
| `TaskCardEditor.js` | Excluded | Phase 5 | Vue handles task cards |
| `InlineUniversesField.js` | **Exclude** | Phase 6 | Vue will handle universe field editing |
| `InlineEstimatedTimeField.js` | **Exclude** | Phase 6 | Vue will handle estimated time field |
| `InlineDeadlineField.js` | **Exclude** | Phase 6 | Vue will handle deadline field |
| `InlineRecurringTaskField.js` | **Exclude** | Phase 6 | Vue will handle recurring task field |
| `TaskFieldInitializer.js` | **Exclude** | Phase 6 | Vue will handle field initialization |
| `AddTaskCard.js` | **Exclude** | Phase 7 | Vue will handle task creation |
| `TaskFieldSaver.js` | Keep | - | Utility, might be used by Vue |
| `TaskStatusManager.js` | Keep | - | Utility, Vue handles status differently |
| `ErrorHandler.js` | Keep | - | Vue components use this |
| `Logger.js` | Keep | - | Utility, no conflicts |
| `TimeHelper.js` | Keep | - | Utility, no conflicts |
| `FieldConstants.js` | Keep | - | Constants only, no conflicts |
| `FieldUtils.js` | Keep | - | Utility functions, no conflicts |
| `DOMUtils.js` | Keep | - | Utility functions, no conflicts |
| `StateManager.js` | Keep | - | State management utility, no conflicts |
| `DependencyManager.js` | Keep | - | Dependency checking, no conflicts |
| `Diagnostics.js` | Keep | - | Development logging only, no conflicts |
| `main.js` | Keep | - | Initialization, safe (only initializes registries) |
| `InlineLogTimeField.js` | Keep | - | Not used in Universes view (no log time feature) |

**Detailed Analysis:**

Before starting Phase 6, the following JavaScript files should be conditionally excluded from loading on the Universes page to prevent conflicts with Vue:

**Files to Exclude for Phase 6:**
1. **`InlineUniversesField.js`** - Handles universe field editing for tasks (Vue will handle this)
2. **`InlineEstimatedTimeField.js`** - Handles estimated time field editing (Vue will handle this)
3. **`InlineDeadlineField.js`** - Handles deadline field editing (Vue will handle this)
4. **`InlineRecurringTaskField.js`** - Handles recurring task field editing (Vue will handle this)
5. **`TaskFieldInitializer.js`** - Initializes all task field classes (Vue will handle initialization)

**Files to Keep (Utilities - No Conflicts):**
- `ErrorHandler.js` - Vue components use this for error handling
- `Logger.js` - Utility, no DOM manipulation
- `TimeHelper.js` - Utility, no DOM manipulation
- `FieldConstants.js` - Constants only, no conflicts
- `FieldUtils.js` - Utility functions, no conflicts
- `DOMUtils.js` - Utility functions, no conflicts
- `StateManager.js` - State management utility, no conflicts
- `DependencyManager.js` - Dependency checking, no conflicts
- `Diagnostics.js` - Development logging only, no conflicts
- `main.js` - Initialization, safe (only initializes registries)

**Files to Evaluate:**
- `TaskFieldSaver.js` - Utility for saving task fields, might be used by Vue or might conflict
- `TaskStatusManager.js` - Handles task status changes, Vue handles this differently but might conflict

**Files Already Excluded:**
- `InlineFieldEditor.js` ✓ (excluded in Phase 5)
- `UniverseFieldSaver.js` ✓ (excluded in Phase 5)
- `TaskCardEditor.js` ✓ (excluded in Phase 5)

**Implementation Note:**
Add conditional loading in `resources/views/layouts/app.blade.php` using the same pattern as Phase 5:
```php
@if(!$isUniversesPage)
<script src="{{ asset('js/InlineUniversesField.js') }}"></script>
<script src="{{ asset('js/InlineEstimatedTimeField.js') }}"></script>
<script src="{{ asset('js/InlineDeadlineField.js') }}"></script>
<script src="{{ asset('js/InlineRecurringTaskField.js') }}"></script>
<script src="{{ asset('js/TaskFieldInitializer.js') }}"></script>
@endif
```

---

**Goal**: Enable editing of complex task fields (universes, deadline, estimated_time, recurring_task_id).

**Tasks**:
1. Create inline editable components for:
   - Universes (multi-select with primary designation)
   - Deadline (date/time picker)
   - Estimated time (number input with unit)
   - Recurring task (select dropdown)
2. Implement save handlers for each field
3. Use `ErrorHandler.js` for error handling
4. Handle universe changes (move task card when primary universe changes)
5. Update display values after save
6. Use CSS classes for styling, no inline styles

**Deliverable**: Can edit all task fields inline.

**Validation**: All fields save correctly, task cards move when primary universe changes.

---

### Phase 7: Task Creation

**JavaScript Exclusion Roadmap for Phase 7**

Before starting Phase 7, the following JavaScript file should be conditionally excluded from loading on the Universes page:

**Files to Exclude for Phase 7:**
1. **`AddTaskCard.js`** - Handles adding new tasks via "+ add task" card (Vue will handle this)

**Note:** This file is already commented out in `resources/views/universes/index.blade.php`, but ensure it's not loaded via the layout or scripts stack.

**Files Already Excluded:**
- All files from Phase 5 and Phase 6 ✓

**Implementation Note:**
Add conditional loading in `resources/views/layouts/app.blade.php` if `AddTaskCard.js` is loaded globally:
```php
@if(!$isUniversesPage)
<script src="{{ asset('js/AddTaskCard.js') }}"></script>
@endif
```

---

### Phase 7: Task Creation

**Goal**: Enable creating new tasks via "+ add task" card.

**Tasks**:
1. Add "+ add task" card component
2. Handle click to create new task via `POST /tasks`
3. Add new task to Vue state after creation
4. Auto-expand new task card into edit mode
5. Auto-focus name field for immediate editing
6. Use `ErrorHandler.js` for error handling
7. Use CSS classes for styling, no inline styles

**Deliverable**: Can create new tasks.

**Validation**: New tasks appear in correct universe, auto-expand, can be edited immediately.

---

### Phase 8: Task Actions
**Goal**: Enable task actions (complete, skip, delete, log time).

**Tasks**:
1. Implement complete task (checkbox) - updates task status
2. Implement skip task (button) - calls skip endpoint
3. Implement delete task (button with confirmation modal) - calls DELETE API, removes from state
4. Implement log time form (time input + notes) - part of expanded task card
5. Implement "Complete & Log" action - combines complete and log
6. Use `ErrorHandler.js` for error handling
7. Update task state after actions
8. Remove task from list when deleted, mark as completed when completed
9. Use CSS classes for styling, no inline styles

**Deliverable**: All task actions work correctly.

**Validation**: All actions update backend and UI correctly.

---

### Phase 9: Polish & Edge Cases
**Goal**: Handle edge cases and match existing UX exactly.

**Tasks**:
1. Handle secondary task references (read-only, show "[see Primary Universe Name]")
2. Handle empty states (no tasks, no universes)
3. Handle error states using ErrorHandler.js
4. Match all existing CSS classes and styling exactly
5. Ensure no inline styles exist (all styling in CSS files)
6. Verify BEM conventions for any new CSS classes
7. Test with large datasets (many universes/tasks)
8. Test nested universe hierarchies
9. Remove old JavaScript files (or conditionally load them only on other pages)
10. Verify visual parity with original implementation

**Deliverable**: Feature-complete Vue implementation matching original behavior.

**Validation**: Comprehensive testing, no regressions.

---

## Technical Decisions

### Where to Mount Vue
**Decision**: Mount Vue on a dedicated container div in `resources/views/universes/index.blade.php`.

```blade
@extends('layouts.app')
@section('content')
<div id="universes-vue-app">
    <!-- Vue will render everything here -->
</div>
<script type="application/json" id="universes-initial-data">
    {!! json_encode($initialData) !!}
</script>
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<script>
    // Mount Vue component with initial data from JSON script tag
</script>
@endsection
```

**Rationale**: 
- Keeps layout/navigation server-rendered
- Isolated to single route
- Easy to pass initial data via JSON script tag

### Data Passing Strategy
**Decision**: **Initial payload via JSON script tag** (not API fetch on mount).

**Approach**:
1. Controller returns Blade view (as before)
2. Blade view includes JSON script tag with all data
3. Vue component reads JSON and initializes
4. Subsequent updates via API calls

**Rationale**:
- Faster initial load (no extra HTTP request)
- Simpler (no loading state needed)
- Matches current pattern (data already loaded server-side)

**Note**: This is a frozen decision - no API fetch on mount.

### Vue Installation
**Decision**: **Vue 3 via CDN** (unpkg.com) for entire migration.

**Approach**:
```blade
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
```

**Rationale**:
- Simplest setup (no build step)
- Fast to implement
- Single view doesn't need complex tooling
- No build configuration required

**Note**: This is a frozen decision - no build tooling will be added.

---

## Implementation Decisions (Frozen)

### Task Cards
- **Expanded View**: Task cards expand to show edit form and log form (no separate side panel)
- **Editing**: All task editing happens in the expanded card view
- **Logging**: Time logging form is part of the expanded task card (right side of edit form)

### Secondary Tasks
- **Display**: Secondary tasks are read-only references showing "[see Primary Universe Name]"
- **Behavior**: Not expandable or editable in Universes view
- **Implementation**: Simple display component with no interaction

### Universe Deletion
- **Flow**: Show confirmation modal → Call DELETE API → Update Vue state on success (no page reload)
- **State Management**: Remove universe from local state immediately after successful deletion
- **Error Handling**: Show error message if deletion fails, keep universe in state

### Task Status Updates
- **Source**: Receive computed status from backend (no client-side computation)
- **Updates**: Status updates automatically when task fields are edited
- **Display**: Use `computed_status` field from API response

### Nested Universe Loading
- **Strategy**: Load all universes upfront (recursive hierarchy loaded server-side)
- **Rationale**: Simpler implementation, matches current behavior, acceptable for typical dataset sizes

### Error Handling
- **Utility**: Use existing `ErrorHandler.js` utility
- **Integration**: Wrap API calls with ErrorHandler methods
- **Display**: Use ErrorHandler's existing error display mechanisms

### Build Tooling
- **Vue Installation**: Vue 3 via CDN (unpkg.com) for entire migration
- **No Build Step**: No npm, Vite, or build tooling required
- **Script Loading**: Load Vue via `<script>` tag in Blade template

### Styling Constraints
- **No Inline Styles**: All styling must live in CSS files - **NEVER use inline `style` attributes**
- **CSS Conventions**: Use BEM (Block Element Modifier) conventions when possible
- **Class Reuse**: Reuse existing CSS classes from `main.css` where applicable
- **New Classes**: When new classes are needed, follow BEM naming: `.block__element--modifier`
- **Vue Class Binding**: Use Vue's `:class` binding with CSS classes only
- **Dynamic Classes**: Use computed properties or reactive state to toggle CSS classes
- **Example**: `:class="{ 'd-none': !isExpanded }"` instead of `:style="{ display: isExpanded ? 'block' : 'none' }"`

---

## Explicit Assumptions

1. **Vue 3 Composition API** will be used (modern, recommended approach)
2. **No state management library** (Pinia/Vuex) - component state + props/emits sufficient
3. **Fetch API** for HTTP requests (no axios needed)
4. **Existing CSS classes** will be reused from `main.css` (no CSS-in-JS)
5. **No inline styles** - all styling in CSS files with BEM conventions
6. **CSRF token** passed via meta tag (already exists in layout)
7. **No authentication changes** - Vue will use same session/auth as Blade
8. **Browser support** matches current requirements (modern browsers)
9. **No TypeScript** - plain JavaScript Vue components for simplicity
10. **Error handling** via existing `ErrorHandler.js` utility
11. **Logging** via existing `Logger.js` utility (if compatible) or console

---

## Data Requirements

### Initial Payload Structure
```json
{
  "universes": [
    {
      "id": 1,
      "name": "Universe Name",
      "status": "in_focus",
      "parent_id": null,
      "children": [
        {
          "id": 2,
          "name": "Child Universe",
          "status": "not_started",
          "parent_id": 1,
          "children": []
        }
      ],
      "primary_tasks": [
        {
          "id": 1,
          "name": "Task Name",
          "description": "Task description",
          "status": "open",
          "computed_status": "open",
          "deadline_at": "2024-01-15T10:00:00Z",
          "estimated_time": 60,
          "recurring_task_id": null,
          "completed_at": null,
          "skipped_at": null,
          "universe_items": [
            {
              "universe_id": 1,
              "is_primary": true
            }
          ]
        }
      ],
      "secondary_tasks": [
        {
          "id": 2,
          "name": "Secondary Task",
          "primary_universe": {
            "id": 3,
            "name": "Other Universe"
          }
        }
      ]
    }
  ],
  "all_universes": [
    {"id": 1, "name": "Universe 1"},
    {"id": 2, "name": "Universe 2"}
  ],
  "statuses": ["not_started", "next_small_steps", "in_focus", "in_orbit", "dormant", "done"],
  "recurring_tasks": [
    {"id": 1, "name": "Daily Standup"}
  ]
}
```

### API Endpoints Needed
- `GET /api/universes` - Get all universes data (or modify existing `index` to accept `Accept: application/json`)
- `PUT /api/universes/{id}` - Update universe (already exists, returns JSON)
- `DELETE /api/universes/{id}` - Delete universe (needs JSON response)
- `PUT /api/tasks/{id}` - Update task (already exists, returns JSON)
- `POST /api/tasks` - Create task (already exists, returns JSON)
- `POST /api/tasks/{id}/log` - Log time (already exists, returns JSON)
- `POST /api/tasks/{id}/complete` - Complete task (may need to create)
- `POST /api/tasks/{id}/skip` - Skip task (may need to create)
- `DELETE /api/tasks/{id}` - Delete task (needs JSON response)

---

## Risk Mitigation

### Risks
1. **Data Synchronization**: Vue state may get out of sync with backend
   - **Mitigation**: Always update local state after successful API calls, handle errors gracefully

2. **Performance**: Large datasets may cause slow rendering
   - **Mitigation**: Start with current approach (all data upfront), optimize later if needed (virtual scrolling, pagination)

3. **CSS Conflicts**: Vue components may not match existing styles
   - **Mitigation**: Reuse existing CSS classes, test visual parity at each phase

4. **Browser Compatibility**: Vue 3 may not work in older browsers
   - **Mitigation**: Check browser support, use polyfills if needed

5. **Migration Complexity**: More complex than expected
   - **Mitigation**: Phased approach allows stopping at any phase, old code remains until migration complete

---

## Success Criteria

1. ✅ Vue renders universes and tasks identically to current Blade view
2. ✅ All interactions work (expand/collapse, inline editing, task creation, actions)
3. ✅ No regressions in functionality
4. ✅ Performance is equal or better than current implementation
5. ✅ Code is more maintainable (clearer state management)
6. ✅ Backend complexity reduced (no complex Blade logic)

---

## Next Steps

1. **Start Phase 1** (setup & read-only display)
2. **Iterate through phases** with validation at each step
3. **Remove old JavaScript** once migration is complete and tested

---

## Implementation Spec Status

**This document is the FROZEN implementation specification.** All decisions have been made and documented above. Implementation should follow this plan exactly.

---

## Notes

- This migration is **isolated** to the Universes view only
- Other views (Today, Tasks, Logs, etc.) remain unchanged
- Old JavaScript files can be conditionally loaded (only on non-Universes pages)
- Vue can coexist with existing JavaScript on other pages
- Migration can be paused/resumed at any phase
- Each phase should be tested before moving to the next

---

## Post-Migration Cleanup: Simplify Inline Editable Components

**Note for later**: Once the old JavaScript (`InlineFieldEditor.js` and related event delegation) is removed or no longer conflicts with Vue components, the inline editable components can be significantly simplified.

### Current Complexity (Due to Old JS Conflicts)

The inline editable components (`InlineEditableField.js`, `InlineEditableSelect.js`, `InlineEditableTextarea.js`) currently include defensive code to prevent conflicts with the old JavaScript:

- Event handlers with `.stop` modifiers to prevent event bubbling to old JS
- Multiple checks in old JavaScript to detect and skip Vue-managed fields
- Defensive checks in `InlineFieldEditor` constructor to prevent creating editors for Vue fields
- Complex Vue detection logic in old JavaScript event delegation

### After Old JS Removal

Once the old JavaScript is removed or fully isolated, we can:

1. **Remove `.stop` event modifiers** - No longer needed to prevent old JS from seeing events
2. **Simplify event handlers** - Remove defensive code that prevents old JS interference
3. **Remove defensive checks** - Clean up all the Vue detection logic in old JavaScript
4. **Simplify component structure** - The two-unit toggle approach (view mode vs edit mode) can be refined without defensive code
5. **Remove workarounds** - Any temporary fixes added to prevent conflicts can be removed

### Files to Review for Simplification

- `public/js/InlineEditableField.js`
- `public/js/InlineEditableSelect.js`
- `public/js/InlineEditableTextarea.js`
- `public/js/InlineFieldEditor.js` (can be removed entirely if not used elsewhere, or simplified if still needed for other views)
