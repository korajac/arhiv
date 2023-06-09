# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

from zira import api, fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    website_slide_google_app_key = fields.Char(related='website_id.website_slide_google_app_key', readonly=False)
