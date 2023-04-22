# -*- coding: utf-8 -*-

import zira

def migrate(cr, version):
    registry = zira.registry(cr.dbname)
    from zira.addons.account.models.chart_template import migrate_tags_on_taxes
    migrate_tags_on_taxes(cr, registry)
