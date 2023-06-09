# -*- coding: utf-8 -*-
{
    'name': 'Slides',
    'version': '1.0',
    'sequence': 145,
    'summary': 'Publish videos, slides and documents',
    'website': 'https://www.korajac.com/page/slides',
    'category': 'Website',
    'description': """
Share and Publish Videos, Presentations and Documents'
======================================================

 * Website Application
 * Channel Management
 * Filters and Tagging
 * Statistics of Presentation
 * Channel Subscription
 * Supported document types : PDF, images, YouTube videos and Google Drive documents)
""",
    'depends': ['website', 'website_mail'],
    'data': [
        'views/res_config_settings_views.xml',
        'views/website_slides.xml',
        'views/website_slides_embed.xml',
        'views/website_slides_backend.xml',
        'data/website_slides_data.xml',
        'security/ir.model.access.csv',
        'security/website_slides_security.xml'
    ],
    'demo': [
        'data/website_slides_demo.xml'
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
