# Part of Zira. See LICENSE file for full copyright and licensing details.

import zira.tests


@zira.tests.tagged('post_install','-at_install')
class TestUi(zira.tests.HttpCase):

    def test_01_crm_tour(self):
        self.phantom_js("/web", "zira.__DEBUG__.services['web_tour.tour'].run('crm_tour')", "zira.__DEBUG__.services['web_tour.tour'].tours.crm_tour.ready", login="admin")
