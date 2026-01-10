<?php

namespace App\Http\Controllers;

use App\Models\Idea;
use App\Models\IdeaPool;
use App\Models\Log;
use Illuminate\Http\Request;
use Carbon\Carbon;

class IdeaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // This will be handled by IdeaPoolController index
        return redirect()->route('idea-pools.index');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $ideaPools = IdeaPool::orderBy('name')->get();
        $selectedPool = $request->get('idea_pool_id');
        
        return view('ideas.create', compact('ideaPools', 'selectedPool'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'body' => 'required|string',
            'notes' => 'nullable|string',
            'status' => 'nullable|in:seed,growing,dormant,active',
            'idea_pool_ids' => 'required|array|min:1',
            'idea_pool_ids.*' => 'required|exists:idea_pools,id',
            'primary_pool_index' => 'required|integer|min:0',
        ]);

        $idea = Idea::create([
            'title' => $validated['title'],
            'body' => $validated['body'],
            'notes' => $validated['notes'] ?? null,
            'status' => $validated['status'] ?? null,
        ]);

        $ideaPoolIds = array_values($validated['idea_pool_ids']); // Re-index array
        $primaryIndex = (int) $validated['primary_pool_index'];

        // Ensure primary index is valid
        if ($primaryIndex < 0 || $primaryIndex >= count($ideaPoolIds)) {
            $primaryIndex = 0;
        }

        // Attach all pools with primary flag
        foreach ($ideaPoolIds as $index => $poolId) {
            $idea->ideaPools()->attach($poolId, [
                'primary_pool' => ($index === $primaryIndex),
            ]);
        }

        // Create log entry for idea creation
        Log::create([
            'loggable_type' => 'App\Models\Idea',
            'loggable_id' => $idea->id,
            'notes' => "Created idea: " . ($validated['title'] ?? substr($validated['body'], 0, 50)),
        ]);

        return redirect()->route('idea-pools.index');
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
    public function edit(Idea $idea)
    {
        $idea->load('ideaPools');
        $ideaPools = IdeaPool::orderBy('name')->get();
        
        return view('ideas.edit', compact('idea', 'ideaPools'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Idea $idea)
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'body' => 'required|string',
            'notes' => 'nullable|string',
            'status' => 'nullable|in:seed,growing,dormant,active',
            'idea_pool_ids' => 'required|array|min:1',
            'idea_pool_ids.*' => 'required|exists:idea_pools,id',
            'primary_pool_index' => 'required|integer|min:0',
        ]);

        $idea->update([
            'title' => $validated['title'],
            'body' => $validated['body'],
            'notes' => $validated['notes'] ?? null,
            'status' => $validated['status'] ?? null,
        ]);

        $ideaPoolIds = array_values($validated['idea_pool_ids']); // Re-index array
        $primaryIndex = (int) $validated['primary_pool_index'];

        // Ensure primary index is valid
        if ($primaryIndex < 0 || $primaryIndex >= count($ideaPoolIds)) {
            $primaryIndex = 0;
        }

        // Detach all existing pools
        $idea->ideaPools()->detach();

        // Attach all pools with primary flag
        foreach ($ideaPoolIds as $index => $poolId) {
            $idea->ideaPools()->attach($poolId, [
                'primary_pool' => ($index === $primaryIndex),
            ]);
        }

        // Handle log entry for idea editing
        $todayLog = Log::where('loggable_type', 'App\Models\Idea')
            ->where('loggable_id', $idea->id)
            ->whereDate('created_at', Carbon::today())
            ->first();

        if ($todayLog) {
            // Append to existing log
            $existingNotes = $todayLog->notes ?? '';
            $updateNote = "Updated: " . ($validated['title'] ?? substr($validated['body'], 0, 50));
            $todayLog->update([
                'notes' => $existingNotes . "\n" . $updateNote,
            ]);
        } else {
            // Create new log
            Log::create([
                'loggable_type' => 'App\Models\Idea',
                'loggable_id' => $idea->id,
                'notes' => "Updated idea: " . ($validated['title'] ?? substr($validated['body'], 0, 50)),
            ]);
        }

        return redirect()->route('idea-pools.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Idea $idea)
    {
        $idea->delete();
        return redirect()->route('idea-pools.index');
    }
}
