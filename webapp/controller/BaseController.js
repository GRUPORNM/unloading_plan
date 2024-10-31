sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, UIComponent, MessageBox, MessageToast) {
    "use strict";

    var TQAModel;

    return Controller.extend("unloadingplan.controller.BaseController", {
        // LIFECYCLE METHODS ----------------------------------------------------------------------------------------------------------------
        getModelTQA: function () {
            return TQAModel;
        },

        setModelTQA: function (token) {
            var userLanguage = sessionStorage.getItem("oLangu");
            if (!userLanguage) {
                userLanguage = "EN";
            }
            var serviceUrlWithLanguage = this.getModel().sServiceUrl + (this.getModel().sServiceUrl.includes("?") ? "&" : "?") + "sap-language=" + userLanguage;

            TQAModel = new sap.ui.model.odata.v2.ODataModel({
                serviceUrl: serviceUrlWithLanguage,
                annotationURI: "/zsrv_iwfnd/Annotations(TechnicalName='%2FTQA%2FOD_UNLOADING_PLANS_ANNO_MDL',Version='0001')/$value/",
                headers: {
                    "authorization": token,
                    "applicationName": "UNLD_PLANS"
                }
            });
            //Variants
            var vModel = new sap.ui.model.odata.v2.ODataModel({
                serviceUrl: "/sap/opu/odata/TQA/OD_VARIANTS_MANAGEMENT_SRV",
                headers: {
                    "authorization": token,
                    "applicationName": "UNLD_PLANS"
                }
            });
            this.setModel(vModel, "vModel");
            this.setModel(TQAModel);
        },

        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        onObjectMatched: function (oEvent) {
            this._bindView("/" + oEvent.getParameter("config").pattern.replace("/{objectId}", "") + oEvent.getParameter("arguments").objectId);
        },

        _bindView: function (sObjectPath) {
            try {
                this.getView().bindElement({
                    path: sObjectPath,
                    change: this._onBindingChange.bind(this),
                    events: {
                        dataRequested: function () {
                            this.getModel("appView").setProperty("/busy", true);
                        }.bind(this),
                        dataReceived: function () {
                            this.getModel("appView").setProperty("/busy", false);
                        }.bind(this)
                    }
                });

                var oView = this.getView();

                if (oView) {
                    if (oView.getViewName().includes("Main")) {
                        this._clearData();
                        this.getModel().refresh(true);
                    }
                    else if (oView.getViewName().includes("Detail")) {
                        this._fetchData(this._extractKeyFromString(sObjectPath));
                    }
                }
            } catch (error) {
                this.showErrorMessage({ oTitle: this.getResourceBundle().getText("error"), oText: error.message });
            }
        },

        _onBindingChange: function () {
            var oView = this.getView(),
                oElementBinding = oView.getElementBinding();

            if (!oElementBinding.getBoundContext()) {
                this.onNavigation("", "main", "");

                return;
            }
        },

        onNavigation: function (sPath, oRoute, oEntityName) {
            if (sPath) {
                this.getRouter().navTo(oRoute, {
                    objectId: sPath.replace(oEntityName, "")
                }, false, true);
            } else {
                this.getRouter().navTo(oRoute, {}, false, true);
            }
        },

        _clearData: function () {
            var oModel = this.getModel("createModel"),
                allCleared = true;

            if (this.getView().getViewName().includes("Create")) {
                if (!this.aFields) {
                    this.onGetFields(["GeneralDataContainer", "ContactsDataContainer"]);
                }

                this.aFields.forEach(function (oField) {
                    var oControl = this.byId(oField.id);

                    if (oControl) {
                        if (oControl instanceof sap.m.Input || oControl instanceof sap.m.MaskInput) {
                            oControl.setValue("");
                        } else if (oControl instanceof sap.m.Select) {
                            oControl.setSelectedKey("");
                        } else if (oControl instanceof sap.m.DatePicker) {
                            oControl.setDateValue(null);
                        }

                        oControl.setEnabled(true);

                        if (oControl.setValueState) {
                            oControl.setValueState(sap.ui.core.ValueState.None);
                        }
                    } else {
                        allCleared = false;
                    }
                }.bind(this));
            }

            oModel.setProperty("/ArrivalProducts", []);
            oModel.setProperty("/v1", true);
            oModel.setProperty("/v2", false);

            return allCleared;
        },
        // LIFECYCLE METHODS ----------------------------------------------------------------------------------------------------------------

        // ERROR HANDLERS 
        showErrorMessage: function (oMessage) {
            new sap.m.MessageBox.error(oMessage.oText, {
                title: oMessage.oTitle,
                actions: [sap.m.MessageBox.Action.OK],
                emphasizedAction: sap.m.MessageBox.Action.OK
            });
        },
        // ERROR HANDLERS 

        // DATA MANAGEMENT
        onCheckEmptyFields: function (aContainers) {
            try {
                this.onGetFields(aContainers);
                this.checked = true;

                if (this.aFields.length > 0) {

                    this.aFields.forEach(oField => {
                        var oControl = this.byId(oField.id);

                        if (oField.value) {
                            oControl.setValueState("None");
                        } else {
                            oControl.setValueState("Error");
                            this.checked = false;
                        }
                    });

                    if (this.checked) {
                        return true;
                    } else {
                        return false;
                    }
                }
            } catch (error) {
                this.showErrorMessage({ oTitle: this.getResourceBundle().getText("error"), oText: error.message });
            }
        },

        onGetFields: function (aContainers) {
            try {
                this.aFields = [];

                aContainers.forEach(oContainer => {
                    var oForm = this.byId(oContainer),
                        aElements = [];

                    if (oForm instanceof sap.ui.layout.form.SimpleForm) {
                        aElements = oForm.getContent();

                        if (aElements.length > 0) {
                            aElements.forEach(oElement => {
                                var oField = {
                                    id: "",
                                    value: ""
                                };

                                if (oElement instanceof sap.m.Input || oElement instanceof sap.m.MaskInput) {
                                    oField.value = oElement.getValue();
                                    oField.id = oElement.getName();
                                } else if (oElement instanceof sap.m.Select) {
                                    oField.value = oElement.getSelectedKey();
                                    oField.id = oElement.getName();
                                } else if (oElement instanceof sap.m.DatePicker) {
                                    oField.value = oElement.getDateValue();
                                    oField.id = oElement.getName();
                                }

                                if (oField.id) {
                                    this.aFields.push(oField);
                                }
                            });
                        }
                    }
                    else if (oForm instanceof sap.ui.comp.smartform.SmartForm) {
                        var oFormContent = oForm.getAggregation("content");

                        if (oFormContent) {
                            var oFormContainer = oFormContent.getAggregation("formContainers")[0]
                        }

                        var aFormElements = oFormContainer.getAggregation("formElements");

                        if (aFormElements.length > 0) {
                            var that = this;

                            aFormElements.forEach(function (oFormElement) {
                                var oField = oFormElement.getFields()[0];

                                if (oField) {
                                    if (oField instanceof sap.ui.comp.smartfield.SmartField) {
                                        var oInnerControl = oField.getInnerControls()[0],
                                            sValue;

                                        if (oInnerControl) {
                                            if (oInnerControl instanceof sap.m.Input) {
                                                sValue = oInnerControl.getValue();
                                            } else if (oInnerControl instanceof sap.m.DatePicker) {
                                                sValue = that._formatDateToLocalYMD(oInnerControl.getDateValue())
                                            } else if (oInnerControl instanceof sap.m.ComboBox) {
                                                sValue = oInnerControl.getSelectedKey();
                                            } else if (oInnerControl instanceof sap.m.Text) {
                                                sValue = oInnerControl.getText();
                                            }

                                            that.aFields.push({ id: oField.getName(), value: sValue })
                                        }
                                    }
                                }
                            });
                        }
                    }
                });

                return this.aFields;
            } catch (error) {
                this.showErrorMessage({ oTitle: this.getResourceBundle().getText("error"), oText: error.message });
            }
        },

        // FORMAT DATE'S
        _formatDateToLocalYMD: function (date) {
            var utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            return utcDate;
        },

        onManageFieldsState: function (oState) {
            try {
                if (this.aFields) {
                    this.aFields.forEach(oField => {
                        var oField = this.byId(oField.id);

                        if (oField) {
                            oField.setValueState("None");
                            oField.setEnabled(oState);
                        }
                    });
                }
            } catch (error) {
                this.showErrorMessage({ oTitle: this.getResourceBundle().getText("error"), oText: error.message });
            }
        },

        _manageButtonsState: function () {
            var oModel = this.getModel("createModel");

            if (oModel) {
                if (oModel.getProperty("/v1")) {
                    oModel.setProperty("/v1", false);
                    oModel.setProperty("/v2", true);
                } else {
                    oModel.setProperty("/v1", true);
                    oModel.setProperty("/v2", false);
                }
            }
        },

        _extractKeyFromString: function (inputString) {
            const regex = /\('(.+?)'\)/,
                match = inputString.match(regex);

            return match ? match[1] : null;
        },

        _mappingFields: function () {
            // SET JSON STRUCTURE 
            var oGeneralData = {},
                oContactsData = {},
                aItemsData = [];

            if (this.aFields.length > 0) {
                this.aFields.forEach(oField => {
                    // MAPPING FIELDS TO THEIR STRUCTURES
                    if (oField.id.startsWith("C_")) {
                        oContactsData[oField.id.replace("C_", "")] = oField.value;
                    } else {
                        oGeneralData[oField.id] = oField.value
                    }
                });
            } else {
                return "";
            }

            var oModel = this.getModel("createModel");

            if (oModel) {
                var aData = oModel.getProperty("/ArrivalProducts");

                if (aData) {
                    var checked = this._checkQuantities(aData);

                    if (checked) {
                        aItemsData = aData;

                        var oEntry = {
                            Ebeln: oGeneralData.EBELN,
                            Json: JSON.stringify({
                                general: oGeneralData,
                                contacts: oContactsData,
                                items: aItemsData
                            })
                        };

                        return oEntry;
                    }
                }
            }
        },

        _checkQuantities: function (aData) {
            var oProductsMap = {},
                aErrorMessages = [],
                tolerance = 0.05;

            aData.forEach(function (item) {
                var sProduct = item.PRODUCT;

                if (!oProductsMap[sProduct]) {
                    oProductsMap[sProduct] = {
                        totalVirtualQuantity: 0,
                        originalQuantity: parseFloat(item.QUANTITY),
                        materialName: item.DESC_PRODUCT || item.PRODUCT,
                        unit: item.UNIT
                    };
                }

                oProductsMap[sProduct].totalVirtualQuantity += parseFloat(item.VIRTUAL_QUANTITY);
            });

            for (var product in oProductsMap) {
                var oProductData = oProductsMap[product];
                var difference = oProductData.totalVirtualQuantity - oProductData.originalQuantity;

                if (difference > tolerance) {
                    var exceededAmount = difference.toFixed(2);

                    aErrorMessages.push(
                        this.getResourceBundle().getText("quantityExceededDetailed", [
                            oProductData.materialName,
                            exceededAmount,
                            oProductData.unit
                        ])
                    );
                }
            }

            if (aErrorMessages.length > 0) {
                MessageBox.error(aErrorMessages.join('\n'));
                return false;
            }

            return true;
        },


        _fetchData: function (pEbeln) {
            try {
                var oModel = this.getModel(),
                    sPath = "/BookingItems",
                    that = this;

                if (pEbeln) {
                    oModel.read(sPath, {
                        filters: [new sap.ui.model.Filter("EBELN", sap.ui.model.FilterOperator.EQ, pEbeln)],
                        success: function (oData) {
                            oData.results.forEach(function (item) {
                                if (item.EXPECTED_DURATION && item.EXPECTED_DURATION.ms) {
                                    var ms = item.EXPECTED_DURATION.ms;
                                    var hours = Math.floor(ms / 3600000);
                                    var minutes = Math.floor((ms % 3600000) / 60000);
                                    var seconds = Math.floor((ms % 60000) / 1000);

                                    // Format as HH:mm:ss
                                    item.EXPECTED_DURATION =
                                        String(hours).padStart(2, '0') + ':' +
                                        String(minutes).padStart(2, '0') + ':' +
                                        String(seconds).padStart(2, '0');
                                }
                            });


                            that.getModel("createModel").setProperty("/ArrivalProducts", oData.results);
                        },
                        error: function (error) {
                            that.showErrorMessage({ oTitle: that.getResourceBundle().getText("error"), oText: JSON.parse(error.responseText).error.message.value });
                        }
                    });
                }
            } catch (error) {
                this.showErrorMessage({ oTitle: this.getResourceBundle().getText("error"), oText: error.message });
            }
        },

        // MODIFY PLAN
        handleModifyPlan: function (aContainers, oAction) {
            try {
                this.onGetFields(aContainers);

                var oEntry = this._mappingFields();

                if (oEntry) {
                    var oModel = this.getModel(),
                        that = this,
                        sPath;

                    if (oAction == "create") {
                        sPath = "/UnloadPlans";
                    } else {
                        sPath = that.getView().getBindingContext().getPath().replace("xTQAxUNLOADING_PLANS_HEADER", "UnloadPlans");
                    }

                    oModel[oAction](sPath, oEntry, {
                        success: function () {
                            var cleared = that._clearData();

                            if (cleared) {
                                if (that.getView().getViewName().includes("Create")) {
                                    that.onNavigation("", "main", "");
                                } else {
                                    that.getModel().refresh(true);
                                    that._fetchData(that._extractKeyFromString(that.getView().getBindingContext().getPath()));
                                }
                            }
                        },
                        error: function (error) {
                            that.showErrorMessage({ oTitle: that.getResourceBundle().getText("error"), oText: JSON.parse(error.responseText).error.message.value });
                        }
                    });
                }
            } catch (error) {
                this.showErrorMessage({ oTitle: this.getResourceBundle().getText("error"), oText: error.message });
            }
        },

        // CANCEL PLAN CREATION
        handleCancelPlan: function () {
            var that = this;

            MessageBox.confirm(
                this.getResourceBundle().getText("cancelConfirmationMessage"),
                {
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.YES) {
                            var cleared = that._clearData();

                            if (cleared) {
                                that.onNavigation("", "main", "");
                            }
                        }
                    }
                }
            );
        },

        // HANDLE ROW SEQUENCE CHANGE
        handleSequenceChange: function (oEvent) {
            try {
                var oModel = this.getView().getModel("createModel"),
                    aItems = oModel.getProperty("/ArrivalProducts"),
                    oChangedItem = oEvent.getSource().getBindingContext("createModel").getObject(),
                    newSequence = oEvent.getParameter("value").trim(),
                    sequenceExists = aItems.some(function (item) {
                        return item.SEQUENCE === newSequence && item !== oChangedItem;
                    });

                if (sequenceExists) {
                    oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
                    oEvent.getSource().setValueStateText(this.getResourceBundle().getText("sequenceDuplicateError"));
                } else {
                    oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
                    oChangedItem.SEQUENCE = newSequence;
                }

                oModel.setProperty("/ArrivalProducts", aItems);
                oModel.refresh();
            } catch (error) {
                this.showErrorMessage({ oTitle: this.getResourceBundle().getText("error"), oText: error.message });
            }
        },


        handleDuplicateItem: function (oEvent) {
            try {
                var oModel = this.getView().getModel("createModel"),
                    aItems = oModel.getProperty("/ArrivalProducts"),
                    oSelectedItem = oEvent.getSource().getParent().getBindingContext("createModel").getObject(),
                    iIndex = aItems.findIndex(item => item.EBELP === oSelectedItem.EBELP),
                    hasChanges = aItems.some(item => item.VIRTUAL_QUANTITY !== item.QUANTITY); // Verifica se há mudanças

                var duplicateItem = () => {
                    var oClonedItem = { ...oSelectedItem },
                        maxItem = Math.max(...aItems.map(item => Number(item.EBELP)));

                    oClonedItem.EBELP = String(maxItem + 10).padStart(5, '0');
                    oClonedItem.SEQUENCE = String(maxItem + 10).padStart(5, '0');
                    oClonedItem.isCloned = true;

                    aItems.splice(iIndex + 1, 0, oClonedItem);

                    var aSameMaterialItems = aItems.filter(item => item.PRODUCT === oSelectedItem.PRODUCT),
                        fQuantityPerItem = (parseFloat(oSelectedItem.QUANTITY) / aSameMaterialItems.length).toFixed(2);

                    aSameMaterialItems.forEach(item => item.VIRTUAL_QUANTITY = fQuantityPerItem);

                    oModel.setProperty("/ArrivalProducts", aItems.sort((a, b) => Number(a.EBELP) - Number(b.EBELP)));
                    oModel.refresh();
                };

                if (hasChanges) {
                    MessageBox.confirm(
                        this.getResourceBundle().getText("confirmDuplication"),
                        {
                            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                            onClose: oAction => (oAction === MessageBox.Action.YES) && duplicateItem()
                        }
                    );
                } else {
                    duplicateItem();
                }

            } catch (error) {
                this.showErrorMessage({ oTitle: this.getResourceBundle().getText("error"), oText: error.message });
            }
        },

        // DELETE DUPLICATED ITEM ITEM
        handleDeleteItem: function (oEvent) {
            try {
                var oModel = this.getView().getModel("createModel"),
                    aItems = oModel.getProperty("/ArrivalProducts"),
                    oSelectedItem = oEvent.getSource().getParent().getBindingContext("createModel").getObject();

                if (!oSelectedItem.isCloned) {
                    MessageToast.show("Apenas linhas clonadas podem ser excluídas.");
                    return;
                }

                var iIndex = aItems.findIndex(item => item.EBELP === oSelectedItem.EBELP);

                if (iIndex !== -1) {
                    aItems.splice(iIndex, 1);
                }

                var aSameMaterialItems = aItems.filter(item => item.PRODUCT === oSelectedItem.PRODUCT);

                if (aSameMaterialItems.length > 0) {
                    var fTotalQuantity = parseFloat(oSelectedItem.VIRTUAL_QUANTITY) * (aSameMaterialItems.length + 1),
                        fQuantityPerItem = (fTotalQuantity / aSameMaterialItems.length).toFixed(2);

                    aSameMaterialItems.forEach(function (item) {
                        item.VIRTUAL_QUANTITY = fQuantityPerItem;
                    });
                }

                aItems.sort(function (a, b) {
                    return Number(a.EBELP) - Number(b.EBELP);
                });

                aItems.forEach(function (item, index) {
                    item.EBELP = String((index + 1) * 10).padStart(5, '0');
                });

                oModel.setProperty("/ArrivalProducts", aItems);
                oModel.refresh();
            } catch (error) {
                this.showErrorMessage({ oTitle: this.getResourceBundle().getText("error"), oText: error.message });
            }
        },

        // RESET TABLE DATA
        handleResetData: function () {
            try {
                var oModel = this.getView().getModel("createModel"),
                    aItems = oModel.getProperty("/ArrivalProducts"),
                    aOriginalItems = aItems.filter(function (item) {
                        return !item.isCloned;
                    });

                aOriginalItems.forEach(function (item) {
                    item.VIRTUAL_QUANTITY = item.QUANTITY;
                });

                oModel.setProperty("/ArrivalProducts", aOriginalItems);
                oModel.refresh();
            } catch (error) {
                this.showErrorMessage({ oTitle: this.getResourceBundle().getText("error"), oText: error.message });
            }
        },
        
        getUserAuthentication: function (type) {
            var that = this,
                urlParams = new URLSearchParams(window.location.search),
                token = urlParams.get('token');

            if (token != null) {
                var headers = new Headers();
                headers.append("X-authorization", token);

                var requestOptions = {
                    method: 'GET',
                    headers: headers,
                    redirect: 'follow'
                };

                fetch("/sap/opu/odata/TQA/AUTHENTICATOR_SRV/USER_AUTHENTICATION", requestOptions)
                    .then(function (response) {
                        if (!response.ok) {
                            throw new Error("Ocorreu um erro ao ler a entidade.");
                        }
                        return response.text();
                    })
                    .then(function (xml) {
                        var parser = new DOMParser(),
                            xmlDoc = parser.parseFromString(xml, "text/xml"),
                            successResponseElement = xmlDoc.getElementsByTagName("d:SuccessResponse")[0],
                            response = successResponseElement.textContent;

                        if (response != 'X') {
                            that.getRouter().navTo("NotFound");
                        }
                        else {
                            that.getModel("appView").setProperty("/token", token);
                        }
                    })
                    .catch(function (error) {
                        console.error(error);
                    });
            } else {
                that.getRouter().navTo("NotFound");
                return;
            }
        },
    });
});