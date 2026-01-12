/**
 * Diagnostics - Comprehensive logging for debugging inline field system
 * 
 * This file adds detailed logging to understand:
 * 1. When classes are initialized
 * 2. When event listeners are attached
 * 3. When buttons are clicked
 * 4. When save handlers are called
 * 5. When display updates happen
 */

(function() {
    'use strict';
    
    // Track initialization state
    window.diagnostics = {
        initializedClasses: {},
        eventListeners: {},
        buttonClicks: [],
        saveCalls: [],
        displayUpdates: []
    };
    
    // Log class initialization
    const originalInlineUniversesField = window.InlineUniversesField;
    if (originalInlineUniversesField) {
        window.InlineUniversesField = class extends originalInlineUniversesField {
            constructor(fieldId, config) {
                console.log('🔵 DIAGNOSTICS: InlineUniversesField constructor called', { fieldId, config });
                window.diagnostics.initializedClasses[fieldId] = {
                    class: 'InlineUniversesField',
                    timestamp: Date.now(),
                    config: config
                };
                super(fieldId, config);
                console.log('🔵 DIAGNOSTICS: InlineUniversesField initialized', { 
                    fieldId, 
                    hasEditor: !!window.inlineFieldEditors?.[fieldId],
                    editor: window.inlineFieldEditors?.[fieldId]
                });
            }
        };
    }
    
    // Log button clicks globally
    document.addEventListener('click', function(e) {
        const target = e.target;
        const isAddUniverse = target.classList?.contains('add-universe-btn') || 
                              target.closest('.add-universe-btn');
        const isSaveBtn = target.classList?.contains('inline-field-save-btn') || 
                         target.closest('.inline-field-save-btn');
        const isEditBtn = target.classList?.contains('inline-field-edit-btn') || 
                         target.closest('.inline-field-edit-btn');
        
        if (isAddUniverse || isSaveBtn || isEditBtn) {
            const buttonType = isAddUniverse ? 'add-universe' : 
                              (isSaveBtn ? 'save' : 'edit');
            const button = isAddUniverse ? target.closest('.add-universe-btn') || target :
                          (isSaveBtn ? target.closest('.inline-field-save-btn') || target :
                          target.closest('.inline-field-edit-btn') || target);
            
            window.diagnostics.buttonClicks.push({
                type: buttonType,
                timestamp: Date.now(),
                target: target,
                button: button,
                buttonId: button?.id,
                buttonDataset: button?.dataset,
                fieldId: button?.dataset?.fieldId,
                taskId: button?.dataset?.taskId
            });
            
            console.log('🟢 DIAGNOSTICS: Button click detected', {
                type: buttonType,
                button: button,
                fieldId: button?.dataset?.fieldId,
                taskId: button?.dataset?.taskId,
                hasEditor: button?.dataset?.fieldId ? !!window.inlineFieldEditors?.[button.dataset.fieldId] : null
            });
        }
    }, true); // Capture phase
    
    // Log save handler calls
    const originalTaskFieldSaver = window.TaskFieldSaver;
    if (originalTaskFieldSaver && originalTaskFieldSaver.saveField) {
        const originalSaveField = originalTaskFieldSaver.saveField;
        originalTaskFieldSaver.saveField = async function(taskId, fieldName, value) {
            console.log('🟡 DIAGNOSTICS: TaskFieldSaver.saveField called', { taskId, fieldName, value });
            window.diagnostics.saveCalls.push({
                taskId: taskId,
                fieldName: fieldName,
                value: value,
                timestamp: Date.now()
            });
            
            try {
                const result = await originalSaveField.call(this, taskId, fieldName, value);
                console.log('🟡 DIAGNOSTICS: TaskFieldSaver.saveField result', { taskId, fieldName, success: result });
                return result;
            } catch (error) {
                console.error('🟡 DIAGNOSTICS: TaskFieldSaver.saveField error', { taskId, fieldName, error });
                throw error;
            }
        };
    }
    
    // Log display updates
    const originalUpdateDisplayValue = InlineFieldEditor?.prototype?.updateDisplayValue;
    if (originalUpdateDisplayValue) {
        InlineFieldEditor.prototype.updateDisplayValue = function(value) {
            console.log('🟣 DIAGNOSTICS: updateDisplayValue called', { 
                fieldId: this.fieldId, 
                value: value,
                hasValueElement: !!this.valueElement
            });
            window.diagnostics.displayUpdates.push({
                fieldId: this.fieldId,
                value: value,
                timestamp: Date.now()
            });
            return originalUpdateDisplayValue.call(this, value);
        };
    }
    
    // Log when TaskFieldInitializer runs
    const originalInitializeTaskFields = window.TaskFieldInitializer?.initializeTaskFields;
    if (originalInitializeTaskFields) {
        window.TaskFieldInitializer.initializeTaskFields = function(taskId, taskCard) {
            console.log('🔴 DIAGNOSTICS: TaskFieldInitializer.initializeTaskFields called', { taskId, taskCard: !!taskCard });
            const result = originalInitializeTaskFields.call(this, taskId, taskCard);
            console.log('🔴 DIAGNOSTICS: TaskFieldInitializer.initializeTaskFields completed', { 
                taskId,
                initializedFields: Object.keys(window.inlineFieldEditors || {}).filter(id => id.includes(`-${taskId}`))
            });
            return result;
        };
    }
    
    // Helper function to dump diagnostics
    window.dumpDiagnostics = function() {
        console.log('📊 DIAGNOSTICS DUMP:', {
            initializedClasses: window.diagnostics.initializedClasses,
            buttonClicks: window.diagnostics.buttonClicks,
            saveCalls: window.diagnostics.saveCalls,
            displayUpdates: window.diagnostics.displayUpdates,
            inlineFieldEditors: Object.keys(window.inlineFieldEditors || {}),
            taskCardEditors: Object.keys(window.taskCardEditors || {})
        });
    };
    
    console.log('✅ DIAGNOSTICS: Diagnostic logging initialized');
})();
