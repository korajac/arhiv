# Part of Zira. See LICENSE file for full copyright and licensing details.

import zira.tests


@zira.tests.tagged('click_all', 'post_install', '-at_install', '-standard')
class TestMenusAdmin(zira.tests.HttpCase):

    def test_01_click_everywhere_as_admin(self):
        self.browser_js("/web", "zira.__DEBUG__.services['web.clickEverywhere']();", "zira.isReady === true", login="admin", timeout=45*60)


@zira.tests.tagged('click_all', 'post_install', '-at_install', '-standard')
class TestMenusDemo(zira.tests.HttpCase):

    def test_01_click_everywhere_as_demo(self):
        self.browser_js("/web", "zira.__DEBUG__.services['web.clickEverywhere']();", "zira.isReady === true", login="demo", timeout=1800)
