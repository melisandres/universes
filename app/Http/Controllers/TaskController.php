<?php

namespace App\Http\Controllers;
use App\Models\Task;
use App\Models\Universe;
use App\Services\TaskCompletionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

use Illuminate\Http\Request;

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Update task statuses based on deadlines before loading
        Task::updateOverdueStatuses();
        
        $tasks = Task::with(['universeItems.universe', 'recurringTask'])
        ->whereNull('completed_at')
        ->orderBy('deadline_at')
        ->get();

        $universes = Universe::orderBy('name')->get();
        $recurringTasks = \App\Models\RecurringTask::where('active', true)->get();

        return view('tasks.index', compact('tasks', 'universes', 'recurringTasks'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $universes = Universe::orderBy('name')->get();
        $selectedUniverse = $request->get('universe_id');
        $recurringTasks = \App\Models\RecurringTask::where('active', true)->get();
    
        return view('tasks.create', compact('universes', 'selectedUniverse', 'recurringTasks'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'estimated_time' => 'nullable|numeric|min:0',
            'time_unit' => 'nullable|string|in:minutes,hours',
            'description' => 'nullable|string',
            'universe_ids' => 'required|array|min:1',
            'universe_ids.*' => 'required|exists:universes,id',
            'primary_universe' => 'required|integer|min:0',
            'deadline_at' => 'nullable|date',
            'recurring_task_id' => 'nullable|exists:recurring_tasks,id',
            'status' => 'nullable|string|in:open,completed,skipped,late',
        ]);
        
        // Convert datetime-local format to proper datetime
        if (!empty($validated['deadline_at'])) {
            $validated['deadline_at'] = \Carbon\Carbon::parse($validated['deadline_at']);
        } else {
            $validated['deadline_at'] = null;
        }
        
        // Convert estimated_time to minutes if provided
        if (isset($validated['estimated_time']) && $validated['estimated_time'] !== null) {
            $timeUnit = $validated['time_unit'] ?? 'minutes'; // Default to minutes if not specified
            if ($timeUnit === 'hours') {
                $validated['estimated_time'] = (int) round($validated['estimated_time'] * 60);
            } else {
                $validated['estimated_time'] = (int) round($validated['estimated_time']);
            }
        } else {
            $validated['estimated_time'] = null;
        }
        unset($validated['time_unit']); // Remove time_unit as it's not a database field
    
        $universeIds = $validated['universe_ids'];
        $primaryIndex = (int) $validated['primary_universe'];
        unset($validated['universe_ids'], $validated['primary_universe']);
        
        $task = Task::create($validated);
        
        // Create universe_item relationships
        foreach ($universeIds as $index => $universeId) {
            \App\Models\UniverseItem::create([
                'universe_id' => $universeId,
                'item_type' => 'App\Models\Task',
                'item_id' => $task->id,
                'is_primary' => ($index === $primaryIndex),
            ]);
        }
        
        // Reload task with relationships for rendering
        $task->load('universeItems.universe', 'recurringTask');
        
        // Check if this is an AJAX request
        $isAjax = $request->ajax() 
            || $request->wantsJson() 
            || $request->header('X-Requested-With') === 'XMLHttpRequest'
            || str_contains($request->header('Accept', ''), 'application/json');
        
        // For AJAX requests, return JSON with HTML partial
        if ($isAjax) {
            // Get the current universe (primary universe)
            $currentUniverse = null;
            if ($primaryIndex >= 0 && isset($universeIds[$primaryIndex])) {
                $currentUniverse = Universe::find($universeIds[$primaryIndex]);
            }
            
            // Get all universes and recurring tasks for the partial
            $allUniverses = Universe::orderBy('name')->get();
            $recurringTasks = \App\Models\RecurringTask::where('active', true)->get();
            
            // Render the task card partial
            $taskCardHtml = view('tasks._task_card', [
                'task' => $task,
                'inlineEdit' => true,
                'currentUniverse' => $currentUniverse,
                'referer' => $request->input('referer', request()->fullUrl()),
                'universes' => $allUniverses,
                'recurringTasks' => $recurringTasks
            ])->render();
            
            return response()->json([
                'success' => true,
                'message' => 'Task created successfully',
                'task' => $task,
                'html' => $taskCardHtml
            ]);
        }
    
        // Redirect back to referer if available and valid, otherwise to tasks index
        $referer = $request->input('referer');
        if ($referer) {
            // Only redirect to URLs within our application
            $appUrl = url('/');
            if (str_starts_with($referer, $appUrl)) {
                return redirect($referer);
            }
        }
        
        // Fallback: redirect to universes index
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
     * Show the form for editing the specified resource.
     */
    public function edit(Request $request, Task $task)
    {
        $task->load('universeItems.universe');
        $universes = Universe::orderBy('name')->get();
        $recurringTasks = \App\Models\RecurringTask::where('active', true)->get();
        $referer = $request->input('referer') ?? $request->header('referer');
        return view('tasks.edit', compact('task', 'universes', 'recurringTasks', 'referer'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Task $task)
    {
        // Force logging to file to debug - use file_put_contents as backup
        $logFile = storage_path('logs/debug.log');
        $logMessage = date('Y-m-d H:i:s') . " - Task update START for task {$task->id}\n";
        @file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
        
        // Check for AJAX indicators FIRST, before any processing
        $acceptHeader = $request->header('Accept', '');
        $xRequestedWith = $request->header('X-Requested-With', '');
        $contentType = $request->header('Content-Type', '');
        
        $logMessage = "  method={$request->method()}, _method={$request->input('_method')}\n";
        $logMessage .= "  Accept={$acceptHeader}\n";
        $logMessage .= "  X-Requested-With={$xRequestedWith}\n";
        $logMessage .= "  Content-Type={$contentType}\n";
        $logMessage .= "  ajax()=" . ($request->ajax() ? 'true' : 'false') . "\n";
        $logMessage .= "  wantsJson()=" . ($request->wantsJson() ? 'true' : 'false') . "\n";
        @file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
        
        // Check for AJAX - be VERY permissive
        // If X-Requested-With is XMLHttpRequest, it's definitely AJAX
        $isAjax = $xRequestedWith === 'XMLHttpRequest' 
            || str_contains($acceptHeader, 'application/json')
            || $request->ajax() 
            || $request->wantsJson();
        
        $logMessage = date('Y-m-d H:i:s') . " - isAjax={$isAjax}\n";
        @file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
        
        // If it's AJAX, we'll return JSON at the end - continue processing
        // Force logging to file to debug
        Log::info('Task update request received', [
            'task_id' => $task->id,
            'is_ajax' => $request->ajax(),
            'wants_json' => $request->wantsJson(),
            'accept_header' => $request->header('Accept'),
            'x_requested_with' => $request->header('X-Requested-With'),
            'all_headers' => $request->headers->all(),
        ]);
        
        try {
            $validated = $request->validate([
            'name' => 'required|string|max:255',
            'estimated_time' => 'nullable|numeric|min:0',
            'time_unit' => 'nullable|string|in:minutes,hours',
            'description' => 'nullable|string',
            'universe_ids' => 'required|array|min:1',
            'universe_ids.*' => 'required|exists:universes,id',
            'primary_universe' => 'required|integer|min:0',
            'deadline_at' => 'nullable|date',
            'recurring_task_id' => 'nullable|exists:recurring_tasks,id',
            'status' => 'nullable|string|in:open,completed,skipped,late',
        ]);
        
        // Convert datetime-local format to proper datetime
        if (!empty($validated['deadline_at'])) {
            $validated['deadline_at'] = \Carbon\Carbon::parse($validated['deadline_at']);
        } else {
            $validated['deadline_at'] = null;
        }
        
        // Convert estimated_time to minutes if provided
        if (isset($validated['estimated_time']) && $validated['estimated_time'] !== null) {
            $timeUnit = $validated['time_unit'] ?? 'minutes'; // Default to minutes if not specified
            if ($timeUnit === 'hours') {
                $validated['estimated_time'] = (int) round($validated['estimated_time'] * 60);
            } else {
                $validated['estimated_time'] = (int) round($validated['estimated_time']);
            }
        } else {
            $validated['estimated_time'] = null;
        }
        unset($validated['time_unit']); // Remove time_unit as it's not a database field
        
        $universeIds = array_values($validated['universe_ids']); // Re-index array to ensure sequential indices
        $primaryIndex = (int) $validated['primary_universe'];
        unset($validated['universe_ids'], $validated['primary_universe']);
    
        // Ensure we have at least one universe BEFORE updating
        if (empty($universeIds)) {
            Log::error('Task update attempted with no universe_ids', ['task_id' => $task->id, 'request' => $request->all()]);
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json(['success' => false, 'errors' => ['universe_ids' => ['At least one universe is required.']]], 422);
            }
            return back()->withErrors(['universe_ids' => 'At least one universe is required.']);
        }
        
        // Ensure primary index is valid BEFORE updating
        if ($primaryIndex < 0 || $primaryIndex >= count($universeIds)) {
            Log::error('Task update with invalid primary_universe index', [
                'task_id' => $task->id,
                'primary_index' => $primaryIndex,
                'universe_ids_count' => count($universeIds),
                'universe_ids' => $universeIds,
                'request_data' => $request->all()
            ]);
            // Default to first universe if index is invalid
            $primaryIndex = 0;
        }
        
        // Auto-update status to "late" if deadline has passed (unless completed/skipped)
        // Only override status if deadline_at is actually being changed, or if status is not explicitly set
        if (isset($validated['deadline_at']) && $validated['deadline_at']) {
            $deadline = \Carbon\Carbon::parse($validated['deadline_at']);
            if ($task->completed_at === null && $task->skipped_at === null) {
                // Only update status if it's not explicitly set in the request, or if deadline is past
                if (!isset($validated['status']) || $validated['status'] === null) {
                    // Status not explicitly set - compute it from deadline
                    if ($deadline->isPast() && !$deadline->isToday()) {
                        $validated['status'] = 'late';
                    } else {
                        $validated['status'] = 'open';
                    }
                } elseif ($deadline->isPast() && !$deadline->isToday()) {
                    // Deadline is past - always set to late (even if status was set to something else)
                    $validated['status'] = 'late';
                }
                // If status is explicitly set to 'late' and deadline is not past, keep the status as-is
                // Don't override it to 'open' - trust the explicit status value
            }
        }
        
        // Use a transaction to ensure data consistency
        DB::transaction(function () use ($task, $validated, $universeIds, $primaryIndex) {
            // Update the task
            $task->update($validated);
            
            // Delete existing universe_items
            $task->universeItems()->delete();
            
            // Create new universe_item relationships
            foreach ($universeIds as $index => $universeId) {
                \App\Models\UniverseItem::create([
                    'universe_id' => $universeId,
                    'item_type' => 'App\Models\Task',
                    'item_id' => $task->id,
                    'is_primary' => ($index === $primaryIndex),
                ]);
            }
        });
        
        // Refresh the task to ensure relationships are loaded
        $task->refresh();
        $task->load('universeItems.universe');
        
        // Log the update for debugging
        Log::info('Task updated successfully', [
            'task_id' => $task->id,
            'task_name' => $task->name,
            'universe_ids' => $universeIds,
            'primary_index' => $primaryIndex,
            'primary_universe_id' => $universeIds[$primaryIndex] ?? null,
            'universe_items_count' => $task->universeItems->count(),
            'completed_at' => $task->completed_at,
            'snooze_until' => $task->snooze_until,
        ]);
    
        // Use the $isAjax variable we set at the beginning
        // For AJAX requests, ALWAYS return JSON response
        if ($isAjax) {
            $logMessage = date('Y-m-d H:i:s') . " - Returning JSON response (isAjax=true from start)\n";
            @file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
            
            Log::info('Returning JSON response for AJAX request', [
                'task_id' => $task->id,
                'via' => $xRequestedWith === 'XMLHttpRequest' ? 'X-Requested-With header' : 
                        (str_contains($acceptHeader, 'application/json') ? 'Accept header' : 
                        ($request->ajax() ? 'ajax() method' : 'wantsJson() method'))
            ]);
            return response()->json([
                'success' => true,
                'message' => 'Task updated successfully',
                'task' => $task->load('universeItems.universe')
            ]);
        }
        
        // Final safety check - if X-Requested-With is present, it's definitely AJAX
        // This catches cases where the initial check might have failed
        if ($xRequestedWith === 'XMLHttpRequest') {
            $logMessage = date('Y-m-d H:i:s') . " - Final safety check: X-Requested-With found, returning JSON\n";
            @file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
            return response()->json([
                'success' => true,
                'message' => 'Task updated successfully',
                'task' => $task->load('universeItems.universe')
            ]);
        }
        
        // Log if we're NOT returning JSON (for debugging)
        $logMessage = date('Y-m-d H:i:s') . " - NOT returning JSON, returning redirect\n";
        @file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
        
        Log::warning('Task update NOT returning JSON - returning redirect instead', [
            'task_id' => $task->id,
            'accept_header' => $acceptHeader,
            'ajax_method' => $request->ajax(),
            'wants_json' => $request->wantsJson(),
            'x_requested_with' => $xRequestedWith,
        ]);
        
        // Redirect back to referer if available and valid, otherwise back
        $referer = $request->input('referer') ?? $request->header('referer');
        if ($referer) {
            // Only redirect to URLs within our application
            $appUrl = url('/');
            if (str_starts_with($referer, $appUrl)) {
                return redirect($referer);
            }
        }
        
        return redirect()->back();
        } catch (\Illuminate\Validation\ValidationException $e) {
            $logFile = storage_path('logs/debug.log');
            $logMessage = date('Y-m-d H:i:s') . " - Validation failed for task {$task->id}\n";
            $logMessage .= "  ajax()=" . ($request->ajax() ? 'true' : 'false') . "\n";
            $logMessage .= "  wantsJson()=" . ($request->wantsJson() ? 'true' : 'false') . "\n";
            $logMessage .= "  X-Requested-With={$request->header('X-Requested-With', '')}\n";
            $logMessage .= "  Accept={$request->header('Accept', '')}\n";
            $logMessage .= "  Errors: " . json_encode($e->errors()) . "\n";
            @file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
            
            Log::error('Task update validation failed', [
                'task_id' => $task->id,
                'errors' => $e->errors(),
            ]);
            
            // Check AJAX again in catch block - be very permissive
            $xRequestedWith = $request->header('X-Requested-With', '');
            $acceptHeader = $request->header('Accept', '');
            $isAjax = $xRequestedWith === 'XMLHttpRequest' 
                || str_contains($acceptHeader, 'application/json')
                || $request->ajax() 
                || $request->wantsJson();
            
            if ($isAjax) {
                return response()->json([
                    'success' => false,
                    'errors' => $e->errors(),
                    'message' => 'Validation failed'
                ], 422);
            }
            
            throw $e;
        } catch (\Exception $e) {
            Log::error('Task update failed with exception', [
                'task_id' => $task->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'An error occurred: ' . $e->getMessage()
                ], 500);
            }
            
            throw $e;
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Task $task)
    {
        $task->delete();
        
        // Return JSON for AJAX requests
        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Task deleted successfully'
            ]);
        }
        
        return redirect()->back();
    }
    public function complete(Request $request, Task $task, TaskCompletionService $service)
    {
        $service->complete($task);
        
        // Return JSON for AJAX requests
        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Task completed successfully'
            ]);
        }
        
        return back();
    }

    public function skip(Request $request, Task $task, TaskCompletionService $service)
    {
        $task->update([
            'skipped_at' => now(),
            'status' => 'skipped',
        ]);

        // Handle recurring task - create next instance with deadline based on interval
        if ($task->isRecurring()) {
            $recurringTask = $task->recurringTask;
            // Calculate next deadline from the skipped task's deadline (if it exists), otherwise from now
            $fromDate = $task->deadline_at ?? now();
            $nextDeadline = $recurringTask->nextDeadline($fromDate->copy());
            $service->createNextRecurringInstance($task, $nextDeadline);
        }

        // Return JSON for AJAX requests
        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Task skipped successfully'
            ]);
        }

        return back();
    }

    public function log(Request $request, Task $task)
    {
        try {
            $validated = $request->validate([
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

            \App\Models\Log::create([
                'loggable_type' => 'App\Models\Task',
                'loggable_id' => $task->id,
                'minutes' => $minutes,
                'notes' => $validated['notes'] ?? null,
            ]);

            // Return JSON for AJAX requests
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Task logged successfully'
                ]);
            }

            return back();
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Return JSON for AJAX requests even on validation errors
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'errors' => $e->errors(),
                    'message' => 'Validation failed'
                ], 422);
            }
            
            throw $e;
        } catch (\Exception $e) {
            // Return JSON for AJAX requests on general errors
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'An error occurred: ' . $e->getMessage()
                ], 500);
            }
            
            throw $e;
        }
    }

    public function snooze(Request $request, Task $task)
    {
        $validated = $request->validate([
            'snooze_until' => 'required|date|after:now',
        ]);

        $task->update([
            'snooze_until' => \Carbon\Carbon::parse($validated['snooze_until']),
        ]);

        return back();
    }
}
