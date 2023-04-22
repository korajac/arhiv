# -*- coding: utf-8 -*-
# Copyright 2020 Artem Shurshilov
# Zira Proprietary License v1.0

# This software and associated files (the "Software") may only be used (executed,
# modified, executed after modifications) if you have purchased a valid license
# from the authors, typically via Zira Apps, or if you have received a written
# agreement from the authors of the Software (see the COPYRIGHT file).

# You may develop Zira modules that use the Software as a library (typically
# by depending on it, importing it and using its resources), but without copying
# any source code or material from the Software. You may distribute those
# modules under the license of your choice, provided that this license is
# compatible with the terms of the Zira Proprietary License (For example:
# LGPL, MIT, or proprietary licenses similar to this one).

# It is forbidden to publish, distribute, sublicense, or sell copies of the Software
# or modified copies of the Software.

# The above copyright notice and this permission notice must be included in all
# copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
# IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
# ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
# DEALINGS IN THE SOFTWARE.

from zira import fields, models, api


class IrAttachment(models.Model):
    _inherit = 'ir.attachment'

    @api.depends('favorite_users_ids')
    def _compute_is_favorite(self):
        for project in self:
            project.is_favorite = self.env.user in project.favorite_users_ids

    def _inverse_is_favorite(self):
        return

    favorite_users_ids = fields.Many2many(
        'res.users', 'attachment_favorite_users_rel', 'attachment_id', 'user_id',
        string='Members')
    is_favorite = fields.Boolean(compute='_compute_is_favorite', inverse='_inverse_is_favorite', string='Show Attachment on dashboard',
                                 help="Whether this attachment should be displayed on your dashboard.", store=True)
    website_visible = fields.Boolean(string='Show attachment on website',
                                     help="Show attachment on website", default=False)

    def delete_favorites(self):
        for attachment in self:
            attachment.write({'favorite_users_ids': [[3, self.env.uid]]})
        return {'type': 'ir.actions.act_close_wizard_and_reload_attachments'}

    def add_current(self, res_model, res_id):
        # exist_ids = self.search([('id', 'in', self.ids), ('res_id','=',res_id), ('res_model','=', res_model)])
        # if exist_ids:
        #     return 0
        for attachment in self:
            attachment.copy({'res_id': res_id, 'res_model': res_model, 'favorite_users_ids': []})
        return {'type': 'ir.actions.act_close_wizard_and_reload_attachments'}

    def download_filter(self):
        return {
            'type': 'ir.actions.act_url',
            'url': '/web/binary/download_document_ids?ids='+str(self.ids).replace(' ', ''),
        }
