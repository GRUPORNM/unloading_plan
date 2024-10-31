sap.ui.define([], function () {
    "use strict";
    return {
        formatTime: function (oTime) {
            if (oTime) {
                var iMilliseconds = oTime.ms,
                    oDate = new Date(iMilliseconds),
                    iHours = oDate.getUTCHours(),
                    iMinutes = oDate.getUTCMinutes();

                var sHours = iHours.toString().padStart(2, "0");
                var sMinutes = iMinutes.toString().padStart(2, "0");

                return sHours + ":" + sMinutes;
            }
            return "";
        }
    };
});
