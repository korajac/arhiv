# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

from zira import fields, models


class ResCompany(models.Model):
    _inherit = 'res.company'

    pad_server = fields.Char(help="Etherpad lite server. Example: beta.primarypad.com")
    pad_key = fields.Char('Pad Api Key', help="Etherpad lite api key.", groups="base.group_system")
