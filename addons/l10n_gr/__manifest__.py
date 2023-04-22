# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

# Copyright (C) 2009 P. Christeas <p_christ@hol.gr>. All Rights Reserved

{
    'name': 'Greece - Accounting',
    'author': 'P. Christeas, Korajac SA.',
    'website': 'http://ziraerp.hellug.gr/',
    'category': 'Localization',
    'description': """
This is the base module to manage the accounting chart for Greece.
==================================================================

Greek accounting chart and localization.
    """,
    'depends': [
        'account',
        'base_iban',
        'base_vat',
    ],
    'data': [ 'data/account_type_data.xml',
              'data/l10n_gr_chart_data.xml',
              'data/account.account.template.csv',
              'data/account_chart_template_data.xml',
              'data/account_data.xml',
              'data/account_tax_data.xml',
              'data/account_chart_template_configure_data.xml'
    ],
    'license': 'LGPL-3',
}
