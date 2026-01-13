<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Universe Organizer')</title>
    <link rel="stylesheet" href="{{ asset('css/variables.css') }}">
    <link rel="stylesheet" href="{{ asset('css/main.css') }}">
    @stack('styles')
</head>
<body>
    <nav class="main-nav">
        <a href="{{ route('today.index') }}">Today</a>
        <a href="{{ route('universes.index') }}">Universes</a>
        <a href="{{ route('tasks.index') }}">Tasks</a>
        <a href="{{ route('recurring-tasks.index') }}">Recurring Tasks</a>
        <a href="{{ route('idea-pools.index') }}">Ideas</a>
        <a href="{{ route('logs.index') }}">Logs</a>
    </nav>
    
    @yield('content')
    
    {{-- Core dependencies --}}
    <script src="{{ asset('js/InlineFieldEditor.js') }}"></script>
    <script src="{{ asset('js/TaskFieldSaver.js') }}"></script>
    <script src="{{ asset('js/TaskStatusManager.js') }}"></script>
    <script src="{{ asset('js/UniverseFieldSaver.js') }}"></script>
    
    {{-- Utility classes --}}
    <script src="{{ asset('js/TimeHelper.js') }}"></script>
    <script src="{{ asset('js/Logger.js') }}"></script>
    <script src="{{ asset('js/ErrorHandler.js') }}"></script>
    <script src="{{ asset('js/FieldConstants.js') }}"></script>
    <script src="{{ asset('js/FieldUtils.js') }}"></script>
    <script src="{{ asset('js/DOMUtils.js') }}"></script>
    
    {{-- Set environment for Logger (Laravel APP_ENV) --}}
    <script>
        window.APP_ENV = '{{ config('app.env') }}';
    </script>
    
    {{-- State manager (centralized state management) --}}
    <script src="{{ asset('js/StateManager.js') }}"></script>
    
    {{-- Main initialization (sets up registries) --}}
    <script src="{{ asset('js/main.js') }}"></script>
    
    {{-- Field classes (loaded before TaskCardEditor) --}}
    <script src="{{ asset('js/InlineUniversesField.js') }}"></script>
    <script src="{{ asset('js/InlineEstimatedTimeField.js') }}"></script>
    <script src="{{ asset('js/InlineRecurringTaskField.js') }}"></script>
    <script src="{{ asset('js/InlineDeadlineField.js') }}"></script>
    <script src="{{ asset('js/InlineLogTimeField.js') }}"></script>
    
    {{-- Dependency manager (for proper dependency checking) - load after field classes --}}
    <script src="{{ asset('js/DependencyManager.js') }}"></script>
    
    {{-- Task field initializer (initializes all field classes) --}}
    <script src="{{ asset('js/TaskFieldInitializer.js') }}"></script>
    
    {{-- Diagnostics (comprehensive logging) - only in development --}}
    @if(config('app.env') === 'local' || config('app.env') === 'development')
    <script src="{{ asset('js/Diagnostics.js') }}"></script>
    @endif
    
    {{-- Task card editor (may use registries from main.js) --}}
    <script src="{{ asset('js/TaskCardEditor.js') }}"></script>
    
    {{-- Field classes and page-specific scripts --}}
    @stack('scripts')
</body>
</html>

