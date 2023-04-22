zira.define('iap.redirect_zira_credit_widget', function(require) {
"use strict";

var AbstractAction = require('web.AbstractAction');
var core = require('web.core');


var IapZiraCreditRedirect = AbstractAction.extend({
    template: 'iap.redirect_to_zira_credit',
    events : {
        "click .redirect_confirm" : "zira_redirect",
    },
    init: function (parent, action) {
        this._super(parent, action);
        this.url = action.params.url;
    },

    zira_redirect: function () {
        window.open(this.url, '_blank');
        this.do_action({type: 'ir.actions.act_window_close'});
        // framework.redirect(this.url);
    },

});
core.action_registry.add('iap_zira_credit_redirect', IapZiraCreditRedirect);
});
