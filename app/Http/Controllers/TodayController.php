<?php

namespace App\Http\Controllers;

use App\Models\Universe;
use App\Models\Task;
use App\Models\IdeaPool;
use App\Models\Log;
use App\Models\UniverseItem;
use App\Services\WeekHelper;
use Illuminate\Http\Request;
use Carbon\Carbon;

class TodayController extends Controller
{
    public function index()
    {
        $today = now();
        
        // Update task statuses based on deadlines before loading
        Task::updateOverdueStatuses();
        
        // Get visible universes
        $visibleUniverses = Universe::visibleForToday()
            ->orderBy('name')
            ->get();
        
        // Get invisible universe IDs for filtering
        $invisibleUniverseIds = Universe::invisibleForToday()->pluck('id');
        
        // Get visible universe IDs for faster lookup
        $visibleUniverseIds = $visibleUniverses->pluck('id');
        
        // Get all incomplete, non-snoozed tasks with their universe items
        $allTasks = Task::incomplete()
            ->notSnoozed()
            ->with(['universeItems.universe', 'recurringTask'])
            ->get();
        
        // Organize tasks by universe and deadline groups
        $tasksByUniverse = [];
        $tasksFromInvisibleUniverses = [];
        
        foreach ($allTasks as $task) {
            $primaryUniverseItem = $task->universeItems->where('is_primary', true)->first();
            
            if ($primaryUniverseItem && $visibleUniverseIds->contains($primaryUniverseItem->universe_id)) {
                // Task belongs to a visible universe
                $universeId = $primaryUniverseItem->universe_id;
                
                if (!isset($tasksByUniverse[$universeId])) {
                    $tasksByUniverse[$universeId] = [
                        'overdue' => [],
                        'today' => [],
                        'this_week' => [],
                        'next_week' => [],
                        'later' => [],
                        'no_deadline' => [],
                    ];
                }
                
                $deadlineGroup = $this->getDeadlineGroup($task);
                $tasksByUniverse[$universeId][$deadlineGroup][] = $task;
            } elseif ($primaryUniverseItem && $invisibleUniverseIds->contains($primaryUniverseItem->universe_id)) {
                // Task belongs to an invisible universe
                // Only include tasks with deadlines in this section
                if ($task->deadline_at) {
                    $deadlineGroup = $this->getDeadlineGroup($task);
                    
                    if (!isset($tasksFromInvisibleUniverses[$deadlineGroup])) {
                        $tasksFromInvisibleUniverses[$deadlineGroup] = [];
                    }
                    
                    $tasksFromInvisibleUniverses[$deadlineGroup][] = [
                        'task' => $task,
                        'universe' => $primaryUniverseItem->universe,
                    ];
                }
            }
        }
        
        // Sort tasks by order within each deadline group for each universe
        foreach ($tasksByUniverse as $universeId => $groups) {
            foreach ($groups as $groupName => $tasks) {
                usort($tasks, function($a, $b) use ($universeId) {
                    $aItem = $a->universeItems->where('universe_id', $universeId)->where('is_primary', true)->first();
                    $bItem = $b->universeItems->where('universe_id', $universeId)->where('is_primary', true)->first();
                    
                    $aOrder = $aItem ? ($aItem->order ?? PHP_INT_MAX) : PHP_INT_MAX;
                    $bOrder = $bItem ? ($bItem->order ?? PHP_INT_MAX) : PHP_INT_MAX;
                    
                    if ($aOrder !== $bOrder) {
                        return $aOrder <=> $bOrder;
                    }
                    
                    // Fallback to created_at if order is the same
                    return $b->created_at <=> $a->created_at;
                });
                $tasksByUniverse[$universeId][$groupName] = $tasks;
            }
        }
        
        // Get secondary task references for visible universes
        $secondaryTaskRefs = [];
        foreach ($visibleUniverses as $universe) {
            $secondaryItems = UniverseItem::where('universe_id', $universe->id)
                ->where('is_primary', false)
                ->where('item_type', 'App\Models\Task')
                ->with(['item.universeItems.universe'])
                ->get();
            
            $secondaryTaskRefs[$universe->id] = [];
            foreach ($secondaryItems as $item) {
                $task = $item->item;
                if ($task && $task->completed_at === null && $this->isNotSnoozed($task)) {
                    $primaryUniverseItem = $task->universeItems->where('is_primary', true)->first();
                    if ($primaryUniverseItem) {
                        $secondaryTaskRefs[$universe->id][] = [
                            'task' => $task,
                            'primary_universe' => $primaryUniverseItem->universe,
                        ];
                    }
                }
            }
        }
        
        // Get idea pools for visible universes
        $ideaPools = IdeaPool::whereHas('universeItems', function ($query) use ($visibleUniverses) {
            $query->whereIn('universe_id', $visibleUniverses->pluck('id'));
        })
        ->with(['ideas', 'universeItems.universe'])
        ->get();
        
        // Get today's logs
        $todayLogs = Log::whereDate('created_at', $today)
            ->with(['loggable'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Status options for universe status dropdown
        $statuses = [
            'not_started',
            'next_small_steps',
            'in_focus',
            'in_orbit',
            'dormant',
            'done',
        ];
        
        // Get all universes for task editing (if needed)
        $allUniverses = Universe::orderBy('name')->get();
        
        // Calculate task counts for all universes (including invisible ones)
        $allUniverseIds = $allUniverses->pluck('id');
        $allTasksByUniverse = [];
        
        foreach ($allTasks as $task) {
            $primaryUniverseItem = $task->universeItems->where('is_primary', true)->first();
            if ($primaryUniverseItem && $allUniverseIds->contains($primaryUniverseItem->universe_id)) {
                $universeId = $primaryUniverseItem->universe_id;
                if (!isset($allTasksByUniverse[$universeId])) {
                    $allTasksByUniverse[$universeId] = 0;
                }
                $allTasksByUniverse[$universeId]++;
            }
        }
        
        // Get recurring tasks for task editing (if needed)
        $recurringTasks = \App\Models\RecurringTask::where('active', true)->get();
        
        // Prepare initial data for Vue
        $initialData = [
            'visible_universes' => $this->formatVisibleUniversesForJson($visibleUniverses, $tasksByUniverse, $secondaryTaskRefs),
            'invisible_deadlines' => $this->formatInvisibleDeadlinesForJson($tasksFromInvisibleUniverses),
            'idea_pools' => $this->formatIdeaPoolsForJson($ideaPools),
            'today_logs' => $this->formatLogsForJson($todayLogs),
            'statuses' => $statuses,
            'all_universes' => $allUniverses->map(function($u) use ($allTasksByUniverse) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'status' => $u->status,
                    'task_count' => $allTasksByUniverse[$u->id] ?? 0
                ];
            })->values(),
            'recurring_tasks' => $recurringTasks->map(fn($rt) => ['id' => $rt->id, 'name' => $rt->name])->values(),
        ];
        
        return view('today.index', compact(
            'visibleUniverses',
            'tasksByUniverse',
            'tasksFromInvisibleUniverses',
            'secondaryTaskRefs',
            'ideaPools',
            'todayLogs',
            'statuses',
            'initialData'
        ));
    }
    
