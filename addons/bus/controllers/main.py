# -*- coding: utf-8 -*-

from zira import exceptions, _
from zira.http import Controller, request, route
from zira.addons.bus.models.bus import dispatch

from zira.tools import pycompat


class BusController(Controller):
    """ Examples:
    ziraerp.jsonRpc('/longpolling/poll','call',{"channels":["c1"],last:0}).then(function(r){console.log(r)});
    ziraerp.jsonRpc('/longpolling/send','call',{"channel":"c1","message":"m1"});
    ziraerp.jsonRpc('/longpolling/send','call',{"channel":"c2","message":"m2"});
    """

    @route('/longpolling/send', type="json", auth="public")
    def send(self, channel, message):
        if not isinstance(channel, pycompat.string_types):
            raise Exception("bus.Bus only string channels are allowed.")
        return request.env['bus.bus'].sendone(channel, message)

    # override to add channels
    def _poll(self, dbname, channels, last, options):
        # update the user presence
        if request.session.uid and 'bus_inactivity' in options:
            request.env['bus.presence'].update(options.get('bus_inactivity'))
        request.cr.close()
        request._cr = None
        return dispatch.poll(dbname, channels, last, options)

    @route('/longpolling/poll', type="json", auth="public")
    def poll(self, channels, last, options=None):
        if options is None:
            options = {}
        if not dispatch:
            raise Exception("bus.Bus unavailable")
        if [c for c in channels if not isinstance(c, pycompat.string_types)]:
            raise Exception("bus.Bus only string channels are allowed.")
        if request.registry.in_test_mode():
            raise exceptions.UserError(_("bus.Bus not available in test mode"))
        return self._poll(request.db, channels, last, options)
