# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

from zira import models, api


class Website(models.Model):
    _name = "website"
    _inherit = _name

    @api.model
    def create_and_redirect_to_theme(self, vals):
        self.browse(vals)._force()
        action = self.env.ref('website_theme_install.theme_install_kanban_action')
        return action.read()[0]
