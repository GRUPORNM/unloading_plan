sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (UI5Object, MessageBox, Filter, FilterOperator) {
    "use strict";

    return UI5Object.extend("unloadingplan.controller.ErrorHandler", {
        constructor: function (oComponent) {
            var oMessageManager = sap.ui.getCore().getMessageManager(),
                oMessageModel = oMessageManager.getMessageModel();

            this._oComponent = oComponent;
            this._bMessageOpen = false;

            this.oMessageModelBinding = oMessageModel.bindList("/", undefined,
                [], new Filter("technical", FilterOperator.EQ, true));

            this.oMessageModelBinding.attachChange(function (oEvent) {
                var aContexts = oEvent.getSource().getContexts(),
                    aMessages = [];

                if (this._bMessageOpen || !aContexts.length) {
                    return;
                }

                aContexts.forEach(function (oContext) {
                    aMessages.push(oContext.getObject());
                });
                oMessageManager.removeMessages(aMessages);

                this._showServiceError(aMessages[0].message);
            }, this);
        },

        _showServiceError: function (sError) {
            this._bMessageOpen = true;
            MessageBox.error(
                sError,
                {
                    id: "serviceErrorMessageBox",
                    actions: [MessageBox.Action.CLOSE],
                    onClose: function () {
                        this._bMessageOpen = false;
                    }.bind(this)
                }
            );
        }
    });
});