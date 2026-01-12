# Integration Test Checklist

## Overview
This checklist verifies that all inline editable fields work together correctly, with no conflicts, and proper initialization order across all pages.

## Test Pages
- [ ] **Tasks Index Page** (`/tasks`)
- [ ] **Universes Index Page** (`/universes`)

---

## 1. Script Loading & Initialization Order

### Verify Script Load Order (Check Browser DevTools Network Tab)
- [ ] `InlineFieldEditor.js` loads first
- [ ] `TaskFieldSaver.js` loads
- [ ] `UniverseFieldSaver.js` loads
- [ ] `TimeHelper.js` loads
- [ ] `main.js` loads (initializes registries)
- [ ] Field classes load in order:
  - [ ] `InlineUniversesField.js`
  - [ ] `InlineEstimatedTimeField.js`
  - [ ] `InlineRecurringTaskField.js`
  - [ ] `InlineDeadlineField.js`
  - [ ] `InlineLogTimeField.js`
- [ ] `TaskCardEditor.js` loads last
- [ ] No console errors about undefined classes

### Verify Registry Initialization
- [ ] `window.inlineFieldEditors` exists (check in console)
- [ ] `window.taskCardEditors` exists (check in console)
- [ ] `main.js` logs "Initialized" (check console)

---

## 2. Task Card - Basic Functionality

### Expand/Collapse
- [ ] Click task name → edit mode expands
- [ ] Click "×" button → edit mode collapses
- [ ] Multiple task cards can be expanded simultaneously
- [ ] Expanding one card doesn't collapse others

### TaskCardEditor Initialization
- [ ] Each task card has a `TaskCardEditor` instance
- [ ] Check console: `window.taskCardEditors` contains entries for each task
- [ ] No duplicate initializations

---

## 3. Simple Fields (Name, Description)

### Name Field
- [ ] Display shows current task name
- [ ] Pencil icon visible next to label
- [ ] Click pencil → input field appears
- [ ] Label and pencil remain visible in edit mode
- [ ] Change value and click "Save" → saves via AJAX
- [ ] Display updates after save
- [ ] Edit mode closes after save
- [ ] Click pencil again (while in edit mode) → cancels edit

### Description Field
- [ ] Display shows current description (or "No description")
- [ ] Pencil icon visible next to label
- [ ] Click pencil → textarea appears
- [ ] Label and pencil remain visible in edit mode
- [ ] Change value and click "Save" → saves via AJAX
- [ ] Display updates after save
- [ ] Edit mode closes after save
- [ ] Click pencil again (while in edit mode) → cancels edit

---

## 4. Universes Field

### Display
- [ ] Shows "★ Primary, Other" format when multiple universes
- [ ] Shows "★ Primary" when only one universe
- [ ] Shows "None" when no universes

### Edit Mode
- [ ] Click pencil → edit mode opens
- [ ] All current universes shown as rows
- [ ] Primary universe has radio button checked
- [ ] "Add Universe" button visible
- [ ] Each row has "Remove" button

### Add/Remove Universes
- [ ] Click "Add Universe" → new row appears
- [ ] Only one universe added (not duplicate)
- [ ] New row has select dropdown with all universes
- [ ] New row has "Primary" radio button
- [ ] New row has "Remove" button
- [ ] Click "Remove" → row disappears
- [ ] Cannot remove last universe (alert shown)

### Primary Selection
- [ ] Select different primary radio → previous primary unchecked
- [ ] Only one primary can be selected at a time

### Save
- [ ] Click "Save" → saves via AJAX
- [ ] Display updates with new universe list
- [ ] Primary indicator (★) shows correctly
- [ ] Edit mode closes after save

---

## 5. Estimated Time Field

### Display
- [ ] Shows "X hours" or "X minutes" format
- [ ] Shows "Not set" when no estimated time

### Edit Mode
- [ ] Click pencil → edit mode opens
- [ ] Number input visible
- [ ] Hours radio button
- [ ] Minutes radio button
- [ ] Current unit selected

### Unit Conversion
- [ ] Switch from hours to minutes → value converts correctly
- [ ] Switch from minutes to hours → value converts correctly
- [ ] Step attribute updates: 0.25 for hours, 5 for minutes
- [ ] Use arrow buttons on input → steps correctly

### Save
- [ ] Change value and click "Save" → saves via AJAX
- [ ] Display updates with new value and unit
- [ ] Edit mode closes after save

---

## 6. Recurring Task Field

### Display
- [ ] Shows "non-recurring" when no recurring task
- [ ] Shows "recurring instance of [Task Name]" when set
- [ ] No label shown

### Edit Mode
- [ ] Click pencil → edit mode opens
- [ ] Select dropdown visible
- [ ] Current selection shown (or "None" if not set)

### Save
- [ ] Select different recurring task and click "Save" → saves via AJAX
- [ ] Display updates with new text
- [ ] Select "None" and click "Save" → shows "non-recurring"
- [ ] Edit mode closes after save

---

## 7. Deadline Field

### Display
- [ ] Shows "no deadline" when no deadline
- [ ] Shows "deadline: [date]" when deadline set
- [ ] Date formatted correctly
- [ ] No label shown

### Edit Mode
- [ ] Click pencil → edit mode opens
- [ ] Datetime-local input visible
- [ ] "Today" button visible
- [ ] Date picker and "Today" button side-by-side

