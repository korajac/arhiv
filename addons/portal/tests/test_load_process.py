# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.
import zira.tests


@zira.tests.tagged('post_install', '-at_install')
class TestUi(zira.tests.HttpCase):
    def test_01_portal_load_tour(self):
        self.phantom_js(
            "/",
            "zira.__DEBUG__.services['web_tour.tour'].run('portal_load_homepage')",
            "zira.__DEBUG__.services['web_tour.tour'].tours.portal_load_homepage.ready",
            login="portal"
        )
