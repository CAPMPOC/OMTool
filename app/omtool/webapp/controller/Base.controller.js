sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "../services/ODataService",
    "../model/formatter"
], (Controller, JSONModel, ODataService, formatter) => {
    "use strict";

    return Controller.extend("com.sap.bklg.revenuebklgtool.controller.Base", {
        formatter: formatter,
        
        
        onInit: function() {
            
        },

        
        initSupportModules: function () {
            if (!this.oODataService) this.oODataService = new ODataService(this);
		},
        
        
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
		},
        
        
        getModel: function (sName) {
            return this.getView().getModel(sName);
		},


        getResourceBundle: function () {
            return this.getModel("i18n").getResourceBundle();
        },
    });
});