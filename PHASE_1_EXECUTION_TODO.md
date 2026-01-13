# Phase 1 Execution TODO: Setup & Read-Only Display

## Overview
This document breaks Phase 1 into very small, testable steps. **After each step, stop and verify before proceeding to the next step.**

---

## Step 1: Backup Current View
**Action**: Create a backup of the current `universes/index.blade.php` view.

**Tasks**:
1. Copy `resources/views/universes/index.blade.php` to `resources/views/universes/index.blade.php.backup`

**Verification**:
- ✅ File `index.blade.php.backup` exists
- ✅ Backup file contains the original content
- ✅ Original `index.blade.php` still works (visit `/universes` - should display normally)

**Stop here and verify before proceeding.**

---

## Step 2: Modify Controller to Support JSON Response
**Action**: Update `UniverseController@index` to return JSON when requested with `Accept: application/json` header.

**Tasks**:
1. Open `app/Http/Controllers/UniverseController.php`
2. Modify the `index()` method to check for JSON request
3. If JSON requested, return JSON response with all data
4. If not JSON, return view as before

**Code to add** (after line 47, before `return view(...)`):
```php
// Check if JSON response is requested
if ($request->wantsJson() || $request->expectsJson()) {
    return response()->json([
        'universes' => $this->formatUniversesForJson($universes),
        'all_universes' => $allUniverses->map(fn($u) => ['id' => $u->id, 'name' => $u->name]),
        'statuses' => $statuses,
        'recurring_tasks' => $recurringTasks->map(fn($rt) => ['id' => $rt->id, 'name' => $rt->name]),
    ]);
}
```

