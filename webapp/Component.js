sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/model/json/JSONModel"
    ],
    function (UIComponent, JSONModel) {
        "use strict";

        return UIComponent.extend("unloadingplan.Component", {
            metadata: {
                manifest: "json"
            },

            init: function () {
                var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "dd.MM.yyyy" });
                this.setModel(new JSONModel({
                    currentDate: oDateFormat.format(new Date()),
                    ebeln: "",
                    v1: true,
                    v2: false
                }), "createModel");

                UIComponent.prototype.init.apply(this, arguments);

                this.getRouter().initialize();
            }
        });
    }
);