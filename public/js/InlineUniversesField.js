/**
 * InlineUniversesField - Manages inline editing for universe selection field
 * 
 * This class handles:
 * - Multiple universe selection with primary designation
 * - Dynamic add/remove of universe rows
 * - Display formatting (★ for primary, comma-separated list)
 * - Custom save logic for universe_ids array and primary_universe
 */
class InlineUniversesField {
    constructor(fieldId, config = {}) {
        this.fieldId = fieldId;
        this.taskId = config.taskId;
        this.config = config;
        
        // Cache elements
        this.elements = {
            viewElement: document.getElementById(`inline-view-${fieldId}`),
            editElement: document.getElementById(`inline-edit-${fieldId}`),
            inputElement: document.getElementById(`input-${fieldId}`),
            container: null,
            valueElement: null
        };
        
        if (this.elements.viewElement) {
            this.elements.valueElement = this.elements.viewElement.querySelector('.inline-field-value');
        }
        
        if (this.taskId) {
            this.elements.container = document.getElementById(`universes-container-${this.taskId}`);
        }
        
        // Get universe data from JSON script tag
        this.universeData = this.loadUniverseData();
        this.universeIndex = this.loadUniverseIndex();
        
        this.init();
    }
    
    init() {
        if (!this.elements.viewElement || !this.elements.editElement || !this.elements.inputElement) {
            console.warn(`InlineUniversesField: Missing elements for field ${this.fieldId}`);
            return;
        }
        
        if (!this.elements.container) {
            console.warn(`InlineUniversesField: Universes container not found for task ${this.taskId}`);
            return;
        }
        
        this.setupEditor();
        this.setupEventListeners();
        this.updateSelectOptions(); // Disable already-selected universes in initial selects
        this.updateDisplay();
    }
    
    /**
     * Load universe data from JSON script tag
     */
    loadUniverseData() {
        if (!this.taskId) return {};
        
        const dataEl = document.getElementById(`universes-data-${this.taskId}`);
        if (dataEl && dataEl.textContent.trim()) {
            try {
                return JSON.parse(dataEl.textContent.trim());
            } catch (e) {
                console.error(`Error parsing universe data for task ${this.taskId}:`, e);
                return {};
            }
        }
        return {};
    }
    
    /**
     * Load universe index from JSON script tag
     */
    loadUniverseIndex() {
        if (!this.taskId) return 0;
        
        const indexEl = document.getElementById(`universe-index-data-${this.taskId}`);
        if (indexEl) {
            return parseInt(indexEl.textContent.trim()) || 0;
        }
        return this.elements.container ? this.elements.container.querySelectorAll('.universe-item-row').length : 0;
    }
    