4. Add a private method `formatUniversesForJson()` to format the recursive structure (we'll implement this in next step)

**Verification**:
- ✅ Controller file saved without syntax errors
- ✅ Visit `/universes` - should still display normally (HTML view)
- ✅ Check browser console - no errors

**Stop here and verify before proceeding.**

---

## Step 3: Create JSON Formatting Helper Method
**Action**: Add `formatUniversesForJson()` method to format universe hierarchy with tasks.

**Tasks**:
1. In `UniverseController.php`, add private method `formatUniversesForJson($universes)`
2. Method should recursively format universes with their children and tasks
3. Include all necessary task fields for display

**Implementation** (add before `loadChildrenRecursively` method):
```php
private function formatUniversesForJson($universes)
{
    return $universes->map(function ($universe) {
        $data = [
            'id' => $universe->id,
            'name' => $universe->name,
            'status' => $universe->status,
            'parent_id' => $universe->parent_id,
            'children' => $this->formatUniversesForJson($universe->children ?? collect()),
            'primary_tasks' => $this->formatTasksForJson($universe->primaryTasks ?? collect()),
            'secondary_tasks' => $this->formatSecondaryTasksForJson($universe->secondaryTasks ?? collect()),
        ];
        return $data;
    });
}

private function formatTasksForJson($tasks)
{
    return $tasks->map(function ($task) {
        return [
            'id' => $task->id,
            'name' => $task->name,
            'description' => $task->description,
            'status' => $task->status,
            'computed_status' => $task->getComputedStatus(),
            'deadline_at' => $task->deadline_at?->toIso8601String(),
            'estimated_time' => $task->estimated_time,
            'recurring_task_id' => $task->recurring_task_id,
            'completed_at' => $task->completed_at?->toIso8601String(),
            'skipped_at' => $task->skipped_at?->toIso8601String(),
            'universe_items' => $task->universeItems->map(fn($ui) => [
                'universe_id' => $ui->universe_id,
                'is_primary' => $ui->is_primary,
            ]),
        ];
    });
}

private function formatSecondaryTasksForJson($tasks)
{
    return $tasks->map(function ($task) {
        $primaryUniverseItem = $task->universeItems->where('is_primary', true)->first();
        return [
            'id' => $task->id,
            'name' => $task->name,
            'primary_universe' => $primaryUniverseItem ? [
                'id' => $primaryUniverseItem->universe->id,
                'name' => $primaryUniverseItem->universe->name,
            ] : null,
        ];
    });
}
```

**Verification**:
- ✅ No PHP syntax errors (check with `php artisan route:list` or visit page)
- ✅ Visit `/universes` - should still display normally
- ✅ Test JSON endpoint: Open browser console, run:
  ```javascript
  fetch('/universes', { headers: { 'Accept': 'application/json' } })
    .then(r => r.json())
    .then(console.log)
  ```
- ✅ JSON response contains `universes`, `all_universes`, `statuses`, `recurring_tasks`
- ✅ Universe structure includes `children`, `primary_tasks`, `secondary_tasks`

**Stop here and verify before proceeding.**

---

## Step 4: Create Minimal Blade View with Vue Container
**Action**: Replace content section with Vue container and placeholder JSON data script tag.

**Tasks**:
1. Open `resources/views/universes/index.blade.php`
2. Replace the `@section('content')` content with:
   - Keep the `<h1>Universes</h1>` and `<a href="{{ route('universes.create') }}">+ New Universe</a>`
   - Add `<div id="universes-vue-app"></div>` container
   - Add placeholder JSON script tag (we'll populate it in next step)
   - Add Vue CDN script tag
   - Add placeholder Vue mounting script

**New content section**:
```blade
@section('content')
<h1>Universes</h1>

<a href="{{ route('universes.create') }}">+ New Universe</a>

<div id="universes-vue-app">
    <!-- Vue will render here -->
    <p>Loading...</p>
</div>

<script type="application/json" id="universes-initial-data">
{!! json_encode(['universes' => [], 'all_universes' => [], 'statuses' => [], 'recurring_tasks' => []]) !!}
</script>

<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<script>
// Vue mounting will go here
console.log('Vue loaded:', typeof Vue !== 'undefined');
</script>
@endsection
```

3. Remove or comment out the old `@push('scripts')` section (we'll handle this later)

**Verification**:
- ✅ Page loads without errors
- ✅ "Loading..." text appears in the Vue container
- ✅ Browser console shows "Vue loaded: true"
- ✅ JSON script tag exists in page source (View Source, search for "universes-initial-data")
- ✅ Vue CDN script loads (check Network tab)

**Stop here and verify before proceeding.**

---

## Step 5: Prepare Initial Data in Controller
**Action**: Modify controller to prepare JSON data and pass to view.

**Tasks**:
1. In `UniverseController@index`, before `return view(...)`, prepare the initial data:
```php
$initialData = [
    'universes' => $this->formatUniversesForJson($universes),
    'all_universes' => $allUniverses->map(fn($u) => ['id' => $u->id, 'name' => $u->name])->values(),
    'statuses' => $statuses,
    'recurring_tasks' => $recurringTasks->map(fn($rt) => ['id' => $rt->id, 'name' => $rt->name])->values(),
];
```

2. Pass `$initialData` to the view: `compact('universes', 'allUniverses', 'statuses', 'recurringTasks', 'initialData')`

3. Update the Blade view to use `$initialData` in the JSON script tag

**Verification**:
- ✅ Page loads without errors
- ✅ JSON script tag contains valid data
- ✅ In browser console, run: `JSON.parse(document.getElementById('universes-initial-data').textContent)` - should return object with `universes`, `all_universes`, `statuses`, `recurring_tasks`
- ✅ Data structure matches expected format

**Stop here and verify before proceeding.**

---

## Step 6: Create Minimal Vue App
**Action**: Create a minimal Vue app that mounts and displays a test message.

**Tasks**:
1. In the Blade view, replace the placeholder script with:
```javascript
const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            message: 'Vue is working!'
        };
    },
    template: '<div>{{ message }}</div>'
});

app.mount('#universes-vue-app');
```

**Verification**:
- ✅ Page loads without errors
- ✅ "Loading..." text is replaced with "Vue is working!"
- ✅ Browser console shows no Vue errors
- ✅ Vue DevTools (if installed) shows the app mounted

**Stop here and verify before proceeding.**

---

## Step 7: Load Initial Data into Vue
**Action**: Read JSON data from script tag and initialize Vue with it.

**Tasks**:
1. Update Vue app to read initial data:
```javascript
const { createApp } = Vue;

const initialDataEl = document.getElementById('universes-initial-data');
const initialData = initialDataEl ? JSON.parse(initialDataEl.textContent) : {};

const app = createApp({
    data() {
        return {
            universes: initialData.universes || [],
            allUniverses: initialData.all_universes || [],
            statuses: initialData.statuses || [],
            recurringTasks: initialData.recurring_tasks || [],
        };
    },
    template: '<div>Loaded {{ universes.length }} universes</div>'
});

app.mount('#universes-vue-app');
```

**Verification**:
- ✅ Page loads without errors
- ✅ Displays "Loaded X universes" where X is the actual count
- ✅ Browser console shows no errors
- ✅ Check Vue data: In console, `app._instance.data` should show `universes` array with data

**Stop here and verify before proceeding.**

---

## Step 8: Create UniversesView Component Structure
**Action**: Create the main UniversesView component with proper structure.

**Tasks**:
1. Create a new file: `public/js/UniversesView.js`
2. Define the component structure:
```javascript
const UniversesView = {
    props: {
        universes: Array,
        allUniverses: Array,
        statuses: Array,
        recurringTasks: Array,
    },
    template: `
        <div class="universes-container">
            <ul>
                <li v-for="universe in universes" :key="universe.id">
                    {{ universe.name }}
                </li>
            </ul>
        </div>
    `
};
```

3. Update the Blade view to use this component:
```javascript
const { createApp } = Vue;

const initialDataEl = document.getElementById('universes-initial-data');
const initialData = initialDataEl ? JSON.parse(initialDataEl.textContent) : {};

const app = createApp({
    components: {
        UniversesView
    },
    data() {
        return {
            universes: initialData.universes || [],
            allUniverses: initialData.all_universes || [],
            statuses: initialData.statuses || [],
            recurringTasks: initialData.recurring_tasks || [],
        };
    },
    template: '<UniversesView :universes="universes" :all-universes="allUniverses" :statuses="statuses" :recurring-tasks="recurringTasks" />'
});

app.mount('#universes-vue-app');
```

4. Add script tag in Blade view to load `UniversesView.js` before the mounting script

**Verification**:
- ✅ `public/js/UniversesView.js` file exists
- ✅ Page loads without errors
- ✅ Universe names appear in a list
- ✅ Browser console shows no errors
- ✅ Only root universes are shown (no children yet)

**Stop here and verify before proceeding.**

---

## Step 9: Create UniverseCard Component
**Action**: Create UniverseCard component to render individual universe with proper CSS classes.

**Tasks**:
1. Create `public/js/UniverseCard.js`:
```javascript
const UniverseCard = {
    props: {
        universe: Object,
        allUniverses: Array,
        statuses: Array,
        recurringTasks: Array,
    },
    template: `
        <li>
            <div :id="'universe-view-' + universe.id" class="universe-header" 
                 :data-parent-id="universe.parent_id || ''" 
                 :data-universe-id="universe.id">
                <div class="universe-status-display">{{ universe.status.replace(/_/g, ' ') }}</div>
                <div class="universe-name-row">
                    <strong class="universe-name">{{ universe.name }}</strong>
                </div>
            </div>
        </li>
    `
};
```

2. Update `UniversesView.js` to use UniverseCard:
```javascript
const UniversesView = {
    components: {
        UniverseCard
    },
    props: {
        universes: Array,
        allUniverses: Array,
        statuses: Array,
        recurringTasks: Array,
    },
    template: `
        <div class="universes-container">
            <ul>
                <UniverseCard 
                    v-for="universe in universes" 
                    :key="universe.id"
                    :universe="universe"
                    :all-universes="allUniverses"
                    :statuses="statuses"
                    :recurring-tasks="recurringTasks"
                />
            </ul>
        </div>
    `
};
```

3. Add script tag in Blade view to load `UniverseCard.js` before `UniversesView.js`

**Verification**:
- ✅ Both JS files exist
- ✅ Page loads without errors
- ✅ Universe cards display with status and name
- ✅ CSS classes match original (`universe-header`, `universe-status-display`, `universe-name-row`, `universe-name`)
- ✅ Visual appearance matches original (check styling)

**Stop here and verify before proceeding.**

---

## Step 10: Add Recursive Children Rendering
**Action**: Update UniverseCard to recursively render child universes.

**Tasks**:
1. Update `UniverseCard.js` to render children:
```javascript
const UniverseCard = {
    components: {
        UniverseCard  // Self-reference for recursion
    },
    props: {
        universe: Object,
        allUniverses: Array,
        statuses: Array,
        recurringTasks: Array,
    },
    template: `
        <li>
            <div :id="'universe-view-' + universe.id" class="universe-header" 
                 :data-parent-id="universe.parent_id || ''" 
                 :data-universe-id="universe.id">
                <div class="universe-status-display">{{ universe.status.replace(/_/g, ' ') }}</div>
                <div class="universe-name-row">
                    <strong class="universe-name">{{ universe.name }}</strong>
                </div>
            </div>
            <ul v-if="universe.children && universe.children.length > 0">
                <UniverseCard 
                    v-for="child in universe.children" 
                    :key="child.id"
                    :universe="child"
                    :all-universes="allUniverses"
                    :statuses="statuses"
                    :recurring-tasks="recurringTasks"
                />
            </ul>
        </li>
    `
};
```

**Verification**:
- ✅ Page loads without errors
- ✅ Child universes appear nested under their parents
- ✅ Nested structure matches original hierarchy
- ✅ CSS classes are preserved
- ✅ Visual appearance matches original nested structure

**Stop here and verify before proceeding.**

---

## Step 11: Add Tasks List Container
**Action**: Add the tasks list container under each universe.

**Tasks**:
1. Update `UniverseCard.js` to include tasks list:
```javascript
template: `
    <li>
        <div :id="'universe-view-' + universe.id" class="universe-header" 
             :data-parent-id="universe.parent_id || ''" 
             :data-universe-id="universe.id">
            <div class="universe-status-display">{{ universe.status.replace(/_/g, ' ') }}</div>
            <div class="universe-name-row">
                <strong class="universe-name">{{ universe.name }}</strong>
            </div>
        </div>
        <ul v-if="universe.children && universe.children.length > 0">
            <UniverseCard 
                v-for="child in universe.children" 
                :key="child.id"
                :universe="child"
                :all-universes="allUniverses"
                :statuses="statuses"
                :recurring-tasks="recurringTasks"
            />
        </ul>
        <ul class="tasks-list">
            <!-- Tasks will go here -->
        </ul>
    </li>
`
```

**Verification**:
- ✅ Page loads without errors
- ✅ Empty `<ul class="tasks-list">` appears under each universe
- ✅ CSS class `tasks-list` is present
- ✅ Visual structure matches original (tasks list container exists)

**Stop here and verify before proceeding.**

---

## Step 12: Create TaskCard Component (View Mode Only)
**Action**: Create TaskCard component for read-only task display.

**Tasks**:
1. Create `public/js/TaskCard.js`:
```javascript
const TaskCard = {
    props: {
        task: Object,
    },
    computed: {
        computedStatus() {
            return this.task.computed_status || this.task.status || 'open';
        },
        isRecurring() {
            return !!this.task.recurring_task_id;
        },
        isCompleted() {
            return !!this.task.completed_at;
        }
    },
    template: `
        <li :class="['task-item', 'task-status-' + computedStatus, isCompleted ? 'task-completed' : '']">
            <div :id="'task-view-' + task.id" :class="['task-view', 'task-status-' + computedStatus]">
                <input 
                    type="checkbox" 
                    class="complete-task-checkbox" 
                    :data-task-id="task.id"
                    :checked="isCompleted"
                    disabled
                />
                <span v-if="isRecurring" class="recurring-icon" title="Recurring">🔄</span>
                <span v-else class="recurring-icon-placeholder"></span>
                <strong class="task-name task-name-clickable" :data-task-id="task.id">
                    {{ task.name }}
                </strong>
            </div>
        </li>
    `
};
```

**Verification**:
- ✅ `public/js/TaskCard.js` file exists
- ✅ Page loads without errors
- ✅ Component structure is defined (not used yet)

**Stop here and verify before proceeding.**

---

## Step 13: Render Primary Tasks
**Action**: Add primary tasks to UniverseCard using TaskCard component.

**Tasks**:
1. Update `UniverseCard.js` to import and use TaskCard:
```javascript
const UniverseCard = {
    components: {
        UniverseCard,
        TaskCard
    },
    // ... props ...
    template: `
        <li>
            <!-- ... existing universe header ... -->
            <ul class="tasks-list">
                <TaskCard 
                    v-for="task in universe.primary_tasks" 
                    :key="task.id"
                    :task="task"
                />
            </ul>
        </li>
    `
};
```

2. Add script tag in Blade view to load `TaskCard.js` before `UniverseCard.js`

**Verification**:
- ✅ Page loads without errors
- ✅ Primary tasks appear under their universes
- ✅ Task cards have correct CSS classes (`task-item`, `task-view`, `task-status-*`)
- ✅ Checkbox, recurring icon, and task name display correctly
- ✅ Visual appearance matches original task cards

**Stop here and verify before proceeding.**

---

## Step 14: Create SecondaryTaskCard Component
**Action**: Create component for read-only secondary task references.

**Tasks**:
1. Create `public/js/SecondaryTaskCard.js`:
```javascript
const SecondaryTaskCard = {
    props: {
        task: Object,
    },
    template: `
        <li class="task-item secondary-task-item">
            <span class="task-content">
                <em>
                    {{ task.name }}
                    <span v-if="task.primary_universe">
                        [see {{ task.primary_universe.name }}]
                    </span>
                </em>
            </span>
        </li>
    `
};
```

**Verification**:
- ✅ `public/js/SecondaryTaskCard.js` file exists
- ✅ Component structure is defined

**Stop here and verify before proceeding.**

---

## Step 15: Render Secondary Tasks
**Action**: Add secondary tasks to UniverseCard using SecondaryTaskCard component.

**Tasks**:
1. Update `UniverseCard.js` to include SecondaryTaskCard:
```javascript
components: {
    UniverseCard,
    TaskCard,
    SecondaryTaskCard
},
template: `
    <li>
        <!-- ... existing code ... -->
        <ul class="tasks-list">
            <TaskCard 
                v-for="task in universe.primary_tasks" 
                :key="task.id"
                :task="task"
            />
            <SecondaryTaskCard 
                v-for="task in universe.secondary_tasks" 
                :key="task.id"
                :task="task"
            />
        </ul>
    </li>
`
```

2. Add script tag in Blade view to load `SecondaryTaskCard.js`

**Verification**:
- ✅ Page loads without errors
- ✅ Secondary tasks appear under their universes
- ✅ Secondary tasks show "[see Primary Universe Name]" format
- ✅ CSS classes match (`task-item`, `secondary-task-item`, `task-content`)
- ✅ Visual appearance matches original secondary task display

**Stop here and verify before proceeding.**

---

## Step 16: Add "+ Add Task" Card
**Action**: Add the "+ add task" card as the first item in each tasks list.

**Tasks**:
1. Update `UniverseCard.js` template to include add task card:
```javascript
template: `
    <li>
        <!-- ... existing code ... -->
        <ul class="tasks-list">
            <li class="task-item add-task-card" :data-universe-id="universe.id">
                <div class="task-view">
                    <span class="add-task-icon">+</span>
                    <span class="recurring-icon-placeholder"></span>
                    <strong class="task-name add-task-name">add task</strong>
                </div>
            </li>
            <TaskCard 
                v-for="task in universe.primary_tasks" 
                :key="task.id"
                :task="task"
            />
            <SecondaryTaskCard 
                v-for="task in universe.secondary_tasks" 
                :key="task.id"
                :task="task"
            />
        </ul>
    </li>
`
```

**Verification**:
- ✅ Page loads without errors
- ✅ "+ add task" card appears as first item in each tasks list
- ✅ CSS classes match (`task-item`, `add-task-card`, `task-view`, `add-task-icon`, `add-task-name`)
- ✅ Visual appearance matches original "+ add task" card

**Stop here and verify before proceeding.**

---

## Step 17: Final Visual Parity Check
**Action**: Compare Vue-rendered page with original Blade-rendered page.

**Tasks**:
1. Open original view (from backup) in one browser tab
2. Open Vue-rendered view in another tab
3. Compare side-by-side:
   - Universe hierarchy structure
   - Task lists under each universe
   - CSS classes and styling
   - Overall layout

**Checklist**:
- ✅ All universes display in correct hierarchy
- ✅ All primary tasks appear under correct universes
- ✅ All secondary tasks appear with "[see X]" format
- ✅ "+ add task" card appears in each tasks list
- ✅ CSS classes match original exactly
- ✅ Visual styling matches (colors, spacing, fonts)
- ✅ No console errors
- ✅ No missing elements

**Verification**:
- ✅ Visual comparison shows parity
- ✅ Browser console shows no errors
- ✅ All data is displayed correctly

**Stop here and verify before proceeding.**

---

## Step 18: Remove Old Scripts from Blade View
**Action**: Remove old JavaScript includes that are no longer needed for Vue version.

**Tasks**:
1. In `resources/views/universes/index.blade.php`, remove or comment out:
   - `@push('scripts')` section with old scripts
   - Or keep them commented for reference

**Note**: We're keeping the old scripts commented for now, but they won't be executed.

**Verification**:
- ✅ Page still loads and displays correctly
- ✅ No JavaScript errors
- ✅ Vue components still work

**Stop here and verify before proceeding.**

---

## Phase 1 Complete!

**Final Verification Checklist**:
- ✅ Vue 3 loaded via CDN
- ✅ JSON endpoint works (or data passed via script tag)
- ✅ Vue app mounts successfully
- ✅ All universes render in correct hierarchy
- ✅ All primary tasks render under correct universes
- ✅ All secondary tasks render with correct format
- ✅ "+ add task" card appears in each tasks list
- ✅ CSS classes match original exactly
- ✅ Visual appearance matches original
- ✅ No console errors
- ✅ No inline styles used (all styling via CSS classes)

**Next Steps**: Once Phase 1 is verified complete, proceed to Phase 2: Universe Expand/Collapse.
