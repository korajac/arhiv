# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

from zira import models


class SaleOrder(models.Model):
    _name = "sale.order"
    _inherit = ['utm.mixin', 'sale.order']
