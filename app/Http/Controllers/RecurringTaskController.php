<?php

namespace App\Http\Controllers;

use App\Models\RecurringTask;

use Illuminate\Http\Request;

class RecurringTaskController extends Controller
{
    public function index()
    {
        $recurringTasks = RecurringTask::with(['universeItems.universe', 'tasks'])->orderBy('name')->get();
        return view('recurring-tasks.index', compact('recurringTasks'));
    }

    public function create()
    {
        $universes = \App\Models\Universe::orderBy('name')->get();
        return view('recurring-tasks.create', compact('universes'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'universe_ids' => 'nullable|array',
            'universe_ids.*' => 'required|exists:universes,id',
            'primary_universe' => 'nullable|integer|min:0',
            'frequency_unit' => 'required|in:day,week,month',
            'frequency_interval' => 'required|integer|min:1',
            'default_duration_minutes' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
            'active' => 'boolean',
        ]);

        $universeIds = $validated['universe_ids'] ?? [];
        $primaryIndex = isset($validated['primary_universe']) ? (int) $validated['primary_universe'] : 0;
        unset($validated['universe_ids'], $validated['primary_universe']);
        
        $recurringTask = RecurringTask::create($validated);
        
        // Create universe_item relationships
        if (!empty($universeIds)) {
            foreach ($universeIds as $index => $universeId) {
                \App\Models\UniverseItem::create([
                    'universe_id' => $universeId,
                    'item_type' => 'App\Models\RecurringTask',
                    'item_id' => $recurringTask->id,
                    'is_primary' => ($index === $primaryIndex),
                ]);
            }
            
            // Create the first task instance using primary universe
            $primaryUniverseId = $universeIds[$primaryIndex] ?? $universeIds[0];
            $task = \App\Models\Task::create([
                'recurring_task_id' => $recurringTask->id,
                'name' => $recurringTask->name,
                'deadline_at' => $recurringTask->nextDeadline(now()),
                'status' => 'open',
            ]);
            
            // Create universe_item for the task (using primary universe)
            \App\Models\UniverseItem::create([
                'universe_id' => $primaryUniverseId,
                'item_type' => 'App\Models\Task',
                'item_id' => $task->id,
                'is_primary' => true,
            ]);
        }

        return redirect()->route('recurring-tasks.index');
    }

    public function edit(RecurringTask $recurringTask)
    {
        $recurringTask->load('universeItems.universe');
        $universes = \App\Models\Universe::orderBy('name')->get();
        return view('recurring-tasks.edit', compact('recurringTask', 'universes'));
    }

    public function update(Request $request, RecurringTask $recurringTask)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'universe_ids' => 'nullable|array',
            'universe_ids.*' => 'required|exists:universes,id',
            'primary_universe' => 'nullable|integer|min:0',
            'frequency_unit' => 'required|in:day,week,month',
            'frequency_interval' => 'required|integer|min:1',
            'default_duration_minutes' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
            'active' => 'boolean',
        ]);

        $universeIds = $validated['universe_ids'] ?? [];
        $primaryIndex = isset($validated['primary_universe']) ? (int) $validated['primary_universe'] : 0;
        unset($validated['universe_ids'], $validated['primary_universe']);
        
        $recurringTask->update($validated);
        
        // Delete existing universe_items
        $recurringTask->universeItems()->delete();
        
        // Create new universe_item relationships
        if (!empty($universeIds)) {
            foreach ($universeIds as $index => $universeId) {
                \App\Models\UniverseItem::create([
                    'universe_id' => $universeId,
                    'item_type' => 'App\Models\RecurringTask',
                    'item_id' => $recurringTask->id,
                    'is_primary' => ($index === $primaryIndex),
                ]);
            }
        }

        return redirect()->route('recurring-tasks.index');
    }

    public function destroy(RecurringTask $recurringTask)
    {
        $recurringTask->delete();
        return back();
    }

    public function seed(RecurringTask $recurringTask)
    {
        $primaryUniverseItem = $recurringTask->universeItems()->where('is_primary', true)->first();
        if (!$primaryUniverseItem) {
            // Fallback to first universe if no primary
            $primaryUniverseItem = $recurringTask->universeItems()->first();
        }
        
        if (!$primaryUniverseItem) {
            return back()->withErrors(['error' => 'Cannot seed task: recurring task has no universe assigned.']);
        }

        $task = \App\Models\Task::create([
            'name' => $recurringTask->name,
            'recurring_task_id' => $recurringTask->id,
            'deadline_at' => $recurringTask->nextDeadline(now()),
            'status' => 'open',
        ]);
        
        // Create universe_items for the task (copy all universes from recurring task)
        foreach ($recurringTask->universeItems as $universeItem) {
            \App\Models\UniverseItem::create([
                'universe_id' => $universeItem->universe_id,
                'item_type' => 'App\Models\Task',
                'item_id' => $task->id,
                'is_primary' => $universeItem->is_primary,
            ]);
        }

        return back()->with('success', 'Task instance created successfully.');
    }
}
