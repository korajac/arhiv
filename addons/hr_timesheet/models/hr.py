# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

from zira import fields, models


class HrEmployee(models.Model):
    _inherit = 'hr.employee'

    timesheet_cost = fields.Monetary('Timesheet Cost', currency_field='currency_id', default=0.0)
    currency_id = fields.Many2one('res.currency', related='company_id.currency_id', readonly=True)
