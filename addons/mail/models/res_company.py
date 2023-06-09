# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

from zira import api, models, fields


class Company(models.Model):
    _name = 'res.company'
    _inherit = 'res.company'

    catchall = fields.Char(string="Catchall Email", compute="_compute_catchall")

    @api.multi
    def _compute_catchall(self):
        ConfigParameter = self.env['ir.config_parameter'].sudo()
        alias = ConfigParameter.get_param('mail.catchall.alias')
        domain = ConfigParameter.get_param('mail.catchall.domain')
        if alias and domain:
            for company in self:
                company.catchall = '%s@%s' % (alias, domain)
        else:
            for company in self:
                company.catchall = ''
