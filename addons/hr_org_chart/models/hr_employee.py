# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

from zira import api, fields, models


class Employee(models.Model):
    _name = "hr.employee"
    _inherit = "hr.employee"

    child_all_count = fields.Integer(
        'Indirect Surbordinates Count',
        compute='_compute_child_all_count', store=False)

    @api.depends('child_ids.child_all_count')
    def _compute_child_all_count(self):
        for employee in self:
            employee.child_all_count = len(employee.child_ids) + sum(child.child_all_count for child in employee.child_ids)
