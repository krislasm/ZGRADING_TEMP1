var NHView = null;
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/m/MessageBox',
	'sap/ui/model/json/JSONModel',
	'sap/ui/core/util/Export',
	'sap/ui/core/util/ExportTypeCSV'
], function(Controller, MessageBox, JSONModel, Export, ExportTypeCSV) {
	"use strict";

	return Controller.extend("com.sap.swazgrading.controller.historical", {
		onInit: function() {
			// Router initialization and Match event handeler 
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("historical").attachMatched(this._initialize, this);
		},
		_initialize: function(oEvent) {
			NHView = this;
			NHView.oArgs = oEvent.getParameter("arguments");
			NHView.sUrl = "/sap/opu/odata/sap/ZGW_SWA_GRADE_SRV/";
			sap.ui.core.BusyIndicator.show();
			//Setting Page Title 
			NHView.byId("headerLabel").setTitle("Historical Data for " + NHView.oArgs.year + ", " + NHView.oArgs.tname + ", " + NHView.oArgs.name +
				", " + NHView.oArgs.grd +
				".");
			//oData Model Defination
			NHView.oDataModel = new sap.ui.model.odata.v2.ODataModel(NHView.sUrl, {
				json: true,
				loadMetadataAsync: true
			});
			//Filter for oData call to get Table Header
			var a = [],
				b = [],
				c = [],
				g = [],
				h = [];
			a.push(new sap.ui.model.Filter("Year", sap.ui.model.FilterOperator.EQ, NHView.oArgs.year));
			b.push(new sap.ui.model.Filter("Term", sap.ui.model.FilterOperator.EQ, NHView.oArgs.term));
			c.push(new sap.ui.model.Filter("SubjectID", sap.ui.model.FilterOperator.EQ, NHView.oArgs.subject));
			g.push(new sap.ui.model.Filter("FieldName", sap.ui.model.FilterOperator.EQ, NHView.oArgs.uname));
			h.push(new sap.ui.model.Filter("COLUMN1", sap.ui.model.FilterOperator.EQ, NHView.oArgs.uname));
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
				filters: g,
				and: true
			});
			var filterName1 = new sap.ui.model.Filter({
				filters: h,
				and: true
			});
			NHView.filter = new sap.ui.model.Filter({
				filters: [filter1, filter2, filter3, filterName],
				and: true
			});
			NHView.filter1 = new sap.ui.model.Filter({
				filters: [filter1, filter2, filter3, filterName1],
				and: true
			});
			NHView.oDataModel.read("/TableMetadataSet", {
				filters: [NHView.filter],
				success: function(oData, response) {
					var oTableHis = NHView.byId("historicalTable");
					NHView.dataModel = new JSONModel();
					for (var i = 0; i < oData.results.length; i++) {
						if (oData.results[i].VisibilityFlag === 'X') {
							oData.results[i].VisibilityFlag = true;
						} else {
							oData.results[i].VisibilityFlag = false;
						}

						if (oData.results[i].EditableFlag === 'X') {
							oData.results[i].EditableFlag = true;
						} else {
							oData.results[i].EditableFlag = false;
						}
					}
					NHView.dataModel.setSizeLimit(oData.results.length);
					NHView.dataModel.setData({
						"Value": oData.results
					});
					oTableHis.setModel(NHView.dataModel);
					NHView.flag = 0;
					oTableHis.bindColumns("/Value", function(index, context) {
						var template = "";

						if (context.getProperty().EditableFlag) {

							template = new sap.m.Input({
								value: "{Item>" + context.getProperty().Binding + "}",
								tooltip: "{Item>" + context.getProperty().Binding + "}",
								enabled: context.getProperty().EditableFlag,
								textAlign: "Right",
								width: "100%",
								change: NHView.ValidateScore
							});

						} else {

							template = new sap.m.Text({
								text: "{Item>" + context.getProperty().Binding + "}",
								tooltip: "{Item>" + context.getProperty().Binding + "}",
								width: "100%",
								textAlign: "Right"
							});

						}
						if (NHView.flag !== 0) {
							NHView.flag++;
							return new sap.ui.table.Column({
								id: context.getProperty().FieldId,
								label: context.getProperty().FieldName,
								tooltip: context.getProperty().FieldName,
								visible: context.getProperty().VisibilityFlag,
								sortProperty: context.getProperty().Binding,
								width: "100px",
								template: template
							});
						} else {
							NHView.flag++;
							template = new sap.m.Text({
								text: "{Item>" + context.getProperty().Binding + "}",
								tooltip: "{Item>" + context.getProperty().Binding + "}",
								width: "100%",
								textAlign: "Left"
							});
							return new sap.ui.table.Column({
								id: context.getProperty().FieldId,
								label: context.getProperty().FieldName,
								tooltip: context.getProperty().FieldName,
								visible: context.getProperty().VisibilityFlag,
								textAlign: "Left",
								sortProperty: context.getProperty().Binding,
								width: "200px",
								template: template
							});
						}

					});
					// oData Call to get Table Items
					var oDataItemModel = new sap.ui.model.odata.v2.ODataModel(NHView.sUrl, {
						json: true,
						loadMetadataAsync: true
					});
					oDataItemModel.read("/HistoricalDataSet", {
						filters: [NHView.filter1],
						success: function(oData, response) {
							NHView.dataItemModel = new JSONModel();
							NHView.dataItemModel.setData({
								"Value": oData.results
							});
							NHView.getView().setModel(NHView.dataItemModel, "Item");
							oTableHis.bindRows("Item>/Value");
							if (oData.results.length > 10) {
								oTableHis.setVisibleRowCount(oData.results.length);
							}
							sap.ui.core.BusyIndicator.hide();
						},
						error: function(oError) {
							sap.ui.core.BusyIndicator.hide();
							var dialog_Msg = new sap.m.Dialog({
								title: 'Error',
								type: 'Message',
								state: 'Error',
								content: new sap.m.Text({
									text: 'Something Went Wrong! Please Reload the Page'
								}),
								beginButton: new sap.m.Button({
									text: 'OK',
									press: function() {
										dialog_Msg.close();
									}
								}),
								afterClose: function() {
									dialog_Msg.destroy();
								}
							});
							dialog_Msg.open();
						}
					});
				},
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					var dialog_Msg = new sap.m.Dialog({
						title: 'Error',
						type: 'Message',
						state: 'Error',
						content: new sap.m.Text({
							text: 'Something Went Wrong! Please Reload the Page'
						}),
						beginButton: new sap.m.Button({
							text: 'OK',
							press: function() {
								dialog_Msg.close();
							}
						}),
						afterClose: function() {
							dialog_Msg.destroy();
						}
					});
					dialog_Msg.open();
				}
			});

		},
		ValidateScore: function(oEvent) {
			var grdFlag = true;
			if (oEvent) {
				if (/^[a-zA-Z0-9]*$/.test(oEvent.getSource().getValue()) === false) {
					/*if (oEvent.getSource().getValue().indexOf(',') != -1) {*/
					oEvent.getSource().setValue("");
					var dialogComma = new sap.m.Dialog({
						title: 'Error',
						type: 'Message',
						state: 'Error',
						content: new sap.m.Text({
							text: 'Special Charaters are not allowed'
						}),
						beginButton: new sap.m.Button({
							text: 'OK',
							press: function() {
								dialogComma.close();
							}
						}),
						afterClose: function() {
							dialogComma.destroy();
						}
					});
					dialogComma.open();
				} else if (parseInt(oEvent.getSource().getValue()) < 0) {
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
							press: function() {
								dialogNeg.close();
							}
						}),
						afterClose: function() {
							dialogNeg.destroy();
						}
					});
					dialogNeg.open();

				} else {

					if (!Number.isInteger(Number(oEvent.getSource().getValue()))) {
						var grd = sap.ui.getCore().getModel("Grade").getData().Value;
						var grades = "";
						if (grd) {
							for (var j = 0; j < grd.length; j++) {
								grades = grades + grd[j].AllwoedGrade + " ";
								if (oEvent.getSource().getValue() === grd[j].AllwoedGrade) {
									grdFlag = true;
									break;
								} else {
									grdFlag = false;
								}

							}
							if (!grdFlag) {
								oEvent.getSource().setValue("");
								var dialogGrd = new sap.m.Dialog({
									title: 'Error',
									type: 'Message',
									state: 'Error',
									content: new sap.m.Text({
										text: 'Please Enter The Allowed Grades:' + grades
									}),
									beginButton: new sap.m.Button({
										text: 'OK',
										press: function() {
											dialogGrd.close();
										}
									}),
									afterClose: function() {
										dialogGrd.destroy();
									}
								});
								dialogGrd.open();
							}
						}
					}
				}

			}
		},

		// Download Table Data
		onDataExport: sap.m.Table.prototype.exportData || function(oEvent) {

			var columns = [];
			var column = [];
			var colHeaders = NHView.dataModel.getData().Value;
			for (var i = 0; i < colHeaders.length; i++) {
				column = [{
					name: colHeaders[i].FieldName,
					template: {
						content: {
							parts: [colHeaders[i].Binding]
						}
					}
				}];
				columns.push(column);
			}

			var oExport = new Export({
				exportType: new ExportTypeCSV({
					fileExtension: "xls",
					separatorChar: "\t",
					charset: "utf-8",
					mimeType: "application/vnd.ms-excel"
				}),
				models: NHView.dataItemModel,
				rows: {
					path: "/Value"
				},
				columns: columns
			});
			// download exported file
			oExport.saveFile().catch(function(oError) {
				MessageBox.error("Error when downloading data. Browser might not be supported!\n\n" + oError);
			}).then(function() {
				oExport.destroy();
			});
		},
		onSubmit: function() {

			if (NHView.oArgs.subject !== null && NHView.oArgs.year !== null && NHView.oArgs.term !== null) {
				NHView.SubData = {
					"SubjectID": NHView.oArgs.subject,
					"Year": NHView.oArgs.year,
					"GradeFlag": "",
					"Term": NHView.oArgs.term
				};
				var dialog_submit = new sap.m.Dialog({
					title: 'Warning',
					type: 'Message',
					state: 'Warning',
					content: new sap.m.Text({
						text: "Once Grades are submited cannot be reverted back, Are you sure you want to submit?"
					}),
					beginButton: new sap.m.Button({
						text: 'Submit',
						press: function() {
							var oDataModel = new sap.ui.model.odata.v2.ODataModel(NHView.sUrl, {
								json: true,
								loadMetadataAsync: true
							});
							oDataModel.create("/SubmitDataSet", NHView.SubData, {
								success: function(oData, response) {
									var dialog_success = new sap.m.Dialog({
										title: 'Success',
										type: 'Message',
										state: 'Success',
										content: new sap.m.Text({
											text: "Submitted Successfully"
										}),
										beginButton: new sap.m.Button({
											text: 'OK',
											press: function() {
												dialog_success.close();
											}
										}),
										afterClose: function() {
											dialog_success.destroy();
										}
									});
									dialog_success.open();
								},
								error: function(oError) {
									var dialog_err = new sap.m.Dialog({
										title: 'Error',
										type: 'Message',
										state: 'Error',
										content: new sap.m.Text({
											text: JSON.parse(oError.responseText).error.message.value
										}),
										beginButton: new sap.m.Button({
											text: 'OK',
											press: function() {
												dialog_err.close();
											}
										}),
										afterClose: function() {
											dialog_err.destroy();
										}
									});
									dialog_err.open();
								}
							});
							dialog_submit.close();
						}
					}),
					endButton: new sap.m.Button({
						text: 'Cancel',
						press: function() {
							dialog_submit.close();
						}
					}),
					afterClose: function() {
						dialog_submit.destroy();
					}
				});
				dialog_submit.open();
			} else {
				var dialog_err = new sap.m.Dialog({
					title: 'Error',
					type: 'Message',
					state: 'Error',
					content: new sap.m.Text({
						text: "Please make sure Year, Term and Subject is selected to Submit"
					}),
					beginButton: new sap.m.Button({
						text: 'OK',
						press: function() {
							dialog_err.close();
						}
					}),
					afterClose: function() {
						dialog_err.destroy();

					}
				});
				dialog_err.open();
			}

		},
		onBack: function() {
			NHView.byId("historicalTable").unbindRows();
			window.history.go(-1);
		}
	});

});