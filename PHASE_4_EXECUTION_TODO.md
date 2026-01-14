# Phase 4 Execution TODO: Task Card Expand/Collapse

## Overview
This document breaks Phase 4 into very small, testable steps. **After each step, stop and verify before proceeding to the next step.**

**Goal**: Add task card expand/collapse functionality so users can toggle between view and edit modes.

---

## Step 1: Add Reactive State for Expanded Task IDs
**Action**: Add state management for tracking which task cards are expanded.

**Tasks**:
1. In `resources/views/universes/index.blade.php`, add `expandedTaskIds: []` to the main Vue app's `data()` function
2. Add a method `toggleTaskExpand(taskId)` similar to `toggleUniverseExpand`
3. Pass `expandedTaskIds` and `toggleTaskExpand` as props to `UniversesView`

**Code structure**:
```javascript
data() {
    return {
        // ... existing data ...
        expandedTaskIds: [],
    };
},
methods: {
    // ... existing methods ...
    toggleTaskExpand(taskId) {
        const index = this.expandedTaskIds.indexOf(taskId);
        if (index > -1) {
            this.expandedTaskIds.splice(index, 1);
        } else {
            this.expandedTaskIds.push(taskId);
        }
    }
},
template: '<UniversesView ... :expanded-task-ids="expandedTaskIds" :toggle-task-expand="toggleTaskExpand" />'
```

**Verification**:
- ✅ `expandedTaskIds` is defined in data
- ✅ `toggleTaskExpand` method exists
- ✅ Props are passed to UniversesView
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 2: Pass Expanded State to UniverseCard
**Action**: Pass expanded task state down through the component hierarchy.

**Tasks**:
1. In `UniversesView.js`, add props:
   - `expandedTaskIds: Array`
   - `toggleTaskExpand: Function`
2. Pass these props to `UniverseCard` components

**Code structure**:
```javascript
props: {
    // ... existing props ...
    expandedTaskIds: Array,
    toggleTaskExpand: Function,
},
template: `
    <UniverseCard 
        ...
        :expanded-task-ids="expandedTaskIds"
        :toggle-task-expand="toggleTaskExpand"
    />
`
```

**Verification**:
- ✅ Props are defined in UniversesView
- ✅ Props are passed to UniverseCard
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 3: Pass Expanded State to TaskCard
**Action**: Pass expanded task state from UniverseCard to TaskCard.

**Tasks**:
1. In `UniverseCard.js`, add props:
   - `expandedTaskIds: Array`
   - `toggleTaskExpand: Function`
2. Pass these props to `TaskCard` components in the template

**Code structure**:
```javascript
props: {
    // ... existing props ...
    expandedTaskIds: Array,
    toggleTaskExpand: Function,
},
template: `
    <TaskCard 
        v-for="task in universe.primary_tasks" 
        :key="task.id"
        :task="task"
        :expanded-task-ids="expandedTaskIds"
        :toggle-task-expand="toggleTaskExpand"
    />
`
```

**Verification**:
- ✅ Props are defined in UniverseCard
- ✅ Props are passed to TaskCard
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 4: Add Computed Property for Task Expansion State
**Action**: Add a computed property in TaskCard to check if the task is expanded.

**Tasks**:
1. In `TaskCard.js`, add props:
   - `expandedTaskIds: Array`
   - `toggleTaskExpand: Function`
2. Add computed property `isExpanded` that checks if `task.id` is in `expandedTaskIds`

**Code structure**:
```javascript
props: {
    task: Object,
    expandedTaskIds: Array,
    toggleTaskExpand: Function,
},
computed: {
    isExpanded() {
        return this.expandedTaskIds && this.expandedTaskIds.includes(this.task.id);
    }
},
```

**Verification**:
- ✅ Props are defined
- ✅ Computed property `isExpanded` exists
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 5: Add Edit Mode Structure to TaskCard Template
**Action**: Add the edit mode HTML structure to TaskCard template.

