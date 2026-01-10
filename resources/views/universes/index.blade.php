@extends('layouts.app')

@section('title', 'Universes')

@section('content')
<h1>Universes</h1>

<a href="{{ route('universes.create') }}">+ New Universe</a>

<ul>
@foreach ($universes as $universe)
    @include('universes._universe_item', ['universe' => $universe, 'allUniverses' => $allUniverses, 'statuses' => $statuses, 'recurringTasks' => $recurringTasks])
@endforeach
</ul>
@endsection

@push('scripts')
<script src="{{ asset('js/universes.js') }}"></script>
@endpush
