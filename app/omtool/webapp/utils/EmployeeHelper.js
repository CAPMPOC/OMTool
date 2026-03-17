sap.ui.define([
    "./Constants"
], function (Constants) {
    "use strict";

    var EmployeeHelper = {
        /**
         * Get initial minimal payload for draft creation (before dialog opens)
         * @returns {object} - Minimal payload for initial draft creation
         */
        getInitialPayload: function () {
            return {
                IsActiveEntity: false
                // Only send minimal data needed to create the draft
                // Other fields will be filled when user submits the form
            };
        },

        /**
         * Prepare employee payload for backend
         * @param {object} oEmployeeData - Raw employee data from form
         * @returns {object} - Formatted payload for backend
         */
        prepareEmployeePayload: function (oEmployeeData) {
            return {
                Empid: this._trimString(oEmployeeData.Empid),
                FirstName: this._trimString(oEmployeeData.firstName),
                LastName: this._trimString(oEmployeeData.lastName),
                Location_LocID: this._trimString(oEmployeeData.location) || null,
                CID: this._trimString(oEmployeeData.CID) || "",
                ProductGroup: this._trimString(oEmployeeData.ProductGroup) || "",
                ServiceGroup: this._trimString(oEmployeeData.ServiceGroup) || "",
                Product: this._trimString(oEmployeeData.Product) || "",
                Accessibility_AccessID: this._trimString(oEmployeeData.Accessibility) || "",
                Employer: this._trimString(oEmployeeData.Employer) || "",
                RollOnDate: oEmployeeData.rollOnDate,
                SAP: this._parseInteger(oEmployeeData.SAP),
                NonSAP: this._parseInteger(oEmployeeData.NonSAP),
                SAPToday: this._parseInteger(oEmployeeData.SAPToday),
                Skill_SkillID: this._trimString(oEmployeeData.Skill_SkillID) || "",
                ktStarted: oEmployeeData.ktStarted,
                isNewRecord: oEmployeeData.isNewRecord,
                IsActiveEntity: false
            };
        },

        /**
         * Safely parse integer with validation
         * @private
         * @param {any} vValue - Value to parse
         * @returns {number|null} - Parsed integer or null if invalid
         */
        _parseInteger: function (vValue) {
            if (vValue === null || vValue === undefined || vValue === "") {
                return null;
            }

            var iParsed = parseInt(vValue, 10);

            if (isNaN(iParsed)) {
                console.warn("Invalid integer value:", vValue);
                return null;
            }

            return iParsed;
        },

        /**
         * Format date for backend
         * @param {Date|string} sDate - Date to format
         * @returns {string|null} - Formatted date string or null
         */
        formatDate: function (sDate) {
            if (!sDate) return null;

            if (sDate instanceof Date) {
                return sDate.toISOString().split("T")[0];
            }

            if (typeof sDate === "string" && sDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return sDate;
            }

            var oDate = new Date(sDate);
            if (!isNaN(oDate.getTime())) {
                return oDate.toISOString().split("T")[0];
            }

            return null;
        },

        /**
         * Get empty employee object
         * @returns {object} - Empty employee data object
         */
        getEmptyEmployee: function () {
            return Object.assign({}, Constants.DEFAULTS.EMPTY_EMPLOYEE);
        },

        /**
         * Build draft prepare path
         * @param {string} sEmployeeId - Employee ID
         * @returns {string} - Draft prepare path
         */
        buildDraftPreparePath: function (sEmployeeId) {
            return "/EmployeeHeader(ID=" + sEmployeeId + ",IsActiveEntity=false)/OMTSrv.draftPrepare";
        },

        /**
         * Build draft activate path
         * @param {string} sEmployeeId - Employee ID
         * @returns {string} - Draft activate path with select and expand
         */
        buildDraftActivatePath: function (sEmployeeId) {
            return "/EmployeeHeader(ID=" + sEmployeeId + ",IsActiveEntity=false)/OMTSrv.draftActivate" +
                "?$select=" + Constants.DRAFT_SELECT_FIELDS.join(",") +
                "&$expand=" + Constants.DRAFT_EXPAND_FIELDS;
        },

        /**
         * Safely trim string
         * @private
         * @param {string} sValue - String to trim
         * @returns {string} - Trimmed string or empty string
         */
        _trimString: function (sValue) {
            return sValue ? sValue.trim() : "";
        }
    };

    return EmployeeHelper;
});