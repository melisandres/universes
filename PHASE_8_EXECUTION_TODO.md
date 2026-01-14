# Phase 8 Execution TODO: Task Actions

## Overview
This document breaks Phase 8 into very small, testable steps. **After each step, stop and verify before proceeding to the next step.**

**Goal**: Enable task actions (complete, skip, delete, log time) in the Vue task cards.

**Note**: These actions are currently handled by old JavaScript. We need to implement them in Vue components.

---

## Step 1: Implement Complete Task Checkbox
**Action**: Make the complete checkbox in view mode functional.

**Tasks**:
1. In `TaskCard.js`, add a method `handleCompleteTask` to the `methods` object
2. Add `@change` handler to the checkbox in view mode
3. Method should call `POST /tasks/{id}/complete` endpoint
4. On success, update local task state (`completed_at`, `status`)
5. Use `ErrorHandler.js` for error handling

**Code structure**:
```javascript
methods: {
    // ... existing methods ...
    async handleCompleteTask(event) {
        const checked = event.target.checked;
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
            const response = await fetch(`/tasks/${this.task.id}/complete`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });
            
            let result;
            if (window.ErrorHandler && ErrorHandler.handleResponse) {
                result = await ErrorHandler.handleResponse(response, {
                    defaultMessage: 'Error completing task'
                });
            } else {
                const data = await response.json();
                result = {
                    success: response.ok && data.success,
                    data: data
                };
                if (!result.success) {
                    alert(data.message || 'Error completing task');
                }
            }
            
            if (result.success) {
                // Update local task state
                this.task.completed_at = checked ? new Date().toISOString() : null;
                this.task.status = checked ? 'completed' : 'open';
                // Emit event to update parent
                this.$emit('task-updated', {
                    id: this.task.id,
                    completed_at: this.task.completed_at,
                    status: this.task.status
                });
            } else {
                // Revert checkbox state on error
                event.target.checked = !checked;
            }
        } catch (error) {
            // Revert checkbox state on error
            event.target.checked = !checked;
            if (window.ErrorHandler && ErrorHandler.handleError) {
                ErrorHandler.handleError(error, {
                    context: 'completing task',
                    showAlert: true
                });
            } else {
                console.error('Error completing task:', error);
                alert('Error: ' + (error.message || 'Error completing task'));
            }
        }
    }
}
```

**Template update**:
```javascript
<input 
    type="checkbox" 
    class="complete-task-checkbox" 
    :data-task-id="task.id"
    :checked="isCompleted"
    @change="handleCompleteTask"
/>
```

**Verification**:
- ✅ Checkbox is clickable
- ✅ Clicking checkbox calls API
- ✅ Task is marked as completed in database
- ✅ Task state updates in UI
- ✅ Unchecking works (if supported by backend)
- ✅ Errors are handled gracefully
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 2: Add Skip Task Button
**Action**: Add skip button to edit mode and implement skip functionality.

**Tasks**:
1. In `TaskCard.js`, add a method `handleSkipTask` to the `methods` object
2. Add skip button to the edit mode template (in the task-action-buttons section)
3. Method should call `POST /tasks/{id}/skip` endpoint
4. On success, update local task state (`skipped_at`, `status`)
5. Handle recurring tasks (backend creates next instance automatically)

**Code structure**:
```javascript
async handleSkipTask() {
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
        const response = await fetch(`/tasks/${this.task.id}/skip`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            }
        });
        
        let result;
        if (window.ErrorHandler && ErrorHandler.handleResponse) {
            result = await ErrorHandler.handleResponse(response, {
                defaultMessage: 'Error skipping task'
            });
        } else {
            const data = await response.json();
            result = {
                success: response.ok && data.success,
                data: data
            };
            if (!result.success) {
                alert(data.message || 'Error skipping task');
            }
        }
        
        if (result.success) {
            // Update local task state
            this.task.skipped_at = new Date().toISOString();
            this.task.status = 'skipped';
            // Emit event to update parent
            this.$emit('task-updated', {
                id: this.task.id,
                skipped_at: this.task.skipped_at,
                status: this.task.status
            });
            // Close edit mode after skipping
            if (this.toggleTaskExpand) {
                this.toggleTaskExpand(this.task.id);
            }
        }
    } catch (error) {
        if (window.ErrorHandler && ErrorHandler.handleError) {
            ErrorHandler.handleError(error, {
                context: 'skipping task',
                showAlert: true
            });
        } else {
            console.error('Error skipping task:', error);
            alert('Error: ' + (error.message || 'Error skipping task'));
        }
    }
}
```

