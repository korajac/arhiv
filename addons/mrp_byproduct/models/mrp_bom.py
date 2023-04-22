# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

from zira import fields, models


class MrpBom(models.Model):
    _name = 'mrp.bom'
    _description = 'Bill of Material'
    _inherit = 'mrp.bom'

    sub_products = fields.One2many('mrp.subproduct', 'bom_id', 'Byproducts', copy=True)
