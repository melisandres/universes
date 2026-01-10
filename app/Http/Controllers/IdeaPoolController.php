<?php

namespace App\Http\Controllers;

use App\Models\IdeaPool;
use Illuminate\Http\Request;

class IdeaPoolController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $ideaPools = IdeaPool::with(['ideas' => function($query) {
            $query->orderBy('created_at', 'desc');
        }, 'universeItems.universe'])->orderBy('name')->get();
        
        // Load all ideas with their pools for cross-referencing
        $allIdeas = \App\Models\Idea::with('ideaPools')->get();
        
        return view('idea-pools.index', compact('ideaPools', 'allIdeas'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $universes = \App\Models\Universe::orderBy('name')->get();
        return view('idea-pools.create', compact('universes'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'universe_ids' => 'nullable|array',
            'universe_ids.*' => 'required|exists:universes,id',
            'primary_universe' => 'nullable|integer|min:0',
        ]);

        $universeIds = $validated['universe_ids'] ?? [];
        $primaryIndex = isset($validated['primary_universe']) ? (int) $validated['primary_universe'] : 0;
        unset($validated['universe_ids'], $validated['primary_universe']);

        $ideaPool = IdeaPool::create($validated);
        
        // Create universe_item relationships
        if (!empty($universeIds)) {
            foreach ($universeIds as $index => $universeId) {
                \App\Models\UniverseItem::create([
                    'universe_id' => $universeId,
                    'item_type' => 'App\Models\IdeaPool',
                    'item_id' => $ideaPool->id,
                    'is_primary' => ($index === $primaryIndex),
                ]);
            }
        }

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
    public function edit(IdeaPool $ideaPool)
    {
        $ideaPool->load('universeItems.universe');
        $universes = \App\Models\Universe::orderBy('name')->get();
        return view('idea-pools.edit', compact('ideaPool', 'universes'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, IdeaPool $ideaPool)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'universe_ids' => 'nullable|array',
            'universe_ids.*' => 'required|exists:universes,id',
            'primary_universe' => 'nullable|integer|min:0',
        ]);

        $universeIds = $validated['universe_ids'] ?? [];
        $primaryIndex = isset($validated['primary_universe']) ? (int) $validated['primary_universe'] : 0;
        unset($validated['universe_ids'], $validated['primary_universe']);

        $ideaPool->update($validated);
        
        // Delete existing universe_items
        $ideaPool->universeItems()->delete();
        
        // Create new universe_item relationships
        if (!empty($universeIds)) {
            foreach ($universeIds as $index => $universeId) {
                \App\Models\UniverseItem::create([
                    'universe_id' => $universeId,
                    'item_type' => 'App\Models\IdeaPool',
                    'item_id' => $ideaPool->id,
                    'is_primary' => ($index === $primaryIndex),
                ]);
            }
        }

        return redirect()->route('idea-pools.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(IdeaPool $ideaPool)
    {
        $ideaPool->delete();
        return redirect()->route('idea-pools.index');
    }
}