    /**
     * Setup InlineFieldEditor with custom handlers
     */
    setupEditor() {
        if (!window.inlineFieldEditors) {
            window.inlineFieldEditors = {};
        }
        
        window.inlineFieldEditors[this.fieldId] = new InlineFieldEditor(this.fieldId, {
            formatValue: (value) => {
                // This won't be called for complex fields, but we need it for the interface
                return value || 'None';
            },
            onSave: (newValue, oldValue, editor) => this.handleSave(newValue, oldValue, editor)
        });
    }
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Update display when entering edit mode
        const editBtn = document.querySelector(`#inline-view-${this.fieldId} .inline-field-edit-btn`);
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                // Small delay to ensure edit mode is visible
                setTimeout(() => this.updateDisplay(), 10);
            });
        }
        
        // Update display when universes change (add/remove/select change)
        if (this.elements.container) {
            // Use event delegation for dynamic content
            this.elements.container.addEventListener('change', (e) => {
                if (e.target.matches('select[name="universe_ids[]"]')) {
                    // Check for duplicate universe selection
                    this.validateUniverseSelection(e.target);
                    // Update options in all selects to disable already-selected universes
                    this.updateSelectOptions();
                    // Only update if we're in edit mode
                    const editElement = document.getElementById(`inline-edit-${this.fieldId}`);
                    if (editElement && !editElement.classList.contains('d-none')) {
                        this.updateDisplay();
                    }
                } else if (e.target.matches('input[name="primary_universe"]')) {
                    // Only update if we're in edit mode
                    const editElement = document.getElementById(`inline-edit-${this.fieldId}`);
                    if (editElement && !editElement.classList.contains('d-none')) {
                        this.updateDisplay();
                    }
                }
            });
            
            // Handle remove universe button
            this.elements.container.addEventListener('click', (e) => {
                if (e.target.matches('.remove-universe-btn') || e.target.closest('.remove-universe-btn')) {
                    e.preventDefault();
                    e.stopPropagation(); // Prevent TaskCardEditor from also handling this
                    const btn = e.target.matches('.remove-universe-btn') ? e.target : e.target.closest('.remove-universe-btn');
                    this.removeUniverseRow(btn);
                    // Wait a bit for the row to be removed
                    setTimeout(() => this.updateDisplay(), 100);
                }
            });
        }
        
        // Handle add universe button
        const addBtn = document.querySelector(`.add-universe-btn[data-task-id="${this.taskId}"]`);
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent TaskCardEditor from also handling this
                this.addUniverseRow();
                // Wait a bit for the new row to be added
                setTimeout(() => this.updateDisplay(), 100);
            });
        }
    }
    
    /**
     * Update the display value from form inputs
     */
    updateDisplay() {
        if (!this.elements.container || !this.elements.valueElement) {
            return;
        }
        
        const rows = this.elements.container.querySelectorAll('.universe-item-row');
        const universeNames = [];
        
        // Find which row contains the checked primary radio
        const checkedPrimaryRadio = this.elements.container.querySelector('input[name="primary_universe"]:checked');
        const primaryRow = checkedPrimaryRadio ? checkedPrimaryRadio.closest('.universe-item-row') : null;
        
        rows.forEach((row) => {
            const select = row.querySelector('select[name="universe_ids[]"]');
            if (!select) return;
            
            if (select.value && select.value !== '') {
                const selectedOption = select.options[select.selectedIndex];
                const name = selectedOption ? selectedOption.text.trim() : '';
                if (name && name !== '— select universe —') {
                    // Check if this row contains the checked primary radio
                    const isPrimary = (row === primaryRow);
                    universeNames.push(isPrimary ? '★ ' + name : name);
                }
            }
        });
        
        const displayText = universeNames.length > 0 ? universeNames.join(', ') : 'None';
        this.elements.valueElement.textContent = displayText;
    }
    
    /**
     * Add a new universe row
     */
    addUniverseRow() {
        if (!this.elements.container) return;
        
        const newRow = document.createElement('div');
        newRow.className = 'universe-item-row inline-universe-item-row';
        newRow.setAttribute('data-index', this.universeIndex);
        
        // Get currently selected universe IDs (to disable them in the new select)
        const selectedUniverseIds = this.getSelectedUniverseIds();
        
        // Build select options, disabling already-selected universes
        let optionsHtml = '<option value="">— select universe —</option>';
        for (const [id, name] of Object.entries(this.universeData)) {
            const isDisabled = selectedUniverseIds.includes(id);
            optionsHtml += `<option value="${id}" ${isDisabled ? 'disabled' : ''}>${name}</option>`;
        }
        
        // Create select
        const select = document.createElement('select');
        select.name = 'universe_ids[]';
        select.className = 'universe-select inline-universe-select';
        select.required = true;
        select.innerHTML = optionsHtml;
        
        // Create label with radio
        const label = document.createElement('label');
        label.className = 'inline-universe-primary-label';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'primary_universe';
        radio.value = this.universeIndex.toString();
        
        label.appendChild(radio);
        label.appendChild(document.createTextNode(' Primary'));
        
        // Create remove button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-universe-btn inline-universe-remove-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.dataset.taskId = this.taskId;
        
        // Append all elements
        newRow.appendChild(select);
        newRow.appendChild(label);
        newRow.appendChild(removeBtn);
        
        this.elements.container.appendChild(newRow);
        this.universeIndex++;
        
        // Update all select options after adding new row
        this.updateSelectOptions();
    }
    
    /**
     * Remove a universe row
     */
    removeUniverseRow(btn) {
        if (!this.elements.container) return;
        
        const row = btn.closest('.universe-item-row');
        if (!row) return;
        
        if (this.elements.container.children.length > 1) {
            row.remove();
            // Update select options after removal (re-enable the removed universe)
            this.updateSelectOptions();
        } else {
            alert('At least one universe is required');
        }
    }
    
    /**
     * Get array of currently selected universe IDs (excluding empty selections)
     */
    getSelectedUniverseIds() {
        if (!this.elements.container) return [];
        
        const selectedIds = [];
        const rows = this.elements.container.querySelectorAll('.universe-item-row');
        
        rows.forEach((row) => {
            const select = row.querySelector('select[name="universe_ids[]"]');
            if (select && select.value && select.value !== '') {
                selectedIds.push(select.value);
            }
        });
        
        return selectedIds;
    }
    
    /**
     * Validate that a universe selection is not a duplicate
     */
    validateUniverseSelection(selectElement) {
        if (!selectElement || !selectElement.value || selectElement.value === '') {
            return; // Empty selection is fine
        }
        
        const selectedId = selectElement.value;
        const rows = this.elements.container.querySelectorAll('.universe-item-row');
        let duplicateFound = false;
        
        rows.forEach((row) => {
            const otherSelect = row.querySelector('select[name="universe_ids[]"]');
            if (otherSelect && otherSelect !== selectElement && otherSelect.value === selectedId) {
                duplicateFound = true;
            }
        });
        
        if (duplicateFound) {
            alert('This universe is already selected. Please choose a different universe.');
            selectElement.value = ''; // Clear the duplicate selection
        }
    }
    
    /**
     * Update all select options to disable already-selected universes
     */
    updateSelectOptions() {
        if (!this.elements.container) return;
        
        const selectedUniverseIds = this.getSelectedUniverseIds();
        const rows = this.elements.container.querySelectorAll('.universe-item-row');
        
        rows.forEach((row) => {
            const select = row.querySelector('select[name="universe_ids[]"]');
            if (!select) return;
            
            const currentValue = select.value;
            
            // Update each option
            Array.from(select.options).forEach((option) => {
                if (option.value === '' || option.value === currentValue) {
                    // Keep placeholder and current selection enabled
                    option.disabled = false;
                } else {
                    // Disable if already selected in another row
                    option.disabled = selectedUniverseIds.includes(option.value);
                }
            });
        });
    }
    
    /**
     * Handle save - collects universe IDs and primary index, then saves via AJAX
     */
    async handleSave(newValue, oldValue, editor) {
        if (!this.elements.container) return false;
        
        // Collect all universe IDs and primary index
        const rows = this.elements.container.querySelectorAll('.universe-item-row');
        const universeIds = [];
        let primaryIndex = 0;
        
        rows.forEach((row, index) => {
            const select = row.querySelector('select[name="universe_ids[]"]');
            const primaryRadio = row.querySelector(`input[name="primary_universe"][value="${index}"]`);
            
            if (select && select.value && select.value !== '') {
                universeIds.push(select.value);
                if (primaryRadio && primaryRadio.checked) {
                    primaryIndex = universeIds.length - 1;
                }
            }
        });
        
        if (universeIds.length === 0) {
            alert('At least one universe is required');
            return false;
        }
        
        // Save universes - we need to send both universe_ids and primary_universe
        const form = document.querySelector(`.task-edit-form-simple[data-task-id="${this.taskId}"]`);
        if (!form) return false;
        
        const formData = new FormData(form);
        formData.delete('universe_ids[]');
        formData.delete('primary_universe');
        
        universeIds.forEach(id => {
            formData.append('universe_ids[]', id);
        });
        formData.append('primary_universe', primaryIndex);
        
        if (!formData.has('_method')) {
            formData.append('_method', 'PUT');
        }
        
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (!csrfToken) return false;
        
        try {
            const response = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json'
                },
                body: formData
            });
            
            if (response.redirected) return false;
            
            const data = await response.json();
            
            if (!response.ok || !data.success) {
                let errorMessage = 'Error updating universes';
                if (data.errors) {
                    errorMessage = Object.values(data.errors).flat().join('\n');
                } else if (data.message) {
                    errorMessage = data.message;
                }
                alert('Error: ' + errorMessage);
                return false;
            }
            
            // Update display after successful save
            setTimeout(() => {
                this.updateDisplay();
            }, 50);
            
            return true;
        } catch (error) {
            console.error('Error saving universes:', error);
            alert('Error: ' + (error.message || 'Error updating universes'));
            return false;
        }
    }
}
