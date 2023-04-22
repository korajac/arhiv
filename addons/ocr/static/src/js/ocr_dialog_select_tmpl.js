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

zira.define('ocr_dialog_select_tmpl', function(require) {
    "use strict";

    var core = require('web.core');
    var QWeb = core.qweb;
    var _t = core._t;
    var Dialog = require('web.Dialog');
    var ocrDialog = require('ocr_dialog');
    var OcrDialogConfirm = require('ocr_dialog_confirm');


    var OcrDialogSelectTmpl = Dialog.extend({
        template: 'OcrDialogSelectTmpl',

        //TODO: delete duplicate functions
        getBackgroundImageTemplateJSON: function() {
            let json = JSON.parse(this.options.templates[0].json)
            return json.backgroundImage
        },
        getWidthHeightTemplate: function(){
            // get size template background image
            var backImgJSON = this.getBackgroundImageTemplateJSON();
            let srcWidth = backImgJSON.width;
            let srcHeight = backImgJSON.height;
            // template size (rectangles)
            let width = 800;
            let height = (800 * srcHeight) / srcWidth;
            return {'width': width, 'height': height}
        },
        getRectanglesFromJSON: function() {
            let json = JSON.parse(this.options.templates[0].json)
            this.rectangles = []
            for (let i = 0; i < json.objects.length; i++) {
                let group = json.objects[i];
                let rect = {};
                rect.left = group.left;
                rect.top = group.top;
                rect.width = group.width * group.scaleX;
                rect.height = group.height * group.scaleY;
                // get name text
                for (let j = 0; j < group.objects.length; j++) {
                    let obj = group.objects[j];
                    if (obj.type == 'text')
                        rect.name = obj.text
                }
                this.rectangles.push(rect)
            }
        },
        init: function(parent, options) {
            this.options = options;
            this._super(parent, _.extend({
                buttons: [{
                        text: _t("Close"),
                        classes: 'btn-warning',
                        close: true
                    },
                    {
                        text: _t("Next"),
                        classes: 'btn-primary',
                        close: true,
                        click: () => {
                            let selected_tmpl_id = this.$("input:radio:checked").data('id');
                            options.templates = _.filter(options.templates,
                                function(x) {
                                    return x.id == selected_tmpl_id
                                });
                            // back dialog
                            options.OcrDialogSelectTmpl = OcrDialogSelectTmpl;
                            // next dialog
                            options.OcrDialogConfirm = OcrDialogConfirm;
                            // достаем размеры шаблона
                            options.sizeTemplate = this.getWidthHeightTemplate();
                            // сразу достаем прямоугольники из шаблона
                            this.getRectanglesFromJSON()
                            options.rectangles = this.rectangles;

                            // если необходимо брать данные из модели, то пропускаем шаг распознования 
                            // и сразу открываем подтверждение с данными из модели
                            if (options.templates[0].pdf_insert_from_record){
                                // при рисовании на pdf, не сохраняем оригинал - так как оригинал пустышка (рыба)
                                options.templates[0].source_save = false;
                                // при рисовании на pdf, не сохраняем данные в модель, так как мы берем их уже из модели
                                //options.templates[0].pdf_only = true;

                                // получить данные из модели и параметры рисования из шаблона
                                let fields = {}
                                for (let i = 0; i < this.rectangles.length; i++) {
                                    this.rectangles[i]['text'] = this.options.form.initialState.data[this.rectangles[i].name];
                                    fields[this.rectangles[i].name] = this.rectangles[i];
                                }
                                options.ocr_result = fields;
                                new OcrDialogConfirm(parent, options).open();
                            }
                            else
                                new ocrDialog(parent, options).open();
                        }
                    },

                ]
            }, options || {}));
        },

        start: function() {
            return this._super.apply(this, arguments).then(() => {
                this.opened().then(() => {
                    for (let i = 0; i < this.options.templates.length; i++)
                        this.$el.find('.ocr_templates').append(QWeb.render('OcrDialogTmplRadio', {
                            tmpl: this.options.templates[i],
                            i: i
                        }))
                });
            });
        },

    });

    return OcrDialogSelectTmpl
});