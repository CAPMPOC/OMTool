sap.ui.define([], function () {
    "use strict";

    return Object.freeze({
        // Entity Sets
        ENTITY_SETS: {
            EMPLOYEE_HEADER: "/EmployeeHeader",
            ACCESSIBILITY_VH: "/AccessibilityVH",
            LOCATION_VH: "/LocationVH"
        },

        // Fragment Paths
        FRAGMENTS: {
            ADD_EMPLOYEE: "com.sap.omtool.omtool.view.fragments.DialogFragment",
            VIEW_EMPLOYEE: "com.sap.omtool.omtool.view.fragments.ViewEmployee",
            EMPLOYEE_LOCATION_VH: "com.sap.omtool.omtool.view.fragments.EmployeeLocationValueHelp"
        },

        // Messages
        MESSAGES: {
            SAVE_SUCCESS: "Employee saved successfully",
            SAVE_ERROR: "Error saving employee: ",
            VALIDATION_ERROR: "Please fill all required fields:\n- Employee ID\n- First Name\n- Last Name\n- Kick-off Date\n- SAP Experience",
            CANCEL_CONFIRM: "Are you sure you want to cancel? All entered data will be lost.",
            NO_DATA: "No employee data available",
            CREATE_FAILED: "Failed to create employee entry"
        },

        // Page Titles
        PAGE_TITLES: {
            EMPLOYEE_MASTER: "Manager Employee Tracker - Employee Master",
            REPORTS: "Manager Employee Tracker - Reports"
        },

        // Default Values
        DEFAULTS: {
            EMPTY_EMPLOYEE: {
                Empid: "",
                firstName: "",
                lastName: "",
                location: "",
                locationDesc: "",
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
                SAPToday: "",
                Skill_SkillID: "",
                statusRollOffStarted: false,
                statusHandoverKTBegun: false
            },

            REPORT_DATA: {
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
            }
        },

        // Select Fields for Draft Activation
        DRAFT_SELECT_FIELDS: [
            "Accessibility_AccessID", "CID", "DraftMessages", "Empid", "Employer",
            "FirstName", "HasActiveEntity", "HasDraftEntity", "ID", "IsActiveEntity",
            "LastName", "Location_LocID", "NonSAP", "Product", "ProductGroup",
            "RollOffDate", "RollOffImpact_ROI", "RollOnDate", "SAP", "SAPToday",
            "ServiceGroup", "Skill_SkillID", "Staff_ReasonsRemarks",
            "Staff_RollOffReasons", "Staff_RollOffStatus", "handoverKtBegun",
            "isNewRecord", "ktStarted"
        ],

        DRAFT_EXPAND_FIELDS: "Accessibility($select=AccessID,Description)," +
            "DraftAdministrativeData($select=DraftIsCreatedByMe,DraftUUID,InProcessByUser)," +
            "Location($select=LocDesc,LocID)"
    });
});