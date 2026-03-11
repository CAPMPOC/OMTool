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
         * Create and save employee (create draft, prepare, activate in single batch)
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

                        // Execute prepare and activate in SINGLE batch
                        that._oODataService.executeDraftOperations(sEmployeeId)
                            .then(function (oResult) {
                                console.log("Employee saved successfully (draft prepared and activated)");
                                resolve(oResult);
                            })
                            .catch(function(oError) {
                                console.error("Draft operations failed:", oError);
                                reject(oError);
                            });
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