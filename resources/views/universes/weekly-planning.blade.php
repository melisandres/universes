@extends('layouts.app')

@section('title', 'Weekly Universe Planning')

@section('content')
<div class="weekly-planning-page-header">
    <h1>Weekly Universe Planning</h1>
    <div class="weekly-planning-header-actions">
        <a href="{{ route('universes.index') }}">← Back to Universes</a>
    </div>
</div>

<div id="weekly-planning-vue-app">
    <!-- Vue will render here -->
    <p>Loading...</p>
</div>

<script type="application/json" id="weekly-planning-initial-data">
{!! json_encode($initialData) !!}
</script>

@push('scripts')
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
<script src="{{ asset('js/WeeklyPlanningBoard.js') }}"></script>
<script>
(function() {
    function initVueApp() {
        // Check if Vue is loaded
        if (typeof Vue === 'undefined') {
            console.error('Vue is not loaded!');
            setTimeout(initVueApp, 100);
            return;
        }
        
        // Check if Sortable is loaded
        if (typeof Sortable === 'undefined') {
            console.error('Sortable is not loaded!');
            setTimeout(initVueApp, 100);
            return;
        }
        
        // Check if component is loaded
        if (typeof window.WeeklyPlanningBoard === 'undefined') {
            setTimeout(initVueApp, 100);
            return;
        }
        
        try {
            const { createApp } = Vue;

            const initialDataEl = document.getElementById('weekly-planning-initial-data');
            if (!initialDataEl) {
                console.error('Initial data element not found!');
                return;
            }
            
            const initialData = JSON.parse(initialDataEl.textContent);

            const app = createApp({
                setup() {
                    return window.WeeklyPlanningBoard.setup(initialData);
                },
                template: window.WeeklyPlanningBoard.template
            });

            const mountElement = document.getElementById('weekly-planning-vue-app');
            if (!mountElement) {
                console.error('Mount element not found!');
                return;
            }
            
            app.mount('#weekly-planning-vue-app');
        } catch (error) {
            console.error('Error mounting Vue app:', error);
            console.error(error.stack);
        }
    }
    
    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVueApp);
    } else {
        // DOM is already ready
        initVueApp();
    }
})();
</script>
@endpush
@endsection
