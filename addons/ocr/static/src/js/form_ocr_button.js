//  Copyright 2021 Artem Shurshilov
//  Zira Proprietary License v1.0

//  This software and associated files (the "Software") may only be used (executed,
//  modified, executed after modifications) if you have purchased a valid license
//  from the authors, typically via Zira Apps, or if you have received a written
//  agreement from the authors of the Software (see the COPYRIGHT file).

//  You may develop Zira modules that use the Software as a library (typically
//  by depending on it, importing it and using its resources), but without copying
//  any source code or material from the Software. You may distribute those
//  modules under the license of your choice, provided that this license is
//  compatible with the terms of the Zira Proprietary License (For example:
//  LGPL, MIT, or proprietary licenses similar to this one).

//  It is forbidden to publish, distribute, sublicense, or sell copies of the Software
//  or modified copies of the Software.

//  The above copyright notice and this permission notice must be included in all
//  copies or substantial portions of the Software.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
//  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
//  ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
//  DEALINGS IN THE SOFTWARE.
/*******************************************************************************
 * 
 * Copyright (C) 2017 MuK IT GmbH
 * 
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * 
 ******************************************************************************/
zira.define('ocr_button', function (require) {
    "use strict";

    var core = require('web.core');
    var ocrDialog = require('ocr_dialog');
    var OcrDialogSelectTmpl = require('ocr_dialog_select_tmpl');
    var FormRenderer = require('web.FormRenderer');
    var _t = core._t;

    FormRenderer.include({

        _renderShareButton: function () {
            let $sharebutton = $('<div>');
            $sharebutton.addClass("share_button");
            $sharebutton.append($('<button>').addClass("btn btn-primary")
                .append($('<i class="fa fa-eye"/>')));
            $sharebutton.on('click', _.bind(this._clickShareButton, this));
            this.$el.find('.o_form_sheet').append($sharebutton);
        },

        _clickShareButton: function () {
            // read ocr.templates for current model
            this._rpc({
                model: 'ocr.template',
                method: 'search_read',
                kwargs: {
                    domain: [
                        ['model_id.model', '=', this.__parentedParent.initialState.model]
                    ],
                    fields: ['name', 'json', 'json_fields', 'lang', 'regex', 'source_save',
                        'pdf_enable', 'pdf_file', 'pdf_only', 'pdf_options', 'pdf_font_color',
                        'pdf_font_size', 'pdf_insert_from_record', 'char_whitelist'],
                },
            }).then((templates) => {
                if (!templates.length) {
                    this.do_notify(_t("Please, create template first!"));
                    return
                }
                //отобразить окно выбора шаблона
                //включить камеру с шаблоном поверх
                //сделать снимок
                //распознать и показать поля
                //сохранить или предложить перефотать
                new OcrDialogSelectTmpl(this, {
                    templates: templates,
                    model: this.__parentedParent.initialState.model,
                    res_id: this.__parentedParent.initialState.res_id,
                    form: this.__parentedParent,
                    size: 'extra-large',
                    dialogClass: 'o_act_window',
                    title: _t("OCR process"),
                    fullscreen: true,
                }).open();

            });
        },

        _renderView: function () {
            let res = this._super.apply(this, arguments);
            res.then(() => {
                // if (this.mode === 'readonly')
                this._renderShareButton();
            });
            return res;
        },

    });
});