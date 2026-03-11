sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function (BaseObject, MessageBox, MessageToast) {
	"use strict";

	return BaseObject.extend("com.sap.omtool.omtool.services.ODataService", {

		/** 
		 * Constructor
		 * @param oController
		 * @param sModel
		 */
		constructor: function (oController, sModel) {
			this.oODataModel = oController.getOwnerComponent().getModel(sModel);
			this.oController = oController;
		},

		/** 
		 * Execute draft prepare and activate in a single batch request
		 * @param {string} sEmployeeId - Employee ID (GUID)
		 * @returns {Promise}
		 */
		executeDraftOperations: function (sEmployeeId) {
			var that = this;
			
			return new Promise(function (resolve, reject) {
				// Build paths
				var sPreparePath = "/EmployeeHeader(ID=" + sEmployeeId + ",IsActiveEntity=false)/OMTSrv.draftPrepare";
				
				var aSelectFields = [
					"Accessibility_AccessID", "CID", "DraftMessages", "Empid", "Employer",
					"FirstName", "HasActiveEntity", "HasDraftEntity", "ID", "IsActiveEntity",
					"LastName", "Location_LocID", "NonSAP", "Product", "ProductGroup",
					"RollOffDate", "RollOffImpact_ROI", "RollOnDate", "SAP", "SAPToday",
					"ServiceGroup", "Skill_SkillID", "Staff_ReasonsRemarks",
					"Staff_RollOffReasons", "Staff_RollOffStatus", "handoverKtBegun",
					"isNewRecord", "ktStarted"
				];
				
				var sExpandFields = "Accessibility($select=AccessID,Description)," +
					"DraftAdministrativeData($select=DraftIsCreatedByMe,DraftUUID,InProcessByUser)," +
					"Location($select=LocDesc,LocID)";
				
				var sActivatePath = "/EmployeeHeader(ID=" + sEmployeeId + ",IsActiveEntity=false)/OMTSrv.draftActivate";
				var sActivateParams = "$select=" + aSelectFields.join(",") + "&$expand=" + sExpandFields;

				// Set deferred group for batching
				that.oODataModel.setDeferredGroups(["draftBatch"]);
				that.oODataModel.setChangeGroups({
					"EmployeeHeader": {
						groupId: "draftBatch",
						changeSetId: "draftChangeSet"
					}
				});

				var bPrepareSuccess = false;
				var bActivateSuccess = false;
				var oPrepareError = null;
				var oActivateError = null;

				// 1. Queue Draft Prepare
				that.oODataModel.create(sPreparePath, {
					SideEffectsQualifier: ""
				}, {
					groupId: "draftBatch",
					changeSetId: "draftChangeSet",
					success: function (oData) {
						console.log("Draft prepare successful:", oData);
						bPrepareSuccess = true;
					},
					error: function (oError) {
						console.error("Draft prepare failed:", oError);
						oPrepareError = oError;
					}
				});

				// 2. Queue Draft Activate
				that.oODataModel.create(sActivatePath, {}, {
					groupId: "draftBatch",
					changeSetId: "draftChangeSet",
					urlParameters: {
						"$select": aSelectFields.join(","),
						"$expand": sExpandFields
					},
					success: function (oData) {
						console.log("Draft activate successful:", oData);
						bActivateSuccess = true;
					},
					error: function (oError) {
						console.error("Draft activate failed:", oError);
						oActivateError = oError;
					}
				});

				// 3. Submit the batch
				that.oODataModel.submitChanges({
					groupId: "draftBatch",
					success: function (oData) {
						console.log("Batch request completed:", oData);
						
						// Check if both operations succeeded
						if (bPrepareSuccess && bActivateSuccess) {
							resolve(oData);
						} else {
							var sErrorMsg = "Draft operations failed: ";
							if (oPrepareError) {
								sErrorMsg += "Prepare - " + that._extractErrorMessage(oPrepareError) + "; ";
							}
							if (oActivateError) {
								sErrorMsg += "Activate - " + that._extractErrorMessage(oActivateError);
							}
							reject(new Error(sErrorMsg));
						}
					},
					error: function (oError) {
						console.error("Batch request failed:", oError);
						that._showSimpleODataErrorMessage(oError);
						reject(that._extractErrorMessage(oError));
					}
				});
			});
		},

		/** 
		 * Read entity set
		 * @param sPath
		 * @param aFilter
		 * @param sParam
		 * @returns {Promise}
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
		 * Read single entity
		 * @param sPath
		 * @param aFilter
		 * @param sParam
		 * @returns {Promise}
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
		 * Create entity
		 * @param sPath
		 * @param oPayload
		 * @param sParam
		 * @returns {Promise}
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
		 * Update entity
		 * @param sPath
		 * @param sParam
		 * @param oPayload
		 * @returns {Promise}
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
		 * Delete entity
		 * @param sPath
		 * @param sParam
		 * @returns {Promise}
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

		/** 
		 * Extract error message from OData error
		 * @private
		 * @param {object} error
		 * @returns {string}
		 */
		_extractErrorMessage: function (error) {
			try {
				if (error.statusCode === 504) {
					return "Connection timeout";
				}
				if (error.responseText && error.responseText.charAt(0) === "{") {
					var oParsedError = JSON.parse(error.responseText);
					return oParsedError.error.message.value || "Unknown error";
				}
				return error.responseText || error.message || "Unknown error";
			} catch (e) {
				return "Error parsing error message";
			}
		},

		/** 
		 * Show error message dialog
		 * @private
		 * @param {object} error
		 */
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