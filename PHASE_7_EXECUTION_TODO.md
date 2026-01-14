# Phase 7 Execution TODO: Task Creation

## Overview
This document breaks Phase 7 into very small, testable steps. **After each step, stop and verify before proceeding to the next step.**

**Goal**: Enable creating new tasks via "+ add task" card.

**Note**: The "+ add task" card already exists in the template (from Phase 1). We need to make it functional by handling clicks and creating tasks via Vue.

---

## Step 1: Exclude AddTaskCard.js from Universes Page
**Action**: Prevent AddTaskCard.js from loading on the Universes page to avoid conflicts with Vue.

**Tasks**:
1. In `resources/views/layouts/app.blade.php`, check if `AddTaskCard.js` is loaded globally
2. If it is, add conditional loading to exclude it on the Universes page:
```php
@php
    $isUniversesPage = request()->routeIs('universes.index');
@endphp
@if(!$isUniversesPage)
<script src="{{ asset('js/AddTaskCard.js') }}"></script>
@endif
```

**Verification**:
- ✅ AddTaskCard.js is conditionally excluded on Universes page
- ✅ AddTaskCard.js still loads on other pages
- ✅ No console errors on Universes page

**Stop here and verify before proceeding.**

---

## Step 2: Add Click Handler to Add Task Card
**Action**: Add click handler to the "+ add task" card in UniverseCard component.

