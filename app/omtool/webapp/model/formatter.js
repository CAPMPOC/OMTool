sap.ui.define([
    "../utils/EmployeeHelper"
], function (EmployeeHelper) {
    "use strict";

    return {

        formatDate: function(sDate) {
            return EmployeeHelper.formatDate(sDate);
        }

    };
}, /* bExport= */ true);
