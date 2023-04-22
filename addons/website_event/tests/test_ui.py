import zira.tests


@zira.tests.tagged('post_install', '-at_install')
class TestUi(zira.tests.HttpCase):
    def test_admin(self):
        self.phantom_js("/", "zira.__DEBUG__.services['web_tour.tour'].run('event')", "zira.__DEBUG__.services['web_tour.tour'].tours.event.ready", login='admin')