**Tasks**:
1. In `UniverseCard.js`, add a method `handleAddTaskClick` to the `methods` object
2. Add `@click` handler to the add task card in the template
3. Method should log to console for now (we'll implement creation in next step)

**Code structure**:
```javascript
methods: {
    // ... existing methods ...
    handleAddTaskClick(event) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Add task clicked for universe', this.universe.id);
    }
}
```

**Template update**:
```javascript
<li class="task-item add-task-card" 
    :data-universe-id="universe.id"
    @click="handleAddTaskClick">
    <div class="task-view">
        <span class="add-task-icon">+</span>
        <span class="recurring-icon-placeholder"></span>
        <strong class="task-name add-task-name">add task</strong>
    </div>
</li>
```

**Verification**:
- ✅ Click handler is attached
- ✅ Console log appears when clicking "+ add task"
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 3: Implement Task Creation API Call
**Action**: Create a method to call the task creation API.

**Tasks**:
1. In `UniverseCard.js`, update `handleAddTaskClick` to call the API
2. Use `POST /tasks` endpoint
3. Send required data:
   - `name`: "new task" (default name)
   - `universe_ids[]`: universe.id
   - `primary_universe`: 0 (first universe in array)
   - `status`: "open"
4. Use `ErrorHandler.js` for error handling
5. Log the response for now

**Code structure**:
```javascript
async handleAddTaskClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    if (!csrfToken) {
        if (window.ErrorHandler) {
            ErrorHandler.handleError(new Error('CSRF token not found'));
        } else {
            console.error('CSRF token not found');
        }
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('name', 'new task');
        formData.append('universe_ids[]', this.universe.id.toString());
        formData.append('primary_universe', '0');
        formData.append('status', 'open');
        
        const response = await fetch('/tasks', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: formData
        });
        
        let result;
        if (window.ErrorHandler && ErrorHandler.handleResponse) {
            result = await ErrorHandler.handleResponse(response, {
                defaultMessage: 'Error creating task'
            });
        } else {
            const data = await response.json();
            result = {
                success: response.ok && data.success,
                data: data
            };
            if (!result.success) {
                alert(data.message || 'Error creating task');
            }
        }
        
        if (result.success) {
            console.log('Task created:', result.data);
            // TODO: Add task to Vue state in next step
        }
    } catch (error) {
        if (window.ErrorHandler && ErrorHandler.handleError) {
            ErrorHandler.handleError(error, {
                context: 'creating task',
                showAlert: true
            });
        } else {
            console.error('Error creating task:', error);
            alert('Error: ' + (error.message || 'Error creating task'));
        }
    }
}
```

**Verification**:
- ✅ API call is made when clicking "+ add task"
- ✅ Task is created in database (check via refresh)
- ✅ Response is logged to console
- ✅ Errors are handled gracefully
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 4: Format Task Data for Vue
**Action**: Format the task data from API response to match Vue component structure.

**Tasks**:
1. In `handleAddTaskClick`, after successful creation, format the task data
2. The API returns `result.data.task` with all task fields
3. Format it to match the structure expected by TaskCard component:
   - Include `id`, `name`, `description`, `status`, `computed_status`
   - Include `deadline_at`, `estimated_time`, `recurring_task_id`
   - Include `universe_items` array with `universe_id` and `is_primary`
   - Include `completed_at`, `skipped_at` (null for new tasks)

**Code structure**:
```javascript
if (result.success) {
    const taskData = result.data.task;
    
    // Format task for Vue component
    const formattedTask = {
        id: taskData.id,
        name: taskData.name,
        description: taskData.description || '',
        status: taskData.status || 'open',
        computed_status: taskData.computed_status || 'open',
        deadline_at: taskData.deadline_at || null,
        estimated_time: taskData.estimated_time || null,
        recurring_task_id: taskData.recurring_task_id || null,
        completed_at: taskData.completed_at || null,
        skipped_at: taskData.skipped_at || null,
        universe_items: taskData.universe_items || taskData.universeItems || []
    };
    
    console.log('Formatted task:', formattedTask);
    // TODO: Add to Vue state in next step
}
```

**Verification**:
- ✅ Task data is formatted correctly
- ✅ All required fields are present
- ✅ Data structure matches TaskCard component expectations
- ✅ Console shows formatted task data

**Stop here and verify before proceeding.**

---

## Step 5: Add Task to Vue State
**Action**: Add the newly created task to the universe's primary_tasks array.

**Tasks**:
1. In `UniverseCard.js`, after formatting the task, add it to `this.universe.primary_tasks`
2. Use Vue's reactivity - push to the array
3. The task should appear immediately in the UI

**Code structure**:
```javascript
if (result.success) {
    const taskData = result.data.task;
    
    // Format task for Vue component (from previous step)
    const formattedTask = {
        // ... formatted task data ...
    };
    
    // Add to universe's primary_tasks array
    if (!this.universe.primary_tasks) {
        this.universe.primary_tasks = [];
    }
    this.universe.primary_tasks.push(formattedTask);
    
    // TODO: Auto-expand in next step
}
```

**Verification**:
- ✅ New task appears in the tasks list
- ✅ Task appears after the "+ add task" card
- ✅ Task has correct structure
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 6: Auto-Expand New Task Card
**Action**: Automatically expand the newly created task card into edit mode.

**Tasks**:
1. In `UniverseCard.js`, after adding task to state, emit an event or call a method to expand the task
2. Need to add the task ID to `expandedTaskIds` array
3. Use `toggleTaskExpand` function passed as prop
4. Call it after Vue updates the DOM (use `$nextTick`)

**Code structure**:
```javascript
if (result.success) {
    // ... format and add task ...
    
    // Auto-expand the new task
    this.$nextTick(() => {
        if (this.toggleTaskExpand) {
            this.toggleTaskExpand(formattedTask.id);
        }
    });
    
    // TODO: Auto-focus name field in next step
}
```

**Verification**:
- ✅ New task card automatically expands into edit mode
- ✅ Edit form is visible
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 7: Auto-Focus Name Field
**Action**: Automatically focus the name field in the newly created task for immediate editing.

**Tasks**:
1. In `TaskCard.js`, add a method to focus the name field
2. Use a `ref` or query selector to find the name input
3. Call `focus()` on the input element
4. In `UniverseCard.js`, after expanding, trigger focus on the name field
5. Use `$nextTick` to ensure DOM is ready

**Code structure in TaskCard.js**:
```javascript
methods: {
    // ... existing methods ...
    focusNameField() {
        this.$nextTick(() => {
            const nameInput = this.$el.querySelector('#input-task-name-' + this.task.id);
            if (nameInput) {
                nameInput.focus();
                nameInput.select(); // Select text for easy replacement
            }
        });
    }
}
```

**Code structure in UniverseCard.js**:
```javascript
// After expanding task
this.$nextTick(() => {
    if (this.toggleTaskExpand) {
        this.toggleTaskExpand(formattedTask.id);
        
        // Wait for TaskCard to render, then focus name field
        setTimeout(() => {
            const taskCard = document.querySelector(`[data-task-id="${formattedTask.id}"]`);
            if (taskCard) {
                const nameInput = taskCard.querySelector(`#input-task-name-${formattedTask.id}`);
                if (nameInput) {
                    nameInput.focus();
                    nameInput.select();
                }
            }
        }, 100);
    }
});
```

**Verification**:
- ✅ Name field is automatically focused
- ✅ Text is selected (can type to replace immediately)
- ✅ Cursor is in the name input field
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 8: Add Loading State to Add Task Card
**Action**: Show loading state while task is being created.

**Tasks**:
1. In `UniverseCard.js`, add a data property `isCreatingTask` (or use a map for multiple universes)
2. Set it to `true` when starting creation
3. Set it to `false` when creation completes (success or error)
4. Update the add task card template to show "Creating..." when loading
5. Disable the card during creation (prevent multiple clicks)

**Code structure**:
```javascript
data() {
    return {
        isCreatingTask: false
    };
},
methods: {
    async handleAddTaskClick(event) {
        event.preventDefault();
        event.stopPropagation();
        
        if (this.isCreatingTask) {
            return; // Prevent multiple clicks
        }
        
        this.isCreatingTask = true;
        
        try {
            // ... API call ...
        } finally {
            this.isCreatingTask = false;
        }
    }
}
```

**Template update**:
```javascript
<li class="task-item add-task-card" 
    :data-universe-id="universe.id"
    :class="{ 'creating': isCreatingTask }"
    @click="handleAddTaskClick">
    <div class="task-view">
        <span class="add-task-icon">+</span>
        <span class="recurring-icon-placeholder"></span>
        <strong class="task-name add-task-name">
            {{ isCreatingTask ? 'Creating...' : 'add task' }}
        </strong>
    </div>
