# -*- coding: utf-8 -*-
# Copyright 2021 Artem Shurshilov
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

from zira import models, fields, api, _
import requests
import json
from zira.exceptions import UserError, ValidationError


class OcrTemplate(models.Model):
    _name = "ocr.template"

    name = fields.Char(string="Template name")
    pdf_enable = fields.Boolean(string="Use pdf template for insert recognized text or record text", default=False)
    pdf_insert_from_record = fields.Boolean(string="Use pdf template for insert record data text, recognize will disable", default=False)
    pdf_file = fields.Binary(string="PDF file template (fish) for OCR recognition")
    pdf_font_size = fields.Integer(string="PDF font size to insert", default=20)
    pdf_font_color = fields.Char(string="PDF font color to insert", default='#123123')
    pdf_only = fields.Boolean(string="Work only with pdf, do not insert recognized data into the model record", default=True)
    pdf_options = fields.Selection(string="PDF options",
        selection=[
            ('pdf_store',' PDF store as attachment'),
            ('pdf_download',' PDF download as file '),
            ('both',' Both '),
        ],
    default='pdf_store', required=True)

    source_save = fields.Boolean(string="Save source image", default=False)
    image = fields.Binary(string="Image for OCR recognition")
    regex = fields.Char(string="Regex js", default="[!№;%:?*()_+=`~|\\}{$#@&^<>,—'\-„]",
        help="Replace on empty char reg. Acceptable for recognized text.")
    char_whitelist = fields.Char(string="White list of chars", default="0123456789abcdefjhijklmnopqrstuvwxyz",
        help="White list of chars in recognition algo better use then regex")
    lang = fields.Selection(string="Language",
    selection=[
        ('afr',' Afrikaans'),
        ('ara',' Arabic'),
        ('aze',' Azerbaijani'),
        ('bel',' Belarusian'),
        ('ben',' Bengali'),
        ('bul',' Bulgarian'),
        ('cat',' Catalan'),
        ('ces',' Czech'),
        ('chi_sim' ,'Chinese'),
        ('chi_tra' ,' Traditional Chinese'),
        ('chr',' Cherokee'),
        ('dan',' Danish'),
        ('deu',' German'),
        ('ell',' Greek'),
        ('eng',' English'),
        ('enm',' English (Old)'),
        ('meme',' Internet Meme'),
        ('epo',' Esperanto '),
        ('epo_alt' ,' Esperanto alternative'),
        ('equ',' Math      '),
        ('est',' Estonian  '),
        ('eus',' Basque    '),
        ('fin',' Finnish   '),
        ('fra',' French    '),
        ('frk',' Frankish  '),
        ('frm',' French (Old) '),
        ('glg',' Galician  '),
        ('grc',' Ancient Greek'),
        ('heb',' Hebrew    '),
        ('hin',' Hindi     '),
        ('hrv',' Croatian  '),
        ('hun',' Hungarian '),
        ('ind',' Indonesian'),
        ('isl',' Icelandic '),
        ('ita',' Italian   '),
        ('ita_old' ,' Italian (Old)'),
        ('jpn',' Japanese  '),
        ('kan',' Kannada   '),
        ('kor',' Korean    '),
        ('lav',' Latvian   '),
        ('lit',' Lithuanian'),
        ('mal',' Malayalam '),
        ('mkd',' Macedonian'),
        ('mlt',' Maltese   '),
        ('msa',' Malay     '),
        ('nld',' Dutch     '),
        ('nor',' Norwegian '),
        ('pol',' Polish    '),
        ('por',' Portuguese'),
        ('ron',' Romanian  '),
        ('rus',' Russian'),
        ('slk',' Slovakian '),
        ('slv',' Slovenian '),
        ('spa',' Spanish   '),
        ('spa_old' ,' Old Spanish'),
        ('sqi',' Albanian  '),
        ('srp',' Serbian (Latin) '),
        ('swa',' Swahili   '),
        ('swe',' Swedish   '),
        ('tam',' Tamil     '),
        ('tel',' Telugu    '),
        ('tgl',' Tagalog   '),
        ('tha',' Thai      '),
        ('tur',' Turkish   '),
        ('ukr',' Ukrainian '),
        ('vie',' Vietnamese ')
    ],
    default='eng', required=True)
    json = fields.Text(string="JSON representation")
    json_fields = fields.Char(string="Fields for parse", compute="_compute_json_fields")

    model_id = fields.Many2one('ir.model', domain=[('transient', '=', False)])
    field_ids = fields.Many2many('ir.model.fields', string='Fields model',
                                domain="""[('model_id', '=', model_id)]""", required=True)

    # @api.onchange('pdf_enable')
    # def _compute_pdf_settings(self):
    #     for rec in self:
    #         if not rec.pdf_enable:
    #             rec.pdf_only = False

    @api.depends('field_ids')
    def _compute_json_fields(self):
        for rec in self:
            rec.json_fields = json.dumps(rec.field_ids.mapped('name'))
