# -*- coding: utf-8 -*-
# Copyright (C) 2021 Artem Shurshilov <shurshilov.a@yandex.ru>
# License OPL-1.0 or later (http://www.gnu.org/licenses/agpl).
{
    'name': "OCR recognition images",

    'summary': """
        ocr recognition text from image. upload from webcamera or file 
        you can recognize docx pdf excel and any file if save it as image or from webcamera
        tessaract js """,

    'author': "Shurshilov Artem",
    'website': "https://eurzira.com",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/zira/zira/blob/13.0/zira/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Technical Settings',
    'version': '12.3.0.4',
    "license": "OPL-1",
    'price': 199,
    'currency': 'EUR',
    'images':[
        'static/description/engine.png',
    ],

    # any module necessary for this one to work correctly
    'depends': ['base','web', 'widget_drawing_image'],
    'installable': True,

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'views/views.xml',
        'views/assets.xml',
    ],

    'qweb': [
        "static/src/xml/ocr.xml",
    ],
}