</li>
```

**Verification**:
- ✅ Card shows "Creating..." during API call
- ✅ Card is disabled during creation (no multiple clicks)
- ✅ Card returns to normal after creation
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 9: Handle Task Creation Errors
**Action**: Ensure errors are displayed properly and card state is reset.

**Tasks**:
1. Verify error handling in `handleAddTaskClick`
2. Ensure `isCreatingTask` is reset even on error (use `finally` block)
3. Test with network errors (disable network in DevTools)
4. Test with validation errors (if backend returns them)
5. Ensure ErrorHandler displays errors correctly

**Verification**:
- ✅ Network errors are handled gracefully
- ✅ Validation errors are displayed
- ✅ Card state resets on error
- ✅ User can retry after error
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 10: Test Task Creation Flow
**Action**: Comprehensive testing of the entire task creation flow.

**Test Checklist**:
- ✅ Clicking "+ add task" creates a new task
- ✅ Task appears in correct universe
- ✅ Task appears after "+ add task" card
- ✅ Task automatically expands into edit mode
- ✅ Name field is automatically focused
- ✅ Can immediately edit the name
- ✅ Loading state shows during creation
- ✅ Errors are handled gracefully
- ✅ Multiple rapid clicks don't create duplicate tasks
- ✅ Task data structure matches existing tasks
- ✅ No console errors

**Verification**:
- ✅ All tests pass
- ✅ Task creation works correctly
- ✅ UX is smooth and intuitive

**Stop here and verify before proceeding.**

---

## Phase 7 Complete!

**Final Verification Checklist**:
- ✅ "+ add task" card is clickable
- ✅ Clicking creates a new task via API
- ✅ New task appears in correct universe
- ✅ Task automatically expands into edit mode
- ✅ Name field is automatically focused
- ✅ Loading state works correctly
- ✅ Errors are handled gracefully
- ✅ No console errors
- ✅ Visual appearance matches original
- ✅ AddTaskCard.js is excluded from Universes page

**Next Steps**: Once Phase 7 is verified complete, proceed to Phase 8: Task Actions (complete, skip, delete, log time).
