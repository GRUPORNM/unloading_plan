sap.ui.define([
    "./BaseController",
    "unloadingplan/model/formatter"
],
    function (BaseController,
        formatter
    ) {
        "use strict";

        return BaseController.extend("unloadingplan.controller.Detail", {

            formatter: formatter,

            onInit: function () {
                sessionStorage.setItem("goToLaunchpad", "");

                sap.ui.core.UIComponent.getRouterFor(this).getRoute("detail").attachPatternMatched(this.onObjectMatched, this);
            },

            handleEditToggled: function (oEvent) {
                try {
                    var bEditable = oEvent.getParameter("editable");

                    if (!bEditable) {
                        this.handleModifyPlan(["generalForm", "contactsForm"], "update")
                    }
                    else {
                        this._manageButtonsState();
                    }

                    this.byId("contactsForm").setEditable(bEditable);
                } catch (error) {
                    this.showErrorMessage({ oTitle: this.getResourceBundle().getText("error"), oText: error.message });
                }
            },

            onAfterRendering: function () {
                var that = this;
                sessionStorage.setItem("goToLaunchpad", "");
                window.addEventListener("message", function (event) {
                    var data = event.data;
                    if (data.action == "goToMainPage") {
                        that.onNavBackDetail();
                    }
                });
            },

            onNavBackDetail: function () {
                sessionStorage.setItem("goToLaunchpad", "X");
                this.onNavigation("", "main", "");
            },
        });
    });