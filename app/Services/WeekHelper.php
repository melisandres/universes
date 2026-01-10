<?php

namespace App\Services;

use Carbon\Carbon;

class WeekHelper
{
    /**
     * Get the start of the week (Monday)
     */
    public static function weekStart(?Carbon $date = null): Carbon
    {
        $date = $date ?? now();
        return $date->copy()->startOfWeek(Carbon::MONDAY);
    }

    /**
     * Get the end of the week (Sunday)
     */
    public static function weekEnd(?Carbon $date = null): Carbon
    {
        $date = $date ?? now();
        return $date->copy()->endOfWeek(Carbon::SUNDAY);
    }

    /**
     * Get the range for "this week" (Monday to Sunday, includes today)
     */
    public static function thisWeekRange(): array
    {
        $start = self::weekStart();
        $end = self::weekEnd();
        
        return [
            'start' => $start,
            'end' => $end,
        ];
    }

    /**
     * Get the range for "next week" (following Monday to Sunday)
     */
    public static function nextWeekRange(): array
    {
        $nextMonday = self::weekStart()->addWeek();
        $nextSunday = self::weekEnd($nextMonday);
        
        return [
            'start' => $nextMonday,
            'end' => $nextSunday,
        ];
    }

    /**
     * Check if a date is in "this week"
     */
    public static function isThisWeek(Carbon $date): bool
    {
        $range = self::thisWeekRange();
        return $date->between($range['start'], $range['end'], true);
    }

    /**
     * Check if a date is in "next week"
     */
    public static function isNextWeek(Carbon $date): bool
    {
        $range = self::nextWeekRange();
        return $date->between($range['start'], $range['end'], true);
    }

    /**
     * Check if a date is today
     */
    public static function isToday(Carbon $date): bool
    {
        return $date->isToday();
    }

    /**
     * Check if a date is overdue (before today)
     */
    public static function isOverdue(Carbon $date): bool
    {
        return $date->isPast() && !$date->isToday();
    }
}

