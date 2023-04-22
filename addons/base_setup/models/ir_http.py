# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.
from zira import models
from zira.http import request


class IrHttp(models.AbstractModel):
    _inherit = 'ir.http'

    def session_info(self):
        result = super(IrHttp, self).session_info()
        result['show_effect'] = request.env['ir.config_parameter'].sudo().get_param('base_setup.show_effect')
        return result
