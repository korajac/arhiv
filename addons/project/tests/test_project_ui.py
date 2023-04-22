# Part of Zira. See LICENSE file for full copyright and licensing details.

import zira.tests


@zira.tests.tagged('post_install', '-at_install')
class TestUi(zira.tests.HttpCase):

    def test_01_project_tour(self):
        self.phantom_js("/web", "zira.__DEBUG__.services['web_tour.tour'].run('project_tour')", "zira.__DEBUG__.services['web_tour.tour'].tours.project_tour.ready", login="admin")