### Today Button
- [ ] Click "Today" → sets deadline to today at 5:00 PM
- [ ] Input value updates immediately
- [ ] Display updates (if in view mode)

### Date Picker
- [ ] Can select date and time manually
- [ ] Input accepts datetime-local format

### Responsive Layout
- [ ] On screens < 480px: "Today" button appears above date picker
- [ ] No horizontal scroll on 320px screens
- [ ] Date picker text is appropriately sized

### Save
- [ ] Set deadline and click "Save" → saves via AJAX
- [ ] Display updates with new deadline
- [ ] Clear deadline (set to empty) and click "Save" → shows "no deadline"
- [ ] Edit mode closes after save

---

## 8. Log Time Field (Right Card)

### Display
- [ ] Shows "X hours" or "X minutes" format
- [ ] Shows "Not set" when no time logged

### Edit Mode
- [ ] Click pencil → edit mode opens
- [ ] Number input visible
- [ ] Hours radio button
- [ ] Minutes radio button
- [ ] Current unit selected

### Unit Conversion
- [ ] Switch from hours to minutes → value converts correctly
- [ ] Switch from minutes to hours → value converts correctly
- [ ] Step attribute updates: 0.25 for hours, 5 for minutes
- [ ] Use arrow buttons on input → steps correctly

### Save (Display-Only)
- [ ] Change value and click "Save" → updates display only
- [ ] Does NOT save to server
- [ ] Display updates with new value
- [ ] Edit mode closes after save

---

## 9. Conflict Prevention

### TaskCardEditor vs Field Classes
- [ ] "Add Universe" button doesn't trigger duplicate handlers
- [ ] "Today" button doesn't trigger duplicate handlers
- [ ] Log time input doesn't have duplicate event listeners
- [ ] Estimated time input doesn't have duplicate event listeners
- [ ] No console errors about event conflicts

### Multiple Task Cards
- [ ] Each task card has independent field instances
- [ ] Editing one card doesn't affect others
- [ ] All cards can be expanded simultaneously
- [ ] No shared state between cards

---

## 10. Task Actions (Right Card)

### Complete Checkbox
- [ ] Checkbox works independently of inline fields
- [ ] Delay before completing works
- [ ] Status updates correctly

### Delete Button
- [ ] Red styling applied
- [ ] Click → confirmation dialog
- [ ] Delete works correctly

### Log Button
- [ ] Blue styling applied
- [ ] Click → submits log form via AJAX
- [ ] Works independently of inline fields

### Complete & Log Button
- [ ] Text shows "Complete & Log"
- [ ] Click → completes task and logs time
- [ ] Works independently of inline fields

### Log and Complete & Log Buttons
- [ ] Both buttons fit side-by-side
- [ ] Responsive: stack on smaller screens

---

## 11. Universe Card (Universes Page)

### Status Display
- [ ] Shows status in large grey text above name
- [ ] Underscores replaced with spaces (e.g., "in progress")

### Expand/Collapse
- [ ] Pencil icon visible after universe name
- [ ] Click pencil → expanded view opens
- [ ] Click "×" button → expanded view closes
- [ ] Expanded state persists after page reload (for parent_id changes)

### Status Field (Expanded View)
- [ ] Status editable in expanded view
- [ ] Pencil icon next to status label
- [ ] Dropdown shows options with spaces (not underscores)
- [ ] Save → updates display (doesn't collapse)
- [ ] Display updates in non-expanded view

### Name Field
- [ ] Editable in expanded view
- [ ] Save → updates display (doesn't collapse)
- [ ] Display updates in non-expanded view

### Parent Field
- [ ] Shows "no parent" or "child of [parent name]"
- [ ] Editable in expanded view
- [ ] Save → page reloads (to show hierarchy changes)
- [ ] Expanded state restored after reload

---

## 12. Error Handling

### Network Errors
- [ ] Save fails → error message shown
- [ ] Field doesn't update on error
- [ ] Can retry after error

### Validation Errors
- [ ] Server validation errors displayed
- [ ] Field highlights error state
- [ ] Can correct and resave

### Missing Data
- [ ] Fields handle null/empty values gracefully
- [ ] No console errors for missing data
- [ ] Display shows appropriate placeholder text

---

## 13. Performance

### Initialization
- [ ] Page loads without lag
- [ ] No excessive DOM queries
- [ ] Event listeners attached efficiently

### Multiple Cards
- [ ] Page with 10+ task cards loads smoothly
- [ ] No performance degradation with many cards
- [ ] Memory usage reasonable

---

## 14. Browser Compatibility

### Test in Multiple Browsers
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

### Mobile Responsiveness
- [ ] Works on mobile viewport (320px+)
- [ ] Touch interactions work
- [ ] No horizontal scroll
- [ ] Buttons are appropriately sized

---

## 15. Console Checks

### No Errors
- [ ] No JavaScript errors in console
- [ ] No undefined variable errors
- [ ] No duplicate initialization warnings
- [ ] No event listener conflicts

### Expected Logs
- [ ] `main.js: Initialized` appears once
- [ ] No unexpected warnings

---

## Test Results Summary

**Date:** _______________
**Tester:** _______________

**Pages Tested:**
- [ ] Tasks Index Page
- [ ] Universes Index Page

**Overall Status:**
- [ ] ✅ All tests passing
- [ ] ⚠️ Some issues found (see notes below)
- [ ] ❌ Critical issues found

**Issues Found:**
1. 
2. 
3. 

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________
