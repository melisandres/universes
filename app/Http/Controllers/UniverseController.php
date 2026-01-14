<?php

namespace App\Http\Controllers;
use App\Models\Universe;

use Illuminate\Http\Request;

class UniverseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Update task statuses based on deadlines before loading
        \App\Models\Task::updateOverdueStatuses();
        
        // Get root universes (those without a parent) and eager load children recursively
        // Load tasks with completed_at filter at the relationship level
        // hasManyThrough automatically loads all task fields including deadline_at
        $universes = Universe::whereNull('parent_id')
            ->with(['primaryTasks' => function ($query) {
                $query->whereNull('completed_at')
                      ->orderBy('created_at', 'desc'); // Newest tasks first
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
        
        // Prepare initial data for Vue
        $initialData = [
            'universes' => $this->formatUniversesForJson($universes),
            'all_universes' => $allUniverses->map(fn($u) => ['id' => $u->id, 'name' => $u->name])->values(),
            'statuses' => $statuses,
            'recurring_tasks' => $recurringTasks->map(fn($rt) => ['id' => $rt->id, 'name' => $rt->name])->values(),
        ];
        
        // Check if JSON response is requested
        if ($request->wantsJson() || $request->expectsJson()) {
            return response()->json($initialData);
        }
        
        return view('universes.index', compact('universes', 'allUniverses', 'statuses', 'recurringTasks', 'initialData'));
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
                $query->whereNull('completed_at')
                      ->orderBy('created_at', 'desc'); // Newest tasks first
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
     * Format universes for JSON response (recursive).
     */
    private function formatUniversesForJson($universes)
    {
        return $universes->map(function ($universe) {
            $data = [
                'id' => $universe->id,
                'name' => $universe->name,
                'status' => $universe->status,
                'parent_id' => $universe->parent_id,
                'children' => $this->formatUniversesForJson($universe->children ?? collect()),
                'primary_tasks' => $this->formatTasksForJson($universe->primaryTasks ?? collect()),
                'secondary_tasks' => $this->formatSecondaryTasksForJson($universe->secondaryTasks ?? collect()),
            ];
            return $data;
        });
    }

    /**
     * Format tasks for JSON response.
     */
    private function formatTasksForJson($tasks)
    {
        return $tasks->map(function ($task) {
            return [
                'id' => $task->id,
                'name' => $task->name,
                'description' => $task->description,
                'status' => $task->status,
                'computed_status' => $task->getComputedStatus(),
                'deadline_at' => $task->deadline_at?->toIso8601String(),
                'estimated_time' => $task->estimated_time,
                'recurring_task_id' => $task->recurring_task_id,
                'completed_at' => $task->completed_at?->toIso8601String(),
                'skipped_at' => $task->skipped_at?->toIso8601String(),
                'universe_items' => $task->universeItems->map(fn($ui) => [
                    'universe_id' => $ui->universe_id,
                    'is_primary' => $ui->is_primary,
                ]),
            ];
        });
    }

    /**
     * Format secondary tasks for JSON response.
     */
    private function formatSecondaryTasksForJson($tasks)
    {
        return $tasks->map(function ($task) {
            // Ensure universeItems are loaded
            if (!$task->relationLoaded('universeItems')) {
                $task->load('universeItems.universe');
            }
            
            $primaryUniverseItem = $task->universeItems->where('is_primary', true)->first();
            return [
                'id' => $task->id,
                'name' => $task->name,
                'primary_universe' => $primaryUniverseItem ? [
                    'id' => $primaryUniverseItem->universe->id,
                    'name' => $primaryUniverseItem->universe->name,
                ] : null,
            ];
        });
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
