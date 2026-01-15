# Today View Vue Migration - TODO List

## Phase 1: Vue Mount + Skeleton (Frame Only)

### Setup & Data Preparation
- [ ] **1.1** Modify `TodayController@index` to prepare JSON payload for Vue
  - Create `$initialData` array with structure matching migration plan
  - Include: `visible_universes`, `invisible_deadlines`, `idea_pools`, `today_logs`
  - Ensure task objects match format expected by `TaskCard` component
  - Keep existing Blade view data for fallback (or make conditional)

- [ ] **1.2** Update `resources/views/today/index.blade.php` to mount Vue
  - Add Vue mount container: `<div id="today-vue-app">`
  - Add JSON script tag: `<script type="application/json" id="today-initial-data">`
  - Load Vue 3 via CDN: `https://unpkg.com/vue@3/dist/vue.global.prod.js`
  - Load required component scripts (TaskCard, inline editable components)
  - Remove or conditionally hide Task Detail panel (not needed in Vue version)
  - Keep existing CSS classes and structure

### Vue Component Structure
- [ ] **1.3** Create `public/js/TodayView.js` - Main root component
  - Define `TodayView` component object (following UniversesView pattern)
  - Props: `visibleUniverses`, `invisibleDeadlines`, `ideaPools`, `todayLogs`, `statuses`, `recurringTasks`, `allUniverses`
  - Template structure matching Today layout:
    - Header section
    - Main column section
    - Logs panel section
  - Use existing CSS classes (no inline styles)

- [ ] **1.4** Create `TodayHeader` component
  - Display "Today" heading
  - "+ New Task" link (can be static for now)
  - Use existing `.today-header` CSS classes

- [ ] **1.5** Create `TodayMainColumn` component
  - Container for universe sections, invisible deadlines, and idea pools
  - Use existing `.today-main` CSS classes
  - Render child components in order

- [ ] **1.6** Create `TodayUniverseSection` component
  - Props: `universe`, `tasksByDeadline`, `secondaryTaskRefs`
  - Render universe header (read-only, no status editing yet)
  - Render deadline groups (overdue, today, this_week, next_week, later)
  - Render no-deadline tasks section
  - Render secondary task references (read-only list)
  - Use existing `.universe-card` CSS classes

- [ ] **1.7** Create `TodayUniverseHeader` component
  - Display universe name and status (read-only)
  - Collapse button (non-functional for now, just visual)
  - Isolate button (non-functional for now, just visual)
  - "+ Task" link (can be static for now)
  - Use existing `.universe-card-header` CSS classes

- [ ] **1.8** Create `TodayDeadlineGroup` component
  - Props: `groupLabel`, `tasks`, `universeId`
  - Display group header with label and count
  - Toggle button (non-functional for now, just visual)
  - Render `TaskCard` components for each task
  - Use existing `.deadline-group` CSS classes

- [ ] **1.9** Create `TodayNoDeadlineGroup` component
  - Props: `tasks`, `universeId`
  - Display "Tasks" section title
  - Render `TaskCard` components for each task
  - Use existing `.tasks-section` CSS classes

- [ ] **1.10** Create `TodaySecondaryTaskRefs` component
  - Props: `secondaryTaskRefs`
  - Display "Related Tasks" section title
  - Render read-only list of secondary task references
  - Show task name and "[see Primary Universe Name]" text
  - Use existing `.secondary-tasks-section` CSS classes

- [ ] **1.11** Create `InvisibleDeadlinesCard` component
  - Props: `invisibleDeadlines`
  - Display "Deadlines from Other Universes" header
  - Collapse button (non-functional for now, just visual)
  - Render deadline groups (overdue, today, this_week, next_week, later)
  - Each group shows task name, universe name, and deadline
  - Use existing `.invisible-deadlines-card` CSS classes

- [ ] **1.12** Create `IdeaPoolsSection` component
  - Props: `ideaPools`
  - Display "Idea Pools" section title
  - Render `IdeaPoolCard` components
  - Use existing `.idea-pools-section` CSS classes

- [ ] **1.13** Create `IdeaPoolCard` component
  - Props: `ideaPool`
  - Display pool name and primary universe
  - Expand button (non-functional for now, just visual)
  - Display ideas list (read-only pills)
  - "+ Add Idea" link (can be static for now)
  - Use existing `.idea-pool-card` CSS classes

- [ ] **1.14** Create `TodayLogsPanel` component
  - Props: `todayLogs`
  - Display "Today's Logs" header
  - Toggle button (non-functional for now, just visual)
  - Render logs list with time, context, minutes, and notes
  - Use existing `.today-logs-panel` CSS classes

### TaskCard Integration
- [ ] **1.15** Integrate `TaskCard` component from Universes view
  - Ensure TaskCard is loaded before TodayView
  - Pass required props: `task`, `recurringTasks`, `allUniverses`, `expandedTaskIds`, `toggleTaskExpand`
  - TaskCard should render in standard form (view/edit modes)
  - Events from TaskCard may exist but are not handled yet (per migration plan)
  - Use existing task card CSS classes

### Vue App Initialization
- [ ] **1.16** Add Vue app initialization script in `today/index.blade.php`
  - Wait for Vue and all components to load
  - Parse JSON from script tag
  - Create Vue app with TodayView component
  - Mount to `#today-vue-app`
  - Pass initial data as props
  - Handle component references (similar to Universes view pattern)

### Styling & CSS
- [ ] **1.17** Verify all CSS classes are reused from existing stylesheets
  - No new inline styles introduced
  - All styling via CSS classes from `main.css` and inline styles in Blade partials
  - Match existing Today view visual appearance exactly

### Testing & Validation
- [ ] **1.18** Visual comparison with original Blade view
  - Layout matches exactly
  - Universe sections appear in correct order
  - Tasks appear in correct deadline groups
  - Secondary task refs display correctly
  - Invisible deadlines card appears when applicable
  - Idea pools section appears when applicable
  - Logs panel displays correctly

- [ ] **1.19** Verify no console errors
  - Vue mounts successfully
  - All components load without errors
  - No missing prop warnings
  - No missing component warnings

- [ ] **1.20** Verify Task Detail panel is not present
  - Confirm panel is removed or hidden in Vue version
  - Task cards replace the detail panel functionality

---

## Out of Scope for Phase 1 (Future Iterations)

These items are explicitly deferred to later phases:

- [ ] Collapse/expand functionality for universes and deadline groups
- [ ] Universe status editing and isolate actions
- [ ] Task actions (complete, log, snooze, skip, delete)
- [ ] Task inline editing
- [ ] Event handling for TaskCard actions
- [ ] Logs panel expand/collapse
- [ ] CSS refactor or layout redesign
- [ ] Task Detail side panel (intentionally omitted)

---

## Notes

- Follow the same patterns established in Universes view migration
- Reuse TaskCard component exactly as it exists
- All styling via CSS classes, no inline styles
- Data passed via JSON script tag (not API fetch on mount)
- Vue 3 via CDN (no build tooling)
- TaskCard events may exist but are not handled in Phase 1
