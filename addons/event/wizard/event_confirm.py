# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

from zira import models, api


class event_confirm(models.TransientModel):
    """Event Confirmation"""
    _name = "event.confirm"
    _description = 'Event Confirmation'

    @api.multi
    def confirm(self):
        events = self.env['event.event'].browse(self._context.get('event_ids', []))
        events.do_confirm()
        return {'type': 'ir.actions.act_window_close'}
