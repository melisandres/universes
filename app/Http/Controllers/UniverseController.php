<?php

namespace App\Http\Controllers;
use App\Models\Universe;

use Illuminate\Http\Request;

class UniverseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Update task statuses based on deadlines before loading
        \App\Models\Task::updateOverdueStatuses();
        
        // Get root universes (those without a parent) and eager load children recursively
        // Load tasks with completed_at filter at the relationship level
        // hasManyThrough automatically loads all task fields including deadline_at
        $universes = Universe::whereNull('parent_id')
            ->with(['primaryTasks' => function ($query) {
                $query->whereNull('completed_at');
            }, 'secondaryTasks' => function ($query) {
                $query->whereNull('completed_at');
            }])
            ->orderBy('name')
            ->get();
        
        // Eager load all nested children recursively
        $this->loadChildrenRecursively($universes);
        
        // Get all universes for parent dropdown (needed for inline editing)
        $allUniverses = Universe::orderBy('name')->get();
        
        // Get recurring tasks for task inline editing
        $recurringTasks = \App\Models\RecurringTask::where('active', true)->get();
        
        // Status options
        $statuses = [
            'not_started',
            'next_small_steps',
            'in_focus',
            'in_orbit',
            'dormant',
            'done',
        ];
        
        return view('universes.index', compact('universes', 'allUniverses', 'statuses', 'recurringTasks'));
    }

    /**
     * Recursively eager load children for a collection of universes.
     */
    private function loadChildrenRecursively($universes)
    {
        if ($universes->isEmpty()) {
            return;
        }
        
        // Load children for all universes in this level
        $ids = $universes->pluck('id');
        $children = Universe::whereIn('parent_id', $ids)
            ->with(['primaryTasks' => function ($query) {
                $query->whereNull('completed_at');
            }, 'secondaryTasks' => function ($query) {
                $query->whereNull('completed_at');
            }])
            ->orderBy('name')
            ->get()
            ->groupBy('parent_id');
        
        // Attach children to their parents
        foreach ($universes as $universe) {
            $universe->setRelation('children', $children->get($universe->id, collect()));
        }
        
        // Recursively load children of children
        if ($children->isNotEmpty()) {
            $this->loadChildrenRecursively($children->flatten());
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $universes = Universe::orderBy('name')->get();
        $statuses = [
            'not_started',
            'next_small_steps',
            'in_focus',
            'in_orbit',
            'dormant',
            'done',
        ];

        return view('universes.create', compact('universes', 'statuses'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:universes,id',
            'status' => 'required|string',
        ]);
    
        Universe::create($validated);
    
        return redirect()->route('universes.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Universe $universe)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => [
                'nullable',
                'exists:universes,id',
                function ($attribute, $value, $fail) use ($universe) {
                    if ($value && $this->wouldCreateCircularReference($universe, $value)) {
                        $fail('Cannot set parent: this would create a circular reference.');
                    }
                },
            ],
            'status' => 'required|string',
        ]);
    
        $universe->update($validated);
    
        // Return JSON response for AJAX/JSON requests
        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'universe' => $universe->fresh()
            ]);
        }
    
        return redirect()->route('universes.index');
    }

    /**
     * Check if setting a parent would create a circular reference.
     */
    private function wouldCreateCircularReference(Universe $universe, $parentId)
    {
        // A universe cannot be its own parent
        if ($universe->id == $parentId) {
            return true;
        }
        
        // Check if the proposed parent is a descendant of this universe
        $proposedParent = Universe::find($parentId);
        if (!$proposedParent) {
            return false;
        }
        
        // Traverse up the tree from the proposed parent to see if we reach this universe
        $current = $proposedParent;
        while ($current->parent_id) {
            if ($current->parent_id == $universe->id) {
                return true;
            }
            $current = $current->parent;
            if (!$current) {
                break;
            }
        }
        
        return false;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Universe $universe)
    {
        $universe->delete();
        return redirect()->route('universes.index');
    }
}
