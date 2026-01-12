/**
 * TimeHelper - Utility functions for time-related inputs
 * 
 * Provides shared logic for time input fields with unit selectors
 */
class TimeHelper {
    /**
     * Get the step value for a time input based on the selected unit
     * @param {string} unit - 'hours' or 'minutes'
     * @returns {string} - The step value as a string
     */
    static getStepForUnit(unit) {
        return unit === 'hours' ? '0.25' : '5';
    }
    
    /**
     * Update the step attribute on a time input based on the selected unit
     * @param {HTMLInputElement} inputElement - The time input element
     * @param {HTMLInputElement} hoursRadio - The hours radio button
     * @param {HTMLInputElement} minutesRadio - The minutes radio button
     */
    static updateStepAttribute(inputElement, hoursRadio, minutesRadio) {
        if (!inputElement) return;
        
        const unit = (hoursRadio && hoursRadio.checked) ? 'hours' : 'minutes';
        const stepValue = this.getStepForUnit(unit);
        inputElement.step = stepValue;
        // Also set as attribute to ensure it's applied
        inputElement.setAttribute('step', stepValue);
    }
}
