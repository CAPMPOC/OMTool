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
        onInit: function () {
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
                    Position: "",
                    kickOffDate: null,
                    rollOffDate: null,
                    monthsExperience: 0,
                    statusNewEmployee: false,
                    statusKTStarted: false,
                    statusRollOffStarted: false,
                    statusHandoverKTBegun: false
                };
                
                const oEmployeeModel = new sap.ui.model.json.JSONModel(oEmptyEmployee);
                this.getView().setModel(oEmployeeModel, "employee");
                
                oDialog.open();
            }.bind(this));
        },

        // Create employee handler
        onAddEmployeePress: function () {
            const oView = this.getView();
            const oModel = oView.getModel(); // OData V4 model
            const oEmployeeData = oView.getModel("employee").getData();
            
            // Validate required fields
            if (!this._validateEmployeeData(oEmployeeData)) {
                MessageBox.error("Please fill all required fields");
                return;
            }

            // Prepare payload for backend
            const oPayload = {
                Empid: oEmployeeData.Empid,
                FirstName: oEmployeeData.firstName,
                LastName: oEmployeeData.lastName,
                Location_LocID: oEmployeeData.location,
                CID: oEmployeeData.CID,
                ProductGroup: oEmployeeData.ProductGroup,
                ServiceGroup: oEmployeeData.ServiceGroup,
                Product: oEmployeeData.Product,
                RollOnDate: oEmployeeData.kickOffDate,
                RollOffDate: oEmployeeData.rollOffDate,
                SAP: oEmployeeData.monthsExperience,
                isNewRecord: oEmployeeData.statusNewEmployee,
                ktStarted: oEmployeeData.statusKTStarted,
                handoverKtBegun: oEmployeeData.statusHandoverKTBegun,
                IsActiveEntity: false
            };

            const oListBinding = oModel.bindList("/EmployeeHeader");
            
            // Show busy indicator
            oView.setBusy(true);

            // Call 1: POST to create draft
            const oContext = oListBinding.create(oPayload);
            
            oContext.created().then(() => {
                // Call 2 & 3: Expand and select specific fields (automatic with OData V4)
                const sPath = oContext.getPath();
                
                return oModel.read(sPath, {
                    $select: "Accessibility,Location,NonSAP,RollOffDate,SAP,Skill_SkillID,handoverKtBegun,isNewRecord",
                    $expand: "Accessibility($select=AccessID,Description),Location($select=LocDesc,LocID)"
                });
            }).then(() => {
                // Success - refresh the table
                oView.setBusy(false);
                MessageBox.success("Employee created successfully", {
                    onClose: function () {
                        this._closeDialog();
                        this._refreshSmartTable();
                    }.bind(this)
                });
            }).catch((oError) => {
                oView.setBusy(false);
                MessageBox.error("Error creating employee: " + oError.message);
            });
        },

        _validateEmployeeData: function (oData) {
            return oData.Empid && 
                   oData.firstName && 
                   oData.lastName && 
                   oData.kickOffDate &&
                   oData.monthsExperience >= 0;
        },

        _closeDialog: function () {
            this._pDialog.then(function (oDialog) {
                oDialog.close();
            });
        },

        _refreshSmartTable: function () {
            const oSmartTable = this.byId("employeeSmartTable");
            if (oSmartTable) {
                oSmartTable.rebindTable();
            }
        },

        onCancelEmployee: function () {
            this._closeDialog();
        }
    });
});