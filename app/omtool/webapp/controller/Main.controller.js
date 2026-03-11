sap.ui.define([
    "./Base.controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "../model/models",
    "../utils/Constants",
    "../utils/DialogManager",
    "../utils/ValidationHelper",
    "../utils/EmployeeHelper",
    "../utils/LocationValueHelpHelper",
    "../services/EmployeeService"
], function (
    BaseController,
    MessageBox,
    MessageToast,
    models,
    Constants,
    DialogManager,
    ValidationHelper,
    EmployeeHelper,
    LocationValueHelpHelper,
    EmployeeService
) {
    "use strict";

    return BaseController.extend("com.sap.omtool.omtool.controller.Main", {

        /* =========================================================== */
        /* Lifecycle Methods                                           */
        /* =========================================================== */

        onInit: function () {
            this._initializeModels();
            this._initializeServices();
            this._loadInitialData();
        },

        onExit: function () {
            if (this._oDialogManager) {
                this._oDialogManager.destroyAll();
            }
        },

        /* =========================================================== */
        /* Initialization Methods                                      */
        /* =========================================================== */

        _initializeModels: function () {
            this.getView().setModel(models.createViewModel(), "viewModel");
            this.getView().setModel(models.createReportModel(), "reportData");
        },

        _initializeServices: function () {
            this.initSupportModules();
            this._oDialogManager = new DialogManager(this);
            this._oEmployeeService = new EmployeeService(this.oODataService);
            this._oLocationHelper = new LocationValueHelpHelper(this);
        },

        _loadInitialData: async function () {
            try {
                var oData = await this._oEmployeeService.loadAccessibilityData();
                console.log("Accessibility data loaded:", oData);
            } catch (error) {
                console.error("Failed to load accessibility data:", error);
            }
        },

        /* =========================================================== */
        /* Navigation Event Handlers                                   */
        /* =========================================================== */

        onSegmentedButtonChange: function () {
            var sSelectedKey = this.byId("navSegmentedButton").getSelectedKey();
            var oViewModel = this.getView().getModel("viewModel");
            var bIsEmployeeMaster = sSelectedKey === "employeeMaster";

            oViewModel.setProperty("/showEmployeeMaster", bIsEmployeeMaster);
            oViewModel.setProperty("/showReports", !bIsEmployeeMaster);

            var sTitle = bIsEmployeeMaster ?
                Constants.PAGE_TITLES.EMPLOYEE_MASTER :
                Constants.PAGE_TITLES.REPORTS;
            this.byId("mainPage").setTitle(sTitle);

            if (!bIsEmployeeMaster) {
                this._loadReportData();
            }
        },

        /* =========================================================== */
        /* SmartFilterBar Event Handlers                               */
        /* =========================================================== */

        onSmartFilterBarSearch: function () {
            var oSmartTable = this.byId("smartTable");
            if (oSmartTable) {
                oSmartTable.rebindTable();
            }
        },

        onFilterChange: function () {
            if (this._filterChangeTimeout) {
                clearTimeout(this._filterChangeTimeout);
            }

            this._filterChangeTimeout = setTimeout(function () {
                var oSmartTable = this.byId("smartTable");
                if (oSmartTable) {
                    oSmartTable.rebindTable();
                }
            }.bind(this), 300);
        },

        onBeforeRebindTable: function (oEvent) {
            var oBindingParams = oEvent.getParameter("bindingParams");

            if (oBindingParams.sorter.length === 0) {
                oBindingParams.sorter.push(new sap.ui.model.Sorter("FirstName", false));
            }
        },

        /* =========================================================== */
        /* Employee Location ValueHelp Handlers                        */
        /* =========================================================== */

        onEmployeeLocationSuggest: function (oEvent) {
            this._oLocationHelper.onSuggest(oEvent);
        },

        onEmployeeLocationSuggestionSelected: function (oEvent) {
            this._oLocationHelper.onSuggestionSelected(oEvent, this._updateEmployeeLocation.bind(this));
        },

        onEmployeeLocationValueHelp: function () {
            this._oDialogManager.openDialog(
                "employeeLocationDialog",
                Constants.FRAGMENTS.EMPLOYEE_LOCATION_VH
            );
        },

        onEmployeeLocationSearch: function (oEvent) {
            this._oLocationHelper.onSearch(oEvent);
        },

        onEmployeeLocationDialogConfirm: function (oEvent) {
            this._oLocationHelper.onDialogConfirm(oEvent, function (sLocationID, sLocationText) {
                this._updateEmployeeLocation(sLocationID, sLocationText);

                var oLocationInput = this.byId("inputEmployeeLocation");
                if (oLocationInput) {
                    oLocationInput.setValue(sLocationText);
                }
            }.bind(this));
        },

        onEmployeeLocationDialogCancel: function (oEvent) {
            this._oLocationHelper.onDialogCancel(oEvent);
        },

        onEmployeeLocationChange: function (oEvent) {
            this._oLocationHelper.onChange(oEvent, this._updateEmployeeLocation.bind(this));
        },

        /* =========================================================== */
        /* Add Employee Event Handlers                                 */
        /* =========================================================== */

        onAddEmployee: function () {
            this.getView().setModel(models.createEmployeeModel(), "employee");

            this._oDialogManager.openDialog(
                "addEmployeeDialog",
                Constants.FRAGMENTS.ADD_EMPLOYEE
            ).then(function () {
                this._resetDialogFields();
            }.bind(this));
        },

        onAddEmployeePress: async function () {
            var oEmployeeData = this.getView().getModel("employee").getData();

            if (!ValidationHelper.validateEmployeeData(oEmployeeData)) {
                MessageBox.error(Constants.MESSAGES.VALIDATION_ERROR);
                return;
            }

            this._oDialogManager.setDialogBusy("addEmployeeDialog", true);

            try {
                var oModel = this.getView().getModel();
                await this._oEmployeeService.createEmployee(oModel, oEmployeeData);

                this._oDialogManager.setDialogBusy("addEmployeeDialog", false);

                MessageBox.success(Constants.MESSAGES.SAVE_SUCCESS, {
                    onClose: function () {
                        this._oDialogManager.closeDialog("addEmployeeDialog");
                        this._refreshMainView();
                    }.bind(this)
                });
            } catch (error) {
                this._oDialogManager.setDialogBusy("addEmployeeDialog", false);
                MessageBox.error(Constants.MESSAGES.SAVE_ERROR + (error.message || "Unknown error"));
                console.error("Save employee error:", error);
            }
        },

        onCancelEmployee: function () {
            var oData = this.getView().getModel("employee").getData();

            if (ValidationHelper.hasEmployeeData(oData)) {
                MessageBox.confirm(Constants.MESSAGES.CANCEL_CONFIRM, {
                    title: "Confirm Cancel",
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            this._oDialogManager.closeDialog("addEmployeeDialog");
                        }
                    }.bind(this)
                });
            } else {
                this._oDialogManager.closeDialog("addEmployeeDialog");
            }
        },

        /* =========================================================== */
        /* View Employee Event Handlers                                */
        /* =========================================================== */

        onViewEmployee: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();

            if (!oContext) {
                MessageToast.show(Constants.MESSAGES.NO_DATA);
                return;
            }

            var oEmployeeData = oContext.getObject();

            this._oDialogManager.openDialog(
                "viewEmployeeDialog",
                Constants.FRAGMENTS.VIEW_EMPLOYEE,
                models.createEmployeeModelWithData(oEmployeeData),
                "viewEmployee"
            );
        },

        onCloseviewEmployeeDetail: function () {
            this._oDialogManager.closeDialog("viewEmployeeDialog");
        },

        /* =========================================================== */
        /* Private Helper Methods                                      */
        /* =========================================================== */

        _loadReportData: function () {
            // TODO: Implement actual report data loading
            console.log("Loading report data...");
        },

        _resetDialogFields: function () {
            var oLocationInput = this.byId("inputEmployeeLocation");
            if (oLocationInput) {
                oLocationInput.setValue("");
            }
        },

        _refreshMainView: function () {
            var oSmartTable = this.byId("smartTable");
            if (oSmartTable) {
                oSmartTable.rebindTable();
            }

            var oModel = this.getView().getModel();
            if (oModel) {
                oModel.refresh(true);
            }
        },

        _updateEmployeeLocation: function (sLocationID, sLocationText) {
            var oEmployeeModel = this.getView().getModel("employee");
            if (oEmployeeModel) {
                oEmployeeModel.setProperty("/location", sLocationID);
                oEmployeeModel.setProperty("/locationDesc", sLocationText);
                console.log("Employee Location updated - ID:", sLocationID, "Text:", sLocationText);
            }
        }
    });
});