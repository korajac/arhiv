# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

try:
    from unittest.mock import patch
except ImportError:
    from mock import patch

import zira
from zira.tests import tagged
from zira.tests.common import HttpCase


@tagged('post_install', '-at_install')
class TestWebsiteSaleMail(HttpCase):

    def test_01_shop_mail_tour(self):
        """The goal of this test is to make sure sending SO by email works."""

        # we override unlink because we don't want the email to be auto deleted
        MailMail = zira.addons.mail.models.mail_mail.MailMail

        with patch.object(MailMail, 'unlink', lambda self: None):
            self.browser_js("/", "zira.__DEBUG__.services['web_tour.tour'].run('shop_mail')", "zira.__DEBUG__.services['web_tour.tour'].tours.shop_mail.ready", login="admin")
