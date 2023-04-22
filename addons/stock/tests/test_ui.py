# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

import zira.tests

@zira.tests.tagged('post_install', '-at_install')
class TestUi(zira.tests.HttpCase):

    def test_01_admin_stock_route(self):
        self.phantom_js("/web", "zira.__DEBUG__.services['web_tour.tour'].run('stock')", "zira.__DEBUG__.services['web_tour.tour'].tours.stock.ready", login='admin')
