sap.ui.define([
    "./Base.controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "../model/models",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "../model/formatter",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, Fragment, models, Filter, FilterOperator, formatter, MessageBox) {
    "use strict";

    return BaseController.extend("com.sap.omtool.omtool.controller.Main", {

        onInit: function () {
            // Initialize view model for section visibility
            var oViewModel = new JSONModel({
                showEmployeeMaster: true,
                showReports: false
            });
            this.getView().setModel(oViewModel, "viewModel");

            // Initialize report data model with calculated percentages
            var oReportModel = new JSONModel({
                totalEmployees: 20,
                ktStarted: 4,
                ktNotStarted: 16,
                ktStartedPercent: 20,
                ktNotStartedPercent: 80,
                rolloffStarted: 6,
                rolloffNotStarted: 14,
                rolloffStartedPercent: 30,
                rolloffNotStartedPercent: 70,
                handoverBegun: 3,
                handoverNotBegun: 3,
                handoverBegunPercent: 50,
                handoverNotBegunPercent: 50
            });
            this.getView().setModel(oReportModel, "reportData");

            this.initSupportModules();
            // Get the OData model (assuming it's the default model)
            // var oModel = this.getOwnerComponent().getModel();

            // Set the model to the view if not already set
            // this.getView().setModel(oModel);

            // Optional: Load AccessibilityVH data explicitly
            this._loadAccessibilityData();

            // Initialize property to store selected location key
            this._selectedLocationKey = "";
        },

        onSegmentedButtonChange: function (oEvent) {
            var sSelectedKey = this.byId("navSegmentedButton").getSelectedKey()
            var oViewModel = this.getView().getModel("viewModel");

            // Toggle visibility based on selected button
            if (sSelectedKey === "employeeMaster") {
                oViewModel.setProperty("/showEmployeeMaster", true);
                oViewModel.setProperty("/showReports", false);
                // Update page title
                this.byId("mainPage").setTitle("Manager Employee Tracker - Employee Master");
            } else if (sSelectedKey === "reports") {
                oViewModel.setProperty("/showEmployeeMaster", false);
                oViewModel.setProperty("/showReports", true);
                // Update page title
                this.byId("mainPage").setTitle("Manager Employee Tracker - Reports");
                // Load reports data when switching to reports
                this._loadReportData();
            }
        },

        onFilterChange: function (oEvent) {
            // TODO: Implement filter logic
            // This will handle filter changes and update charts
        },

        _loadReportData: function () {
            // TODO: Implement data loading logic
            // This will be populated with actual OData service calls later
        },

        /**
         * Load Accessibility Value Help data from backend
         * @private
         */
        _loadAccessibilityData: async function () {
            const oData = await this.oODataService.readEntitySet("/AccessibilityVH")
            console.log(oData);
        },

        onLocationSuggest: function (oEvent) {
            var sValue = oEvent.getParameter("suggestValue");
            var aFilters = [];

            if (sValue) {
                // Filter suggestions based on user input
                aFilters = [
                    new Filter({
                        filters: [
                            new Filter("LocDesc", FilterOperator.Contains, sValue),
                            new Filter("LocID", FilterOperator.Contains, sValue)
                        ],
                        and: false
                    })
                ];
            }

            // Apply filters to suggestion items
            var oInput = oEvent.getSource();
            var oBinding = oInput.getBinding("suggestionItems");

            if (oBinding) {
                oBinding.filter(aFilters);
            }
        },

        onLocationSuggestionSelected: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");

            if (oSelectedItem) {
                var sLocationID = oSelectedItem.getKey();
                var sLocationText = oSelectedItem.getText();

                // Store the selected location ID
                this._selectedLocationKey = sLocationID;

                console.log("Location selected from suggestion - ID:", sLocationID, "Text:", sLocationText);

                // Apply filters
                this._applyFiltersToSmartTable();
            }
        },

        /**
         * Handle Value Help Request for Location
         * @param {sap.ui.base.Event} oEvent - Value help request event
         */
        onLocationValueHelp: function (oEvent) {
            var oView = this.getView();

            // Create dialog lazily
            if (!this._locationDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.omtool.omtool.view.fragments.LocationValueHelp",
                    controller: this
                }).then(function (oDialog) {
                    this._locationDialog = oDialog;
                    oView.addDependent(this._locationDialog);
                    this._locationDialog.open();
                }.bind(this));
            } else {
                this._locationDialog.open();
            }
        },

        /**
         * Handle search in Location Value Help dialog
         * @param {sap.ui.base.Event} oEvent - Search event
         */
        onLocationSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter({
                filters: [
                    new Filter("LocDesc", FilterOperator.Contains, sValue),
                    new Filter("LocID", FilterOperator.Contains, sValue)
                ],
                and: false
            });

            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);
        },

        /**
         * Handle confirm in Location Value Help dialog
         * @param {sap.ui.base.Event} oEvent - Confirm event
         */
        onLocationConfirm: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            var oLocationInput = this.byId("locationValueHelp");

            if (oSelectedItem) {
                var sLocationText = oSelectedItem.getTitle();
                var sLocationID = oSelectedItem.getDescription();

                // Set the selected location in the input field
                oLocationInput.setValue(sLocationText);

                // Store the Location ID for filtering
                this._selectedLocationKey = sLocationID;

                console.log("Location selected - ID:", sLocationID, "Text:", sLocationText);

                // Apply filters
                this._applyFiltersToSmartTable();
            }

            // Clear the search filter
            oEvent.getSource().getBinding("items").filter([]);
        },

        /**
         * Handle cancel in Location Value Help dialog
         * @param {sap.ui.base.Event} oEvent - Cancel event
         */
        onLocationCancel: function (oEvent) {
            // Clear the search filter
            oEvent.getSource().getBinding("items").filter([]);
        },

        /**
         * Handle change in Location input (for manual entry or clearing)
         * @param {sap.ui.base.Event} oEvent - Change event
         */
        onLocationChange: function (oEvent) {
            var sValue = oEvent.getParameter("value");

            // If input is cleared, reset the stored key
            if (!sValue || sValue.trim() === "") {
                this._selectedLocationKey = "";
                console.log("Location cleared");

                // Apply filters (will remove location filter)
                this._applyFiltersToSmartTable();
            }
        },

        /**
         * Placeholder for search functionality
         * @param {sap.ui.base.Event} oEvent - Search event
         */
        onSearch: function (oEvent) {
            // Will implement search filtering logic here later
            var sQuery = oEvent.getParameter("query");
            console.log("Search query:", sQuery);
            // For now, just log. We'll add search logic later if needed

            this._applyFiltersToSmartTable();
        },

        /**
         * Handle filter change in dropdown and apply filter to SmartTable
         * @param {sap.ui.base.Event} oEvent - Selection change event
         */
        onFilterChange: function (oEvent) {
            var oComboBox = oEvent.getSource();
            var sSelectedKey = oComboBox.getSelectedKey();
            var sId = oComboBox.getId();

            console.log("Filter changed - ID:", sId, "Selected Key:", sSelectedKey);

            // Apply filter to SmartTable
            this._applyFiltersToSmartTable();
        },

        onKtStatusChange: function (oEvent) {
            var oComboBox = oEvent.getSource();
            var sSelectedKey = oComboBox.getSelectedKey();

            console.log("KT Status filter changed - Selected Key:", sSelectedKey);

            // Apply filter to SmartTable
            this._applyFiltersToSmartTable();
        },

        /**
         * Apply all active filters to the SmartTable
         * @private
         */
        _applyFiltersToSmartTable: function () {
            // Get the SmartTable
            var oSmartTable = this.byId("smartTable");

            if (!oSmartTable) {
                console.error("SmartTable not found");
                return;
            }

            // Get the inner table from SmartTable
            var oTable = oSmartTable.getTable();

            if (!oTable) {
                console.error("Inner table not found");
                return;
            }

            // Get binding of the table
            var oBinding = oTable.getBinding("items");

            if (!oBinding) {
                console.error("Table binding not found");
                return;
            }

            // Array to hold all filters
            var aFilters = [];

            // ===== SEARCH FILTER =====
            var oSearchField = this.byId("mainSearchField");
            if (oSearchField) {
                var sSearchQuery = oSearchField.getValue();

                if (sSearchQuery && sSearchQuery.trim() !== "") {
                    // Create OR filters for multiple fields
                    // IMPORTANT: Replace these field names with your actual JobPostings entity fields
                    var aSearchFilters = [
                        new Filter("Empid", FilterOperator.Contains, sSearchQuery),
                        new Filter("CID", FilterOperator.Contains, sSearchQuery),
                        new Filter("FirstName", FilterOperator.Contains, sSearchQuery),
                        new Filter("LastName", FilterOperator.Contains, sSearchQuery),
                        new Filter("Employer", FilterOperator.Contains, sSearchQuery),
                        new Filter("Accessibility_AccessID", FilterOperator.Contains, sSearchQuery),
                        new Filter("Location_LocID", FilterOperator.Contains, sSearchQuery),
                        new Filter("ProductGroup", FilterOperator.Contains, sSearchQuery),
                        new Filter("Product", FilterOperator.Contains, sSearchQuery),
                        new Filter("ServiceGroup", FilterOperator.Contains, sSearchQuery),
                        new Filter("NonSAP", FilterOperator.Contains, sSearchQuery),
                        new Filter("SAP", FilterOperator.Contains, sSearchQuery),
                        new Filter("SAPToday", FilterOperator.Contains, sSearchQuery),
                        // Add more fields as needed
                    ];

                    // Combine search filters with OR logic
                    var oSearchFilter = new Filter({
                        filters: aSearchFilters,
                        and: false  // OR condition - search in any of these fields
                    });

                    aFilters.push(oSearchFilter);
                }
            }

            // ===== DROPDOWN FILTERS =====
            // Get filter value from Dropdown 1 (Accessibility)
            var oDropdown1 = this.byId("Position");
            if (oDropdown1) {
                var sAccessibilityKey = oDropdown1.getSelectedKey();

                // Only add filter if a value is selected (not empty)
                if (sAccessibilityKey && sAccessibilityKey !== "" && sAccessibilityKey !== "All") {
                    // IMPORTANT: Replace "accessibilityField" with your actual field name from JobPostings entity
                    var oFilter1 = new Filter("Accessibility_AccessID", FilterOperator.EQ, sAccessibilityKey);
                    aFilters.push(oFilter1);
                }
            }

            // ===== VALUE HELP FILTER 2 - Location =====
            if (this._selectedLocationKey && this._selectedLocationKey !== "") {
                // IMPORTANT: Replace "locationField" with your actual field name in JobPostings entity
                var oLocationFilter = new Filter("Location_LocID", FilterOperator.EQ, this._selectedLocationKey);
                aFilters.push(oLocationFilter);
                console.log("Location filter applied with key:", this._selectedLocationKey);
            } else {
                console.log("No location selected - No location filter applied");
            }

            // ===== DROPDOWN FILTER 3 - KT Started (Boolean) =====
            var oDropdown3 = this.byId("filterDropdown3");
            if (oDropdown3) {
                var sKtStatusKey = oDropdown3.getSelectedKey();

                // Only add filter if a value is selected (not "All")
                if (sKtStatusKey && sKtStatusKey !== "") {
                    // Convert string to boolean
                    var bKtStarted = (sKtStatusKey === "true");

                    // IMPORTANT: Replace "ktStarted" with your actual field name if different
                    var oKtFilter = new Filter("ktStarted", FilterOperator.EQ, bKtStarted);
                    aFilters.push(oKtFilter);
                    console.log("KT Started filter applied with value:", bKtStarted);
                } else {
                    console.log("'All' selected - No KT filter applied");
                }
            }

            // Apply filters to the table binding
            oBinding.filter(aFilters);

            console.log("Filters applied:", aFilters.length);

        },

        onAddEmployee: async function () {
            this._oDialog = null;
            if (!this._pDialog) {
                this._pDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "com.sap.omtool.omtool.view.fragments.DialogFragment",
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }

            this._pDialog.then(function (oDialog) {
                // Initialize empty employee model
                const oEmptyEmployee = {
                    Empid: "",
                    firstName: "",
                    lastName: "",
                    location: "",
                    CID: "",
                    ProductGroup: "",
                    ServiceGroup: "",
                    Product: "",
                    Accessibility: "",
                    Employer: "",
                    rollOnDate: null,
                    rollOffDate: null,
                    SAP: 0,
                    NonSAP: 0,
                    SAPToday: '',
                    Skill_SkillID: "",
                    statusRollOffStarted: false,
                    statusHandoverKTBegun: false
                };

                const oEmployeeModel = new sap.ui.model.json.JSONModel(oEmptyEmployee);
                this.getView().setModel(oEmployeeModel, "employee");

                oDialog.open();
            }.bind(this));
        },

        onAddEmployeePress: async function () {
            try {
                const oView = this.getView();
                const oEmployeeModel = oView.getModel("employee");
                const oEmployeeData = oEmployeeModel.getData();

                // Validate required fields
                if (!this._validateEmployeeData(oEmployeeData)) {
                    MessageBox.error("Please fill all required fields:\n- Employee ID\n- First Name\n- Last Name\n- Kick-off Date\n- SAP Experience");
                    return;
                }

                // Show busy indicator
                const oDialog = this.byId("employeeDialog");
                oDialog.setBusy(true);

                const oModel = this.getView().getModel(); // Your OData V2 model

                // Execute batch operation
                await this._createAndSaveEmployee(oModel, oEmployeeData);

                // Success - close dialog and refresh
                oDialog.setBusy(false);

                MessageBox.success("Employee saved successfully", {
                    onClose: function () {
                        this._closeDialog();
                        this._refreshMainView();
                    }.bind(this)
                });

            } catch (error) {
                MessageBox.error("Error saving employee: " + (error.message || "Unknown error"));
                console.error("Save employee error:", error);

                const oDialog = this.byId("employeeDialog");
                if (oDialog) {
                    oDialog.setBusy(false);
                }
            }
        },

        _validateEmployeeData: function (oData) {
            // Validate required fields
            return !!(
                oData.Empid &&
                oData.firstName &&
                oData.lastName &&
                oData.rollOnDate &&
                oData.SAP
            );
        },

        _prepareEmployeePayload: function (oEmployeeData) {
            // Map frontend model to backend entity structure
            return {
                Empid: oEmployeeData.Empid.trim(),
                FirstName: oEmployeeData.firstName.trim(),
                LastName: oEmployeeData.lastName.trim(),
                Location_LocID: oEmployeeData.location ? oEmployeeData.location.trim() : null,
                CID: oEmployeeData.CID ? oEmployeeData.CID.trim() : "",
                ProductGroup: oEmployeeData.ProductGroup ? oEmployeeData.ProductGroup.trim() : "",
                ServiceGroup: oEmployeeData.ServiceGroup ? oEmployeeData.ServiceGroup.trim() : "",
                Product: oEmployeeData.Product ? oEmployeeData.Product.trim() : "",
                Accessibility_AccessID: oEmployeeData.Accessibility ? oEmployeeData.Accessibility.trim() : "",
                Employer: oEmployeeData.Employer ? oEmployeeData.Employer.trim() : "",
                RollOnDate: oEmployeeData.rollOnDate ? this._formatDate(oEmployeeData.rollOnDate) : null,
                RollOffDate: oEmployeeData.rollOffDate ? this._formatDate(oEmployeeData.rollOffDate) : null,
                SAP: parseInt(oEmployeeData.SAP) || 0,
                NonSAP: parseInt(oEmployeeData.NonSAP) || 0,
                SAPToday: parseInt(oEmployeeData.SAPToday) || 0,
                Skill_SkillID: oEmployeeData.Skill ? oEmployeeData.Skill.trim() : "",
                Staff_RollOffStatus: oEmployeeData.statusRollOffStarted || false,
                handoverKtBegun: oEmployeeData.statusHandoverKTBegun || false,
                IsActiveEntity: false // Create as draft first
            };
        },

        _formatDate: function (sDate) {
            // Ensure date is in correct format for backend
            if (!sDate) return null;

            // If it's already a Date object
            if (sDate instanceof Date) {
                return sDate.toISOString().split('T')[0];
            }

            // If it's a string in yyyy-MM-dd format, return as is
            if (typeof sDate === 'string' && sDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return sDate;
            }

            // Try to parse and format
            const oDate = new Date(sDate);
            if (!isNaN(oDate.getTime())) {
                return oDate.toISOString().split('T')[0];
            }

            return null;
        },

        _createAndSaveEmployee: function (oModel, oEmployeeData) {
            return new Promise((resolve, reject) => {
                const oPayload = this._prepareEmployeePayload(oEmployeeData);

                console.log("Creating employee with payload:", oPayload);

                // Store the employee ID for later use
                let sCreatedEmployeeId = null;

                // Create the draft entry
                oModel.create("/EmployeeHeader", oPayload, {
                    success: function (oCreatedData) {
                        console.log("Draft created successfully:", oCreatedData);
                        sCreatedEmployeeId = oCreatedData.ID;

                        if (!sCreatedEmployeeId) {
                            reject(new Error("No ID returned from create operation"));
                            return;
                        }

                        // Now prepare and activate the draft using POST
                        this._prepareDraftPost(oModel, sCreatedEmployeeId)
                            .then(() => {
                                return this._activateDraftPost(oModel, sCreatedEmployeeId);
                            })
                            .then(() => {
                                console.log("Employee saved successfully");
                                resolve();
                            })
                            .catch((error) => {
                                console.error("Error in draft prepare/activate:", error);
                                reject(error);
                            });

                    }.bind(this),
                    error: function (oError) {
                        console.error("Create draft error:", oError);
                        let sErrorMsg = "Failed to create employee entry";

                        try {
                            if (oError.responseText) {
                                const oErrorResponse = JSON.parse(oError.responseText);
                                sErrorMsg = oErrorResponse.error?.message?.value || sErrorMsg;
                            }
                        } catch (e) {
                            console.error("Error parsing error response:", e);
                        }

                        reject(new Error(sErrorMsg));
                    }
                });
            });
        },

        _prepareDraftPost: function (oModel, sEmployeeId) {
            return new Promise((resolve, reject) => {
                // Use POST to call the bound action
                const sPath = `/EmployeeHeader(ID=${sEmployeeId},IsActiveEntity=false)/OMTSrv.draftPrepare`;
                const oPayload = {
                    SideEffectsQualifier: ""
                };

                console.log("Preparing draft for:", sEmployeeId);
                console.log("POST path:", sPath);

                this.oODataService.createEntity(sPath, oPayload)
                    .then((oData) => {
                        resolve(oData)
                    })
                    .catch((oError) => {
                        reject(oError);
                    })
            });
        },

        _activateDraftPost: function (oModel, sEmployeeId) {
            return new Promise((resolve, reject) => {
                // Use POST to call the bound action
                const aSelects = [
                    "Accessibility_AccessID", "CID", "DraftMessages", "Empid", "Employer",
                    "FirstName", "HasActiveEntity", "HasDraftEntity", "ID", "IsActiveEntity",
                    "LastName", "Location_LocID", "NonSAP", "Product", "ProductGroup",
                    "RollOffDate", "RollOffImpact_ROI", "RollOnDate", "SAP", "SAPToday",
                    "ServiceGroup", "Skill_SkillID", "Staff_ReasonsRemarks",
                    "Staff_RollOffReasons", "Staff_RollOffStatus", "handoverKtBegun",
                    "isNewRecord", "ktStarted"
                ];

                const sExpand = "Accessibility($select=AccessID,Description)," +
                    "DraftAdministrativeData($select=DraftIsCreatedByMe,DraftUUID,InProcessByUser)," +
                    "Location($select=LocID,LocDesc)";

                const sPath = `/EmployeeHeader(ID=${sEmployeeId},IsActiveEntity=false)/OMTSrv.draftActivate` +
                    `?$select=${aSelects.join(",")}&$expand=${sExpand}`;

                console.log("Activating draft for:", sEmployeeId);
                console.log("POST path:", sPath);

                this.oODataService.createEntity(sPath)
                    .then((oData) => {
                        resolve(oData)
                    })
                    .catch((oError) => {
                        reject(oError)
                    })
            });
        },

        _closeDialog: function () {
            const oDialog = this.byId("employeeDialog");
            if (oDialog) {
                oDialog.close();
            }
        },

        _refreshMainView: function () {
            // Refresh your SmartTable
            const oSmartTable = this.byId("smartTable"); // Replace with your actual SmartTable ID
            if (oSmartTable) {
                oSmartTable.rebindTable();
            }

            // Also refresh the model to ensure data is up-to-date
            const oModel = this.getView().getModel();
            if (oModel) {
                oModel.refresh(true);
            }
        },

        onCancelEmployee: function () {
            // Optional: Show confirmation dialog if data was entered
            const oEmployeeModel = this.getView().getModel("employee");
            const oData = oEmployeeModel.getData();

            const bHasData = !!(oData.Empid || oData.firstName || oData.lastName);

            if (bHasData) {
                MessageBox.confirm("Are you sure you want to cancel? All entered data will be lost.", {
                    title: "Confirm Cancel",
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            this._closeDialog();
                        }
                    }.bind(this)
                });
            } else {
                this._closeDialog();
            }
        },
        onViewEmployee: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext();

            if (!oContext) {
                MessageToast.show("No employee data available");
                return;
            }

            // Get the employee data from the context
            var oEmployeeData = oContext.getObject();

            console.log("Employee Data:", oEmployeeData); // Debug log

            // Create a JSON model with the employee data
            var oViewModel = new sap.ui.model.json.JSONModel(oEmployeeData);

            var oView = this.getView();

            if (!this._oEmployeeDetailDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.omtool.omtool.view.fragments.ViewEmployee",
                    controller: this
                }).then(function (oDialog) {
                    this._oEmployeeDetailDialog = oDialog;
                    oView.addDependent(this._oEmployeeDetailDialog);

                    // Set the viewEmployee model to the dialog
                    this._oEmployeeDetailDialog.setModel(oViewModel, "viewEmployee");

                    this._oEmployeeDetailDialog.open();
                }.bind(this));
            } else {
                // Update the viewEmployee model with new data
                this._oEmployeeDetailDialog.setModel(oViewModel, "viewEmployee");
                this._oEmployeeDetailDialog.open();
            }
        },

        onCloseEmployeeDetail: function () {
            if (this._oEmployeeDetailDialog) {
                this._oEmployeeDetailDialog.close();
            }
        },

        // Cleanup when view is destroyed
        onExit: function () {
            if (this._oEmployeeDetailDialog) {
                this._oEmployeeDetailDialog.destroy();
            }
        }
    });
});