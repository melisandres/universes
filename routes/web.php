<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UniverseController;
use App\Http\Controllers\RecurringTaskController;
use App\Http\Controllers\IdeaController;
use App\Http\Controllers\IdeaPoolController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\TodayController;

Route::get('/', function () {
    return redirect()->route('universes.index');
});

Route::get('/universes/weekly-planning', [UniverseController::class, 'weeklyPlanning'])->name('universes.weekly-planning');
Route::post('/universes/update-weekly-order', [UniverseController::class, 'updateWeeklyOrder'])->name('universes.update-weekly-order');
Route::post('/universes/{universe}/log', [UniverseController::class, 'log'])->name('universes.log');

Route::resource('universes', UniverseController::class);
Route::resource('tasks', TaskController::class);
Route::resource('recurring-tasks', RecurringTaskController::class);
Route::resource('idea-pools', IdeaPoolController::class);
Route::resource('ideas', IdeaController::class);
Route::resource('logs', LogController::class);

Route::post('/tasks/{task}/complete', [TaskController::class, 'complete'])->name('tasks.complete');
Route::post('/tasks/{task}/skip', [TaskController::class, 'skip'])->name('tasks.skip');
Route::post('/tasks/{task}/log', [TaskController::class, 'log'])->name('tasks.log');
Route::post('/tasks/{task}/snooze', [TaskController::class, 'snooze'])->name('tasks.snooze');
Route::post('/tasks/update-order', [TaskController::class, 'updateOrder'])->name('tasks.update-order');

Route::post('/recurring-tasks/{recurringTask}/seed', [RecurringTaskController::class, 'seed'])->name('recurring-tasks.seed');

Route::get('/today', [TodayController::class, 'index'])->name('today.index');
Route::get('/today/task-detail/{task}', [TodayController::class, 'taskDetail'])->name('today.task-detail');

// Debug route to check task status
Route::get('/debug/task/{task}', function (\App\Models\Task $task) {
    $task->load('universeItems.universe');
    return response()->json([
        'task_id' => $task->id,
        'name' => $task->name,
        'completed_at' => $task->completed_at,
        'snooze_until' => $task->snooze_until,
        'deadline_at' => $task->deadline_at,
        'status' => $task->status,
        'universe_items' => $task->universeItems->map(function ($item) {
            return [
                'universe_id' => $item->universe_id,
                'universe_name' => $item->universe->name,
                'is_primary' => $item->is_primary,
            ];
        }),
    ]);
})->name('debug.task');
