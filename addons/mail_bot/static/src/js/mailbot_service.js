zira.define('mail_bot.MailBotService', function (require) {
"use strict";

var AbstractService = require('web.AbstractService');
var core = require('web.core');
var session = require('web.session');

var _t = core._t;

var MailBotService =  AbstractService.extend({
    /**
     * @override
     */
    start: function () {
        this._hasRequest = (window.Notification && window.Notification.permission === "default") || false;
        if ('zirabot_initialized' in session && ! session.zirabot_initialized) {
            this._showZirabotTimeout();
        }
    },

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Get the previews related to the ZiraBot (conversation not included).
     * For instance, when there is no conversation with ZiraBot and ZiraBot has
     * a request, it should display a preview in the systray messaging menu.
     *
     * @param {string|undefined} [filter]
     * @returns {Object[]} list of objects that are compatible with the
     *   'mail.Preview' template.
     */
    getPreviews: function (filter) {
        var previews = [];
        if (this.hasRequest() && (filter === 'mailbox_inbox' || !filter)) {
            previews.push({
                title: _t("ZiraBot has a request"),
                imageSRC: "/mail/static/src/img/zirabot.png",
                status: 'bot',
                body:  _t("Enable desktop notifications to chat"),
                id: 'request_notification',
                unreadCounter: 1,
            });
        }
        return previews;
    },
    /**
     * Tell whether ZiraBot has a request or not.
     *
     * @returns {boolean}
     */
    hasRequest: function () {
        return this._hasRequest;
    },
    /**
     * Called when user either accepts or refuses push notifications.
     */
    removeRequest: function () {
        this._hasRequest = false;
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @private
     */
    _showZirabotTimeout: function () {
        var self = this;
        setTimeout(function () {
            session.zirabot_initialized = true;
            self._rpc({
                model: 'mail.channel',
                method: 'init_zirabot',
            });
        }, 2*60*1000);
    },
});

core.serviceRegistry.add('mailbot_service', MailBotService);
return MailBotService;

});
