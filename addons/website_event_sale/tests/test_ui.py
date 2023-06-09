import zira.tests


@zira.tests.common.tagged('post_install', '-at_install')
class TestUi(zira.tests.HttpCase):

    def test_admin(self):
        # Seen that:
        # - this test relies on demo data that are entirely in USD (pricelists)
        # - that main demo company is gelocated in US
        # - that this test awaits for hardcoded USDs amount
        # we have to force company currency as USDs only for this test
        self.cr.execute("UPDATE res_company SET currency_id = %s WHERE id = %s", [self.env.ref('base.USD').id, self.env.ref('base.main_company').id])
        self.phantom_js("/", "zira.__DEBUG__.services['web_tour.tour'].run('event_buy_tickets')", "zira.__DEBUG__.services['web_tour.tour'].tours.event_buy_tickets.ready", login="admin")

    def test_demo(self):
        self.phantom_js("/", "zira.__DEBUG__.services['web_tour.tour'].run('event_buy_tickets')", "zira.__DEBUG__.services['web_tour.tour'].tours.event_buy_tickets.ready", login="demo")

    # TO DO - add public test with new address when convert to web.tour format.
