@extends('layouts.app')

@section('title', 'New Universe')

@section('content')
<h1>New Universe</h1>

<form method="POST" action="{{ route('universes.store') }}">
    @csrf

    <label>Name</label><br>
    <input type="text" name="name"><br><br>

    <label>Parent</label><br>
    <select name="parent_id">
        <option value="">— none —</option>
        @foreach ($universes as $u)
            <option value="{{ $u->id }}">{{ $u->name }}</option>
        @endforeach
    </select><br><br>

    <label>Status</label><br>
    <select name="status">
        @foreach ($statuses as $status)
            <option value="{{ $status }}">{{ $status }}</option>
        @endforeach
    </select><br><br>

    <button type="submit">Save</button>
</form>
@endsection
