@extends('layouts.app')

@section('title', 'Tasks')

@section('content')
<h1>Tasks</h1>

<a href="{{ route('tasks.create') }}">+ New Task</a>

@if($tasks->isEmpty())
    <p>No tasks found.</p>
@else
    <ul class="tasks-list">
        @foreach ($tasks as $task)
            @include('tasks._task_card', ['task' => $task, 'referer' => request()->fullUrl()])
        @endforeach
    </ul>
@endif
@endsection

