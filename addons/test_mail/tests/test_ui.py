# Part of Zira. See LICENSE file for full copyright and licensing details.

import zira.tests


@zira.tests.tagged('post_install', '-at_install')
class TestUi(zira.tests.HttpCase):
    """ This tour is not imported in __init__ as the Longpolling required to update the message
        list is not available in test mode.
        see: https://github.com/zira/zira/commit/673f4aa4a77161dc58e0e1bf97e8f713b1e88491 """

    def test_01_project_tour(self):
        self.phantom_js("/web", "zira.__DEBUG__.services['web_tour.tour'].run('mail_tour')", "zira.__DEBUG__.services['web_tour.tour'].tours.mail_tour.ready", login="admin")
