sap.ui.define([
    "../utils/EmployeeHelper",
    "../utils/Constants"
], function (EmployeeHelper, Constants) {
    "use strict";

    var EmployeeService = function (oODataService) {
        this._oODataService = oODataService;
    };

    EmployeeService.prototype = {
        /**
         * Create and save employee (create draft, prepare, activate)
         * @param {object} oModel - OData model
         * @param {object} oEmployeeData - Employee form data
         * @returns {Promise} - Promise resolving on success
         */
        createEmployee: function (oModel, oEmployeeData) {
            var that = this;
            var oPayload = EmployeeHelper.prepareEmployeePayload(oEmployeeData);

            console.log("Creating employee with payload:", oPayload);

            return new Promise(function (resolve, reject) {
                oModel.create(Constants.ENTITY_SETS.EMPLOYEE_HEADER, oPayload, {
                    success: function (oCreatedData) {
                        console.log("Draft created successfully:", oCreatedData);
                        var sEmployeeId = oCreatedData.ID;

                        if (!sEmployeeId) {
                            reject(new Error("No ID returned from create operation"));
                            return;
                        }

                        that._prepareDraft(sEmployeeId)
                            .then(function () {
                                return that._activateDraft(sEmployeeId);
                            })
                            .then(function () {
                                console.log("Employee saved successfully");
                                resolve();
                            })
                            .catch(reject);
                    },
                    error: function (oError) {
                        console.error("Create draft error:", oError);
                        reject(new Error(that._parseErrorMessage(oError)));
                    }
                });
            });
        },

        /**
         * Load accessibility value help data
         * @returns {Promise} - Promise resolving with data
         */
        loadAccessibilityData: function () {
            return this._oODataService.readEntitySet(Constants.ENTITY_SETS.ACCESSIBILITY_VH);
        },

        /**
         * Prepare draft for employee
         * @private
         * @param {string} sEmployeeId - Employee ID
         * @returns {Promise}
         */
        _prepareDraft: function (sEmployeeId) {
            var sPath = EmployeeHelper.buildDraftPreparePath(sEmployeeId);
            var oPayload = { SideEffectsQualifier: "" };

            console.log("Preparing draft for:", sEmployeeId);

            return this._oODataService.createEntity(sPath, oPayload);
        },

        /**
         * Activate draft for employee
         * @private
         * @param {string} sEmployeeId - Employee ID
         * @returns {Promise}
         */
        _activateDraft: function (sEmployeeId) {
            var sPath = EmployeeHelper.buildDraftActivatePath(sEmployeeId);

            console.log("Activating draft for:", sEmployeeId);

            return this._oODataService.createEntity(sPath);
        },

        /**
         * Parse error message from OData error response
         * @private
         * @param {object} oError - Error object
         * @returns {string} - Parsed error message
         */
        _parseErrorMessage: function (oError) {
            try {
                if (oError.responseText) {
                    var oErrorResponse = JSON.parse(oError.responseText);
                    return oErrorResponse.error?.message?.value || Constants.MESSAGES.CREATE_FAILED;
                }
            } catch (e) {
                console.error("Error parsing error response:", e);
            }
            return Constants.MESSAGES.CREATE_FAILED;
        }
    };

    return EmployeeService;
});