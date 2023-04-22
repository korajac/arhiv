# -*- coding: utf-8 -*-

import logging

import zira.release
import zira.tools
from zira.exceptions import AccessDenied
from zira.tools.translate import _

from . import security

_logger = logging.getLogger(__name__)

RPC_VERSION_1 = {
        'server_version': zira.release.version,
        'server_version_info': zira.release.version_info,
        'server_serie': zira.release.serie,
        'protocol_version': 1,
}

def exp_login(db, login, password):
    # TODO: legacy indirection through 'security', should use directly
    # the res.users model
    res = security.login(db, login, password)
    msg = res and 'successful login' or 'bad login or password'
    _logger.info("%s from '%s' using database '%s'", msg, login, db.lower())
    return res or False

def exp_authenticate(db, login, password, user_agent_env):
    res_users = zira.registry(db)['res.users']
    try:
        return res_users.authenticate(db, login, password, user_agent_env)
    except AccessDenied:
        return False

def exp_version():
    return RPC_VERSION_1

def exp_about(extended=False):
    """Return information about the Korajac Server.

    @param extended: if True then return version info
    @return string if extended is False else tuple
    """

    info = _('See http://ziraerp.com')

    if extended:
        return info, zira.release.version
    return info

def exp_set_loglevel(loglevel, logger=None):
    # TODO Previously, the level was set on the now deprecated
    # `zira.netsvc.Logger` class.
    return True

def dispatch(method, params):
    g = globals()
    exp_method_name = 'exp_' + method
    if exp_method_name in g:
        return g[exp_method_name](*params)
    else:
        raise Exception("Method not found: %s" % method)
