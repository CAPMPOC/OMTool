sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("com.sap.omtool.omtool.controller.Reports", {
        
        onInit: function () {
            // Initialize report data model
            var oReportModel = new JSONModel({
                totalEmployees: 20,
                ktStarted: 4,
                ktNotStarted: 16,
                rolloffStarted: 6,
                rolloffNotStarted: 14,
                handoverBegun: 3,
                handoverNotBegun: 3
            });
            this.getView().setModel(oReportModel, "reportData");

            // Route matched handler
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("Reports").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            // Set the correct button as selected when route is matched
            var oSegmentedButton = this.byId("navSegmentedButton");
            if (oSegmentedButton) {
                oSegmentedButton.setSelectedKey("reports");
            }
            
            // Load report data when route is matched
            this._loadReportData();
        },

        _loadReportData: function () {
            // TODO: Implement data loading logic
            // This will be populated with actual OData service calls later
        },

        onFilterChange: function (oEvent) {
            // TODO: Implement filter logic
            // This will handle filter changes and update charts
        },

        onNavigateToEmployeeMaster: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteEmployeeHeader");
        },

        onNavigateToReports: function () {
            // Already on Reports page
            var oSegmentedButton = this.byId("navSegmentedButton");
            if (oSegmentedButton) {
                oSegmentedButton.setSelectedKey("reports");
            }
        }
    });
});