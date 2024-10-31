sap.ui.define([
    "./BaseController",
    "sap/m/MessageBox"
], function (BaseController, MessageBox) {
    "use strict";

    return BaseController.extend("unloadingplan.controller.Create", {
        attachHeaderChange: function (oAction) {
            try {
                if (!oAction) {
                    var checked = this.onCheckEmptyFields(["GeneralDataContainer", "ContactsDataContainer"])

                    if (checked) { 
                        this.onManageFieldsState(oAction);
                        this._manageButtonsState();

                        this._fetchData(this.aFields.find(({ id }) => id === 'EBELN').value);
                    } else {

                    }
                } else {
                    this.onManageFieldsState(oAction);
                    this._manageButtonsState();
                }

            } catch (error) {
                this.showErrorMessage({ oTitle: this.getResourceBundle().getText("error"), oText: error.message });
            }
        },

        handleBookingChanged: function (oEvent) {
            try {
                var oSelectedItem = oEvent.getParameter("selectedItem");

                if (!oSelectedItem || !oSelectedItem.getKey()) {
                    MessageBox.error(this.getResourceBundle().getText(oSelectedItem ? "invalidSelectionError" : "noSelectionError"));
                    return;
                }

                var hasFieldsWithValue = Array.isArray(this.aFields) && this.aFields.some(field => field.value && field.value.trim() !== ""),
                    aArrivalProducts = this.getModel("createModel").getProperty("/ArrivalProducts") || [],
                    tableLoaded = aArrivalProducts.length > 0,
                    hasClonedItems = aArrivalProducts.some(item => item.isCloned === true);

                if (hasFieldsWithValue && tableLoaded && hasClonedItems) {
                    MessageBox.alert(this.getResourceBundle().getText("confirmChangeBooking"), {
                        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                        onClose: function (oAction) {
                            if (oAction === MessageBox.Action.YES) {
                                this._fetchData(oSelectedItem.getKey());
                            }
                        }.bind(this)
                    });
                } else {
                    this.getModel("createModel").setProperty("/ebeln", oSelectedItem.getKey());
                }
            } catch (error) {
                this.showErrorMessage({ oTitle: this.getResourceBundle().getText("error"), oText: error.message });
            }
        },

        teste: function(){
            this.handleModifyPlan(["GeneralDataContainer","ContactsDataContainer"], "create");
        },

        onAfterRendering: function () {
            var that = this;
            sessionStorage.setItem("goToLaunchpad", "");
            window.addEventListener("message", function (event) {
                var data = event.data;
                if (data.action == "goToMainPage") {
                    that.onNavBackCreate();
                }
            });
        },

        onNavBackCreate: function () {
            sessionStorage.setItem("goToLaunchpad", "X");
            this.onNavigation("", "main", "");
        },
    });
});