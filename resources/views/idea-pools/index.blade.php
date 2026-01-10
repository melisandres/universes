@extends('layouts.app')

@section('title', 'Idea Pools')

@section('content')
<h1>Idea Pools</h1>

<a href="{{ route('idea-pools.create') }}">+ New Idea Pool</a>
<a href="{{ route('ideas.create') }}" style="margin-left: 10px;">+ New Idea</a>

@if($ideaPools->isEmpty())
    <p>No idea pools found.</p>
@else
    <ul>
        @foreach ($ideaPools as $pool)
            <li>
                <div class="idea-pool-view" data-pool-id="{{ $pool->id }}">
                    <strong>{{ $pool->name }}</strong>
                    @php
                        $pool->load('universeItems.universe');
                        $primaryUniverse = $pool->universeItems->where('is_primary', true)->first();
                        $secondaryUniverses = $pool->universeItems->where('is_primary', false);
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
                    @elseif($pool->universeItems->isNotEmpty())
                        <br>Universe: {{ $pool->universeItems->first()->universe->name }}
                    @endif
                    @if($pool->description)
                        <br>{{ $pool->description }}
                    @endif
                    
                    <div class="btns" style="margin-top: 10px;">
                        <a href="{{ route('idea-pools.edit', $pool) }}" class="btn-link">Edit</a>
                        <form method="POST" action="{{ route('idea-pools.destroy', $pool) }}" class="inline-form">
                            @csrf
                            @method('DELETE')
                            <button type="submit" onclick="return confirm('Are you sure?')">Delete</button>
                        </form>
                    </div>
                </div>

                @if($pool->ideas->isNotEmpty())
                    <ul>
                        @foreach ($pool->ideas as $idea)
                            @php
                                $isPrimary = $idea->pivot->primary_pool ?? false;
                                $primaryPool = $idea->primaryPool();
                                $otherPools = $idea->ideaPools()->where('idea_pool_id', '!=', $pool->id)->get();
                            @endphp
                            <li class="{{ $isPrimary ? 'idea-primary' : 'idea-secondary' }}">
                                @if($isPrimary)
                                    <strong>{{ $idea->title ?: '(No title)' }}</strong>
                                    @if($otherPools->isNotEmpty())
                                        <span style="font-size: 0.8em; color: #666;">[also appears in: {{ $otherPools->pluck('name')->join(', ') }}]</span>
                                    @endif
                                @else
                                    <span style="opacity: 0.6;">
                                        <strong>{{ $idea->title ?: '(No title)' }}</strong>
                                        @if($primaryPool)
                                            [also appears in: {{ $primaryPool->name }}]
                                        @endif
                                    </span>
                                @endif
                                @if($idea->status)
                                    <span class="idea-status-badge">[{{ $idea->status }}]</span>
                                @endif
                                <br>
                                <span style="font-size: 0.9em;">{{ Str::limit($idea->body, 100) }}</span>
                                
                                <div class="btns" style="margin-top: 5px;">
                                    <a href="{{ route('ideas.edit', $idea) }}" class="btn-link">Edit</a>
                                    <form method="POST" action="{{ route('ideas.destroy', $idea) }}" class="inline-form">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" onclick="return confirm('Are you sure?')">Delete</button>
                                    </form>
                                </div>
                            </li>
                        @endforeach
                    </ul>
                @endif

                <a href="{{ route('ideas.create', ['idea_pool_id' => $pool->id]) }}">
                    + add idea
                </a>
            </li>
        @endforeach
    </ul>
@endif
@endsection

