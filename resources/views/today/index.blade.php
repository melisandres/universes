@extends('layouts.app')

@section('title', 'Today')

@section('content')
<div class="today-container">
    <div class="today-header">
        <h1>Today</h1>
        <a href="{{ route('tasks.create') }}" class="btn-new-task">+ New Task</a>
    </div>

    <div class="today-layout">
        <!-- Main Content Area -->
        <div class="today-main" id="today-main">
            <!-- Visible Universes -->
            @if($visibleUniverses->isEmpty())
                <p>No visible universes. Update universe statuses to see them here.</p>
            @else
                @foreach($visibleUniverses as $universe)
                    @include('today._universe_card', [
                        'universe' => $universe,
                        'tasks' => $tasksByUniverse[$universe->id] ?? [],
                        'secondaryTaskRefs' => $secondaryTaskRefs[$universe->id] ?? [],
                        'statuses' => $statuses
                    ])
                @endforeach
            @endif

            <!-- Deadlines from Invisible Universes -->
            @if(!empty($tasksFromInvisibleUniverses))
                @include('today._invisible_deadlines_card', ['tasks' => $tasksFromInvisibleUniverses])
            @endif

            <!-- Idea Pools Section -->
            @if($ideaPools->isNotEmpty())
                @include('today._idea_pools_section', ['ideaPools' => $ideaPools])
            @endif
        </div>

        <!-- Task Detail Panel -->
        <div class="today-task-panel" id="task-detail-panel" style="display: none;">
            <div class="panel-header">
                <h3>Task Details</h3>
                <button class="btn-close-panel" id="close-task-panel">×</button>
            </div>
            <div class="panel-content" id="task-detail-content">
                <!-- Populated by JavaScript -->
            </div>
        </div>

        <!-- Logs Panel -->
        <div class="today-logs-panel" id="logs-panel">
            <div class="panel-header">
                <h3>Today's Logs</h3>
                <button class="btn-toggle-panel" id="toggle-logs-panel">−</button>
            </div>
            <div class="panel-content" id="logs-content">
                @include('today._logs_content', ['logs' => $todayLogs])
            </div>
        </div>
    </div>
</div>
@endsection

@push('styles')
<style>
.today-container {
    padding: 20px;
}

.today-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.today-layout {
    display: grid;
    grid-template-columns: 1fr 350px 300px;
    gap: 20px;
    align-items: start;
}

.today-main {
    min-width: 0;
}

.today-task-panel,
.today-logs-panel {
    background: #f5f5f5;
    border-radius: 8px;
    padding: 15px;
    position: sticky;
    top: 20px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #ddd;
}

.panel-header h3 {
    margin: 0;
    font-size: 1.2em;
}

.btn-close-panel,
.btn-toggle-panel {
    background: none;
    border: none;
    font-size: 1.5em;
    cursor: pointer;
    padding: 0 5px;
}

.btn-close-panel:hover,
.btn-toggle-panel:hover {
    opacity: 0.7;
}

.panel-content {
    /* Content styles */
}

@media (max-width: 1200px) {
    .today-layout {
        grid-template-columns: 1fr;
    }
    
    .today-task-panel,
    .today-logs-panel {
        position: relative;
        top: 0;
        max-height: none;
    }
}
</style>
@endpush

@push('scripts')
<script src="{{ asset('js/today.js') }}"></script>
@endpush

