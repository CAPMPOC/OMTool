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
         * Create initial draft employee (called BEFORE dialog opens)
         * @param {object} oModel - OData model
         * @param {object} oInitialPayload - Initial minimal payload
         * @returns {Promise} - Promise resolving with created draft data
         */
        createDraftEmployee: function (oModel, oInitialPayload) {
            console.log("Creating draft employee with initial payload:", oInitialPayload);

            return new Promise(function (resolve, reject) {
                oModel.create(Constants.ENTITY_SETS.EMPLOYEE_HEADER, oInitialPayload, {
                    success: function (oCreatedData) {
                        console.log("Draft created successfully:", oCreatedData);
                        
                        if (!oCreatedData.ID) {
                            reject(new Error("No ID returned from create operation"));
                            return;
                        }
                        
                        resolve(oCreatedData);
                    },
                    error: function (oError) {
                        console.error("Create draft error:", oError);
                        reject(new Error(this._parseErrorMessage(oError)));
                    }.bind(this)
                });
            }.bind(this));
        },

        /**
         * Update draft employee with form data
         * @param {object} oModel - OData model
         * @param {string} sEmployeeId - Draft Employee ID
         * @param {object} oEmployeeData - Complete employee form data
         * @returns {Promise} - Promise resolving on success
         */
        updateDraftEmployee: function (oModel, sEmployeeId, oEmployeeData) {
            var oPayload = EmployeeHelper.prepareEmployeePayload(oEmployeeData);
            var sPath = "/EmployeeHeader(ID=" + sEmployeeId + ",IsActiveEntity=false)";

            console.log("Updating draft employee:", sEmployeeId, "with payload:", oPayload);

            return new Promise(function (resolve, reject) {
                oModel.update(sPath, oPayload, {
                    success: function (oUpdatedData) {
                        console.log("Draft updated successfully:", oUpdatedData);
                        resolve(oUpdatedData);
                    },
                    error: function (oError) {
                        console.error("Update draft error:", oError);
                        reject(new Error(this._parseErrorMessage(oError)));
                    }.bind(this)
                });
            }.bind(this));
        },

        /**
         * Prepare and activate draft employee (called when user clicks Add Employee in dialog)
         * @param {string} sEmployeeId - Employee ID
         * @returns {Promise} - Promise resolving on success
         */
        prepareAndActivateDraft: function (sEmployeeId) {
            var that = this;

            return this._prepareDraft(sEmployeeId)
                .then(function () {
                    return that._activateDraft(sEmployeeId);
                })
                .then(function () {
                    console.log("Employee prepared and activated successfully");
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