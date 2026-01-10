<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class LogRequests
{
    public function handle(Request $request, Closure $next)
    {
        if (str_contains($request->path(), 'tasks') && $request->isMethod('post')) {
            file_put_contents(
                storage_path('logs/debug.log'),
                date('Y-m-d H:i:s') . " - Middleware: Request to {$request->path()}, method={$request->method()}, _method={$request->input('_method')}, Accept={$request->header('Accept')}\n",
                FILE_APPEND
            );
        }
        
        return $next($request);
    }
}

