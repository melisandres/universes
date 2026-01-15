# Vue Migration Plan: Today View (Frame Only)

## Goal

Build the **Today** view in Vue using the same patterns established in the **Universes** view migration. This first pass focuses only on the **layout frame / bones**:
- Reuse the **Task Card** component used by the Universes view
- Preserve the **Today** layout structure and universe groupings
- **Do not** migrate the Task Detail panel (the Task Card replaces it)
- Render TaskCards in their standard form, but defer wiring of actions and mutations to later phases.

This plan is intentionally scoped to a **basic Vue skeleton** that will be iterated on later.

---

## Scope (Phase 1 Only)

**In scope:**
- Vue mounted on Today route (`/today`)
- Layout structure that matches Today Blade view:
  - Header
  - Main column with visible universe sections
  - "Deadlines from Other Universes" card
  - "Idea Pools" section
  - Logs panel
- Universe areas structured as they appear in Today:
  - Tasks grouped by deadline buckets
  - No-deadline list
  - Secondary task references
- Task rendering uses the **shared Task Card** component

**Out of scope for now:**
- Task Detail side panel
- Inline editing or actions (complete, log, snooze, skip, delete)
- Collapsing groups or universes
- Any CSS refactor or layout redesign
- No event handling for TaskCard actions in TodayView (events may exist but are not yet handled)

---

## Alignment With Universes View Patterns

**Frozen decisions reused from Universes migration:**
- Vue 3 via CDN
- Data passed via JSON script tag in Blade
- No build tooling
- No inline styles (reuse existing CSS classes)
- Use existing error handling utilities when we add interactions later

---

## Current Today Layout (Target Structure)

The Vue layout should mirror these sections in order:
1. Header (`Today`, "+ New Task")
2. Main column:
   - Visible universes (each with deadline groups + no-deadline section + secondary refs)
   - "Deadlines from Other Universes" card
   - "Idea Pools" section
3. Logs panel

**Note:** The Task Detail panel is intentionally omitted.

---

## Data Requirements (Frame Only)

Minimal payload needed to render the frame:
```json
{
  "visible_universes": [
    {
      "id": 1,
      "name": "Universe Name",
      "status": "in_focus",
      "tasks_by_deadline": {
        "overdue": [/* Task objects */],
        "today": [],
        "this_week": [],
        "next_week": [],
        "later": [],
        "no_deadline": []
      },
      "secondary_task_refs": [
        {
          "task": {/* Task object */},
          "primary_universe": {"id": 2, "name": "Other Universe"}
        }
      ]
    }
  ],
  "invisible_deadlines": {
    "overdue": [
      {"task": {/* Task */}, "universe": {"id": 2, "name": "Other Universe"}}
    ],
    "today": [],
    "this_week": [],
    "next_week": [],
    "later": []
  },
  "idea_pools": [
    {
      "id": 10,
      "name": "Pool Name",
      "primary_universe": {"id": 3, "name": "Universe"},
      "ideas": [{"id": 1, "title": "Idea"}]
    }
  ],
  "today_logs": [
    {
      "id": 100,
      "created_at": "2026-01-14T09:12:00Z",
      "minutes": 30,
      "notes": "Notes...",
      "loggable_type": "task",
      "loggable_title": "Task Name"
    }
  ]
}
```

Task objects can reuse the same shape as the Universes view Task Card expects.

---

## Component Map (Frame Only)

**Root**
- `TodayView` (mount point for the page)

**Layout Components**
- `TodayHeader`
- `TodayMainColumn`
- `TodayLogsPanel`

**Main Column Sections**
- `TodayUniverseSection`
  - `TodayUniverseHeader` (read-only, no status update yet)
  - `TodayDeadlineGroup`
    - `TaskCard` (shared component from Universes view)
  - `TodayNoDeadlineGroup`
    - `TaskCard`
  - `TodaySecondaryTaskRefs` (read-only list)
- `InvisibleDeadlinesCard`
  - `TodayDeadlineGroup` (read-only)
- `IdeaPoolsSection`
  - `IdeaPoolCard`

---

## Migration Steps (Frame Only)

### Phase 1: Vue Mount + Skeleton
**Goal:** Vue renders the Today frame with real data, read-only.

**Tasks:**
1. Add Vue mount container in `resources/views/today/index.blade.php`
2. Pass JSON payload via `<script type="application/json">`
3. Create `public/js/TodayView.js` with Vue app and components
4. Render header, main column, and logs panel using existing CSS classes
5. Reuse `TaskCard` component from Universes view (same markup/classes)
6. Ensure no inline styles are introduced

**Deliverable:** Today page renders via Vue with the same structure as the Blade view.

---

## Future Iterations (After Frame)

When the frame is stable, iterate in small steps:
- Add collapse controls for universes and deadline groups
- Add universe status editing and isolate actions
- Add task actions and inline editing
- Add logs panel expand/collapse
- Consider replacing any inline styles embedded in Blade partials

---

## Success Criteria (Phase 1)

- Today layout is rendered by Vue
- Tasks appear within the same universe groupings
- Task Detail panel is not present
- Shared Task Card component is reused
- No regressions in layout or CSS
