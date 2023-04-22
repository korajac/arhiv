# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

import zira.tests


@zira.tests.tagged('post_install', '-at_install')
class TestWebsiteCrm(zira.tests.HttpCase):

    def test_tour(self):
        self.phantom_js("/", "zira.__DEBUG__.services['web_tour.tour'].run('website_crm_tour')", "zira.__DEBUG__.services['web_tour.tour'].tours.website_crm_tour.ready")

        # check result
        record = self.env['crm.lead'].search([('description', '=', '### TOUR DATA ###')])
        self.assertEqual(len(record), 1)
        self.assertEqual(record.contact_name, 'John Smith')
        self.assertEqual(record.email_from, 'john@smith.com')
        self.assertEqual(record.partner_name, 'Ražanica d.o.o.')