    /**
     * Determine which deadline group a task belongs to
     */
    private function getDeadlineGroup(Task $task): string
    {
        if (!$task->deadline_at) {
            return 'no_deadline';
        }
        
        $deadline = $task->deadline_at;
        
        if (WeekHelper::isOverdue($deadline)) {
            return 'overdue';
        }
        
        if (WeekHelper::isToday($deadline)) {
            return 'today';
        }
        
        if (WeekHelper::isThisWeek($deadline)) {
            return 'this_week';
        }
        
        if (WeekHelper::isNextWeek($deadline)) {
            return 'next_week';
        }
        
        return 'later';
    }
    
    /**
     * Check if a task is not snoozed (helper method)
     */
    private function isNotSnoozed(Task $task): bool
    {
        return $task->snooze_until === null || $task->snooze_until <= now();
    }

    /**
     * Get task detail HTML for the detail panel
     */
    public function taskDetail(Task $task)
    {
        $task->load('universeItems.universe', 'recurringTask');
        return view('today._task_detail', compact('task'))->render();
    }
    
    /**
     * Format visible universes for JSON response.
     * Returns the same format as UniverseController for consistency.
     */
    private function formatVisibleUniversesForJson($visibleUniverses, $tasksByUniverse, $secondaryTaskRefs)
    {
        return $visibleUniverses->map(function ($universe) use ($tasksByUniverse, $secondaryTaskRefs) {
            $universeId = $universe->id;
            $tasks = $tasksByUniverse[$universeId] ?? [];
            
            // Flatten all tasks from deadline groups into a single array
            // Tasks are already sorted by order within each deadline group
            $allTasks = collect();
            foreach (['overdue', 'today', 'this_week', 'next_week', 'later', 'no_deadline'] as $group) {
                if (isset($tasks[$group]) && is_array($tasks[$group])) {
                    $allTasks = $allTasks->merge($tasks[$group]);
                }
            }
            
            // Format all tasks for JSON (already sorted by order in the controller)
            $primaryTasks = $this->formatTasksForJson($allTasks);
            
            return [
                'id' => $universe->id,
                'name' => $universe->name,
                'status' => $universe->status,
                'primary_tasks' => $primaryTasks->values()->all(), // Convert to array and re-index
                'secondary_tasks' => $this->formatSecondaryTaskRefsForJson($secondaryTaskRefs[$universeId] ?? [])->values()->all(), // Match UniverseController format
            ];
        });
    }
    
