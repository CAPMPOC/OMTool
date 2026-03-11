sap.ui.define([], function () {
    "use strict";

    var ValidationHelper = {
        /**
         * Validate employee data for required fields
         * @param {object} oData - Employee data object
         * @returns {boolean} - True if valid, false otherwise
         */
        validateEmployeeData: function (oData) {
            return !!(
                oData.Empid &&
                oData.Empid.trim() &&
                oData.firstName &&
                oData.firstName.trim() &&
                oData.lastName &&
                oData.lastName.trim() &&
                oData.rollOnDate &&
                oData.SAP
            );
        },

        /**
         * Check if employee form has any data entered
         * @param {object} oData - Employee data object
         * @returns {boolean} - True if any data exists
         */
        hasEmployeeData: function (oData) {
            return !!(oData.Empid || oData.firstName || oData.lastName);
        },

        /**
         * Validate email format
         * @param {string} sEmail - Email string
         * @returns {boolean} - True if valid email
         */
        isValidEmail: function (sEmail) {
            if (!sEmail) return false;
            var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(sEmail);
        },

        /**
         * Validate date is not in the past
         * @param {Date|string} oDate - Date to validate
         * @returns {boolean} - True if date is today or future
         */
        isDateNotInPast: function (oDate) {
            if (!oDate) return false;
            var date = oDate instanceof Date ? oDate : new Date(oDate);
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            return date >= today;
        },

        /**
         * Validate roll-off date is after roll-on date
         * @param {Date|string} oRollOnDate - Roll-on date
         * @param {Date|string} oRollOffDate - Roll-off date
         * @returns {boolean} - True if roll-off is after roll-on
         */
        isRollOffAfterRollOn: function (oRollOnDate, oRollOffDate) {
            if (!oRollOnDate || !oRollOffDate) return true;
            var rollOn = oRollOnDate instanceof Date ? oRollOnDate : new Date(oRollOnDate);
            var rollOff = oRollOffDate instanceof Date ? oRollOffDate : new Date(oRollOffDate);
            return rollOff >= rollOn;
        }
    };

    return ValidationHelper;
});