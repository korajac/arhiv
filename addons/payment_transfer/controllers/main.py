# -*- coding: utf-8 -*-
import logging
import pprint
import werkzeug

from zira import http
from zira.http import request

_logger = logging.getLogger(__name__)


class OgoneController(http.Controller):
    _accept_url = '/payment/transfer/feedback'

    @http.route([
        '/payment/transfer/feedback',
    ], type='http', auth='none', csrf=False)
    def transfer_form_feedback(self, **post):
        _logger.info('Beginning form_feedback with post data %s', pprint.pformat(post))  # debug
        request.env['payment.transaction'].sudo().form_feedback(post, 'transfer')
        return werkzeug.utils.redirect('/payment/process')
