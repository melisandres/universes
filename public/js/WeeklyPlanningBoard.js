/**
 * Weekly Universe Planning Board
 * Vue 3 Composition API component with drag-and-drop
 */

window.WeeklyPlanningBoard = {
    setup(initialData) {
        const { ref, computed, onMounted, nextTick } = Vue;

        // Status order (predefined)
        const statusOrder = [
            'not_started',
            'next_small_steps',
            'in_focus',
            'in_orbit',
            'dormant',
            'done',
        ];

        // Reactive state
        const universes = ref(initialData.universes || []);
        const sortableInstances = ref({});
        const isDragging = ref(false);

        // Format status for display
        const formatStatus = (status) => {
            return status.replace(/_/g, ' ');
        };

        // Get universes filtered by status, sorted by weekly_order then name
        const getUniversesByStatus = (status) => {
            return universes.value
                .filter(u => u.status === status)
                .sort((a, b) => {
                    // Sort by weekly_order first (nulls last), then by name
                    if (a.weekly_order === null && b.weekly_order === null) {
                        return a.name.localeCompare(b.name);
                    }
                    if (a.weekly_order === null) return 1;
                    if (b.weekly_order === null) return -1;
                    if (a.weekly_order !== b.weekly_order) {
                        return a.weekly_order - b.weekly_order;
                    }
                    return a.name.localeCompare(b.name);
                });
        };

        const applyOrderFromZone = (zoneElement, status) => {
            if (!zoneElement) {
                return [];
            }

            const orderedIds = Array.from(
                zoneElement.querySelectorAll('.universe-card-small')
            ).map(el => Number(el.dataset.universeId)).filter(Boolean);

            const updates = [];
            orderedIds.forEach((id, index) => {
                const universe = universes.value.find(u => Number(u.id) === id);
                if (!universe) {
                    return;
                }
                universe.status = status;
                universe.weekly_order = index * 100;
                updates.push({
                    id: universe.id,
                    status: universe.status,
                    weekly_order: universe.weekly_order,
                });
            });

            return updates;
        };

        const persistOrderUpdates = async (updates) => {
            if (!updates.length) {
                return;
            }

            try {
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
                if (!csrfToken) {
                    throw new Error('CSRF token not found');
                }

                const response = await fetch('/universes/update-weekly-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        updates,
                    })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || 'Failed to update universe order');
                }
            } catch (error) {
                console.error('Error updating universe order:', error);
                if (window.ErrorHandler && window.ErrorHandler.handleError) {
                    window.ErrorHandler.handleError(error, {
                        context: 'updating universe order',
                        showAlert: true
                    });
                } else {
                    alert('Error updating universe order: ' + error.message);
                }
            }
        };

        // Initialize Sortable for a status zone
        const initSortable = (status, element) => {
            if (!element || sortableInstances.value[status]) {
                return; // Already initialized or element not found
            }

            sortableInstances.value[status] = Sortable.create(element, {
                group: 'universes', // Allow dragging between zones
                animation: 150,
                handle: '.universe-card-handle', // Only allow dragging by handle
                ghostClass: 'universe-card-ghost',
                chosenClass: 'universe-card-chosen',
                dragClass: 'universe-card-drag',
                fallbackOnBody: true,
                swapThreshold: 0.65,
                forceFallback: true, // Better mobile support
                onStart: () => {
                    isDragging.value = true;
                },
                onEnd: (evt) => {
                    isDragging.value = false;
                    
                    const { item, to, from, newIndex, oldIndex } = evt;
                    const universeId = parseInt(item.dataset.universeId, 10);
                    
                    if (!universeId) {
                        console.error('Universe ID not found on dragged item');
                        return;
                    }

                    // Determine target status from the zone
                    const targetStatus = to.dataset.status;
                    if (!targetStatus) {
                        console.error('Target status not found');
                        return;
                    }

                    // Get the universe to check its current status
                    const universe = universes.value.find(u => u.id === universeId);
                    if (!universe) {
                        console.error('Universe not found');
                        return;
                    }

                    // If moving within the same zone and position didn't change, skip update
                    if (from === to && oldIndex === newIndex) {
                        return;
                    }

                    const updates = [];
                    updates.push(...applyOrderFromZone(to, targetStatus));
                    if (from !== to) {
                        const oldStatus = from.dataset.status;
                        if (oldStatus) {
                            updates.push(...applyOrderFromZone(from, oldStatus));
                        }
                    }

                    persistOrderUpdates(updates);
                },
            });
        };

        // Initialize all sortable instances after mount
        onMounted(() => {
            nextTick(() => {
                statusOrder.forEach(status => {
                    const element = document.getElementById(`status-zone-${status}`);
                    if (element) {
                        initSortable(status, element);
                    }
                });
            });
        });

        return {
            statusOrder,
            universes,
            isDragging,
            formatStatus,
            getUniversesByStatus,
        };
    },

    template: `
        <div class="weekly-planning-board">
            <div class="status-zones-container">
                <div 
                    v-for="status in statusOrder" 
                    :key="status"
                    class="status-zone"
                    :data-status="status"
                >
                    <div class="status-zone-header">
                        <h2 class="status-zone-title">{{ formatStatus(status) }}</h2>
                        <span class="status-zone-count">
                            ({{ getUniversesByStatus(status).length }})
                        </span>
                    </div>
                    <div 
                        :id="'status-zone-' + status"
                        class="status-zone-content"
                        :data-status="status"
                    >
                        <div
                            v-for="universe in getUniversesByStatus(status)"
                            :key="universe.id"
                            :class="['universe-card-small', 'universe-status-' + universe.status.replace(/_/g, '-')]"
                            :data-universe-id="universe.id"
                        >
                            <div class="universe-card-handle">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="9" cy="12" r="1"></circle>
                                    <circle cx="9" cy="5" r="1"></circle>
                                    <circle cx="9" cy="19" r="1"></circle>
                                    <circle cx="15" cy="12" r="1"></circle>
                                    <circle cx="15" cy="5" r="1"></circle>
                                    <circle cx="15" cy="19" r="1"></circle>
                                </svg>
                            </div>
                            <div class="universe-card-name">{{ universe.name }}</div>
                        </div>
                        <div 
                            v-if="getUniversesByStatus(status).length === 0"
                            class="status-zone-empty"
                        >
                            No universes
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};