    /**
     * Format tasks for JSON response (same format as UniverseController).
     */
    private function formatTasksForJson($tasks)
    {
        return $tasks->map(function ($task) {
            // Ensure universeItems are loaded
            if (!$task->relationLoaded('universeItems')) {
                $task->load('universeItems.universe');
            }
            
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
                    'id' => $ui->id,
                    'universe_id' => $ui->universe_id,
                    'is_primary' => $ui->is_primary,
                    'order' => $ui->order,
                ]),
            ];
        });
    }
    
    /**
     * Format secondary task references for JSON response.
     * Matches UniverseController format for consistency.
     */
    private function formatSecondaryTaskRefsForJson($secondaryTaskRefs)
    {
        return collect($secondaryTaskRefs)->map(function ($ref) {
            return [
                'id' => $ref['task']->id,
                'name' => $ref['task']->name,
                'primary_universe' => [
                    'id' => $ref['primary_universe']->id,
                    'name' => $ref['primary_universe']->name,
                ],
            ];
        });
    }
    
    /**
     * Format invisible deadlines for JSON response.
     */
    private function formatInvisibleDeadlinesForJson($tasksFromInvisibleUniverses)
    {
        $result = [
            'overdue' => [],
            'today' => [],
            'this_week' => [],
            'next_week' => [],
            'later' => [],
        ];
        
        foreach ($tasksFromInvisibleUniverses as $group => $items) {
            if ($group === 'no_deadline') {
                continue; // Skip no_deadline for invisible deadlines
            }
            
            $result[$group] = collect($items)->map(function ($item) {
                return [
                    'task' => $this->formatTasksForJson(collect([$item['task']]))->first(),
                    'universe' => [
                        'id' => $item['universe']->id,
                        'name' => $item['universe']->name,
                    ],
                ];
            });
        }
        
        return $result;
    }
    
    /**
     * Format idea pools for JSON response.
     */
    private function formatIdeaPoolsForJson($ideaPools)
    {
        return $ideaPools->map(function ($pool) {
            $primaryUniverseItem = $pool->universeItems->where('is_primary', true)->first();
            
            return [
                'id' => $pool->id,
                'name' => $pool->name,
                'primary_universe' => $primaryUniverseItem ? [
                    'id' => $primaryUniverseItem->universe->id,
                    'name' => $primaryUniverseItem->universe->name,
                ] : null,
                'ideas' => $pool->ideas->map(fn($idea) => [
                    'id' => $idea->id,
                    'title' => $idea->title,
                    'body' => $idea->body,
                ]),
            ];
        });
    }
    
    /**
     * Format logs for JSON response.
     */
    private function formatLogsForJson($logs)
    {
        return $logs->map(function ($log) {
            $loggableTitle = null;
            if ($log->loggable) {
                if ($log->loggable_type === 'App\Models\Task') {
                    $loggableTitle = $log->loggable->name;
                } elseif ($log->loggable_type === 'App\Models\Idea') {
                    $loggableTitle = $log->loggable->title ?: substr($log->loggable->body, 0, 30);
                } elseif ($log->loggable_type === 'App\Models\Universe') {
                    $loggableTitle = $log->loggable->name;
                }
            }
            
            return [
                'id' => $log->id,
                'created_at' => $log->created_at->toIso8601String(),
                'minutes' => $log->minutes,
                'notes' => $log->notes,
                'loggable_type' => $log->loggable_type,
                'loggable_title' => $loggableTitle,
            ];
        });
    }
}
