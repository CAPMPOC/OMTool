sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function (BaseObject, MessageBox, MessageToast) {
	"use strict";

	return BaseObject.extend("com.sap.bklg.revenuebklgtool.services.ODataService", {

		/** 
		 * 
		 * @param oComponent
		 * @param sModel
		 */
		constructor: function (oController, sModel) {
			this.oODataModel = oController.getOwnerComponent().getModel(sModel);
			this.oController = oController;
		},

		/** 
		 * 
		 * @param sPath
		 * @param aFilter
		 * @param sParam
		 * @returns
		 */
		readEntitySet: function (sPath, aFilter, sParam) {
			return new Promise(function (fnResolve, fnReject) {
				this.oODataModel.read(sPath, {
					filters: aFilter,
					urlParameters: sParam,
					success: function (oData) {
						fnResolve(oData);
					},
					error: function (oError) {
						// this._showSimpleODataErrorMessage(oError);
						fnReject(oError);
					}.bind(this)
				});
			}.bind(this));
		},

		/** 
		 * 
		 * @param sPath
		 * @param sParam
		 * @returns
		 */
		readEntity: function (sPath, aFilter, sParam) {
			return new Promise(function (fnResolve, fnReject) {
				this.oODataModel.read(sPath, {
					filters: aFilter,
					urlParameters: sParam,
					success: function (oData) {
						fnResolve(oData);
					},
					error: function (oError) {
						this._showSimpleODataErrorMessage(oError);
						fnReject(oError);
					}.bind(this)
				});
			}.bind(this));
		},

		/** 
		 * 
		 * @param sPath
		 * @param sParam
		 * @returns
		 */
		createEntity: function (sPath, oPayload, sParam) {
			return new Promise(function (fnResolve, fnReject) {
				this.oODataModel.create(sPath, oPayload, {
					urlParameters: sParam,
					success: function (oData) {
						fnResolve(oData);
					},
					error: function (oError) {
						this._showSimpleODataErrorMessage(oError);
						fnReject(oError);
					}.bind(this)
				});
			}.bind(this));
		},

		/** 
		 * 
		 * @param sPath
		 * @param sParam
		 * @returns
		 */
		updateEntity: function (sPath, sParam, oPayload) {
			return new Promise(function (fnResolve, fnReject) {
				this.oODataModel.update(sPath, oPayload, {
					urlParameters: sParam,
					success: function (oData) {
						fnResolve(oData);
					},
					error: function (oError) {
						this._showSimpleODataErrorMessage(oError);
						fnReject(oError);
					}.bind(this)
				});
			}.bind(this));
		},

		/** 
		 * 
		 * @param sPath
		 * @param sParam
		 * @returns
		 */
		deleteEntity: function (sPath, sParam) {
			return new Promise(function (fnResolve, fnReject) {
				this.oODataModel.remove(sPath, {
					urlParameters: sParam,
					success: function (oData) {
						fnResolve(oData);
					},
					error: function (oError) {
						this._showSimpleODataErrorMessage(oError);
						fnReject(oError);
					}.bind(this)
				});
			}.bind(this));
		},

		//ERROR HANDLING FUNCTIONS
		_showSimpleODataErrorMessage: function (error) {
			let sFinalMessage;
			if (error.statusCode === 504) {
				sFinalMessage = "Connection timeout";
			} else if (error.responseText.charAt(0) !== "{") {
				sFinalMessage = error.responseText;
			} else {
				let oParsedError = JSON.parse(error.responseText);
				let fRegExFirst = new RegExp(/^[+]+/g);
				let fRegExSecond = new RegExp(/[+]+/g);
				let fMatchFirst = oParsedError.error.message.value.match(fRegExFirst);
				sFinalMessage = oParsedError.error.message.value;
				if (fMatchFirst) {
					sFinalMessage = oParsedError.error.message.value.replace(fMatchFirst[0], "");
				}
				let fMatchSecond = sFinalMessage.match(fRegExSecond);
				if (fMatchSecond !== null) {
					for (let i = 0; i <= fMatchSecond.length - 1; i++) {
						sFinalMessage = sFinalMessage.replace(fMatchSecond[i], "\n");
					}
				}
			}
			if (sFinalMessage.length === 0) sFinalMessage = "HTTP request failed (Status Code: " + error.statusCode + ")";
			let bCompact = !!this.oController.getView().$().closest(".sapUiSizeCompact").length;
			MessageBox.show(sFinalMessage, {
				icon: sap.m.MessageBox.Icon.ERROR,
				title: "Error",
				actions: [sap.m.MessageBox.Action.CLOSE],
				styleClass: bCompact ? "sapUiSizeCompact" : "",
				contentWidth: "100px"
			});
		}

	});

});