**Tasks**:
1. In `TaskCard.js`, add edit mode div after the view mode div
2. Structure should match the existing Blade template:
   - Edit mode container with `task-edit-mode` class
   - Edit header with close button
   - Placeholder content for now (we'll add fields in Phase 5)

**Code structure**:
```javascript
template: `
    <li :class="['task-item', 'task-status-' + computedStatus, isCompleted ? 'task-completed' : '']">
        <!-- View Mode -->
        <div :id="'task-view-' + task.id" 
             :class="['task-view', 'task-status-' + computedStatus]"
             :class="{ 'd-none': isExpanded }">
            <!-- existing view content -->
        </div>
        
        <!-- Edit Mode -->
        <div :id="'task-edit-' + task.id" 
             class="task-edit-mode" 
             :class="{ 'd-none': !isExpanded }"
             :data-task-id="task.id">
            <div class="task-edit-header">
                <button type="button" 
                        class="task-close-edit-btn" 
                        :data-task-id="task.id" 
                        @click="toggleTaskExpand(task.id)"
                        aria-label="Close">×</button>
            </div>
            <div class="task-edit-cards-container">
                <div class="task-edit-card">
                    <p>Edit mode (fields coming in Phase 5)</p>
                </div>
            </div>
        </div>
    </li>
`
```

**Verification**:
- ✅ Edit mode structure exists in template
- ✅ View mode hides when expanded (`d-none` when `isExpanded`)
- ✅ Edit mode shows when expanded (`d-none` when `!isExpanded`)
- ✅ Close button exists
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 6: Add Click Handler to Task Name
**Action**: Make the task name clickable to toggle edit mode.

**Tasks**:
1. In `TaskCard.js`, add `@click` handler to the task name element
2. Handler should call `toggleTaskExpand(task.id)`
3. Add `event.preventDefault()` and `event.stopPropagation()` to prevent unwanted behavior

**Code structure**:
```javascript
<strong class="task-name task-name-clickable" 
        :data-task-id="task.id"
        @click="handleTaskNameClick">
    {{ task.name }}
</strong>

methods: {
    handleTaskNameClick(event) {
        event.preventDefault();
        event.stopPropagation();
        this.toggleTaskExpand(this.task.id);
    }
}
```

**Verification**:
- ✅ Task name is clickable
- ✅ Clicking task name toggles edit mode
- ✅ View mode hides when expanded
- ✅ Edit mode shows when expanded
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 7: Add SessionStorage Persistence for Expanded Tasks
**Action**: Persist expanded task IDs across page reloads.

**Tasks**:
1. In `resources/views/universes/index.blade.php`, add `mounted()` hook to load `expandedTaskIds` from sessionStorage
2. Add `watch` for `expandedTaskIds` to save to sessionStorage

**Code structure**:
```javascript
mounted() {
    // Load expanded universe IDs
    const savedExpanded = sessionStorage.getItem('expandedUniverseIds');
    if (savedExpanded) {
        try {
            const ids = JSON.parse(savedExpanded);
            this.expandedUniverseIds = ids;
        } catch (e) {
            console.error('Error parsing saved expanded universes:', e);
        }
    }
    
    // Load expanded task IDs
    const savedExpandedTasks = sessionStorage.getItem('expandedTaskIds');
    if (savedExpandedTasks) {
        try {
            const ids = JSON.parse(savedExpandedTasks);
            this.expandedTaskIds = ids;
        } catch (e) {
            console.error('Error parsing saved expanded tasks:', e);
        }
    }
},
watch: {
    expandedUniverseIds: {
        handler(newIds) {
            sessionStorage.setItem('expandedUniverseIds', JSON.stringify(newIds));
        },
        deep: true
    },
    expandedTaskIds: {
        handler(newIds) {
            sessionStorage.setItem('expandedTaskIds', JSON.stringify(newIds));
        },
        deep: true
    }
},
```

**Verification**:
- ✅ Expanded tasks persist after page reload
- ✅ Expanded universes still persist (regression test)
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 8: Test Multiple Task Cards Expanded Simultaneously
**Action**: Verify that multiple task cards can be expanded at once.

**Tasks**:
1. Test expanding multiple task cards in the same universe
2. Test expanding task cards in different universes
3. Test collapsing individual task cards
4. Verify that expanding one task doesn't collapse others

**Test Checklist**:
- ✅ Can expand task card 1
- ✅ Can expand task card 2 while task card 1 is expanded
- ✅ Can expand task card 3 while task cards 1 and 2 are expanded
- ✅ Can collapse task card 1 without affecting task cards 2 and 3
- ✅ All expanded states persist after page reload
- ✅ No console errors

**Verification**:
- ✅ All tests pass
- ✅ Multiple task cards can be expanded simultaneously
- ✅ Each task card's expand/collapse is independent

**Stop here and verify before proceeding.**

---

## Step 9: Test Expand/Collapse Visual Transitions
**Action**: Verify that expand/collapse transitions work smoothly.

**Tasks**:
1. Test clicking task name to expand
2. Test clicking close button (×) to collapse
3. Test clicking task name again to collapse (toggle behavior)
4. Verify CSS classes are applied correctly (`d-none` toggles)
5. Verify no visual glitches or layout shifts

**Test Checklist**:
- ✅ Clicking task name expands the card smoothly
- ✅ Clicking close button collapses the card smoothly
- ✅ Clicking task name again collapses the card (toggle)
- ✅ View mode hides when expanded
- ✅ Edit mode shows when expanded
- ✅ No layout shifts or visual glitches
- ✅ CSS classes toggle correctly

**Verification**:
- ✅ All visual transitions work smoothly
- ✅ No layout issues
- ✅ Toggle behavior works correctly

**Stop here and verify before proceeding.**

---

## Step 10: Final Integration Test
**Action**: Comprehensive testing of task card expand/collapse with universe expand/collapse.

**Tasks**:
1. Test expanding a universe (should work as before)
2. Test expanding a task card within an expanded universe
3. Test expanding a task card within a collapsed universe
4. Test expanding multiple universes and multiple tasks
5. Test that universe and task expand states are independent

**Test Checklist**:
- ✅ Universe expand/collapse still works
- ✅ Task expand/collapse works within expanded universe
- ✅ Task expand/collapse works within collapsed universe
- ✅ Can expand multiple universes and multiple tasks simultaneously
- ✅ Universe and task expand states are independent
- ✅ All states persist after page reload
- ✅ No console errors
- ✅ No visual issues

**Verification**:
- ✅ All integration tests pass
- ✅ Universe and task expand/collapse work independently
- ✅ No regressions in existing functionality

**Stop here and verify before proceeding.**

---

## Phase 4 Complete!

**Final Verification Checklist**:
- ✅ Task cards can be expanded by clicking task name
- ✅ Task cards can be collapsed by clicking close button or task name again
- ✅ Multiple task cards can be expanded simultaneously
- ✅ Expand/collapse state persists across page reloads
- ✅ Universe and task expand states work independently
- ✅ CSS classes used (no inline styles)
- ✅ No console errors
- ✅ Visual transitions are smooth

**Next Steps**: Once Phase 4 is verified complete, proceed to Phase 5: Task Inline Editing (Simple Fields).
