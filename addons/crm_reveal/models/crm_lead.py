# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

from zira import fields, models


class Lead(models.Model):
    _inherit = 'crm.lead'

    reveal_ip = fields.Char(string='IP Address')
    reveal_iap_credits = fields.Integer(string='IAP Credits')
    reveal_rule_id = fields.Many2one('crm.reveal.rule', string='Lead Generation Rule', index=True)
    reveal_id = fields.Char(string='Reveal ID', index=True)
