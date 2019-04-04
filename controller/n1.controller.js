var NView = null;
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/m/MessageBox',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter'
], function (Controller, MessageBox, JSONModel, Filter) {
	"use strict";

	return Controller.extend("com.sap.swazgrading.controller.n1", {

		onInit: function () {
			this._initialize();
		},
		handleValueHelp: function (oEvent) {
			//	var sInputValue = oEvent.getSource().getValue();
			var sInputValue = "";
			this.inputId = oEvent.getSource().getId();
			// create value help dialog
			if (!this._valueHelpDialog) {
				this._valueHelpDialog = sap.ui.xmlfragment(
					"com.sap.swazgrading.util.Dialog",
					this
				);
				this.getView().addDependent(this._valueHelpDialog);
			}

			// create a filter for the binding
			this._valueHelpDialog.getBinding("items").filter([new Filter(
				"MapUname",
				sap.ui.model.FilterOperator.Contains, sInputValue
			)]);

			// open value help dialog filtered by the input value
			this._valueHelpDialog.open(sInputValue);
		},

		_handleValueHelpSearch: function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new Filter(
				"MapUname",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},

		_handleValueHelpClose: function (evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var userInput = this.byId(this.inputId),
					sDescription = oSelectedItem.getTitle();
				userInput.setSelectedKey(sDescription);
				NView.uName = sDescription;
				NView.handelYear();
			}
			evt.getSource().getBinding("items").filter([]);
		},

		suggestionItemSelected: function (evt) {

			var oItem = evt.getParameter('selectedItem'),
				oText = this.byId('selectedKey'),
				sKey = oItem ? oItem.getKey() : '';

			oText.setText(sKey);
		},
		_initialize: function () {
			sap.ui.core.BusyIndicator.show();
			var that = this;
			NView = this;
			this.sUrl = "/sap/opu/odata/sap/ZGW_SWA_GRADE_SRV/";
			var a = [];
			a.push(new sap.ui.model.Filter("AppType", sap.ui.model.FilterOperator.EQ, 'O'));
			var appType = new sap.ui.model.Filter({
				filters: a,
				and: true
			});
			var filter = new sap.ui.model.Filter({
				filters: [appType],
				and: true
			});

			var oDataModel = new sap.ui.model.odata.v2.ODataModel(that.sUrl, {
				json: true,
				loadMetadataAsync: true
			});
			oDataModel.read("/UserListSet", {
				filters: [filter],
				success: function (oData, response) {
					if (oData.results.length === 0) {
						that.byId("userListBox").setVisible(false);
						that.uName = "";
					} else {
						that.byId("userListBox").setVisible(true);
						var dataModelU = new JSONModel();
						dataModelU.setData({
							"Value": oData.results
						});
						that.getView().setModel(dataModelU, "userList");
						for (var i = 0; i < oData.results.length; i++) {
							if (oData.results[i].Flag === "X") {
								that.byId("UserListInp").setSelectedKey(oData.results[i].MapUname);
								that.uName = oData.results[i].MapUname;
							}
						}
					}
					NView.handelYear();
				}
			});

		},
		handelYear: function (oEvent) {
			var oDataModel = new sap.ui.model.odata.v2.ODataModel(NView.sUrl, {
				json: true,
				loadMetadataAsync: true
			});
			oDataModel.read("/YearSet", {
				success: function (oData, response) {
					var dataModel = new JSONModel();
					dataModel.setData({
						"Value": oData.results
					});
					for (var y = 0; y < oData.results.length; y++) {
						if (oData.results[y].Flag === "X") {
							NView.byId("idoSelect3").setSelectedKey(oData.results[y].yearId);
						}
					}
					NView.getView().setModel(dataModel, "Year");
					NView.handleSelectionChange3();
					sap.ui.core.BusyIndicator.hide();
				},
				error: function (oError) {
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},
		handleSelectionChange3: function () {
			sap.ui.core.BusyIndicator.show();
			var that = this;
			this.sUrl = "/sap/opu/odata/sap/ZGW_SWA_GRADE_SRV/";
			var oDataModel = new sap.ui.model.odata.v2.ODataModel(that.sUrl, {
				json: true,
				loadMetadataAsync: true
			});
			oDataModel.read("/TermSet", {
				success: function (oData, response) {
					var dataModel = new JSONModel();
					dataModel.setData({
						"Value": oData.results
					});
					for (var f = 0; f < oData.results.length; f++) {
						if (oData.results[f].Flag === "X") {
							that.byId("idoSelect4").setSelectedKey(oData.results[f].termId);
						}
					}
					that.getView().setModel(dataModel, "Term");
					that.handleSelectionChange4();
					sap.ui.core.BusyIndicator.hide();
				},
				error: function (oError) {
					that.byId("idoSelect1").destroyItems();
					that.byId("idoSelect2").destroyItems();
					that.byId("idoSelect5").destroyItems();
					that.byId("idoSelect6").destroyItems();
					sap.ui.core.BusyIndicator.hide();
				}
			});

		},
		onHistorical: function (oEvent) {
			var year = this.byId("idoSelect3").getSelectedKey();
			var term = this.byId("idoSelect4").getSelectedKey();
			var termname = this.byId("idoSelect4")._getSelectedItemText();
			var subject = this.byId("idoSelect1").getSelectedKey();
			var name = this.byId("idoSelect1")._getSelectedItemText();
			var grd = this.byId("idoSelectGrd")._getSelectedItemText();
			var uName = "";
			if (NView.uName === "") {
				uName = "X";
			} else {
				uName = NView.uName;
			}
			if (year !== "" && term !== "" && subject !== "" && name !== "") {
				this.getOwnerComponent().getRouter().navTo("historical", {
					year: year,
					term: term,
					subject: subject,
					name: name,
					tname: termname,
					grd: grd,
					uname: uName
				});
			} else {
				var dialog_Msg = new sap.m.Dialog({
					title: 'Error',
					type: 'Message',
					state: 'Error',
					content: new sap.m.Text({
						text: 'Please select TERM YEAR and SUBJECT'
					}),
					beginButton: new sap.m.Button({
						text: 'OK',
						press: function () {
							dialog_Msg.close();
						}
					}),
					afterClose: function () {
						dialog_Msg.destroy();
					}
				});
				dialog_Msg.open();
			}
		},
		handleSelectionChange4: function () {
			sap.ui.core.BusyIndicator.show();
			var that = this;
			this.sUrl = "/sap/opu/odata/sap/ZGW_SWA_GRADE_SRV/";
			var oDataModel = new sap.ui.model.odata.v2.ODataModel(that.sUrl, {
				json: true,
				loadMetadataAsync: true
			});
			if (that.byId("idoSelect3").getSelectedKey() === "") {
				if (that.byId("idoSelect3").getFirstItem() !== null) {
					that.year = that.byId("idoSelect3").getFirstItem().getKey();
					that.byId("idoSelect3").setSelectedKey(that.year);
				}
			} else {
				that.year = that.byId("idoSelect3").getSelectedKey();
			}
			if (that.byId("idoSelect4").getSelectedKey() === "") {
				if (that.byId("idoSelect4").getFirstItem() !== null) {
					that.term = that.byId("idoSelect4").getFirstItem().getKey();
					that.byId("idoSelect4").setSelectedKey(that.term);
				}
			} else {
				that.term = that.byId("idoSelect4").getSelectedKey();
			}
			var a = [],
				b = [],
				c = [],
				d = [];
			a.push(new sap.ui.model.Filter("Year", sap.ui.model.FilterOperator.EQ, that.year));
			b.push(new sap.ui.model.Filter("Term", sap.ui.model.FilterOperator.EQ, that.term));
			c.push(new sap.ui.model.Filter("MYP", sap.ui.model.FilterOperator.EQ, "F"));
			d.push(new sap.ui.model.Filter("responseText", sap.ui.model.FilterOperator.EQ, that.uName));
			var filter1 = new sap.ui.model.Filter({
				filters: a,
				and: true
			});
			var filter2 = new sap.ui.model.Filter({
				filters: b,
				and: true
			});
			var filter3 = new sap.ui.model.Filter({
				filters: c,
				and: true
			});
			var filterName = new sap.ui.model.Filter({
				filters: d,
				and: true
			});
			var filter = new sap.ui.model.Filter({
				filters: [filter1, filter2, filter3, filterName],
				and: true
			});

			oDataModel.read("/timetableSet", {
				filters: [filter],
				success: function (oData, response) {
					var dataModel = new JSONModel();
					dataModel.setData({
						"Value": oData.results
					});
					that.getView().setModel(dataModel, "GRD");
					if (oData.results.length === 0) {

						that.byId("idoSelectGrd").destroyItems();
						that.byId("idoSelect1").destroyItems();
						that.byId("idoSelect2").destroyItems();
						that.byId("idoSelect5").destroyItems();
						that.byId("idoSelect6").destroyItems();
					}
					that.handleSelectionChangeSub();
					sap.ui.core.BusyIndicator.hide();
				},
				error: function (oError) {
					that.byId("idoSelect2").destroyItems();
					that.byId("idoSelect5").destroyItems();
					that.byId("idoSelect6").destroyItems();
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},
		handleSelectionChangeSub: function () {
			sap.ui.core.BusyIndicator.show();
			var that = this;
			this.sUrl = "/sap/opu/odata/sap/ZGW_SWA_GRADE_SRV/";
			var oDataModel = new sap.ui.model.odata.v2.ODataModel(that.sUrl, {
				json: true,
				loadMetadataAsync: true
			});
			if (that.byId("idoSelect3").getSelectedKey() === "") {
				if (that.byId("idoSelect3").getFirstItem() !== null) {
					that.year = that.byId("idoSelect3").getFirstItem().getKey();
					that.byId("idoSelect3").setSelectedKey(that.year);
				}
			} else {
				that.year = that.byId("idoSelect3").getSelectedKey();
			}
			if (that.byId("idoSelect4").getSelectedKey() === "") {
				if (that.byId("idoSelect4").getFirstItem() !== null) {
					that.term = that.byId("idoSelect4").getFirstItem().getKey();
					that.byId("idoSelect4").setSelectedKey(that.term);
				}
			} else {
				that.term = that.byId("idoSelect4").getSelectedKey();
			}
			var a = [],
				b = [],
				c = [],
				d = [],
				e = [];
			if (that.getView().getModel("GRD").getData().Value.length !== 0) {
				var grd = that.getView().getModel("GRD").getData().Value[0].GRADE_ID;
				that.byId("idoSelect1").setSelectedKey("");
				that.byId("idoSelectGrd").setSelectedKey(that.getView().getModel("GRD").getData().Value[0].GRADE_ID);
			}
			a.push(new sap.ui.model.Filter("Year", sap.ui.model.FilterOperator.EQ, that.year));
			b.push(new sap.ui.model.Filter("Term", sap.ui.model.FilterOperator.EQ, that.term));
			c.push(new sap.ui.model.Filter("MYP", sap.ui.model.FilterOperator.EQ, "F"));
			d.push(new sap.ui.model.Filter("GRADE_ID", sap.ui.model.FilterOperator.EQ, grd));
			e.push(new sap.ui.model.Filter("responseText", sap.ui.model.FilterOperator.EQ, that.uName));
			var filter1 = new sap.ui.model.Filter({
				filters: a,
				and: true
			});
			var filter2 = new sap.ui.model.Filter({
				filters: b,
				and: true
			});
			var filter3 = new sap.ui.model.Filter({
				filters: c,
				and: true
			});
			var filter4 = new sap.ui.model.Filter({
				filters: d,
				and: true
			});
			var filterName = new sap.ui.model.Filter({
				filters: e,
				and: true
			});
			var filter = new sap.ui.model.Filter({
				filters: [filter1, filter2, filter3, filter4, filterName],
				and: true
			});
			oDataModel.read("/timetableSet", {
				filters: [filter],
				success: function (oData, response) {
					var dataModel = new JSONModel();
					dataModel.setData({
						"Value": oData.results
					});
					that.getView().setModel(dataModel, "Subject");
					if (oData.results.length === 0) {
						that.byId("idoSelect1").destroyItems();
						that.byId("idoSelect2").destroyItems();
						that.byId("idoSelect5").destroyItems();
						that.byId("idoSelect6").destroyItems();
					}
					that.handleSelectionChange1();
					sap.ui.core.BusyIndicator.hide();
				},
				error: function (oError) {
					that.byId("idoSelect2").destroyItems();
					that.byId("idoSelect5").destroyItems();
					that.byId("idoSelect6").destroyItems();
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},
		handleSelectionChangeGrd: function () {
			sap.ui.core.BusyIndicator.show();
			var that = this;
			this.sUrl = "/sap/opu/odata/sap/ZGW_SWA_GRADE_SRV/";

			var oDataModel = new sap.ui.model.odata.v2.ODataModel(that.sUrl, {
				json: true,
				loadMetadataAsync: true
			});
			if (that.byId("idoSelect3").getSelectedKey() === "") {
				if (that.byId("idoSelect3").getFirstItem() !== null) {
					that.year = that.byId("idoSelect3").getFirstItem().getKey();
					that.byId("idoSelect3").setSelectedKey(that.year);
				}
			} else {
				that.year = that.byId("idoSelect3").getSelectedKey();
			}
			if (that.byId("idoSelect4").getSelectedKey() === "") {
				if (that.byId("idoSelect4").getFirstItem() !== null) {
					that.term = that.byId("idoSelect4").getFirstItem().getKey();
					that.byId("idoSelect4").setSelectedKey(that.term);
				}
			} else {
				that.term = that.byId("idoSelect4").getSelectedKey();
			}
			if (that.byId("idoSelectGrd").getSelectedKey() === "") {
				if (that.byId("idoSelectGrd").getFirstItem() !== null) {
				var	grd = that.byId("idoSelectGrd").getFirstItem().getKey();
					that.byId("idoSelectGrd").setSelectedKey(grd);
				}
			} else {
				grd = that.byId("idoSelectGrd").getSelectedKey();
			}
			var a = [],
				b = [],
				c = [],
				d = [],
				f = [];
		//	var grd = that.getView().byId("idoSelectGrd").getSelectedKey();
			a.push(new sap.ui.model.Filter("Year", sap.ui.model.FilterOperator.EQ, that.year));
			b.push(new sap.ui.model.Filter("Term", sap.ui.model.FilterOperator.EQ, that.term));
			c.push(new sap.ui.model.Filter("MYP", sap.ui.model.FilterOperator.EQ, "F"));
			d.push(new sap.ui.model.Filter("GRADE_ID", sap.ui.model.FilterOperator.EQ, grd));
			f.push(new sap.ui.model.Filter("responseText", sap.ui.model.FilterOperator.EQ, that.uName));
			var filter1 = new sap.ui.model.Filter({
				filters: a,
				and: true
			});
			var filter2 = new sap.ui.model.Filter({
				filters: b,
				and: true
			});
			var filter3 = new sap.ui.model.Filter({
				filters: c,
				and: true
			});
			var filter4 = new sap.ui.model.Filter({
				filters: d,
				and: true
			});
			var filterName = new sap.ui.model.Filter({
				filters: f,
				and: true
			});
			var filter = new sap.ui.model.Filter({
				filters: [filter1, filter2, filter3, filter4, filterName],
				and: true
			});

			oDataModel.read("/timetableSet", {
				filters: [filter],
				success: function (oData, response) {
					var dataModel = new JSONModel();
					dataModel.setData({
						"Value": oData.results
					});
					that.getView().setModel(dataModel, "Subject");
					if (oData.results.length === 0) {
						that.byId("idoSelect1").destroyItems();
						that.byId("idoSelect2").destroyItems();
						that.byId("idoSelect5").destroyItems();
						that.byId("idoSelect6").destroyItems();
					}
					that.handleSelectionChange1("sub");
					//that.handleSelectionChange4();
					sap.ui.core.BusyIndicator.hide();
				},
				error: function (oError) {
					that.byId("idoSelect2").destroyItems();
					that.byId("idoSelect5").destroyItems();
					that.byId("idoSelect6").destroyItems();
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},
		handleSelectionChange1: function (event) {
			sap.ui.core.BusyIndicator.show();
			var that = this;
			var oDataModel = new sap.ui.model.odata.v2.ODataModel(that.sUrl, {
				json: true,
				loadMetadataAsync: true
			});
			if (that.byId("idoSelect1").getSelectedKey() === "") {
				if (that.byId("idoSelect1").getFirstItem() !== null) {
					that.objectId = that.byId("idoSelect1").getFirstItem().getKey();
					that.byId("idoSelect1").setSelectedKey(that.objectId);
				}
			} else {
				that.objectId = that.byId("idoSelect1").getSelectedKey();
			}
			if (event === "sub") {
				if (that.getView().getModel("Subject").getData().Value.length !== 0)
					that.objectId = that.getView().getModel("Subject").getData().Value[0].ObjectId;
					that.byId("idoSelect1").setSelectedKey(that.objectId);
			}
			var a = [],
				b = [],
				c = [];
			that.term = that.byId("idoSelect4").getSelectedKey();
			a.push(new sap.ui.model.Filter("Year", sap.ui.model.FilterOperator.EQ, that.year));
			b.push(new sap.ui.model.Filter("Term", sap.ui.model.FilterOperator.EQ, that.term));
			c.push(new sap.ui.model.Filter("SubjectID", sap.ui.model.FilterOperator.EQ, that.objectId));
			var filter1 = new sap.ui.model.Filter({
				filters: a,
				and: true
			});
			var filter2 = new sap.ui.model.Filter({
				filters: b,
				and: true
			});
			var filter3 = new sap.ui.model.Filter({
				filters: c,
				and: true
			});
			var filter = new sap.ui.model.Filter({
				filters: [filter1, filter2, filter3],
				and: true
			});
			oDataModel.read("/AppraisalTypeSet", {
				filters: [filter],
				success: function (oData, response) {

					var dataModel = new JSONModel();
					dataModel.setData({
						"Value": oData.results
					});
					that.getView().setModel(dataModel, "AppraisalType");
					if (oData.results.length === 0) {

						that.byId("idoSelect2").destroyItems();
						that.byId("idoSelect5").destroyItems();
						that.byId("idoSelect6").destroyItems();
					}
					if (oData.results.length > 0) {
						that.byId("idoSelect2").setSelectedKey(oData.results[0].ObjectId);
					}
					that.handleSelectionChange2();
					sap.ui.core.BusyIndicator.hide();
				},
				error: function (oError) {
					that.byId("idoSelect5").destroyItems();
					that.byId("idoSelect6").destroyItems();
					sap.ui.core.BusyIndicator.hide();
				}
			});

		},
		handleSelectionChange2: function (event) {
			sap.ui.core.BusyIndicator.show();
			var that = this;
			var oDataModel = new sap.ui.model.odata.v2.ODataModel(that.sUrl, {
				json: true,
				loadMetadataAsync: true
			});
			if (that.byId("idoSelect2").getSelectedItem() === null) {
				//that.AppraisalType = that.byId("idoSelect2").getFirstItem().getText();
				if (that.byId("idoSelect2").getFirstItem() !== null) {
					var temp = that.byId("idoSelect2").getFirstItem().getKey();
					that.byId("idoSelect2").setSelectedKey(temp);
					that.AppraisalType = that.byId("idoSelect2").getSelectedItem().getText();
				}
			} else {
				that.AppraisalType = that.byId("idoSelect2").getSelectedItem().getText();
			}
			var modeln = that.getView().getModel("AppraisalType").getData().Value;
			//	;
			that.byId("idTable1").setVisible(true);
			that.byId("idTable2").setVisible(false);
			for (var n = 0; n < modeln.length; n++) {
				if (that.AppraisalType === modeln[n].AppraisalTypeId) {
					if (modeln[n].comentFlag === "X") {
						that.byId("idTable1").setVisible(false);
						that.byId("idTable2").setVisible(true);
						//	that.byId("aName").setValue("Comments");&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
					}
				}
			}
			var a = [],
				b = [],
				c = [],
				d = [];
			a.push(new sap.ui.model.Filter("Year", sap.ui.model.FilterOperator.EQ, that.year));
			b.push(new sap.ui.model.Filter("Term", sap.ui.model.FilterOperator.EQ, that.term));
			c.push(new sap.ui.model.Filter("SubjectID", sap.ui.model.FilterOperator.EQ, that.objectId));
			d.push(new sap.ui.model.Filter("AppraisalTypeId", sap.ui.model.FilterOperator.EQ, that.AppraisalType));
			var filter1 = new sap.ui.model.Filter({
				filters: a,
				and: true
			});
			var filter2 = new sap.ui.model.Filter({
				filters: b,
				and: true
			});
			var filter3 = new sap.ui.model.Filter({
				filters: c,
				and: true
			});
			var filter4 = new sap.ui.model.Filter({
				filters: d,
				and: true
			});
			var filter = new sap.ui.model.Filter({
				filters: [filter1, filter2, filter3, filter4],
				and: true
			});

			oDataModel.read("/AppraisalSubTypeSet", {
				filters: [filter],
				success: function (oData, response) {
					var dataModel = new JSONModel();
					dataModel.setData({
						"Value": oData.results
					});
					that.getView().setModel(dataModel, "AppraisalSubType");
					if (oData.results.length === 0) {

						that.byId("idoSelect5").destroyItems();
						that.byId("idoSelect6").destroyItems();
					}
					that.handleSelectionChange5();
					sap.ui.core.BusyIndicator.hide();
				},
				error: function (oError) {
					that.byId("idoSelect6").destroyItems();
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},
		handleSelectionChange5: function (event) {
			sap.ui.core.BusyIndicator.show();
			var that = this;
			var oDataModel = new sap.ui.model.odata.v2.ODataModel(that.sUrl, {
				json: true,
				loadMetadataAsync: true
			});
			if (that.byId("idoSelect5").getSelectedItem() === null) {
				if (that.byId("idoSelect5").getFirstItem() !== null) {
					var temp = that.byId("idoSelect5").getFirstItem().getKey();
					that.byId("idoSelect5").setSelectedKey(temp);
					that.AppraisalSubType = that.byId("idoSelect5").getSelectedItem().getText();
					that.appCode = that.byId("idoSelect5").getSelectedItem().getKey();
				} else {
					that.AppraisalSubType = " ";
					that.appCode = "";
				}
			} else {
				that.AppraisalSubType = that.byId("idoSelect5").getSelectedItem().getText();
				that.appCode = that.byId("idoSelect5").getSelectedItem().getKey();
			}
			var a = [],
				b = [],
				c = [],
				d = [],
				e = [];
			a.push(new sap.ui.model.Filter("Year", sap.ui.model.FilterOperator.EQ, that.year));
			b.push(new sap.ui.model.Filter("Term", sap.ui.model.FilterOperator.EQ, that.term));
			c.push(new sap.ui.model.Filter("SubjectID", sap.ui.model.FilterOperator.EQ, that.objectId));
			d.push(new sap.ui.model.Filter("AppraisalType", sap.ui.model.FilterOperator.EQ, that.AppraisalType));
			e.push(new sap.ui.model.Filter("AppraisalSubType", sap.ui.model.FilterOperator.EQ, that.AppraisalSubType));
			var filter1 = new sap.ui.model.Filter({
				filters: a,
				and: true
			});
			var filter2 = new sap.ui.model.Filter({
				filters: b,
				and: true
			});
			var filter3 = new sap.ui.model.Filter({
				filters: c,
				and: true
			});
			var filter4 = new sap.ui.model.Filter({
				filters: d,
				and: true
			});
			var filter5 = new sap.ui.model.Filter({
				filters: e,
				and: true
			});
			var filter = new sap.ui.model.Filter({
				filters: [filter1, filter2, filter3, filter4, filter5],
				and: true
			});

			oDataModel.read("/AssignmentNumberSet", {
				filters: [filter],
				success: function (oData, response) {
					var dataModel = new JSONModel();
					dataModel.setData({
						"Value": oData.results
					});
					that.getView().setModel(dataModel, "AssignmentNumber");
					if (that.asskey) {
						that.byId("idoSelect6").setSelectedKey(that.asskey);
					}
					that.handleSelectionChange6();
					if (oData.results.length === 0) {
						that.byId("idoSelect6").destroyItems();
					}
					sap.ui.core.BusyIndicator.hide();
				},
				error: function (oData, response) {
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},

		handleSelectionChange6: function (oEvent) {
			sap.ui.core.BusyIndicator.show();
			var that = this;
			var oDataModel = new sap.ui.model.odata.v2.ODataModel(that.sUrl, {
				json: true,
				loadMetadataAsync: true
			});
			if (that.byId("idoSelect6").getSelectedItem() === null) {
				//that.AppraisalType = that.byId("idoSelect2").getFirstItem().getText();
				if (that.byId("idoSelect6").getFirstItem() !== null) {
					var temp = that.byId("idoSelect6").getFirstItem().getKey();
					that.byId("idoSelect6").setSelectedKey(temp);
					that.assignmentNo = that.byId("idoSelect6").getSelectedItem().getText();
				}
			} else {
				that.assignmentNo = that.byId("idoSelect6").getSelectedItem().getText();
				//that.assignmentNo = that.asskey;
			}
			var a = [],
				b = [],
				c = [],
				d = [],
				e = [],
				f = [],
				g = [],
				h = [],
				i = [];
			var grdObjId = "";
			for (var z = 0; z < that.getView().getModel("GRD").getData().Value.length; z++) {
				if (that.getView().getModel("GRD").getData().Value[z].GRADE_ID === this.byId("idoSelectGrd").getSelectedKey()) {
					grdObjId = this.getView().getModel("GRD").getData().Value[z].GRADEOBJ_ID;
				}
			}
			a.push(new sap.ui.model.Filter("Year", sap.ui.model.FilterOperator.EQ, that.year));
			b.push(new sap.ui.model.Filter("Term", sap.ui.model.FilterOperator.EQ, that.term));
			c.push(new sap.ui.model.Filter("SubjectID", sap.ui.model.FilterOperator.EQ, that.objectId));
			d.push(new sap.ui.model.Filter("APP_NO", sap.ui.model.FilterOperator.EQ, that.assignmentNo));
			e.push(new sap.ui.model.Filter("APP_CODE", sap.ui.model.FilterOperator.EQ, that.appCode));
			f.push(new sap.ui.model.Filter("GRDOBJ_ID", sap.ui.model.FilterOperator.EQ, grdObjId));
			g.push(new sap.ui.model.Filter("ASG_TYPE", sap.ui.model.FilterOperator.EQ, that.AppraisalSubType));
			h.push(new sap.ui.model.Filter("LastName", sap.ui.model.FilterOperator.EQ, that.uName));
			i.push(new sap.ui.model.Filter("DEADLINE", sap.ui.model.FilterOperator.EQ, that.uName));
			var filter1 = new sap.ui.model.Filter({
				filters: a,
				and: true
			});
			var filter2 = new sap.ui.model.Filter({
				filters: b,
				and: true
			});
			var filter3 = new sap.ui.model.Filter({
				filters: c,
				and: true
			});
			var filter4 = new sap.ui.model.Filter({
				filters: d,
				and: true
			});
			var filter5 = new sap.ui.model.Filter({
				filters: e,
				and: true
			});
			var filter6 = new sap.ui.model.Filter({
				filters: f,
				and: true
			});
			var filter7 = new sap.ui.model.Filter({
				filters: g,
				and: true
			});
			var filterName = new sap.ui.model.Filter({
				filters: h,
				and: true
			});
			var filterName1 = new sap.ui.model.Filter({
				filters: i,
				and: true
			});
			var filter = new sap.ui.model.Filter({
				filters: [filter1, filter2, filter3, filter4, filter5, filter6, filter7, filterName],
				and: true
			});
			this.gradeFilter = new sap.ui.model.Filter({
				filters: [filter1, filter2, filter3, filter4, filter5, filterName1],
				and: true
			});
			oDataModel.read("/StudentDetailsSet", {
				filters: [filter],
				success: function (oData, response) {
					var dataModel = new JSONModel();
					dataModel.setData({
						"Value": oData.results
					});
					that.getView().setModel(dataModel, "StudentDetails");
				
					//that.byId("idTable1").setVisibleRowCount(oData.results.length);
					var oDataModelGrade = new sap.ui.model.odata.v2.ODataModel(that.sUrl, {
						json: true,
						loadMetadataAsync: true
					});
					oDataModelGrade.read("/OnlineGradeSet", {
						filters: [that.gradeFilter],
						success: function (oData, response) {
							var dataModelGrade = new JSONModel();
							dataModelGrade.setData({
								"Value": oData.results
							});
							sap.ui.getCore().setModel(dataModelGrade, "Grade");
							if (!oEvent) {
								NView.byId("idoSelect6").setSelectedKey(NView.asskey);
							}
								that.updateScore();
							sap.ui.core.BusyIndicator.hide();
						}
					});
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},
		saveAllScoreValidation: function () {
			var sDta = this.getView().getModel("StudentDetails").getData().Value;
			var A_S = 0,
				A_E = 0;
			var max = 0;

			for (var i = 0; i < sDta.length; i++) {
				if (sDta[i].SCORE === "") {
					A_E = A_E + 1;
				} else {
					A_S = A_S + 1;
				}
				if (max < parseFloat(sDta[i].SCORE)) {
					max = parseFloat(sDta[i].SCORE);
				}
			}
			if (max > 0) {
				if (this.byId("maxScore").getValue() === "") {
					return 'E';
				}
			}
			if (A_S > 0) {
				if (A_E > 0) {
					return 'A';
				}
			}
			return "";
		},
		onSave: function () {
			sap.ui.core.BusyIndicator.show();
			var that = this;
			var scoreFlag = that.saveAllScoreValidation();
			if (scoreFlag === "") {
				if (this.byId("aName").getValue() !== "") {
					var check = that.comentValidation();
					if (check && parseInt(that.byId("DTI1").getValue()) !== 0 && that.byId("DTI1").getValue() !== "") {
						var dateString = sap.ui.getCore().getModel("Grade").getData().Value[0].DEADLINE;
						var year = dateString.substring(0, 4);
						var month = dateString.substring(4, 6);
						var day = dateString.substring(6, 8);
						var deadLineDate = new Date(year, month - 1, day);
						//var AsmtDate = that.byId("DTI1").getDateValue();new Date()
						var AsmtDate = new Date();
						if (AsmtDate >= deadLineDate) {
							sap.ui.core.BusyIndicator.hide();
							var dialog_Error = new sap.m.Dialog({
								title: 'Error',
								type: 'Message',
								state: 'Error',
								content: new sap.m.Text({
									text: 'The deadline for submission has passed.'
								}),
								beginButton: new sap.m.Button({
									text: 'OK',
									press: function () {
										dialog_Error.close();
									}
								}),
								afterClose: function () {
									dialog_Error.destroy();
								}
							});
							dialog_Error.open();
						} else {
							this.ModelSu = new sap.ui.model.odata.v2.ODataModel(that.sUrl, {
								json: true,
								loadMetadataAsync: true
							});
							var obj = that.getView().getModel("StudentDetails").getData().Value;
							var objS = {};
							objS.Sub_Student = [];
							for (var i = 0; i < obj.length; i++) {
								var temp = {
									APP_CODE: that.appCode,
									APP_NO: that.assignmentNo,
									ASSIGNMENT_DATE: obj[0].ASSIGNMENT_DATE,
									ASSIGNMENT_NAME: obj[0].ASSIGNMENT_NAME,
									Id: obj[i].Id,
									MAX_SCORE: obj[0].MAX_SCORE,
									SCORE: obj[i].SCORE,
									STUDENT_ID: obj[i].STUDENT_ID,
									SubjectID: obj[i].SubjectID,
									Term: obj[i].Term,
									Year: obj[i].Year,
									Coments: obj[i].Coments
								};
								objS.Sub_Student.push(temp);
							}
							objS.ObjectId = obj[0].SubjectID;
							objS.MYP = "F";
							this.ModelSu.create("/timetableSet", objS, {
								success: function (oData) {
									if (oData.responseType === "S") {
										that.asskey = that.assignmentNo;
										sap.ui.core.BusyIndicator.hide();
										that.getView().getModel("StudentDetails").refresh();
										var dialog_3 = new sap.m.Dialog({
											title: 'Success',
											type: 'Message',
											state: 'Success',
											content: new sap.m.Text({
												text: oData.responseText
											}),
											beginButton: new sap.m.Button({
												text: 'OK',
												press: function () {
													dialog_3.close();
												}
											}),
											afterClose: function () {
												dialog_3.destroy();
											}
										});
										dialog_3.open();
										that.handleSelectionChange5();
									} else {
										sap.ui.core.BusyIndicator.hide();
										var dialog_4 = new sap.m.Dialog({
											title: 'Error',
											type: 'Message',
											state: 'Error',
											content: new sap.m.Text({
												text: oData.responseText
											}),
											beginButton: new sap.m.Button({
												text: 'OK',
												press: function () {
													dialog_4.close();
												}
											}),
											afterClose: function () {
												dialog_4.destroy();
											}
										});
										dialog_4.open();
									}
									sap.ui.core.BusyIndicator.hide();
								},
								error: function (oError) {
									sap.ui.core.BusyIndicator.hide();
									var errMsg = "Please ensure all mandatory fields are entered correctly.";
									if(JSON.parse(oError.responseText))
									{
										errMsg =JSON.parse(oError.responseText).error.message.value;
									}
									var dialog_5 = new sap.m.Dialog({
										title: 'Error',
										type: 'Message',
										state: 'Error',
										content: new sap.m.Text({
											text: errMsg
										}),
										beginButton: new sap.m.Button({
											text: 'OK',
											press: function () {
												dialog_5.close();
											}
										}),
										afterClose: function () {
											dialog_5.destroy();
										}
									});
									dialog_5.open();
								}
							});
						}
					} else {
						sap.ui.core.BusyIndicator.hide();
						if (check) {
							this.byId("DTI1").focus();
							this.byId("DTI1").setValueState("Error");
							this.byId("DTI1").setValueStateText("Enter Date");
							var dialog_1 = new sap.m.Dialog({
								title: 'Error',
								type: 'Message',
								state: 'Error',
								content: new sap.m.Text({
									text: 'Please ensure all mandatory fields are entered correctly.'
								}),
								beginButton: new sap.m.Button({
									text: 'OK',
									press: function () {
										dialog_1.close();
									}
								}),
								afterClose: function () {
									dialog_1.destroy();
								}
							});
							dialog_1.open();
						}
					}
				} else {
					sap.ui.core.BusyIndicator.hide();
					var dialog_aName = new sap.m.Dialog({
						title: 'Error',
						type: 'Message',
						state: 'Error',
						content: new sap.m.Text({
							text: 'Assignment Name is mandatory.'
						}),
						beginButton: new sap.m.Button({
							text: 'OK',
							press: function () {
								dialog_aName.close();
							}
						}),
						afterClose: function () {
							dialog_aName.destroy();
						}
					});
					dialog_aName.open();
				}
			} else {
				var msg = "";
				if (scoreFlag === "A") {
					msg = "Please ensure scores are given to all students.";
				}
				if (scoreFlag === "E") {
					msg = "Please ensure Max Score is given from 0 - 100.";
				}
				sap.ui.core.BusyIndicator.hide();
				var dialog_sc = new sap.m.Dialog({
					title: 'Error',
					type: 'Message',
					state: 'Error',
					content: new sap.m.Text({
						text: msg
					}),
					beginButton: new sap.m.Button({
						text: 'OK',
						press: function () {
							dialog_sc.close();
						}
					}),
					afterClose: function () {
						dialog_sc.destroy();
					}
				});
				dialog_sc.open();
			}
		},
		comentValidation: function (oEvent) {
			if (oEvent) {
				if (oEvent.getSource().getValue().indexOf("{") !== -1 || oEvent.getSource().getValue().indexOf("{") !== -1) {
					oEvent.getSource().setValue("");
					var dialogerror = new sap.m.Dialog({
						title: 'Error',
						type: 'Message',
						state: 'Error',
						content: new sap.m.Text({
							text: 'Comment Cannot Contain Currly braces'
						}),
						beginButton: new sap.m.Button({
							text: 'OK',
							press: function () {
								dialogerror.close();
							}
						}),
						afterClose: function () {
							dialogerror.destroy();
						}
					});
					dialogerror.open();
				}
			}
			var that = this;
			var obj = that.getView().getModel("StudentDetails").getData().Value;
			var flag2 = 0;
			if (oEvent) {
				var comentLength = oEvent.getParameters().newValue.length;
			} else {
				comentLength = 0;
			}
			for (var i = 0; i < obj.length; i++) {
				if (obj[i].Coments.length > obj[i].length) {
					if (comentLength) {
						var messageText = "Maximum comment length is " + obj[i].length + " characters, please reduce for student:" + obj[i].FirstName;
					} else {
						messageText = "Maximum comment length is " + obj[i].length + " characters, please reduce for student:" + obj[i].FirstName;
					}
					if (!flag2) {
						sap.ui.core.BusyIndicator.hide();
						var dialog2 = new sap.m.Dialog({
							title: 'Error',
							type: 'Message',
							state: 'Error',
							content: new sap.m.Text({
								text: messageText
							}),
							beginButton: new sap.m.Button({
								text: 'OK',
								press: function () {
									dialog2.close();
								}
							}),
							afterClose: function () {
								dialog2.destroy();
							}
						});
						dialog2.open();
						flag2++;
					}
					return 0;
				}
			}
			return 1;

		},
		maxValidation: function (oEvent) {
			NView = this;
			var stdData = this.getView().getModel("StudentDetails").getData().Value;
			var max = 0;
			for (var i = 0; i < stdData.length; i++) {
				if (max < parseFloat(stdData[i].SCORE)) {
					max = parseFloat(stdData[i].SCORE);
				}
			}
			if (!isNaN(oEvent.getSource().getValue())) {
				if (oEvent.getSource().getValue() < max) {
					var dialogMax = new sap.m.Dialog({
						title: 'Error',
						type: 'Message',
						state: 'Error',
						content: new sap.m.Text({
							text: 'Please enter a Max Score greater than ' + max + "."
						}),
						beginButton: new sap.m.Button({
							text: 'OK',
							press: function () {
								NView.byId("maxScore").setValue("");
								dialogMax.close();
							}
						}),
						afterClose: function () {
							dialogMax.destroy();
						}
					});
					dialogMax.open();
				} else {
					this.updateScore(oEvent);
				}
			} else {
				var dialogMax = new sap.m.Dialog({
					title: 'Error',
					type: 'Message',
					state: 'Error',
					content: new sap.m.Text({
						text: 'Please ensure Max Score is given from 0 - 100.'
					}),
					beginButton: new sap.m.Button({
						text: 'OK',
						press: function () {
							NView.byId("maxScore").setValue("");
							dialogMax.close();
						}
					}),
					afterClose: function () {
						dialogMax.destroy();
					}
				});
				dialogMax.open();
			}

		},
		updateScore: function (oEvent) {
			//sap.ui.core.BusyIndicator.show();
			NView = this;
			NView.Max = 0;
			if (oEvent) {
				if (/^[a-zA-Z0-9.]*$/.test(oEvent.getSource().getValue()) === false) {
					sap.ui.core.BusyIndicator.hide();
					oEvent.getSource().setValue("");
					var dialogComma = new sap.m.Dialog({
						title: 'Error',
						type: 'Message',
						state: 'Error',
						content: new sap.m.Text({
							text: 'Special characters are not allowed'
						}),
						beginButton: new sap.m.Button({
							text: 'OK',
							press: function () {
								dialogComma.close();
							}
						}),
						afterClose: function () {
							dialogComma.destroy();
						}
					});
					dialogComma.open();
				} else if (parseInt(oEvent.getSource().getValue()) < 0) {
					sap.ui.core.BusyIndicator.hide();
					oEvent.getSource().setValue("");
					var dialogNeg = new sap.m.Dialog({
						title: 'Error',
						type: 'Message',
						state: 'Error',
						content: new sap.m.Text({
							text: 'Negative marking is not allowed.'
						}),
						beginButton: new sap.m.Button({
							text: 'OK',
							press: function () {
								dialogNeg.close();
							}
						}),
						afterClose: function () {
							dialogNeg.destroy();
						}
					});
					dialogNeg.open();
				}
			}
			if (this.byId("maxScore").getValue() !== "") {
				if (this.byId("maxScore").getValue() > 100) {
					sap.ui.core.BusyIndicator.hide();
					var dialog2_max = new sap.m.Dialog({
						title: 'Error',
						type: 'Message',
						state: 'Error',
						content: new sap.m.Text({
							text: 'The Max Score cannot be more than 100.'
						}),
						beginButton: new sap.m.Button({
							text: 'OK',
							press: function () {
								dialog2_max.close();
							}
						}),
						afterClose: function () {
							dialog2_max.destroy();
						}
					});
					dialog2_max.open();
					this.byId("maxScore").setValue("");
					this.byId("maxScore").focus();
					return;
				}
			}
			var that = this;
			var grdFlag = true;
			var obj = that.getView().getModel("StudentDetails").getData().Value;
			if (sap.ui.getCore().getModel("Grade"))
				var grd = sap.ui.getCore().getModel("Grade").getData().Value;
			var validation = that.byId("maxScore").getValue();
			if (!parseFloat(validation)) {
				that.byId("maxScore").setValue("");
			}
			that.byId("app").setEnabled(true);
			that.byId("maxScore").setValueState("None");
			var objS = {};
			objS.Sub_Student = [];
			var temp1 = null,
				temp2 = null,
				temp3 = null,
				Xavg = 0,
				percent = null;
			var count = 0,
				flag = 0,
				flag2 = 0;
			for (var i = 0; i < obj.length; i++) {
				if (!parseFloat(obj[i].SCORE) && parseFloat(obj[i].SCORE) !== 0) {
					if (grd) {
						for (var j = 0; j < grd.length; j++) {

							if (obj[i].SCORE === grd[j].AllwoedGrade) {
								grdFlag = true;
								this.getView().byId("idTable1").getRows()[i].getCells()[3].setText("");
								break;
							} else
								grdFlag = false;
						}
					}
					if (obj[i].SCORE === "" || obj[i].SCORE === " ") {
						this.getView().byId("idTable1").getRows()[i].getCells()[3].setText("");
						count++;
					} else if (grdFlag) {
						Xavg++;
						continue;
					} else {
						this.getView().byId("idTable1").getRows()[i].getCells()[2].setValue("");
						this.getView().byId("idTable1").getRows()[i].getCells()[2].focus();
						if (!flag2) {
							var grades = "";
							if (grd) {
								for (var j1 = 0; j1 < grd.length; j1++) {
									grades = grades + grd[j1].AllwoedGrade + " ";
								}
							} else {
								grades = "Please Enter The Valid Grade";
							}
							var dialog2_1 = new sap.m.Dialog({
								title: 'Error',
								type: 'Message',
								state: 'Error',
								content: new sap.m.Text({
									text: 'Please only enter the allowed grades:' + grades
								}),
								beginButton: new sap.m.Button({
									text: 'OK',
									press: function () {
										dialog2_1.close();
									}
								}),
								afterClose: function () {
									dialog2_1.destroy();
								}
							});
							dialog2_1.open();
							flag2++;
						}
						that.byId("app").setEnabled(false);
					}
					continue;
				}
				if (!temp1) {
					temp1 = parseFloat(obj[i].SCORE);
				} else {
					if (temp1 < parseFloat(obj[i].SCORE)) {
						temp1 = parseFloat(obj[i].SCORE);
					}
				}
				if (!temp2) {
					temp2 = parseFloat(obj[i].SCORE);
				} else if (temp2 > parseFloat(obj[i].SCORE)) {
					temp2 = parseFloat(obj[i].SCORE);
				} else if (parseFloat(obj[i].SCORE === 0)) {
					temp2 = 0;
				}
				if (!temp3) {
					temp3 = parseFloat(obj[i].SCORE);
				} else {
					temp3 = temp3 + parseFloat(obj[i].SCORE);
				}
				if (parseFloat(validation) < parseFloat(obj[i].SCORE)) {

					that.byId("app").setEnabled(false);
					that.byId("maxScore").setValueState("Error");
					if (!flag) {
						if (oEvent) {
							oEvent.getSource().setValue("");
							obj[i].Percent = "";
							that.getView().getModel("StudentDetails").refresh();
						}
						sap.ui.core.BusyIndicator.hide();
						var dialog = new sap.m.Dialog({
							title: 'Error',
							type: 'Message',
							state: 'Error',
							content: new sap.m.Text({
								text: 'Grade entered should not be greater than Max Score.'
							}),
							beginButton: new sap.m.Button({
								text: 'OK',
								press: function () {
									dialog.close();
								}
							}),
							afterClose: function () {
								dialog.destroy();
							}
						});
						dialog.open();
						flag++;
					}
				}
				if (this.byId("maxScore").getValue() === "") {
					/*if (sap.ui.getCore().getModel("Grade"))
						var grdFlag = sap.ui.getCore().getModel("Grade").getData().Value;
					if (grdFlag[0].ATL_FLAG !== "X") {*/
					sap.ui.core.BusyIndicator.hide();
					var obj1 = this.getView().getModel("StudentDetails").getData().Value;
					if (oEvent) {
						oEvent.getSource().setValue("");
						if (NView.Max === 0) {
							var dialogMax = new sap.m.Dialog({
								title: 'Error',
								type: 'Message',
								state: 'Error',
								content: new sap.m.Text({
									text: 'Please enter the Max Score.'
								}),
								beginButton: new sap.m.Button({
									text: 'OK',
									press: function () {
										dialogMax.close();
									}
								}),
								afterClose: function () {
									dialogMax.destroy();
								}
							});
							oEvent.getSource().setValue("");
							this.byId("maxScore").focus();
							NView.Max = 1;
							dialogMax.open();
						}
					}
					//}
				} else {
					percent = parseFloat(obj[i].SCORE) * 100 / parseFloat(this.byId("maxScore").getValue());
					obj[i].Percent = percent.toFixed(2);
				}
			}
			temp3 = temp3 / (obj.length - Xavg);
			if (!temp1) {
				temp1 = "";
			}
			if (!temp2) {
				if (temp2 !== 0)
					temp2 = "";
			}
			if (!temp3 || temp1 === "") {
				temp3 = "";
				this.byId("min").setValue(temp3);
			} else {
				var per = (parseFloat(temp3) * 100 / parseFloat(this.byId("maxScore").getValue())).toFixed(2);
				this.byId("min").setValue(temp3.toFixed(2) + "/" + per + "%");
			}
			this.byId("max").setValue(temp1 + " / " + temp2);
			this.byId("avg").setValue(count);
			this.byId("no_students").setValue(obj.length);
			this.getView().getModel("StudentDetails").refresh();
			sap.ui.core.BusyIndicator.hide();
		},
		dateValidation: function (oEvent) {
			var date = oEvent.getSource().getDateValue();
			var today = new Date();
			if (date > today) {
				oEvent.getSource().setValueState("Error");
				oEvent.getSource().setValueStateText("Assignment date cannot be in the future");
				oEvent.getSource().setValue("00000000");
			} else {
				oEvent.getSource().setValueState("None");
			}
		},
		handleLiveChange: function (oEvent) {
			var oTextArea = oEvent.getSource(),
				iValueLength = oTextArea.getValue().length,
				iMaxLength = oTextArea.getMaxLength(),
				sState = iValueLength > iMaxLength ? "Warning" : "None";
			oTextArea.setValueState(sState);
		},
		onPress: function (oEvent) {
			//	sap.ui.core.BusyIndicator.show();
			var that = this;
			NView = this;
			var index = oEvent.getSource()._getPropertiesToPropagate().oBindingContexts.StudentDetails.sPath.split("/")[2];
			var dialog_2 = new sap.m.Dialog({
				title: 'Notes',
				type: 'Message',
				state: 'None',
				content: new sap.m.TextArea({
					value: that.getView().getModel("StudentDetails").getData().Value[index].Coments,
					showExceededText: true,
					maxLength: parseInt(that.getView().getModel("StudentDetails").getData().Value[index].length),
					growing: true,
					rows: 10,
					width: "100%",
					liveChange: that.handleLiveChange,
					valueLiveUpdate: true
				}),
				beginButton: new sap.m.Button({
					text: 'OK',
					press: function (oEvent) {
						dialog_2.close();
						NView.getView().getModel("StudentDetails").getData().Value[index].Coments = oEvent.getSource().getParent().getContent()[0]
							.getValue();
						NView.getView().getModel("StudentDetails").refresh();
					}
				}),
				afterClose: function () {
					dialog_2.destroy();
				}
			});
			dialog_2.open();
		}
	});
});