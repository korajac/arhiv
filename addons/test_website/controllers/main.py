# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

from zira import http
from zira.http import request
from zira.addons.portal.controllers.web import Home


class WebsiteTest(Home):

    @http.route('/test_view', type='http', auth="public", website=True, sitemap=False)
    def test_view(self, **kw):
        return request.render('test_website.test_view')

    @http.route(['/get'], type='http', auth="public", methods=['GET'], website=True)
    def get_method(self, **kw):
        return request.make_response('get')

    @http.route(['/post'], type='http', auth="public", methods=['POST'], website=True)
    def post_method(self, **kw):
        return request.make_response('post')

    @http.route(['/get_post'], type='http', auth="public", methods=['GET', 'POST'], website=True)
    def get_post_method(self, **kw):
        return request.make_response('get_post')

    @http.route(['/get_post_nomultilang'], type='http', auth="public", methods=['GET', 'POST'], website=True, multilang=False)
    def get_post_method_no_multilang(self, **kw):
        return request.make_response('get_post_nomultilang')
