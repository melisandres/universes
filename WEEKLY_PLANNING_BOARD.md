# Weekly Universe Planning Board

## Overview

The Weekly Universe Planning Board is a special planning view that allows users to visually organize universes by status and relative priority order for the current week. It intentionally flattens the universe hierarchy and does not display parent/child relationships.

## Architecture

### Backend (Laravel)

1. **Database Schema**
   - Added `weekly_order` column (nullable integer) to `universes` table
   - Migration: `2026_01_14_161904_add_weekly_order_to_universes_table.php`

2. **Model**
   - `Universe` model includes `weekly_order` in `$fillable` array

3. **Routes**
   - `GET /universes/weekly-planning` - Display the planning board view
   - `POST /universes/update-weekly-order` - API endpoint to update status and order

4. **Controller Methods**
   - `UniverseController::weeklyPlanning()` - Renders the Blade view with flattened universes
   - `UniverseController::updateWeeklyOrder()` - Handles status and order updates via API

### Frontend (Vue 3 Composition API)

1. **Component**: `WeeklyPlanningBoard.js`
   - Uses Vue 3 Composition API (`setup()` function)
   - Integrates SortableJS for drag-and-drop functionality
   - Single source of truth: `universes` array filtered by status

2. **Drag-and-Drop Library**: SortableJS
   - Mobile support via `forceFallback: true`
   - Animation support (150ms)
   - Cross-zone dragging enabled via `group: 'universes'`

## Weekly Order Calculation

### How `weekly_order` Works

The `weekly_order` field stores a numeric value that represents the relative position of a universe within its status zone. Lower values appear first.

### Calculation Strategy

When a universe is dropped at a specific index within a status zone:

1. **Exclude the dragged item** from the calculation array
2. **Determine target position**:
   - **Empty zone**: Start at `0`
   - **Beginning** (index 0): `max(0, firstItemOrder - 100)`
   - **End** (index >= length): `lastItemOrder + 100`
   - **Between items** (middle): `floor((prevOrder + nextOrder) / 2)`

3. **Ensure spacing**: If calculated order is too close to adjacent items, adjust to maintain at least 1 unit difference

### Example Calculation

Given a status zone with universes at orders: `[0, 100, 200, 300]`

- **Inserting at beginning**: New order = `0 - 100 = -100` → clamped to `0`
- **Inserting between 100 and 200** (at index 2): New order = `floor((100 + 200) / 2) = 150`
- **Inserting at end**: New order = `300 + 100 = 400`

### Normalization

After a successful API update, orders are normalized to keep them clean and sequential:

```javascript
normalizeWeeklyOrders(status) {
    const statusUniverses = getUniversesByStatus(status);
    statusUniverses.forEach((universe, index) => {
        universe.weekly_order = index * 100;
    });
}
```

This ensures:
- Orders stay sequential (0, 100, 200, 300...)
- No gaps or overlaps
- Values don't grow indefinitely
- Easy to insert new items between existing ones

### Why Normalize?

1. **Prevents order value inflation**: Without normalization, orders could grow very large over time
2. **Maintains clean data**: Sequential orders are easier to reason about
3. **Preserves insertion space**: With 100-unit gaps, we can insert up to 99 items between any two items before needing to normalize

## Status Zones

The board displays 6 vertical status zones in this predefined order:

1. `not_started`
2. `next_small_steps`
3. `in_focus`
4. `in_orbit`
5. `dormant`
6. `done`

Each zone:
- Filters universes by status
- Displays them sorted by `weekly_order` (then by name as fallback)
- Shows count of universes in that status
- Supports drag-and-drop within and between zones

## Data Flow

1. **Initial Load**:
   - Controller loads all universes (flattened, ignoring hierarchy)
   - Sorted by status, then `weekly_order`, then name
   - Passed to Vue as JSON via script tag

2. **Drag Operation**:
   - User drags a universe card
   - SortableJS handles DOM manipulation
   - On drop, `onEnd` callback fires

3. **Order Update**:
   - Calculate new `weekly_order` based on drop position
   - Optimistically update local state
   - Send API request to persist changes
   - On success: normalize orders
   - On error: revert optimistic update

4. **Persistence**:
   - `POST /universes/update-weekly-order`
   - Updates both `status` and `weekly_order`
   - Returns updated universe data
   - Frontend updates local state with server response

## UI Features

- **Draggable Cards**: Each universe card has a drag handle (6-dot icon)
- **Visual Feedback**: 
  - Ghost state during drag
  - Chosen state (slight rotation and shadow)
  - Smooth animations
- **Empty States**: Zones show "No universes" when empty
- **Responsive Design**: 
  - Desktop: 6 columns
  - Tablet: 2 columns
  - Mobile: 1 column (stacked)

## CSS Classes

Following BEM conventions where applicable:

- `.weekly-planning-board` - Main container
- `.status-zones-container` - Flex container for zones
- `.status-zone` - Individual status column
- `.status-zone-header` - Zone title and count
- `.status-zone-content` - Scrollable card container
- `.universe-card-small` - Draggable universe card
- `.universe-card-handle` - Drag handle icon
- `.universe-card-ghost` - Ghost state during drag
- `.universe-card-chosen` - Selected state
- `.universe-card-drag` - Active drag state

## Future Enhancements

The data structure supports future features like:
- **Weekly Snapshots**: Save the current state as a snapshot
- **Historical Comparison**: Compare current week to previous weeks
- **Bulk Operations**: Move multiple universes at once
- **Filters**: Filter by universe name or other criteria

## Notes

- **Hierarchy Ignored**: Parent/child relationships are not displayed or considered
- **Per-Status Ordering**: `weekly_order` is scoped to each status, not global
- **Optimistic Updates**: UI updates immediately, reverts on error
- **Mobile Support**: SortableJS fallback mode ensures touch devices work
