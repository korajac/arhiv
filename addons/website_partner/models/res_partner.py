# -*- coding: utf-8 -*-

from zira import api, fields, models
from zira.addons.http_routing.models.ir_http import slug
from zira.tools.translate import html_translate


class WebsiteResPartner(models.Model):
    _name = 'res.partner'
    _inherit = ['res.partner', 'website.seo.metadata', 'website.published.mixin']

    website_description = fields.Html('Website Partner Full Description', strip_style=True, translate=html_translate)
    website_short_description = fields.Text('Website Partner Short Description', translate=True)

    @api.multi
    def _compute_website_url(self):
        super(WebsiteResPartner, self)._compute_website_url()
        for partner in self:
            partner.website_url = "/partners/%s" % slug(partner)
