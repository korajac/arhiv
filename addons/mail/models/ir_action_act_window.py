# -*- coding: utf-8 -*-
from zira import fields, models


class ActWindowView(models.Model):
    _inherit = 'ir.actions.act_window.view'

    view_mode = fields.Selection(selection_add=[('activity', 'Activity')])
