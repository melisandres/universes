document.addEventListener('DOMContentLoaded', function() {
    // Get CSRF token
    function getCsrfToken() {
        return document.querySelector('meta[name="csrf-token"]')?.content;
    }

    // Task Selection & Detail Panel
    const taskDetailPanel = document.getElementById('task-detail-panel');
    const taskDetailContent = document.getElementById('task-detail-content');
    const closeTaskPanelBtn = document.getElementById('close-task-panel');
    let selectedTaskId = null;

    // Load task detail when task is clicked
    document.querySelectorAll('.task-item[data-task-id]').forEach(item => {
        item.addEventListener('click', function(e) {
            // Don't trigger if clicking on a button or form inside
            if (e.target.closest('button, form, a')) return;
            
            const taskId = this.dataset.taskId;
            if (taskId) {
                loadTaskDetail(taskId);
            }
        });
    });

    function loadTaskDetail(taskId) {
        selectedTaskId = taskId;
        
        // Fetch task data
        fetch(`/tasks/${taskId}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            // Fetch the task detail HTML
            fetch(`/today/task-detail/${taskId}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'text/html'
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.text();
                }
                throw new Error('Failed to load task details');
            })
            .then(html => {
                taskDetailContent.innerHTML = html;
                taskDetailPanel.style.display = 'block';
                // Re-attach event listeners for forms in the detail panel
                attachTaskActionListeners();
            })
            .catch(() => {
                // Fallback: show basic info
                showBasicTaskInfo(taskId);
            });
        })
        .catch(() => {
            // Fallback: show basic info
            showBasicTaskInfo(taskId);
        });
    }

    function showBasicTaskInfo(taskId) {
        const taskItem = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
        if (taskItem) {
            const taskName = taskItem.querySelector('.task-content strong')?.textContent || 'Task';
            taskDetailContent.innerHTML = `
                <div class="task-detail">
                    <h3>${taskName}</h3>
                    <p>Loading task details...</p>
                    <a href="/tasks/${taskId}/edit" class="btn-action btn-edit">Edit Task</a>
                </div>
            `;
            taskDetailPanel.style.display = 'block';
        }
    }

    // Close task panel
    if (closeTaskPanelBtn) {
        closeTaskPanelBtn.addEventListener('click', function() {
            taskDetailPanel.style.display = 'none';
            selectedTaskId = null;
        });
    }

    // Collapse/Expand Universe Cards
    document.querySelectorAll('.btn-collapse-universe').forEach(btn => {
        btn.addEventListener('click', function() {
            const universeId = this.dataset.universeId;
            const content = document.getElementById(`universe-content-${universeId}`);
            if (content) {
                content.classList.toggle('collapsed');
                this.textContent = content.classList.contains('collapsed') ? '▶' : '▼';
            }
        });
    });

    // Collapse/Expand Deadline Groups
    document.querySelectorAll('.btn-toggle-group').forEach(btn => {
        btn.addEventListener('click', function() {
            const group = this.closest('.deadline-group');
            if (group) {
                group.classList.toggle('collapsed');
                this.textContent = group.classList.contains('collapsed') ? '▶' : '▼';
            }
        });
    });

    // Collapse/Expand Idea Pools
    document.querySelectorAll('.btn-expand-pool').forEach(btn => {
        btn.addEventListener('click', function() {
            const poolCard = this.closest('.idea-pool-card');
            const poolId = poolCard.dataset.poolId;
            const content = document.getElementById(`pool-content-${poolId}`);
            if (content) {
                const isHidden = content.style.display === 'none';
                content.style.display = isHidden ? 'block' : 'none';
                this.textContent = isHidden ? '▼' : '▶';
            }
        });
    });

    // Collapse/Expand Invisible Deadlines Card
    const collapseCardBtn = document.querySelector('.btn-collapse-card');
    if (collapseCardBtn) {
        collapseCardBtn.addEventListener('click', function() {
            const content = document.getElementById('invisible-deadlines-content');
            if (content) {
                content.classList.toggle('collapsed');
                this.textContent = content.classList.contains('collapsed') ? '▶' : '▼';
            }
        });
    }

    // Isolate Universe Toggle
    document.querySelectorAll('.btn-isolate-universe').forEach(btn => {
        btn.addEventListener('click', function() {
            const universeId = this.dataset.universeId;
            toggleIsolateUniverse(universeId);
        });
    });

    function toggleIsolateUniverse(universeId) {
        const isolated = localStorage.getItem('isolatedUniverse') === universeId;
        
        if (isolated) {
            // Restore all universes
            localStorage.removeItem('isolatedUniverse');
            document.querySelectorAll('.universe-card').forEach(card => {
                card.style.display = 'block';
            });
        } else {
            // Isolate this universe
            localStorage.setItem('isolatedUniverse', universeId);
            document.querySelectorAll('.universe-card').forEach(card => {
                if (card.dataset.universeId !== universeId) {
                    card.style.display = 'none';
                } else {
                    card.style.display = 'block';
                }
            });
        }
    }

    // Restore isolated state on page load
    const isolatedUniverseId = localStorage.getItem('isolatedUniverse');
    if (isolatedUniverseId) {
        document.querySelectorAll('.universe-card').forEach(card => {
            if (card.dataset.universeId !== isolatedUniverseId) {
                card.style.display = 'none';
            }
        });
    }

    // Attach task action listeners (called after loading task detail)
    function attachTaskActionListeners() {
        document.querySelectorAll('.task-action-form').forEach(form => {
            // Remove existing listeners by cloning
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            const action = newForm.action;
            
            if (action.includes('/complete')) {
                newForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    submitTaskAction(this, 'complete');
                });
            } else if (action.includes('/skip')) {
                newForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    submitTaskAction(this, 'skip');
                });
            } else if (action.includes('/snooze')) {
                newForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    submitTaskAction(this, 'snooze');
                });
            } else if (action.includes('/log')) {
                newForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    submitTaskAction(this, 'log');
                });
            }
        });
    }

    // AJAX Actions for Tasks (initial load)
    attachTaskActionListeners();
    
    // Also attach to forms that might be in the page initially
    document.querySelectorAll('.task-action-form').forEach(form => {
        const action = form.action;
        
        if (action.includes('/complete')) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                submitTaskAction(this, 'complete');
            });
        } else if (action.includes('/skip')) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                submitTaskAction(this, 'skip');
            });
        } else if (action.includes('/snooze')) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                submitTaskAction(this, 'snooze');
            });
        } else if (action.includes('/log')) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                submitTaskAction(this, 'log');
            });
        }
    });

    function submitTaskAction(form, action) {
        const formData = new FormData(form);
        const csrfToken = getCsrfToken();
        formData.append('_token', csrfToken);

        fetch(form.action, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json'
            },
            body: formData
        })
        .then(response => {
            if (response.ok) {
                // Reload page to reflect changes
                window.location.reload();
            } else {
                return response.json().then(data => {
                    alert('Error: ' + (data.message || 'Something went wrong'));
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred');
        });
    }

    // Toggle Logs Panel
    const toggleLogsPanelBtn = document.getElementById('toggle-logs-panel');
    if (toggleLogsPanelBtn) {
        toggleLogsPanelBtn.addEventListener('click', function() {
            const logsContent = document.getElementById('logs-content');
            if (logsContent) {
                const isHidden = logsContent.style.display === 'none';
                logsContent.style.display = isHidden ? 'block' : 'none';
                this.textContent = isHidden ? '−' : '+';
            }
        });
    }

    // Create Log Form (standalone)
    const createLogForm = document.getElementById('create-log-form');
    if (createLogForm) {
        createLogForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const csrfToken = getCsrfToken();
            formData.append('_token', csrfToken);

            fetch(this.action, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json'
                },
                body: formData
            })
            .then(response => {
                if (response.ok) {
                    window.location.reload();
                } else {
                    return response.json().then(data => {
                        alert('Error: ' + (data.message || 'Something went wrong'));
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred');
            });
        });
    }

    // Universe Status Dropdown (reuse from universes.js pattern)
    document.querySelectorAll('.universe-status-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', function() {
            const universeId = this.dataset.universeId;
            const updateUrl = this.dataset.updateUrl;
            const status = this.value;
            
            this.disabled = true;
            
            const formData = new FormData();
            const csrfToken = getCsrfToken();
            formData.append('_token', csrfToken);
            formData.append('_method', 'PUT');
            formData.append('status', status);
            
            // Get universe name
            const universeCard = document.querySelector(`.universe-card[data-universe-id="${universeId}"]`);
            const universeName = universeCard?.querySelector('.universe-name')?.textContent || '';
            formData.append('name', universeName);
            
            fetch(updateUrl, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json'
                },
                body: formData
            })
            .then(response => {
                this.disabled = false;
                if (!response.ok) {
                    this.value = this.dataset.originalValue || '';
                    return response.json().then(data => {
                        alert('Error updating status: ' + (data.message || 'Unknown error'));
                    });
                }
                // Reload to reflect status changes (may affect visibility)
                window.location.reload();
            })
            .catch(error => {
                this.disabled = false;
                this.value = this.dataset.originalValue || '';
                console.error('Error:', error);
                alert('An error occurred');
            });
        });
    });
});

