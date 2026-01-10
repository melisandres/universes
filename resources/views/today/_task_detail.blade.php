<div class="task-detail" data-task-id="{{ $task->id }}">
    <div class="task-info">
        <h3>{{ $task->name }}</h3>
        
        @php
            $primaryUniverse = $task->universeItems->where('is_primary', true)->first();
        @endphp
        @if($primaryUniverse)
            <p class="task-universe">Universe: <strong>{{ $primaryUniverse->universe->name }}</strong></p>
        @endif
        
        @if($task->deadline_at)
            <p class="task-deadline-info">
                Deadline: <strong>{{ $task->deadline_at->format('M j, Y g:i A') }}</strong>
            </p>
        @else
            <p class="task-deadline-info">No deadline</p>
        @endif
        
        @if($task->recurringTask)
            <p class="task-recurring">Recurring: {{ $task->recurringTask->name }}</p>
        @endif
        
        <p class="task-status">Status: <strong>{{ $task->status }}</strong></p>
    </div>

    <div class="task-actions">
        <a href="{{ route('tasks.edit', $task) }}" class="btn-action btn-edit">Edit</a>
        
        <form method="POST" action="{{ route('tasks.complete', $task) }}" class="inline-form task-action-form">
            @csrf
            <button type="submit" class="btn-action btn-complete">Complete</button>
        </form>

        <form method="POST" action="{{ route('tasks.log', $task) }}" class="inline-form task-action-form" id="log-task-form-{{ $task->id }}">
            @csrf
            <div class="log-form-fields" style="display: none;">
                <input type="number" name="minutes" placeholder="Minutes" min="0" class="form-input-small">
                <textarea name="notes" placeholder="Notes" rows="2" class="form-input-small"></textarea>
            </div>
            <button type="button" class="btn-action btn-log" onclick="toggleLogForm({{ $task->id }})">Log</button>
            <button type="submit" class="btn-action btn-log-submit" style="display: none;">Submit Log</button>
        </form>

        <form method="POST" action="{{ route('tasks.snooze', $task) }}" class="inline-form task-action-form" id="snooze-task-form-{{ $task->id }}">
            @csrf
            <div class="snooze-form-fields" style="display: none;">
                <input type="date" name="snooze_until" required class="form-input-small">
            </div>
            <button type="button" class="btn-action btn-snooze" onclick="toggleSnoozeForm({{ $task->id }})">Snooze</button>
            <button type="submit" class="btn-action btn-snooze-submit" style="display: none;">Set Snooze</button>
        </form>

        @if($task->isRecurring())
            <form method="POST" action="{{ route('tasks.skip', $task) }}" class="inline-form task-action-form">
                @csrf
                <button type="submit" class="btn-action btn-skip">Skip</button>
            </form>
        @endif

        <form method="POST" action="{{ route('tasks.destroy', $task) }}" class="inline-form task-action-form" onsubmit="return confirm('Are you sure you want to delete this task?')">
            @csrf
            @method('DELETE')
            <button type="submit" class="btn-action btn-delete">Delete</button>
        </form>
    </div>
</div>

<style>
.task-detail {
    padding: 10px 0;
}

.task-info {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #ddd;
}

.task-info h3 {
    margin: 0 0 10px 0;
    font-size: 1.3em;
}

.task-info p {
    margin: 5px 0;
    font-size: 0.9em;
    color: #666;
}

.task-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.btn-action {
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
    text-decoration: none;
    display: inline-block;
    text-align: center;
}

.btn-edit {
    background: #007bff;
    color: white;
}

.btn-complete {
    background: #28a745;
    color: white;
}

.btn-log,
.btn-snooze {
    background: #ffc107;
    color: #333;
}

.btn-skip {
    background: #6c757d;
    color: white;
}

.btn-delete {
    background: #dc3545;
    color: white;
}

.btn-action:hover {
    opacity: 0.9;
}

.inline-form {
    display: block;
}

.form-input-small {
    width: 100%;
    padding: 5px;
    margin: 5px 0;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9em;
}

.log-form-fields,
.snooze-form-fields {
    margin: 10px 0;
    padding: 10px;
    background: #f9f9f9;
    border-radius: 4px;
}
</style>

<script>
function toggleLogForm(taskId) {
    const form = document.getElementById('log-task-form-' + taskId);
    const fields = form.querySelector('.log-form-fields');
    const logBtn = form.querySelector('.btn-log');
    const submitBtn = form.querySelector('.btn-log-submit');
    
    if (fields.style.display === 'none') {
        fields.style.display = 'block';
        logBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
    } else {
        fields.style.display = 'none';
        logBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    }
}

function toggleSnoozeForm(taskId) {
    const form = document.getElementById('snooze-task-form-' + taskId);
    const fields = form.querySelector('.snooze-form-fields');
    const snoozeBtn = form.querySelector('.btn-snooze');
    const submitBtn = form.querySelector('.btn-snooze-submit');
    
    if (fields.style.display === 'none') {
        fields.style.display = 'block';
        snoozeBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
    } else {
        fields.style.display = 'none';
        snoozeBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    }
}
</script>

