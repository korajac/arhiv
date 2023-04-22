# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.
from zira import models, api
from zira.tools.translate import _
from zira.exceptions import UserError


class AccountBankStatement(models.Model):
    _inherit = 'account.bank.statement'

    @api.multi
    def unlink(self):
        for statement in self.filtered(lambda s: s.company_id._is_accounting_unalterable() and s.journal_id.journal_user):
            raise UserError(_('You cannot modify anything on a bank statement (name: %s) that was created by point of sale operations.') % (statement.name,))
        return super(AccountBankStatement, self).unlink()


class AccountBankStatementLine(models.Model):
    _inherit = 'account.bank.statement.line'

    @api.multi
    def unlink(self):
        for line in self.filtered(lambda s: s.company_id._is_accounting_unalterable() and s.journal_id.journal_user):
            raise UserError(_('You cannot modify anything on a bank statement line (name: %s) that was created by point of sale operations.') % (line.name,))
        return super(AccountBankStatementLine, self).unlink()
