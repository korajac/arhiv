# -*- coding: utf-8 -*-

import zira

def migrate(cr, version):
    registry = zira.registry(cr.dbname)
    from zira.addons.account.models.chart_template import migrate_set_tags_and_taxes_updatable
    migrate_set_tags_and_taxes_updatable(cr, registry, 'l10n_nl')
