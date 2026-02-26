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
        },

        /**
         * Load Accessibility Value Help data from backend
         * @private
         */
        _loadAccessibilityData:async function () {
            var oModel = this.getView().getModel();
            
            // // Read AccessibilityVH entity set
            // oModel.read("/AccessibilityVH", {
            //     success: function (oData) {
            //         console.log("AccessibilityVH data loaded successfully:", oData);
            //     },
            //     error: function (oError) {
            //         console.error("Error loading AccessibilityVH data:", oError);
            //         sap.m.MessageToast.show("Error loading accessibility options");
            //     }
            // });
            const oData = await this.oODataService.readEntitySet("/AccessibilityVH")
            console.log(oData);
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

            // Get filter values from other dropdowns (if needed later)
            // var oDropdown2 = this.byId("filterDropdown2");
            // if (oDropdown2 && oDropdown2.getSelectedKey()) {
            //     var oFilter2 = new Filter("fieldName2", FilterOperator.EQ, oDropdown2.getSelectedKey());
            //     aFilters.push(oFilter2);
            // }

            // Apply filters to the table binding
            oBinding.filter(aFilters);

            console.log("Filters applied:", aFilters.length);
            this._oDialog = null;
        },

        onAddEmployee: async function () {
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