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

zira.define('ocr_dialog_confirm', function(require) {
    "use strict";

    var core = require('web.core');
    var QWeb = core.qweb;
    var _t = core._t;
    var Dialog = require('web.Dialog');
    var ocrDialog = require('ocr_dialog');


    var OcrDialogConfirm = Dialog.extend({
        template: 'OcrDialogConfirm',

         createPdf: async function() {
            var PDFDocument = PDFLib.PDFDocument;
            var rgb = PDFLib.rgb;
            const pdfDoc = await PDFDocument.load(this.options.templates[0].pdf_file)
            const timesRomanFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman)
            const pages = pdfDoc.getPages()
            const firstPage = pages[0]
            const { width, height } = firstPage.getSize()
            const fontSize = this.options.templates[0].pdf_font_size;
            let scaleX = width/this.options.sizeTemplate.width;
            let scaleY = height/this.options.sizeTemplate.height;
            function hexToRgb(hex) {
                // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
                var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
                hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                  return r + r + g + g + b + b;
                });
              
                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16)
                } : null;
              }
            for (let prop in this.options.ocr_result){
                let color = hexToRgb(this.options.templates[0].pdf_font_color)
                firstPage.drawText(this.options.ocr_result[prop]['text'], {
                    x: this.options.ocr_result[prop]['left'] * scaleX,
                    y: (height-(this.options.ocr_result[prop]['top'] * scaleY)) - fontSize/2,
                    size: fontSize,
                    font: timesRomanFont,
                    color: rgb (color.r/255,color.g/255,color.b/255),
                })
            }
            return await pdfDoc.saveAsBase64({ dataUri: true })
        },

        pdf_start: async function() {
            let pdf_base64 = await this.createPdf();
            let pdf_options = this.options.templates[0].pdf_options;

            if (pdf_options == 'pdf_store' || pdf_options == 'both')
                this._rpc({
                    model: 'ir.attachment',
                    method: 'create',
                    args: [{'name': 'OCR ' + new Date().toLocaleString()+'.pdf',
                            'type': 'binary',
                            //base64 image data
                            'datas': pdf_base64.split(',')[1],
                            'res_id': this.options.res_id,
                            'res_model': this.options.model,
                            //'mimetype': 'image/jpeg'
                        }],
                })
            if (pdf_options == 'pdf_download' || pdf_options == 'both')
                window.location.href = pdf_base64;
        },
        options_apply: async function() {
            // сохраняем исходное изображение
            if (this.options.templates[0].source_save)
                this._rpc({
                    model: 'ir.attachment',
                    method: 'create',
                    args: [{'name': 'OCR ' + new Date().toLocaleString(),
                            'type': 'binary',
                            //base64 image data
                            'datas': this.options.canvasImage.split(',')[1],
                            'res_id': this.options.res_id,
                            'res_model': this.options.model,
                        }],
                })

            // если не используем pdf или используем пдф и не пдф онли,
            // то сохраняем распознанные данные в модель
            if (!this.options.templates[0].pdf_enable ||
                (this.options.templates[0].pdf_enable && !this.options.templates[0].pdf_only)){
                    // prepare data to save
                    let record = {}
                    for (let prop in this.options.ocr_result)
                        record[prop] = this.options.ocr_result[prop]['text']
                    console.log(record, "RECORD TO SAVE")
                    await this._rpc({
                        model: this.options.model,
                        method: 'write',
                        args: [
                            [this.options.res_id], record
                        ],
                    }).then(() => {
                        this.options.form.reload();
                    });
            }

            // PDF PROCESS
            if (this.options.templates[0].pdf_enable){
                await this.pdf_start();
            }
            this.close()
        },

        init: function(parent, options) {
            this.options = options;
            this._super(parent, _.extend({
                buttons: [{
                        text: _t("Close all"),
                        classes: 'btn-warning',
                        close: true
                    },
                    {
                        text: _t("Return"),
                        classes: 'btn-primary',
                        close: true,
                        click: () => {
                            if (options.templates[0].pdf_insert_from_record)
                                new options.OcrDialogSelectTmpl(parent, options).open();
                            else
                                new ocrDialog(parent, options).open();
                        }
                    },
                    {
                        text: _t("Confirm"),
                        classes: 'btn-success',
                        click: async () => {
                            // updates fields from UI
                            for (let prop in this.options.ocr_result)
                                this.options.ocr_result[prop]['text'] = this.$('input[name="' + prop + '"]').val();

                            await this.options_apply()

                        }
                    },

                ]
            }, options || {}));
        },

        start: function() {
            return this._super.apply(this, arguments).then(() => {
                this.opened().then(() => {
                    for (let prop in this.options.ocr_result) {
                        let field = {
                            'name': prop,
                            'val': this.options.ocr_result[prop]['text']
                        };
                        this.$el.find('.ocr_result').append(QWeb.render('OcrDialogConfirmField', {
                            field
                        }))
                    }
                });
            });
        },

    });

    return OcrDialogConfirm
});