**Template update** (add to task-action-buttons section):
```javascript
<div class="task-action-buttons">
    <button type="button" 
            class="skip-task-btn" 
            :data-task-id="task.id"
            @click="handleSkipTask">
        Skip
    </button>
    <!-- Delete button will be added in next step -->
</div>
```

**Verification**:
- ✅ Skip button appears in edit mode
- ✅ Clicking skip button calls API
- ✅ Task is marked as skipped in database
- ✅ Task state updates in UI
- ✅ Edit mode closes after skipping
- ✅ Recurring tasks create next instance (verify in database)
- ✅ Errors are handled gracefully
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 3: Add Delete Task Button
**Action**: Add delete button with confirmation modal.

**Tasks**:
1. In `TaskCard.js`, add a method `handleDeleteTask` to the `methods` object
2. Add delete button to the edit mode template
3. Method should show confirmation dialog before deleting
4. On confirm, call `DELETE /tasks/{id}` endpoint
5. On success, emit event to remove task from parent state
6. Parent should remove task from `primary_tasks` array

**Code structure**:
```javascript
async handleDeleteTask() {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
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
        const response = await fetch(`/tasks/${this.task.id}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            }
        });
        
        let result;
        if (window.ErrorHandler && ErrorHandler.handleResponse) {
            result = await ErrorHandler.handleResponse(response, {
                defaultMessage: 'Error deleting task'
            });
        } else {
            const data = await response.json();
            result = {
                success: response.ok && data.success,
                data: data
            };
            if (!result.success) {
                alert(data.message || 'Error deleting task');
            }
        }
        
        if (result.success) {
            // Emit event to remove task from parent
            this.$emit('task-deleted', this.task.id);
        }
    } catch (error) {
        if (window.ErrorHandler && ErrorHandler.handleError) {
            ErrorHandler.handleError(error, {
                context: 'deleting task',
                showAlert: true
            });
        } else {
            console.error('Error deleting task:', error);
            alert('Error: ' + (error.message || 'Error deleting task'));
        }
    }
}
```

**Template update**:
```javascript
<div class="task-action-buttons">
    <button type="button" 
            class="skip-task-btn" 
            :data-task-id="task.id"
            @click="handleSkipTask">
        Skip
    </button>
    <button type="button" 
            class="delete-task-btn" 
            :data-task-id="task.id"
            @click="handleDeleteTask">
        Delete
    </button>
</div>
```

**Handle task-deleted event in UniverseCard**:
```javascript
handleTaskDeleted(taskId) {
    // Remove task from universe.primary_tasks array
    if (this.universe.primary_tasks) {
        const index = this.universe.primary_tasks.findIndex(t => t.id === taskId);
        if (index > -1) {
            this.universe.primary_tasks.splice(index, 1);
        }
    }
}
```

**Template update in UniverseCard**:
```javascript
<TaskCard 
    v-for="task in universe.primary_tasks" 
    :key="task.id"
    :task="task"
    ...
    @task-deleted="handleTaskDeleted"
/>
```

**Verification**:
- ✅ Delete button appears in edit mode
- ✅ Clicking delete shows confirmation dialog
- ✅ Canceling confirmation does nothing
- ✅ Confirming delete calls API
- ✅ Task is deleted from database
- ✅ Task is removed from UI immediately
- ✅ Errors are handled gracefully
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 4: Add Log Time Form (Right Card)
**Action**: Add log time form to the right card in edit mode.

**Tasks**:
1. In `TaskCard.js` template, add the log form as a second `task-edit-card` div
2. Form should have:
   - Time input (number) with unit selector (hours/minutes)
   - Notes textarea
   - "Log" submit button
   - "Complete & Log" button
3. Use CSS classes: `task-log-form`, `log-form-field`, `log-form-label`, `log-form-input`, `log-form-textarea`, `log-form-submit-btn`, `complete-and-log-btn`

**Template structure**:
```javascript
<!-- Right Card: Log Form -->
<div class="task-edit-card">
    <form class="task-log-form" @submit.prevent="handleLogTime">
        <div class="log-form-field">
            <label class="log-form-label">Time:</label>
            <div class="log-form-input-container">
                <input 
                    type="number" 
                    name="minutes" 
                    :id="'log-minutes-' + task.id"
                    v-model="logTime"
                    min="0" 
                    step="0.25"
                    placeholder="Optional" 
                    class="log-form-input"
                >
                <div class="log-form-radio-group">
                    <label class="log-form-radio-label">
                        <input 
                            type="radio" 
                            name="time_unit" 
                            value="minutes" 
                            :id="'log-time-unit-minutes-' + task.id"
                            v-model="logTimeUnit"
                        >
                        <span>Minutes</span>
                    </label>
                    <label class="log-form-radio-label">
                        <input 
                            type="radio" 
                            name="time_unit" 
                            value="hours" 
                            :id="'log-time-unit-hours-' + task.id"
                            v-model="logTimeUnit"
                        >
                        <span>Hours</span>
                    </label>
                </div>
            </div>
        </div>
        <div class="log-form-field">
            <label class="log-form-label">Notes:</label>
            <textarea 
                name="notes" 
                rows="4" 
                placeholder="Optional" 
                class="log-form-textarea"
                v-model="logNotes"
            ></textarea>
        </div>
        <div class="log-form-actions">
            <button type="submit" class="log-form-submit-btn">Log</button>
            <button type="button" class="complete-and-log-btn" @click="handleCompleteAndLog">Complete & Log</button>
        </div>
    </form>
