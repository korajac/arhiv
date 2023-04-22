# -*- coding: utf-8 -*-
# Copyright (C) 2020 Artem Shurshilov <shurshilov.a@yandex.ru>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
{
    'name': "Widget for draw on image and save result as JSON",

    'summary': """
            Widget for draw on image and save result as JSON.
            Rectangles shape and save coords
        """,

    'author': "Shurshilov Artem",
    'website': "https://eurzira.com",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/zira/zira/blob/13.0/zira/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'eCommerce',
    'version': '14.1.0.0',
    "license": "OPL-1",
    "support": "shurshilov.a@yandex.ru",
    'price': 49,
    'currency': 'EUR',
    'images':[
        'static/description/backend.gif',
    ],

    # any module necessary for this one to work correctly
    #'depends': ['website_sale'],
    'installable': True,

    # always loaded
    'data': [
        'assets.xml',
    ],

    'qweb': [
        "static/src/xml/image.xml",
    ],
}
