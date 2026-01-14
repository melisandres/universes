# Phase 2 Execution TODO: Universe Expand/Collapse

## Overview
This document breaks Phase 2 into very small, testable steps. **After each step, stop and verify before proceeding to the next step.**

**Goal**: Add universe edit mode expand/collapse functionality.

---

## Step 1: Add Edit Mode Structure to UniverseCard
**Action**: Add the edit mode HTML structure to UniverseCard component (initially hidden).

**Tasks**:
1. Open `public/js/UniverseCard.js`
2. Add edit mode div structure after the view mode div
3. Include placeholder content for now (we'll add form fields in Phase 3)
4. Use CSS class `d-none` to hide it initially
5. Match the structure from the original Blade template

**Structure to add**:
```javascript
<div :id="'universe-edit-' + universe.id" class="universe-edit-mode d-none" :data-universe-id="universe.id">
    <div class="universe-edit-header">
        <button type="button" class="universe-close-edit-btn" :data-universe-id="universe.id" aria-label="Close">×</button>
    </div>
    <!-- Form fields will go here in Phase 3 -->
    <p>Edit mode (form fields coming in Phase 3)</p>
</div>
```

**Verification**:
- ✅ File saved without errors
- ✅ Edit mode div exists in the template (check in browser DevTools)
- ✅ Edit mode is hidden by default (has `d-none` class)
- ✅ Page still displays correctly

**Stop here and verify before proceeding.**

---

## Step 2: Add Edit Toggle Button to View Mode
**Action**: Add the edit toggle button to the universe view mode header.

**Tasks**:
1. In `UniverseCard.js`, find the `universe-name-row` div
2. Add the edit toggle button after the universe name
3. Match the structure from the original Blade template

**Button to add**:
```javascript
<button type="button" class="universe-edit-toggle-btn" :data-universe-id="universe.id" aria-label="Edit universe">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
</button>
```

**Verification**:
- ✅ Edit button appears next to each universe name
- ✅ Button has correct CSS classes
- ✅ SVG icon displays correctly
- ✅ Page still displays correctly

**Stop here and verify before proceeding.**

---

## Step 3: Add Reactive State for Expanded Universes
**Action**: Add reactive state to track which universes are expanded.

**Tasks**:
1. In `resources/views/universes/index.blade.php`, find the Vue app `data()` function
2. Add `expandedUniverseIds` as a reactive array: `expandedUniverseIds: []`
3. Pass this state down to UniversesView component as a prop

**Code to add**:
```javascript
data() {
    return {
        universes: initialData.universes || [],
        allUniverses: initialData.all_universes || [],
        statuses: initialData.statuses || [],
        recurringTasks: initialData.recurring_tasks || [],
        expandedUniverseIds: [],  // Track which universes are expanded
    };
},
template: '<UniversesView :universes="universes" :all-universes="allUniverses" :statuses="statuses" :recurring-tasks="recurringTasks" :expanded-universe-ids="expandedUniverseIds" />'
```

4. Update `UniversesView.js` to accept and pass down the prop

**Verification**:
- ✅ No console errors
- ✅ State is initialized as empty array
- ✅ Prop is passed to UniversesView

**Stop here and verify before proceeding.**

---

## Step 4: Pass Expanded State to UniverseCard
**Action**: Pass expanded state and methods to UniverseCard component.

**Tasks**:
1. In `UniversesView.js`, pass `expandedUniverseIds` to each UniverseCard
2. Also pass a method to toggle expansion (we'll create it in next step)
3. Update UniverseCard props to accept these

**Code to add in UniversesView**:
```javascript
<UniverseCard 
    v-for="universe in universes" 
    :key="universe.id"
    :universe="universe"
    :all-universes="allUniverses"
    :statuses="statuses"
    :recurring-tasks="recurringTasks"
    :expanded-universe-ids="expandedUniverseIds"
    :toggle-expand="toggleUniverseExpand"
/>
```

4. Add `toggleUniverseExpand` method to UniversesView (placeholder for now)

**Verification**:
- ✅ No console errors
- ✅ Props are passed correctly

**Stop here and verify before proceeding.**

---

## Step 5: Create Toggle Method in Main App
**Action**: Create the toggle method in the main Vue app to update expanded state.

**Tasks**:
1. In `resources/views/universes/index.blade.php`, add `methods` to the Vue app
2. Create `toggleUniverseExpand(universeId)` method
3. Method should add/remove universe ID from `expandedUniverseIds` array
4. Pass this method to UniversesView component

**Method to add**:
```javascript
methods: {
    toggleUniverseExpand(universeId) {
        const index = this.expandedUniverseIds.indexOf(universeId);
        if (index > -1) {
            // Remove if already expanded
            this.expandedUniverseIds.splice(index, 1);
        } else {
            // Add if not expanded
            this.expandedUniverseIds.push(universeId);
        }
    }
}
```

5. Pass method to UniversesView: `:toggle-expand="toggleUniverseExpand"`

**Verification**:
- ✅ Method is defined
- ✅ No console errors
- ✅ Can call method manually in console: `app._instance.data.toggleUniverseExpand(1)`

**Stop here and verify before proceeding.**

---

## Step 6: Add Computed Property to Check if Expanded
**Action**: Add computed property in UniverseCard to check if this universe is expanded.

**Tasks**:
1. In `UniverseCard.js`, add `computed` section
2. Add `isExpanded()` computed property that checks if `universe.id` is in `expandedUniverseIds` array

**Code to add**:
```javascript
computed: {
    isExpanded() {
        return this.expandedUniverseIds && this.expandedUniverseIds.includes(this.universe.id);
    }
}
```

**Verification**:
- ✅ Computed property is defined
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 7: Bind Edit Mode Visibility to Expanded State
**Action**: Use `v-if` or `:class` to show/hide edit mode based on expanded state.

**Tasks**:
1. In `UniverseCard.js`, update the edit mode div
2. Use `:class` binding to toggle `d-none` class based on `isExpanded`
3. Also hide view mode when expanded (or use `v-if`/`v-show`)

**Code to update**:
```javascript
// View mode - hide when expanded
<div :id="'universe-view-' + universe.id" 
     class="universe-header" 
     :class="{ 'd-none': isExpanded }"
     ...>

// Edit mode - show when expanded
<div :id="'universe-edit-' + universe.id" 
     class="universe-edit-mode" 
     :class="{ 'd-none': !isExpanded }"
     ...>
```

**Verification**:
- ✅ Edit mode visibility is bound to state
- ✅ No console errors
- ✅ Can manually set expanded state and see edit mode appear (test in console)

**Stop here and verify before proceeding.**

---

## Step 8: Add Click Handler to Edit Toggle Button
**Action**: Add click handler to the edit toggle button to call the toggle method.

**Tasks**:
1. In `UniverseCard.js`, add `@click` handler to the edit toggle button
2. Call the `toggleExpand` method passed as prop
3. Pass the universe ID as argument

**Code to add**:
```javascript
<button type="button" 
        class="universe-edit-toggle-btn" 
        :data-universe-id="universe.id" 
        @click="toggleExpand(universe.id)"
        aria-label="Edit universe">
```

**Verification**:
- ✅ Button click triggers the method
- ✅ Edit mode toggles when button is clicked
- ✅ View mode hides when edit mode shows
- ✅ Can expand and collapse multiple universes independently

**Stop here and verify before proceeding.**

---

## Step 9: Add Click Handler to Close Button
**Action**: Add click handler to the close button (×) in edit mode.

**Tasks**:
1. In `UniverseCard.js`, add `@click` handler to the close button
2. Call the same `toggleExpand` method to collapse

**Code to add**:
```javascript
<button type="button" 
        class="universe-close-edit-btn" 
        :data-universe-id="universe.id" 
        @click="toggleExpand(universe.id)"
        aria-label="Close">×</button>
```

**Verification**:
- ✅ Close button collapses the edit mode
- ✅ View mode reappears when closed
- ✅ Works correctly

**Stop here and verify before proceeding.**

---

## Step 10: Add SessionStorage Persistence
**Action**: Persist expanded universe state in sessionStorage (match current behavior).

**Tasks**:
1. In `resources/views/universes/index.blade.php`, add logic to:
   - Load expanded universe IDs from sessionStorage on mount
   - Save expanded universe IDs to sessionStorage when they change
2. Use Vue's `watch` to watch `expandedUniverseIds` and save to sessionStorage
3. Load from sessionStorage in `mounted()` or `created()` lifecycle hook

**Code to add**:
```javascript
mounted() {
    // Load expanded universe from sessionStorage
    const savedExpanded = sessionStorage.getItem('expandedUniverseIds');
    if (savedExpanded) {
        try {
            const ids = JSON.parse(savedExpanded);
            this.expandedUniverseIds = ids;
        } catch (e) {
            console.error('Error parsing saved expanded universes:', e);
        }
    }
},
watch: {
    expandedUniverseIds: {
        handler(newIds) {
            // Save to sessionStorage
            sessionStorage.setItem('expandedUniverseIds', JSON.stringify(newIds));
        },
        deep: true
    }
}
```

**Verification**:
- ✅ Expanded state persists after page reload
- ✅ Multiple expanded universes are saved and restored
- ✅ SessionStorage contains the correct data

**Stop here and verify before proceeding.**

---

## Step 11: Test Expand/Collapse Functionality
**Action**: Comprehensive testing of expand/collapse functionality.

**Tasks**:
1. Test expanding a universe
2. Test collapsing a universe
3. Test expanding multiple universes simultaneously
4. Test that state persists on page reload
5. Test nested universes (expand parent, then child)
6. Verify CSS classes are applied correctly
7. Verify no console errors

**Test Checklist**:
- ✅ Click edit button → edit mode expands, view mode hides
- ✅ Click close button → edit mode collapses, view mode shows
- ✅ Multiple universes can be expanded at once
- ✅ Expanded state persists after page reload
- ✅ Nested universes work correctly
- ✅ CSS classes toggle correctly (`d-none` added/removed)
- ✅ No console errors
- ✅ Visual appearance matches original behavior

**Verification**:
- ✅ All tests pass
- ✅ Functionality matches original behavior

**Stop here and verify before proceeding.**

---

## Phase 2 Complete!

**Final Verification Checklist**:
- ✅ Edit toggle button appears next to each universe name
- ✅ Clicking edit button expands edit mode
- ✅ Clicking close button collapses edit mode
- ✅ Multiple universes can be expanded simultaneously
- ✅ Expanded state persists in sessionStorage
- ✅ View mode hides when edit mode shows
- ✅ CSS classes used (no inline styles)
- ✅ No console errors
- ✅ Visual appearance matches original

**Next Steps**: Once Phase 2 is verified complete, proceed to Phase 3: Universe Inline Editing.
