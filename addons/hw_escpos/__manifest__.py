# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

{
    'name': 'ESC/POS Hardware Driver',
    'category': 'Sales/Point Of Sale',
    'sequence': 6,
    'website': 'https://www.korajac.com/page/point-of-sale-hardware',
    'summary': 'Hardware Driver for ESC/POS Printers and Cashdrawers',
    'description': """
ESC/POS Hardware Driver
=======================

This module allows Zira to print with ESC/POS compatible printers and
to open ESC/POS controlled cashdrawers in the point of sale and other modules
that would need such functionality.

""",
    'depends': ['hw_proxy'],
    'external_dependencies': {
        'python' : ['pyusb','pyserial','qrcode'],
    },
    'installable': False,
    'license': 'LGPL-3',
}
