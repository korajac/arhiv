# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

import zira.tests

@zira.tests.tagged('post_install', '-at_install')
class TestUi(zira.tests.HttpCase):

    def test_01_admin_rte(self):
        self.phantom_js("/web", "zira.__DEBUG__.services['web_tour.tour'].run('rte')", "zira.__DEBUG__.services['web_tour.tour'].tours.rte.ready", login='admin')

    def test_02_admin_rte_inline(self):
        self.phantom_js("/web", "zira.__DEBUG__.services['web_tour.tour'].run('rte_inline')", "zira.__DEBUG__.services['web_tour.tour'].tours.rte_inline.ready", login='admin')
