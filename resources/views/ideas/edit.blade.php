@extends('layouts.app')

@section('title', 'Edit Idea')

@section('content')
<h2>Edit Idea</h2>

<form method="POST" action="{{ route('ideas.update', $idea) }}">
    @csrf
    @method('PUT')

    <label>Idea Pools:</label><br>
    <div id="idea-pools-container">
        @php
            $ideaPoolItems = $idea->ideaPools->sortByDesc('pivot.primary_pool');
            $primaryIndex = 0;
            if ($ideaPoolItems->isNotEmpty()) {
                foreach ($ideaPoolItems as $index => $pool) {
                    if ($pool->pivot->primary_pool) {
                        $primaryIndex = $index;
                        break;
                    }
                }
            }
        @endphp
        @if($ideaPoolItems->isNotEmpty())
            @foreach($ideaPoolItems as $index => $pool)
                <div class="idea-pool-item-row" data-index="{{ $index }}" style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                    <select name="idea_pool_ids[]" class="idea-pool-select" required style="padding: 0.35rem; flex: 1; max-width: 300px;">
                        <option value="">— select idea pool —</option>
                        @foreach ($ideaPools as $p)
                            <option value="{{ $p->id }}" @selected($pool->id == $p->id)>
                                {{ $p->name }}
                            </option>
                        @endforeach
                    </select>
                    <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; white-space: nowrap;">
                        <input type="radio" name="primary_pool_index" value="{{ $index }}" @checked($pool->pivot->primary_pool)>
                        Primary
                    </label>
                    <button type="button" class="remove-idea-pool-btn" style="padding: 0.35rem 0.75rem; font-size: 0.9rem; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Remove</button>
                </div>
            @endforeach
        @else
            <div class="idea-pool-item-row" data-index="0" style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <select name="idea_pool_ids[]" class="idea-pool-select" required style="padding: 0.35rem; flex: 1; max-width: 300px;">
                    <option value="">— select idea pool —</option>
                    @foreach ($ideaPools as $p)
                        <option value="{{ $p->id }}">{{ $p->name }}</option>
                    @endforeach
                </select>
                <label style="display: flex; align-items: center; gap: 0.25rem; margin: 0; white-space: nowrap;">
                    <input type="radio" name="primary_pool_index" value="0" checked>
                    Primary
                </label>
                <button type="button" class="remove-idea-pool-btn" style="padding: 0.35rem 0.75rem; font-size: 0.9rem; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Remove</button>
            </div>
        @endif
    </div>
    <button type="button" class="add-idea-pool-btn" style="margin-top: 0.5rem; padding: 0.35rem 0.75rem; font-size: 0.85rem;">+ Add Idea Pool</button><br><br>

    <label>Title (optional)</label><br>
    <input type="text" name="title" value="{{ $idea->title }}"><br><br>

    <label>Body</label><br>
    <textarea name="body" required>{{ $idea->body }}</textarea><br><br>

    <label>Notes (optional)</label><br>
    <textarea name="notes">{{ $idea->notes }}</textarea><br><br>

    <label>Status (optional)</label><br>
    <select name="status">
        <option value="">— none —</option>
        <option value="seed" @selected($idea->status == 'seed')>Seed</option>
        <option value="growing" @selected($idea->status == 'growing')>Growing</option>
        <option value="dormant" @selected($idea->status == 'dormant')>Dormant</option>
        <option value="active" @selected($idea->status == 'active')>Active</option>
    </select><br><br>

    <button type="submit">Update Idea</button>
</form>
@endsection

