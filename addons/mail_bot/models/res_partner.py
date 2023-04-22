# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.
from zira import api, models

class Partner(models.Model):
    _inherit = 'res.partner'

    def _compute_im_status(self):
        #we asume that mail_bot _compute_im_status will be executed after bus _compute_im_status
        super(Partner, self)._compute_im_status()
        zirabot_id = self.env['ir.model.data'].xmlid_to_res_id("base.partner_root")
        for partner in self:
            if partner.id == zirabot_id:
                partner.im_status = 'bot'

    @api.model
    def get_mention_suggestions(self, search, limit=8):
        #add zirabot in mention suggestion when pinging in mail_thread
        [users, partners] = super(Partner, self).get_mention_suggestions(search, limit=limit)
        if len(partners) + len(users) < limit and "zirabot".startswith(search.lower()):
            zirabot = self.env.ref("base.partner_root")
            if not any([elem['id'] == zirabot.id for elem in partners]):
                if zirabot:
                    partners.append({'id': zirabot.id, 'name': zirabot.name, 'email': zirabot.email})
        return [users, partners]

