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

        onAddEmployee: async function () {
            var oViewModel = this.getView().getModel("viewModel");

            // Show busy indicator
            oViewModel.setProperty("/busy", true);

            try {
                // Step 1: Create draft employee entry BEFORE opening dialog
                var oModel = this.getView().getModel();
                var oInitialPayload = EmployeeHelper.getInitialPayload();

                console.log("Creating draft employee entry...");
                var oCreatedData = await this._oEmployeeService.createDraftEmployee(oModel, oInitialPayload);

                // Store the draft employee ID for later use
                this._sDraftEmployeeId = oCreatedData.ID;

                console.log("Draft employee created with ID:", this._sDraftEmployeeId);

                if (oCreatedData.RollOnDate) {
                    oCreatedData.rollOnDate = EmployeeHelper.formatDate(oCreatedData.RollOnDate);
                }

                // Step 2: Initialize employee model with the created draft data
                this.getView().setModel(models.createEmployeeModelWithData(oCreatedData), "employee");

                // Step 3: Open the dialog
                await this._oDialogManager.openDialog(
                    "addEmployeeDialog",
                    Constants.FRAGMENTS.ADD_EMPLOYEE
                );

                this._resetDialogFields();

            } catch (error) {
                console.error("Error creating draft employee:", error);
                MessageBox.error("Failed to initialize employee creation: " + (error.message || "Unknown error"));
            } finally {
                oViewModel.setProperty("/busy", false);
            }
        },

        onAddEmployeePress: async function () {
            var oEmployeeData = this.getView().getModel("employee").getData();

            if (!ValidationHelper.validateEmployeeData(oEmployeeData)) {
                MessageBox.error(Constants.MESSAGES.VALIDATION_ERROR);
                return;
            }

            // Check if we have a draft employee ID
            if (!this._sDraftEmployeeId) {
                MessageBox.error("No draft employee found. Please try again.");
                return;
            }

            this._oDialogManager.setDialogBusy("addEmployeeDialog", true);

            try {
                // Update the employee data with the stored draft ID
                oEmployeeData.ID = this._sDraftEmployeeId;

                // Step 1: Update the draft with user-entered data
                var oModel = this.getView().getModel();
                await this._oEmployeeService.updateDraftEmployee(oModel, this._sDraftEmployeeId, oEmployeeData);

                console.log("Draft employee updated with form data");

                // Step 2: Prepare and activate draft
                await this._oEmployeeService.prepareAndActivateDraft(this._sDraftEmployeeId);

                this._oDialogManager.setDialogBusy("addEmployeeDialog", false);

                MessageBox.success(Constants.MESSAGES.SAVE_SUCCESS, {
                    onClose: function () {
                        this._oDialogManager.closeDialog("addEmployeeDialog");
                        this._cleanupDraftData();
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
                            this._deleteDraftIfExists();
                            this._oDialogManager.closeDialog("addEmployeeDialog");
                        }
                    }.bind(this)
                });
            } else {
                this._deleteDraftIfExists();
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
            var oModel = models.createEmployeeModelWithData(oEmployeeData);

            // Set model on view first
            this.getView().setModel(oModel, "viewEmployee");

            this._oDialogManager.openDialog(
                "viewEmployeeDialog",
                Constants.FRAGMENTS.VIEW_EMPLOYEE,
                oModel,
                "viewEmployee"
            );
        },

        onCloseviewEmployeeDetail: function () {
            this._oDialogManager.closeDialog("viewEmployeeDialog");
        },

        onEditEmployee: function (oEvent) {
            var oButton = oEvent.getSource();
            var oListItem = oButton.getParent().getParent();
            var oBindingContext = oListItem.getBindingContext();

            if (!oBindingContext) {
                MessageBox.warning("Unable to retrieve employee data. Please try again.");
                return;
            }

            var oSelectedEmployee = oBindingContext.getObject();
            this._callDraftEdit(oSelectedEmployee);
        },

        _callDraftEdit: function (oEmployeeData) {
            var oDataModel = this.getView().getModel();
            this.getView().setBusy(true);
            oDataModel.setDeferredGroups(["editGroup"]);

            var sPath = "/EmployeeHeader(ID=" + oEmployeeData.ID + ",IsActiveEntity=true)/OMTSrv.draftEdit";
            var oPayload = { PreserveChanges: true };

            oDataModel.create(sPath, oPayload, {
                groupId: "editGroup",
                urlParameters: {
                    "$select": "Accessibility_AccessID,CID,DraftMessages,Empid,Employer,FirstName,HasActiveEntity,HasDraftEntity,ID,IsActiveEntity,LastName,Location_LocID,NonSAP,Product,ProductGroup,RollOffDate,RollOffImpact_ROI,RollOnDate,SAP,SAPToday,ServiceGroup,Skill_SkillID,Staff_ReasonsRemarks,Staff_RollOffReasons,Staff_RollOffStatus,handoverKtBegun,isNewRecord,ktStarted",
                    "$expand": "Accessibility($select=AccessID,Description),DraftAdministrativeData($select=DraftIsCreatedByMe,DraftUUID,InProcessByUser),Location($select=LocDesc,LocID)"
                },
                success: function (oData) {
                    this.getView().setBusy(false);
                    this._oDraftEmployee = oData;
                    // Store draft path for later updates
                    this._sDraftPath = "/EmployeeHeader(ID=" + oData.ID + ",IsActiveEntity=false)";
                    this.openEditDialog(oData);
                }.bind(this),
                error: function (oError) {
                    this.getView().setBusy(false);
                    var sErrorMsg = this._extractErrorMessage(oError);
                    MessageBox.error("Failed to create draft: " + sErrorMsg);
                }.bind(this)
            });

            oDataModel.submitChanges({
                groupId: "editGroup",
                success: function () {
                    console.log("Draft edit batch submitted successfully");
                },
                error: function (oError) {
                    this.getView().setBusy(false);
                    var sErrorMsg = this._extractErrorMessage(oError);
                    MessageBox.error("Failed to submit draft edit: " + sErrorMsg);
                }.bind(this)
            });
        },

        openEditDialog: function (oEmployeeData) {
            var oEditData = JSON.parse(JSON.stringify(oEmployeeData));
            var oEditModel = models.createEmployeeModelWithData(oEditData);
            this.getView().setModel(oEditModel, "editEmployee");

            this._oDialogManager.openDialog(
                "editEmployeeDialog",
                Constants.FRAGMENTS.EDIT_EMPLOYEE,
                oEditModel,
                "editEmployee"
            );
        },

        // NEW: Generic field change handler
        onEmployeeFieldChange: function (oEvent) {
            var oSource = oEvent.getSource();
            var sFieldName = oSource.data("fieldName");

            if (!sFieldName) {
                console.warn("Field name not specified for auto-update");
                return;
            }

            // Get the new value
            var vNewValue = oSource.getValue ? oSource.getValue() :
                oSource.getSelectedKey ? oSource.getSelectedKey() :
                    oSource.getState ? oSource.getState() : null;

            // Update the draft immediately
            this._updateDraftField(sFieldName, vNewValue);
        },

        // NEW: Update draft field immediately
        _updateDraftField: function (sFieldName, vValue) {
            if (!this._sDraftPath) {
                console.error("Draft path not available");
                return;
            }

            var oDataModel = this.getView().getModel();
            var oUpdatePayload = {};
            oUpdatePayload[sFieldName] = vValue;

            oDataModel.update(this._sDraftPath, oUpdatePayload, {
                success: function () {
                    console.log("Field '" + sFieldName + "' updated successfully in draft");
                }.bind(this),
                error: function (oError) {
                    console.error("Failed to update field '" + sFieldName + "':", oError);
                    var sErrorMsg = this._extractErrorMessage(oError);
                    MessageBox.error("Failed to update " + sFieldName + ": " + sErrorMsg);
                }.bind(this)
            });
        },

        // MODIFIED: Save only executes prepare and activate
        onSaveEmployeeEdit: function () {
            var oEditModel = this.getView().getModel("editEmployee");

            if (!oEditModel) {
                MessageBox.error("Unable to retrieve employee data. Please try again.");
                return;
            }

            if (!this._sDraftPath) {
                MessageBox.error("Draft path is not available. Please try again.");
                return;
            }

            var oDataModel = this.getView().getModel();
            var oDialog = this._oDialogManager.getDialog("editEmployeeDialog");

            if (oDialog) {
                oDialog.setBusy(true);
            }

            // Set deferred groups for batch processing
            oDataModel.setDeferredGroups(["saveGroup"]);

            // Step 1: Call draftPrepare
            var sPrepareActionPath = this._sDraftPath + "/OMTSrv.draftPrepare";
            var oPreparePayload = {
                SideEffectsQualifier: ""
            };

            oDataModel.create(sPrepareActionPath, oPreparePayload, {
                groupId: "saveGroup",
                success: function () {
                    console.log("Draft prepared successfully");
                }.bind(this),
                error: function (oError) {
                    console.error("Prepare error:", oError);
                }.bind(this)
            });

            // Step 2: Call draftActivate
            var sActivateActionPath = this._sDraftPath + "/OMTSrv.draftActivate";
            var oActivatePayload = {};

            oDataModel.create(sActivateActionPath, oActivatePayload, {
                groupId: "saveGroup",
                urlParameters: {
                    "$select": "Accessibility_AccessID,CID,DraftMessages,Empid,Employer,FirstName,HasActiveEntity,HasDraftEntity,ID,IsActiveEntity,LastName,Location_LocID,NonSAP,Product,ProductGroup,RollOffDate,RollOffImpact_ROI,RollOnDate,SAP,SAPToday,ServiceGroup,Skill_SkillID,Staff_ReasonsRemarks,Staff_RollOffReasons,Staff_RollOffStatus,handoverKtBegun,isNewRecord,ktStarted",
                    "$expand": "Accessibility($select=AccessID,Description),DraftAdministrativeData($select=DraftIsCreatedByMe,DraftUUID,InProcessByUser),Location($select=LocDesc,LocID)"
                },
                success: function (oData) {
                    console.log("Draft activated successfully");
                }.bind(this),
                error: function (oError) {
                    console.error("Activate error:", oError);
                }.bind(this)
            });

            // Submit all changes in the batch
            oDataModel.submitChanges({
                groupId: "saveGroup",
                success: function (oResponse) {
                    if (oDialog) {
                        oDialog.setBusy(false);
                    }

                    var bHasErrors = false;
                    var sErrorMsg = "";

                    if (oResponse.__batchResponses) {
                        oResponse.__batchResponses.forEach(function (oResp) {
                            if (oResp.__changeResponses) {
                                oResp.__changeResponses.forEach(function (oChangeResp) {
                                    if (oChangeResp.statusCode && parseInt(oChangeResp.statusCode) >= 400) {
                                        bHasErrors = true;
                                        sErrorMsg = this._extractErrorMessage(oChangeResp);
                                    }
                                }.bind(this));
                            } else if (oResp.response && parseInt(oResp.response.statusCode) >= 400) {
                                bHasErrors = true;
                                sErrorMsg = this._extractErrorMessage(oResp.response);
                            }
                        }.bind(this));
                    }

                    if (!bHasErrors) {
                        this._sDraftPath = null; // Clear draft path
                        this._oDialogManager.closeDialog("editEmployeeDialog");
                        MessageBox.success("Employee data updated successfully.");
                        this._refreshSmartTable();
                    } else {
                        MessageBox.error("Failed to save changes: " + sErrorMsg);
                    }
                }.bind(this),
                error: function (oError) {
                    if (oDialog) {
                        oDialog.setBusy(false);
                    }
                    var sErrorMsg = this._extractErrorMessage(oError);
                    MessageBox.error("Failed to save changes: " + sErrorMsg);
                }.bind(this)
            });
        },

        onCancelEmployeeEdit: function () {
            MessageBox.confirm("Are you sure you want to cancel? All unsaved changes will be lost.", {
                title: "Confirm",
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        this._discardDraft();
                    }
                }.bind(this)
            });
        },

        _discardDraft: function () {
            if (!this._sDraftPath) {
                this._oDialogManager.closeDialog("editEmployeeDialog");
                return;
            }

            var oDataModel = this.getView().getModel();

            oDataModel.remove(this._sDraftPath, {
                success: function () {
                    console.log("Draft discarded successfully");
                    this._sDraftPath = null; // Clear draft path
                    this._oDialogManager.closeDialog("editEmployeeDialog");
                }.bind(this),
                error: function (oError) {
                    console.error("Failed to discard draft", oError);
                    this._sDraftPath = null;
                    this._oDialogManager.closeDialog("editEmployeeDialog");
                }.bind(this)
            });
        },

        _extractErrorMessage: function (oError) {
            var sErrorMsg = "An error occurred.";
            if (oError.responseText) {
                try {
                    var oErrorResponse = JSON.parse(oError.responseText);
                    sErrorMsg = oErrorResponse.error.message.value ||
                        oErrorResponse.error.message ||
                        sErrorMsg;
                } catch (e) {
                    // Use default error message
                }
            } else if (oError.message) {
                sErrorMsg = oError.message;
            }
            return sErrorMsg;
        },

        _refreshSmartTable: function () {
            var oSmartTable = this.byId("smartTable");
            if (oSmartTable) {
                oSmartTable.rebindTable();
            }
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
        },

        _cleanupDraftData: function () {
            this._sDraftEmployeeId = null;
        },

        _deleteDraftIfExists: function () {
            if (this._sDraftEmployeeId) {
                // Optional: Call backend to delete the draft if needed
                console.log("Cleaning up draft employee:", this._sDraftEmployeeId);
                this._cleanupDraftData();
            }
        }
    });
});