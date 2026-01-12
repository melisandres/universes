# Task Card Refactor Plan

## Overview
Refactor `_task_card.blade.php` to:
1. Remove all inline JavaScript
2. Remove all inline CSS
3. Use clean OOP JavaScript class (`TaskCardEditor.js`)
4. Move all styles to `main.css`

## Structure

### JavaScript Architecture
- **File**: `public/js/TaskCardEditor.js` ✅ CREATED
- **Class**: `TaskCardEditor`
- **Initialization**: Auto-initializes on DOMContentLoaded
- **Event Handling**: Uses event delegation where possible
- **State Management**: Instance-based, no global pollution

### CSS Architecture
- **File**: `public/css/main.css`
- **Approach**: Extract all inline styles to semantic CSS classes
- **Naming**: Use BEM-like naming where appropriate

### Blade Architecture
- **File**: `resources/views/tasks/_task_card.blade.php`
- **Approach**: 
  - Remove all `<script>` tags
  - Remove all inline `style` attributes
  - Remove all inline `onchange`, `onclick`, `onsubmit` handlers
  - Use data attributes for JavaScript hooks
  - Use CSS classes for styling

## Implementation Order

### Phase 1: Foundation ✅
- [x] Create OOP JavaScript class structure
- [x] Create todo list with tags

### Phase 2: CSS Extraction
- [ ] Extract all inline styles from view mode
- [ ] Extract all inline styles from edit form
- [ ] Extract all inline styles from two-card layout
- [ ] Create utility classes for common patterns

### Phase 3: JavaScript Migration
- [ ] Remove inline scripts from Blade file
- [ ] Ensure TaskCardEditor handles all functionality
- [ ] Test edit/cancel toggle
- [ ] Test form submission
- [ ] Test all interactive features

### Phase 4: Blade Cleanup
- [ ] Remove all inline event handlers
- [ ] Remove all inline styles
- [ ] Remove all script tags
- [ ] Use data attributes for JavaScript hooks

### Phase 5: Integration Testing
- [ ] Test with universes.js (or replace it)
- [ ] Test all features work together
- [ ] Verify no conflicts

## Key Features to Migrate

### View Mode
- Complete checkbox with delay
- Recurring indicator
- Deadline display
- Status badge
- Skip button
- Eye icon button

### Edit Mode - Left Card
- Form setup with data attributes
- Name + status pill
- Recurring checkbox
- Deadline checkbox
- Estimated time input
- Description textarea
- Deadline input + Today button
- Recurring task dropdown
- Universes selection (add/remove)
- Action buttons (Save, Cancel, Delete)

### Edit Mode - Right Card
- Log form (minutes, notes)

### JavaScript Functions
- Edit/Cancel toggle
- Form submission (AJAX)
- Deadline toggle
- Today button
- Status pill update
- Recurring toggle
- Universe add/remove
- Complete checkbox with delay
- Clear deadline if unchecked

## Data Passing
- Use JSON script tags (keep this approach)
- Parse in TaskCardEditor constructor
- Store in instance properties (not window globals)

## Event Handling Strategy
- Use event delegation for dynamic elements
- Attach listeners in `attachEventListeners()` method
- Cache DOM elements in `cacheElements()` method

## Testing Checklist
- [ ] Edit mode toggle works
- [ ] Form submission returns JSON (not redirect)
- [ ] Deadline checkbox toggles input
- [ ] Today button sets deadline to 5pm
- [ ] Status pill updates based on deadline
- [ ] Recurring checkbox toggles dropdown
- [ ] Universe add/remove works
- [ ] Complete checkbox has delay
- [ ] All styles are in CSS file
- [ ] No inline JavaScript
- [ ] No inline CSS
- [ ] No inline event handlers

