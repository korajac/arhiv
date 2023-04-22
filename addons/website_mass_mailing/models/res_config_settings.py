# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

from zira import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    group_website_popup_on_exit = fields.Boolean(string="Website Popup", implied_group="website_mass_mailing.group_website_popup_on_exit")
