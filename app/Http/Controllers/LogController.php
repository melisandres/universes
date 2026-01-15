<?php

namespace App\Http\Controllers;

use App\Models\Log;
use App\Models\Task;
use Illuminate\Http\Request;

class LogController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $logs = Log::with(['loggable'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy(function ($log) {
                return $log->created_at->format('Y-m-d');
            });
        
        $tasks = Task::with('universeItems.universe')
            ->incomplete()
            ->whereNull('skipped_at')
            ->orderBy('name')
            ->get();
        
        // Group tasks by primary universe
        $tasksByUniverse = $tasks->groupBy(function ($task) {
            $primaryUniverseItem = $task->universeItems->where('is_primary', true)->first();
            return $primaryUniverseItem ? $primaryUniverseItem->universe->name : 'Unassigned';
        })->sortKeys();
        
        $ideas = \App\Models\Idea::with('ideaPools')->orderBy('title')->get();
        
        // Group ideas by primary idea pool
        $ideasByPool = $ideas->groupBy(function ($idea) {
            $primaryPool = $idea->primaryPool();
            return $primaryPool ? $primaryPool->name : 'Unassigned';
        })->sortKeys();
        
        $universes = \App\Models\Universe::orderBy('name')->get();
        
        return view('logs.index', compact('logs', 'tasks', 'tasksByUniverse', 'ideas', 'ideasByPool', 'universes'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'loggable_type' => 'nullable|string',
            'loggable_id' => 'nullable|integer',
            'minutes' => 'nullable|numeric|min:0',
            'time_unit' => 'nullable|string|in:minutes,hours',
            'notes' => 'nullable|string',
        ]);

        // Convert minutes to minutes if provided
        $minutes = null;
        if (isset($validated['minutes']) && $validated['minutes'] !== null) {
            $timeUnit = $validated['time_unit'] ?? 'hours'; // Default to hours
            if ($timeUnit === 'hours') {
                $minutes = (int) round($validated['minutes'] * 60);
            } else {
                $minutes = (int) round($validated['minutes']);
            }
        }

        // If loggable_type is empty, set both to null for standalone logs
        if (empty($validated['loggable_type']) || empty($validated['loggable_id'])) {
            $validated['loggable_type'] = null;
            $validated['loggable_id'] = null;
        }

        Log::create([
            'loggable_type' => $validated['loggable_type'],
            'loggable_id' => $validated['loggable_id'],
            'minutes' => $minutes,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Redirect back to referer if available, otherwise to logs index
        $referer = $request->input('referer') ?? $request->header('referer');
        if ($referer && str_starts_with($referer, url('/'))) {
            return redirect($referer);
        }

        return redirect()->route('logs.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Log $log)
    {
        $validated = $request->validate([
            'loggable_type' => 'nullable|string',
            'loggable_id' => 'nullable|integer',
            'minutes' => 'nullable|numeric|min:0',
            'time_unit' => 'nullable|string|in:minutes,hours',
            'notes' => 'nullable|string',
        ]);

        // Convert minutes to minutes if provided
        $minutes = null;
        if (isset($validated['minutes']) && $validated['minutes'] !== null) {
            $timeUnit = $validated['time_unit'] ?? 'hours'; // Default to hours
            if ($timeUnit === 'hours') {
                $minutes = (int) round($validated['minutes'] * 60);
            } else {
                $minutes = (int) round($validated['minutes']);
            }
        }

        // If loggable_type is empty, set both to null for standalone logs
        if (empty($validated['loggable_type']) || empty($validated['loggable_id'])) {
            $validated['loggable_type'] = null;
            $validated['loggable_id'] = null;
        }

        $log->update([
            'loggable_type' => $validated['loggable_type'],
            'loggable_id' => $validated['loggable_id'],
            'minutes' => $minutes,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('logs.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Log $log)
    {
        $log->delete();
        return redirect()->route('logs.index');
    }
}
