# Part of Zira. See LICENSE file for full copyright and licensing details.

import zira.tests


@zira.tests.tagged('post_install', '-at_install')
class TestUi(zira.tests.HttpCase):
    
    def test_01_main_flow_tour(self):
        self.phantom_js("/web", "zira.__DEBUG__.services['web_tour.tour'].run('main_flow_tour')", "zira.__DEBUG__.services['web_tour.tour'].tours.main_flow_tour.ready", login="admin", timeout=180)
