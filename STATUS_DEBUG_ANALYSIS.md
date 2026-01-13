# Task Status "Late" Not Showing - Debug Analysis

## The Problem
- Tasks with deadlines in the past are showing as `task-status-open` instead of `task-status-late`
- The form shows `value="late"` in the hidden input, meaning the database HAS the correct status
- But the Blade template is computing `task-status-open`

## Current Flow

### 1. UniverseController@index
```php
Task::updateOverdueStatuses(); // Updates DB
$universes = Universe::with(['primaryTasks', 'secondaryTasks'])->get(); // Loads tasks
```

### 2. updateOverdueStatuses()
- Updates tasks where `deadline_at < today` to `status = 'late'`
- Updates tasks where `status = 'late'` and `deadline_at >= today` to `status = 'open'`

### 3. Tasks Loaded via hasManyThrough
- `Universe::primaryTasks()` uses `hasManyThrough(Task::class, UniverseItem::class)`
- Tasks are loaded with `whereNull('completed_at')` filter

### 4. Blade Template (_task_card.blade.php)
- Computes status from deadline check OR database status
- Uses `$computedStatus` for CSS classes

## Theories Why It's Not Working

### Theory 1: hasManyThrough Not Selecting Status Field
**Likelihood: LOW**
- `hasManyThrough` should select all task columns by default
- The form shows `value="late"` which means `$task->status` IS loaded and IS "late"
- **Evidence**: Form input shows correct value

### Theory 2: Deadline Check Failing
**Likelihood: MEDIUM**
- Deadline is "Jan 10, 2026, 5:00 PM"
- If today is after Jan 10, 2026, `isPast()` should be true
- But maybe:
  - Timezone issues?
  - Date parsing failing?
  - `isToday()` returning true when it shouldn't?
- **Evidence**: Today view works (uses same logic), so deadline check should work

### Theory 3: Status Field Not Updated in DB
**Likelihood: LOW**
- `updateOverdueStatuses()` runs before loading
- Form shows `value="late"` so DB has correct value
- **Evidence**: Form shows correct value

### Theory 4: Stale Model Data / Caching
**Likelihood: MEDIUM**
- Tasks loaded through relationships might have stale data
- `updateOverdueStatuses()` updates DB, but models in memory might be cached
- **Evidence**: Form shows correct value (rendered later), but class is wrong (computed earlier)

### Theory 5: Status Field Not Accessible Through Relationship
**Likelihood: MEDIUM-HIGH**
- When tasks come through `hasManyThrough`, maybe `$task->status` returns null/empty
- But `getRawOriginal('status')` or direct DB query would work
- **Evidence**: Form shows value, but class computation fails

## Most Likely Issue

**Theory 5** - The status field might not be accessible as a property when loaded through `hasManyThrough`, but IS accessible when the form is rendered (maybe because of a refresh or different access method).

## Solution Approach

1. Use `getRawOriginal('status')` or `getAttribute('status')` to get the database value directly
2. Check deadline using same logic as `WeekHelper::isOverdue()`
3. If either says "late", use "late"
4. Otherwise use status or "open"

## Current Implementation

The Blade template now:
- Gets status using `getRawOriginal('status')` first (raw DB value)
- Falls back to `getAttribute('status')` then `$task->status`
- Checks deadline using `isPast() && !isToday()` (same as WeekHelper)
- Uses "late" if deadline check OR database status says "late"
