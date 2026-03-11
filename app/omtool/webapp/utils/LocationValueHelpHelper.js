sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Filter, FilterOperator) {
    "use strict";

    var LocationValueHelpHelper = function (oController) {
        this._oController = oController;
        this._oView = oController.getView();
    };

    LocationValueHelpHelper.prototype = {

        /**
         * Handle suggestion event for location input
         * @param {sap.ui.base.Event} oEvent - Suggest event
         */
        onSuggest: function (oEvent) {
            var sValue = oEvent.getParameter("suggestValue");
            var aFilters = this._buildFilters(sValue);
            var oBinding = oEvent.getSource().getBinding("suggestionItems");

            if (oBinding) {
                oBinding.filter(aFilters);
            }
        },

        /**
         * Handle suggestion item selection
         * @param {sap.ui.base.Event} oEvent - Selection event
         * @param {function} fnCallback - Callback function to handle selected values
         */
        onSuggestionSelected: function (oEvent, fnCallback) {
            var oSelectedItem = oEvent.getParameter("selectedItem");

            if (oSelectedItem && typeof fnCallback === "function") {
                fnCallback(oSelectedItem.getKey(), oSelectedItem.getText());
            }
        },

        /**
         * Handle search in value help dialog
         * @param {sap.ui.base.Event} oEvent - Search event
         */
        onSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = this._buildCombinedFilter(sValue);
            oEvent.getSource().getBinding("items").filter([oFilter]);
        },

        /**
         * Handle confirm in value help dialog
         * @param {sap.ui.base.Event} oEvent - Confirm event
         * @param {function} fnCallback - Callback function to handle selected values
         */
        onDialogConfirm: function (oEvent, fnCallback) {
            var oSelectedItem = oEvent.getParameter("selectedItem");

            if (oSelectedItem && typeof fnCallback === "function") {
                var sLocationID = oSelectedItem.getDescription();
                var sLocationText = oSelectedItem.getTitle();
                fnCallback(sLocationID, sLocationText);
            }

            // Clear the search filter
            this._clearDialogFilter(oEvent);
        },

        /**
         * Handle cancel in value help dialog
         * @param {sap.ui.base.Event} oEvent - Cancel event
         */
        onDialogCancel: function (oEvent) {
            this._clearDialogFilter(oEvent);
        },

        /**
         * Handle change in location input (for clearing)
         * @param {sap.ui.base.Event} oEvent - Change event
         * @param {function} fnCallback - Callback function to handle cleared state
         */
        onChange: function (oEvent, fnCallback) {
            var sValue = oEvent.getParameter("value");

            if ((!sValue || sValue.trim() === "") && typeof fnCallback === "function") {
                fnCallback("", "");
            }
        },

        /**
         * Build filters for suggestion
         * @private
         * @param {string} sValue - Search value
         * @returns {Array} - Array of filters
         */
        _buildFilters: function (sValue) {
            if (!sValue) {
                return [];
            }

            return [
                new Filter({
                    filters: [
                        new Filter("LocDesc", FilterOperator.Contains, sValue),
                        new Filter("LocID", FilterOperator.Contains, sValue)
                    ],
                    and: false
                })
            ];
        },

        /**
         * Build combined filter for dialog search
         * @private
         * @param {string} sValue - Search value
         * @returns {sap.ui.model.Filter} - Combined filter
         */
        _buildCombinedFilter: function (sValue) {
            return new Filter({
                filters: [
                    new Filter("LocDesc", FilterOperator.Contains, sValue),
                    new Filter("LocID", FilterOperator.Contains, sValue)
                ],
                and: false
            });
        },

        /**
         * Clear dialog filter binding
         * @private
         * @param {sap.ui.base.Event} oEvent - Event object
         */
        _clearDialogFilter: function (oEvent) {
            var oBinding = oEvent.getSource().getBinding("items");
            if (oBinding) {
                oBinding.filter([]);
            }
        }
    };

    return LocationValueHelpHelper;
});