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
        
        return view('today.index', compact(
            'visibleUniverses',
            'tasksByUniverse',
            'tasksFromInvisibleUniverses',
            'secondaryTaskRefs',
            'ideaPools',
            'todayLogs',
            'statuses'
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
}
