<li class="task-item" data-task-id="{{ $task->id }}" data-universe-id="{{ $universe->id }}">
    <span class="task-content">
        @if($task->recurring_task_id)
            <span class="recurring-indicator" title="Recurring task">🔄</span>
        @endif
        <strong>{{ $task->name }}</strong>
        @if($task->deadline_at)
            <span class="task-deadline">({{ $task->deadline_at->format('M j, Y') }})</span>
        @endif
    </span>
</li>

