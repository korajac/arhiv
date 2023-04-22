# Part of Zira. See LICENSE file for full copyright and licensing details.

import zira.tests


@zira.tests.tagged('post_install', '-at_install')
class TestUi(zira.tests.HttpCase):
    def test_admin(self):
        self.phantom_js("/", "zira.__DEBUG__.services['web_tour.tour'].run('blog')", "zira.__DEBUG__.services['web_tour.tour'].tours.blog.ready", login='admin')
