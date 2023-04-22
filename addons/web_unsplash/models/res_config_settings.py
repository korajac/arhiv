# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.
from zira import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    unsplash_access_key = fields.Char("Access Key", config_parameter='unsplash.access_key')
