<?php

namespace App\Services;

use App\Models\Task;
use App\Models\Log;
use Carbon\Carbon;

class TaskCompletionService
{
    public function complete(Task $task, array $options = [])
    {
        $task->update([
            'completed_at' => now(),
            'status' => 'completed',
        ]);

        // Create log
        Log::create([
            'loggable_type' => 'App\Models\Task',
            'loggable_id' => $task->id,
            'minutes' => $options['minutes'] ?? null,
            'notes' => $options['notes'] ?? null,
        ]);

        // Handle recurring
        if ($task->isRecurring() && ($options['create_next'] ?? true)) {
            $this->createNextRecurringInstance($task, $options['next_deadline'] ?? null);
        }
    }

    public function createNextRecurringInstance(Task $task, ?Carbon $deadline)
    {
        $recurring = $task->recurringTask;
        $universeItem = $task->universeItems()->where('is_primary', true)->first();

        $newTask = Task::create([
            'name' => $task->name,
            'recurring_task_id' => $recurring->id,
            'deadline_at' => $deadline
                ?? $recurring->nextDeadline(now()),
        ]);
        
        // Create universe_item for the new task if the original had one
        if ($universeItem) {
            \App\Models\UniverseItem::create([
                'universe_id' => $universeItem->universe_id,
                'item_type' => 'App\Models\Task',
                'item_id' => $newTask->id,
                'is_primary' => true,
            ]);
        }
    }
}
