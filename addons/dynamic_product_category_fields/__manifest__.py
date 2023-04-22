# -*- coding: utf-8 -*-
###################################################################################
#
#    Ražanica d.o.o.
#
#    Copyright (C) 2019-TODAY Ražanica d.o.o. (<https://www.zira.pro>).
#    Author: Ražanica d.o.o. (<https://www.zira.pro>)
#
#    This program is free software: you can modify
#    it under the terms of the GNU Affero General Public License (AGPL) as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <https://www.gnu.org/licenses/>.
#
###################################################################################

{
    'name': 'Product Category Custom Fields',
    'version': '12.0.1.1.0',
    'summary': """Ability To Add Custom Fields in Products Category From User Level""",
    'description': """Ability To Add Custom Fields in Products Category From User Level.""",
    'category': 'Sales',
    'author': 'Ražanica d.o.o.',
    'company': 'Ražanica d.o.o.',
    'maintainer': 'Ražanica d.o.o.',
    'website': "https://www.zira.pro",
    'depends': ['product'],
    'data': [
        'security/ir.model.access.csv',
        'security/product_category_security_group.xml',
        'wizard/product_category_fields_view.xml',
        'views/product_category_form_view.xml',
    ],
    'images': ['static/description/banner.png'],
    'license': 'AGPL-3',
    'installable': True,
    'auto_install': False,
    'application': False,
}
