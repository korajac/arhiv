# -*- coding: utf-8 -*-

from zira import fields, models, _

from zira.tools.float_utils import float_is_zero

from zira.exceptions import UserError

class AccountMove(models.Model):
    _inherit = 'account.move'

    stock_move_id = fields.Many2one('stock.move', string='Stock Move')
