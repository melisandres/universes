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
    
    <script src="{{ asset('js/InlineFieldEditor.js') }}"></script>
    <script src="{{ asset('js/TaskFieldSaver.js') }}"></script>
    <script src="{{ asset('js/UniverseFieldSaver.js') }}"></script>
    <script src="{{ asset('js/TaskCardEditor.js') }}"></script>
    @stack('scripts')
</body>
</html>

