# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

from zira import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    crm_phone_valid_method = fields.Selection(related="company_id.phone_international_format", required=True, readonly=False)
