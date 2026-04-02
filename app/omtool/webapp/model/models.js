sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "../utils/Constants"
], function (JSONModel, Device, Constants) {
    "use strict";

    return {

        /**
         * Provides runtime information for the device the UI5 app is running on as a JSONModel.
         * @returns {sap.ui.model.json.JSONModel} The device model.
         */
        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        /**
         * Creates the view model for controlling UI visibility and states.
         * @returns {sap.ui.model.json.JSONModel} The view model.
         */
        createViewModel: function () {
            var oModel = new JSONModel({
                showEmployeeMaster: true,
                showReports: false,
                busy: false,
                delay: 0
            });
            return oModel;
        },


        /**
         * Creates the report data model with default values.
         * @returns {sap.ui.model.json.JSONModel} The report data model.
         */
        createReportModel: function () {
            var oModel = new JSONModel(Constants.DEFAULTS.REPORT_DATA);
            return oModel;
        },

        /**
         * Creates an empty employee model for add/edit operations.
         * @returns {sap.ui.model.json.JSONModel} The employee model.
         */
        createEmployeeModel: function () {
            var oModel = new JSONModel(Constants.DEFAULTS.EMPTY_EMPLOYEE);
            return oModel;
        },

        // createEditEmployeeModel: function () {
        //     var oModel = new JSONModel();
        //     return oModel;
        // },

        /**
         * Creates an employee model with provided data (for view/edit).
         * @param {object} oEmployeeData - Employee data object
         * @returns {sap.ui.model.json.JSONModel} The employee model with data.
         */
        createEmployeeModelWithData: function (oEmployeeData) {
            // // Ensure we have valid data
            var oDefaults = {
                Staff_ReasonsRemarksField: false,
                RollOffImpact_ROIField: false,
                Staff_RollOffReasonsField: false,
                RollOffDateField: false,
                handoverKtBegunField: false,
                Staff_RollOffStatusField: false,
                Staff_ReasonsRemarksFieldRequired: false,
                RollOffImpact_ROIFieldRequired: false,
                Staff_RollOffReasonsFieldRequired: false,
                handoverKtBegunFieldRequired: false,
                Staff_RollOffStatusFieldRequired: false
            };

            // Merge defaults with incoming data
            var oData = Object.assign({}, oDefaults, oEmployeeData);

            return new JSONModel(oData);

        },

        /**
         * Resets the employee model to empty state.
         * @param {sap.ui.model.json.JSONModel} oModel - Existing employee model
         */
        resetEmployeeModel: function (oModel) {
            if (oModel) {
                oModel.setData(Object.assign({}, Constants.DEFAULTS.EMPTY_EMPLOYEE));
            }
        },

        /**
         * Creates a generic JSON model with provided data.
         * @param {object} oData - Data object
         * @param {string} [sBindingMode] - Binding mode (default: TwoWay)
         * @returns {sap.ui.model.json.JSONModel} The JSON model.
         */
        createJSONModel: function (oData, sBindingMode) {
            var oModel = new JSONModel(oData || {});
            if (sBindingMode) {
                oModel.setDefaultBindingMode(sBindingMode);
            }
            return oModel;
        }
    };
});