</div>
```

**Add data properties**:
```javascript
data() {
    return {
        logTime: '',
        logTimeUnit: 'hours',
        logNotes: ''
    };
}
```

**Verification**:
- ✅ Log form appears in right card in edit mode
- ✅ Time input and unit selector are visible
- ✅ Notes textarea is visible
- ✅ "Log" and "Complete & Log" buttons are visible
- ✅ Form layout matches original design
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 5: Implement Log Time Handler
**Action**: Implement the log time functionality.

**Tasks**:
1. In `TaskCard.js`, add method `handleLogTime` to handle form submission
2. Method should call `POST /tasks/{id}/log` endpoint
3. Send `minutes`, `time_unit`, and `notes` in request body
4. Convert time to minutes based on unit before sending
5. On success, clear the form and show success message
6. Use `ErrorHandler.js` for error handling

**Code structure**:
```javascript
async handleLogTime(event) {
    event.preventDefault();
    
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    if (!csrfToken) {
        if (window.ErrorHandler) {
            ErrorHandler.handleError(new Error('CSRF token not found'));
        } else {
            console.error('CSRF token not found');
        }
        return;
    }
    
    // Convert time to minutes
    let minutes = null;
    if (this.logTime && this.logTime !== '') {
        const timeValue = parseFloat(this.logTime);
        if (!isNaN(timeValue) && timeValue > 0) {
            if (this.logTimeUnit === 'hours') {
                minutes = Math.round(timeValue * 60);
            } else {
                minutes = Math.round(timeValue);
            }
        }
    }
    
    try {
        const response = await fetch(`/tasks/${this.task.id}/log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                minutes: minutes,
                time_unit: this.logTimeUnit,
                notes: this.logNotes || null
            })
        });
        
        let result;
        if (window.ErrorHandler && ErrorHandler.handleResponse) {
            result = await ErrorHandler.handleResponse(response, {
                defaultMessage: 'Error logging time'
            });
        } else {
            const data = await response.json();
            result = {
                success: response.ok && data.success,
                data: data
            };
            if (!result.success) {
                alert(data.message || 'Error logging time');
            }
        }
        
        if (result.success) {
            // Clear form
            this.logTime = '';
            this.logNotes = '';
            // Show success message (optional)
            // Could emit event to show toast notification
        }
    } catch (error) {
        if (window.ErrorHandler && ErrorHandler.handleError) {
            ErrorHandler.handleError(error, {
                context: 'logging time',
                showAlert: true
            });
        } else {
            console.error('Error logging time:', error);
            alert('Error: ' + (error.message || 'Error logging time'));
        }
    }
}
```

**Verification**:
- ✅ Submitting log form calls API
- ✅ Time is logged correctly in database
- ✅ Form clears after successful log
- ✅ Validation errors are displayed
- ✅ Network errors are handled gracefully
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 6: Implement Complete & Log Action
**Action**: Implement the "Complete & Log" button that combines both actions.

**Tasks**:
1. In `TaskCard.js`, add method `handleCompleteAndLog`
2. Method should:
   - First log the time (if provided)
   - Then complete the task
   - Handle errors appropriately
3. Use the existing `handleLogTime` and `handleCompleteTask` logic

**Code structure**:
```javascript
async handleCompleteAndLog() {
    // First, log the time if provided
    if (this.logTime && this.logTime !== '') {
        await this.handleLogTime(new Event('submit'));
        // Small delay to ensure log completes
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Then complete the task
    // Create a synthetic change event for the checkbox
    const checkbox = this.$el.querySelector('.complete-task-checkbox');
    if (checkbox) {
        checkbox.checked = true;
        const changeEvent = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(changeEvent);
        // Or call handleCompleteTask directly
        await this.handleCompleteTask({ target: checkbox });
    }
    
    // Clear form after completion
    this.logTime = '';
    this.logNotes = '';
}
```

**Alternative approach** (cleaner):
```javascript
async handleCompleteAndLog() {
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
        // Convert time to minutes
        let minutes = null;
        if (this.logTime && this.logTime !== '') {
            const timeValue = parseFloat(this.logTime);
            if (!isNaN(timeValue) && timeValue > 0) {
                if (this.logTimeUnit === 'hours') {
                    minutes = Math.round(timeValue * 60);
                } else {
                    minutes = Math.round(timeValue);
                }
            }
        }
        
        // Log time first (if provided)
        if (minutes !== null) {
            const logResponse = await fetch(`/tasks/${this.task.id}/log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    minutes: minutes,
                    time_unit: this.logTimeUnit,
                    notes: this.logNotes || null
                })
            });
            
            if (!logResponse.ok) {
                const logData = await logResponse.json();
                throw new Error(logData.message || 'Error logging time');
            }
        }
        
        // Then complete the task
        const completeResponse = await fetch(`/tasks/${this.task.id}/complete`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            }
        });
        
        let result;
        if (window.ErrorHandler && ErrorHandler.handleResponse) {
            result = await ErrorHandler.handleResponse(completeResponse, {
                defaultMessage: 'Error completing task'
            });
        } else {
            const data = await completeResponse.json();
            result = {
                success: completeResponse.ok && data.success,
                data: data
            };
            if (!result.success) {
                alert(data.message || 'Error completing task');
            }
        }
        
        if (result.success) {
            // Update local task state
            this.task.completed_at = new Date().toISOString();
            this.task.status = 'completed';
            // Clear form
            this.logTime = '';
            this.logNotes = '';
            // Emit event to update parent
            this.$emit('task-updated', {
                id: this.task.id,
                completed_at: this.task.completed_at,
                status: this.task.status
            });
            // Close edit mode
            if (this.toggleTaskExpand) {
                this.toggleTaskExpand(this.task.id);
            }
        }
    } catch (error) {
        if (window.ErrorHandler && ErrorHandler.handleError) {
            ErrorHandler.handleError(error, {
                context: 'completing and logging task',
                showAlert: true
            });
        } else {
            console.error('Error completing and logging task:', error);
            alert('Error: ' + (error.message || 'Error completing and logging task'));
        }
    }
}
```

**Verification**:
- ✅ "Complete & Log" button is clickable
- ✅ Clicking button logs time (if provided) then completes task
- ✅ Both actions succeed in database
- ✅ Task state updates in UI
- ✅ Form clears after completion
- ✅ Edit mode closes after completion
- ✅ Works even if no time is provided (just completes)
- ✅ Errors are handled gracefully
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 7: Update Task State After Actions
**Action**: Ensure all task actions properly update the local task state and emit events.

**Tasks**:
1. Verify all action handlers update `this.task` object correctly
2. Verify all action handlers emit `task-updated` or `task-deleted` events
3. Verify parent components (UniverseCard) handle these events correctly
4. Test that UI updates immediately after actions

**Verification Checklist**:
- ✅ Complete action updates `completed_at` and `status`
- ✅ Skip action updates `skipped_at` and `status`
- ✅ Delete action emits `task-deleted` event
- ✅ Log action doesn't need to update task state (creates log entry)
- ✅ Complete & Log updates both log and task state
- ✅ Parent components receive and handle events correctly
- ✅ UI updates reflect changes immediately
- ✅ No console errors

**Stop here and verify before proceeding.**

---

## Step 8: Test All Task Actions
**Action**: Comprehensive testing of all task actions.

**Test Checklist**:
- ✅ Complete task: checkbox works, task marked as completed, UI updates
- ✅ Uncomplete task: if supported, unchecking works
- ✅ Skip task: button works, task marked as skipped, UI updates, recurring tasks create next instance
- ✅ Delete task: confirmation dialog works, task deleted, removed from UI
- ✅ Log time: form submits, time logged, form clears
- ✅ Complete & Log: both actions work, task completed and time logged
- ✅ Error handling: network errors, validation errors, API errors all handled
- ✅ State updates: all actions update UI immediately
- ✅ No console errors

**Verification**:
- ✅ All tests pass
- ✅ All actions work correctly
- ✅ UX is smooth and intuitive

**Stop here and verify before proceeding.**

---

## Phase 8 Complete!

**Final Verification Checklist**:
- ✅ Complete task checkbox works
- ✅ Skip task button works
- ✅ Delete task button works with confirmation
- ✅ Log time form works
- ✅ Complete & Log button works
- ✅ All actions update backend correctly
- ✅ All actions update UI immediately
- ✅ Errors are handled gracefully
- ✅ No console errors
- ✅ Visual appearance matches original
- ✅ CSS classes used (no inline styles)

**Next Steps**: Once Phase 8 is verified complete, proceed to Phase 9: Polish & Edge Cases.
