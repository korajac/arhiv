# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.
import zira.tests


@zira.tests.common.at_install(False)
@zira.tests.common.post_install(True)
class TestUi(zira.tests.HttpCase):
    def test_01_wishlist_tour(self):
        self.phantom_js("/", "zira.__DEBUG__.services['web_tour.tour'].run('shop_wishlist')", "zira.__DEBUG__.services['web_tour.tour'].tours.shop_wishlist.ready")
