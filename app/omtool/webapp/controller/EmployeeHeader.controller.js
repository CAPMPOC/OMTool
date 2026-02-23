sap.ui.define([
    "./Base.controller",
    "sap/ui/core/Fragment",
    "../model/models",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "../model/formatter",
    "sap/m/MessageBox"
], (BaseController, Fragment, models, Filter, FilterOperator, formatter, MessageBox) => {
    "use strict";

    return BaseController.extend("com.sap.omtool.omtool.controller.EmployeeHeader", {
        onInit() {
        }
    });
});