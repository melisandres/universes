<div class="logs-content">
    <!-- Today's Logs -->
    <div class="logs-list">
        <h4>Today's Activity</h4>
        @if($logs->isEmpty())
            <p class="no-logs">No logs yet today</p>
        @else
            @foreach($logs as $log)
                <div class="log-item" data-log-id="{{ $log->id }}">
                    <div class="log-header">
                        <span class="log-time">{{ $log->created_at->format('H:i') }}</span>
                        @if($log->loggable)
                            @if($log->loggable_type === 'App\Models\Task')
                                <span class="log-context">Task: {{ $log->loggable->name }}</span>
                            @elseif($log->loggable_type === 'App\Models\Idea')
                                <span class="log-context">Idea: {{ $log->loggable->title ?: substr($log->loggable->body, 0, 30) }}</span>
                            @elseif($log->loggable_type === 'App\Models\Universe')
                                <span class="log-context">Universe: {{ $log->loggable->name }}</span>
                            @endif
                        @else
                            <span class="log-context">Standalone Log</span>
                        @endif
                    </div>
                    @if($log->minutes)
                        <div class="log-minutes">⏱ {{ $log->minutes }} minutes</div>
                    @endif
                    @if($log->notes)
                        <div class="log-notes">{{ $log->notes }}</div>
                    @endif
                </div>
            @endforeach
        @endif
    </div>
</div>

<style>
.logs-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.logs-list h4 {
    margin: 0 0 10px 0;
    font-size: 1em;
}

.logs-list {
    max-height: 400px;
    overflow-y: auto;
}

.log-item {
    padding: 10px;
    margin-bottom: 10px;
    background: white;
    border-radius: 4px;
    border-left: 3px solid #007bff;
}

.log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
}

.log-time {
    font-size: 0.85em;
    color: #999;
}

.log-context {
    font-weight: 600;
    font-size: 0.9em;
}

.log-minutes {
    color: #666;
    font-size: 0.9em;
    margin: 5px 0;
}

.log-notes {
    color: #333;
    font-size: 0.9em;
    white-space: pre-wrap;
}

.no-logs {
    color: #999;
    font-style: italic;
    text-align: center;
    padding: 20px;
}
</style>

