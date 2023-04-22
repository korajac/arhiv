# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

from zira.tests.common import TransactionCase
from zira.tests import tagged

@tagged('post_install', '-at_install')
class SwissQRTest(TransactionCase):

    def test_abc_1(self):
        assert self.env['res.partner.bank'].find_number('1 rue du bois communal') == '1'
        assert self.env['res.partner.bank'].find_number('1bis rue du bois communal') == '1bis'
        assert self.env['res.partner.bank'].find_number('rue du bois communal 1') == '1'
        assert self.env['res.partner.bank'].find_number('rue du bois communal 1bis') == '1bis'
        assert self.env['res.partner.bank'].find_number('1 rue du 9 mars 1962') == '1'
        assert self.env['res.partner.bank'].find_number('rue du 9 mars 1962 1') == '1'
        assert self.env['res.partner.bank'].find_number('1bis rue du 9 mars 1962') == '1bis'
        assert self.env['res.partner.bank'].find_number('rue du 9 mars 1962 1bis') == '1bis'
        assert self.env['res.partner.bank'].find_number('rue du 9 mars 1962') == '1962'
        assert self.env['res.partner.bank'].find_number('rue du 9 mars 1962 4 boite 2') == '2'
