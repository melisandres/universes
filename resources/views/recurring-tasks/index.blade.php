@extends('layouts.app')

@section('title', 'Recurring Tasks')

@section('content')
<h1>Recurring Tasks</h1>

<a href="{{ route('recurring-tasks.create') }}">+ New Recurring Task</a>

@if($recurringTasks->isEmpty())
    <p>No recurring tasks found.</p>
@else
    <ul>
        @foreach ($recurringTasks as $rt)
            <li>
                <div class="recurring-task-view" data-recurring-task-id="{{ $rt->id }}">
                    <strong>{{ $rt->name }}</strong>
                    @php
                        $rt->load('universeItems.universe');
                        $primaryUniverse = $rt->universeItems->where('is_primary', true)->first();
                        $secondaryUniverses = $rt->universeItems->where('is_primary', false);
                    @endphp
                    @if($primaryUniverse)
                        <br>Universe: <strong>{{ $primaryUniverse->universe->name }}</strong>
                        @if($secondaryUniverses->isNotEmpty())
                            <span class="secondary-universes">
                                @foreach($secondaryUniverses as $secondary)
                                    <span class="secondary-universe">{{ $secondary->universe->name }}</span>
                                @endforeach
                            </span>
                        @endif
                    @elseif($rt->universeItems->isNotEmpty())
                        <br>Universe: {{ $rt->universeItems->first()->universe->name }}
                    @endif
                    <br>Frequency: Every {{ $rt->frequency_interval }} {{ $rt->frequency_unit }}(s)
                    @if($rt->default_duration_minutes)
                        <br>Default Duration: {{ $rt->default_duration_minutes }} minutes
                    @endif
                    @if($rt->notes)
                        <br>Notes: {{ $rt->notes }}
                    @endif
                    <br>Status: {{ $rt->active ? 'Active' : 'Inactive' }}
                    <br>Task Instances: {{ $rt->tasks->count() }}
                    
                    <div class="btns" style="margin-top: 10px;">
                        @if($rt->universe)
                            <form method="POST" action="{{ route('recurring-tasks.seed', $rt) }}" class="inline-form">
                                @csrf
                                <button type="submit">Seed Task</button>
                            </form>
                        @endif
                        <a href="{{ route('recurring-tasks.edit', $rt) }}" class="btn-link">Edit</a>
                        <form method="POST" action="{{ route('recurring-tasks.destroy', $rt) }}" class="inline-form">
                            @csrf
                            @method('DELETE')
                            <button type="submit" onclick="return confirm('Are you sure? This will delete the recurring task template but not the task instances.')">Delete</button>
                        </form>
                    </div>
                </div>
            </li>
        @endforeach
    </ul>
@endif
@endsection

