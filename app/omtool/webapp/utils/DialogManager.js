sap.ui.define([
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "./Constants"
], function (Fragment, JSONModel, Constants) {
    "use strict";

    var DialogManager = function (oController) {
        this._oController = oController;
        this._oView = oController.getView();
        this._dialogs = {};
    };

    DialogManager.prototype = {
        /**
         * Open a dialog by name
         * @param {string} sDialogName - Name identifier for the dialog
         * @param {string} sFragmentPath - Fragment path
         * @param {object} [oModel] - Optional model to set on dialog
         * @param {string} [sModelName] - Optional model name
         * @returns {Promise} - Promise resolving to dialog instance
         */
        openDialog: function (sDialogName, sFragmentPath, oModel, sModelName) {
            var that = this;

            return new Promise(function (resolve, reject) {
                if (!that._dialogs[sDialogName]) {
                    Fragment.load({
                        id: that._oView.getId(),
                        name: sFragmentPath,
                        controller: that._oController
                    }).then(function (oDialog) {
                        that._dialogs[sDialogName] = oDialog;
                        that._oView.addDependent(oDialog);

                        if (oModel && sModelName) {
                            oDialog.setModel(oModel, sModelName);
                        }

                        oDialog.open();
                        resolve(oDialog);
                    }).catch(reject);
                } else {
                    var oDialog = that._dialogs[sDialogName];

                    if (oModel && sModelName) {
                        oDialog.setModel(oModel, sModelName);
                    }

                    oDialog.open();
                    resolve(oDialog);
                }
            });
        },

        /**
         * Close a dialog by name
         * @param {string} sDialogName - Name identifier for the dialog
         */
        closeDialog: function (sDialogName) {
            if (this._dialogs[sDialogName]) {
                this._dialogs[sDialogName].close();
            }
        },

        /**
         * Get dialog instance by name
         * @param {string} sDialogName - Name identifier for the dialog
         * @returns {sap.ui.core.Control|null} - Dialog instance or null
         */
        getDialog: function (sDialogName) {
            return this._dialogs[sDialogName] || null;
        },

        /**
         * Set dialog busy state
         * @param {string} sDialogName - Name identifier for the dialog
         * @param {boolean} bBusy - Busy state
         */
        setDialogBusy: function (sDialogName, bBusy) {
            if (this._dialogs[sDialogName]) {
                this._dialogs[sDialogName].setBusy(bBusy);
            }
        },

        /**
         * Destroy all dialogs - call on controller exit
         */
        destroyAll: function () {
            Object.keys(this._dialogs).forEach(function (sKey) {
                if (this._dialogs[sKey]) {
                    this._dialogs[sKey].destroy();
                }
            }.bind(this));
            this._dialogs = {};
        }
    };

    return DialogManager;
});