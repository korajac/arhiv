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

zira.define('ocr_dialog', function(require) {
    "use strict";

    var core = require('web.core');
    var QWeb = core.qweb;
    var _t = core._t;
    var rpc = require('web.rpc');
    var config = require('web.config');
    var session = require('web.session');
    var Dialog = require('web.Dialog');
    var utils = require('web.utils');

    
    var OcrDialog = Dialog.extend({
        template: 'OcrDialog',
        events: _.extend({}, Dialog.prototype.events, {
            'change .o_input_file': 'on_file_change'
        }),

        on_file_change: function (e) {
            var file_node = e.target;
            if ((this.useFileAPI && file_node.files.length) || (!this.useFileAPI && $(file_node).val() !== '')) {
                if (this.useFileAPI) {
                    var file = file_node.files[0];
                    if (file.size > this.max_upload_size) {
                        var msg = _t("The selected file exceed the maximum file size of %s.");
                        this.do_warn(_t("File upload"), _.str.sprintf(msg, utils.human_size(this.max_upload_size)));
                        return false;
                    }
                    var filereader = new FileReader();
                    filereader.readAsDataURL(file);
                    filereader.onloadend = (upload) => {
                        var data = upload.target.result;
                        //data = data.split(',')[1];
                        this.on_file_uploaded(file.size, file.name, file.type, data);
                    };
                    // utils.getDataURLFromFile(file).then( (data) => {
                    //     this.on_file_uploaded(file.size, file.name, file.type, data);
                    // });
                }
                this.$('.o_form_binary_progress').show();
            }
        },

        on_file_uploaded: function (size, name, content_type, file_base64) {
            if (size === false) {
                this.do_warn(false, _t("There was a problem while uploading your file"));
                // TODO: use crashmanager
                console.warn("Error while uploading file : ", name);
            } else {
                this.originalWidth = false;
                this.originalHeight = false;
                this.originalImage = file_base64;
                this.drawBase64Image(file_base64);
            }
            this.$('.o_form_binary_progress').hide();
        },

        drawBase64Image: function (file_base64){
            if (Webcam.live){
                Webcam.off('live');
                Webcam.reset();
                this.$('#ocr_canvas').hide();
            }
            // draw convert and recognize Image
            var i = new Image();
            i.onload = async () => {
                  this.drawImage("#ocr_canvas_snap", i);
            };
            i.src = file_base64;
        },
    
        imageToDataUri: function(img, width, height) {

            // create an off-screen canvas
            let canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d');

            // set its dimension to target size
            canvas.width = width;
            canvas.height = height;

            // draw source image into the off-screen canvas:
            ctx.drawImage(img, 0, 0, width, height);

            // encode image to data-uri with base64 version of compressed image
            return canvas.toDataURL();
        },

        init_recognize: async function(){
            this.worker = new Tesseract.createWorker();
            await this.worker.load();
            await this.worker.loadLanguage(this.options.templates[0].lang);
            await this.worker.initialize(this.options.templates[0].lang);
        },

        imgageFlip: async function(url, degrees, rect){
            var img = new Image();
            img.src = url;
            await img.decode();
            var canvas = document.createElement('canvas');
            var context = canvas.getContext("2d");

            canvas.id='canvasJavascript'
            canvas.width = img.height;
            canvas.height = img.width;

            // save the unrotated context of the canvas so we can restore it later
            // the alternative is to untranslate & unrotate after drawing
            context.save();
            context.clearRect(0,0,canvas.width,canvas.height);
        
            // move to the center of the canvas
            context.translate(canvas.width/2,canvas.height/2);
        
            // rotate the canvas to the specified degrees
            context.rotate(degrees*Math.PI/180);
        
            // draw the image
            // since the context is rotated, the image will be rotated also

            context.drawImage(img,-img.width/2,-img.height/2);

            // Turn transparency on
            // context.globalAlpha = 0.2;
            // context.fillStyle = "green";
            // context.fillRect(rect.left,rect.top, rect.width,rect.height);
            // context.globalAlpha = 1;

            // we’re done with the rotating so restore the unrotated context
            context.restore();
            return canvas.toDataURL();
        },

        recognize: async function(image, scale = false) {
            this.$('.ocr_loader_time').show();
            await this.ready_init_recognize;
            const fields = {};

            for (let i = 0; i < this.rectangles.length; i++) {
                let rect = {
                    'left': this.rectangles[i].left * scale.width,
                    'top': this.rectangles[i].top * scale.height,
                    'width': this.rectangles[i].width * scale.width,
                    'height': this.rectangles[i].height * scale.height
                };

                // If vertical
                let is_vertical = this.rectangles[i].name.split(',').length >1 && this.rectangles[i].name.split(',')[1]==' vertical' ? true : false;
                let img = null;
                if (is_vertical){
                    // if vertical rotate image on -90 and change coords
                    rect = {
                        'left': this.rectangles[i].top* scale.height,
                        'top': this.canvasf.width- this.rectangles[i].width* scale.width-this.rectangles[i].left* scale.width,
                        'width': this.rectangles[i].height* scale.height,
                        'height': this.rectangles[i].width* scale.width
                    };
                    img = await this.imgageFlip(image, -90, rect)
                }
                // let data = await this.worker.recognize(is_vertical ? img :image, { rectangle: rect });
                let data = await this.worker.recognize(is_vertical ? img :image,
                    {   rectangle: rect ,
                        // init_oem: Tesseract.OEM.TESSERACT_ONLY,
                        tessedit_char_whitelist: this.options.templates[0].char_whitelist ? this.options.templates[0].char_whitelist : ''
                    });

                // console.log(data)
                // REGEX
                if (this.options.templates[0].regex){
                    let reg = this.options.templates[0].regex;
                    this.rectangles[i]['text'] = data.data.text.replace(eval("/"+reg+"/gm"), '').replace(/\s+/g, " ");
                }
                else
                    this.rectangles[i]['text'] = data.data.text;

                // SAVE NAME
                if (this.rectangles[i].name.split(',').length >1 && this.rectangles[i].name.split(',')[1]==' vertical')
                    fields[this.rectangles[i].name.split(',')[0]] = this.rectangles[i];
                else
                    fields[this.rectangles[i].name] = this.rectangles[i];
            }
            await this.worker.terminate();
            this.$('.ocr_loader_time').hide();
            console.log(fields);
            return fields;
        },

        getBackgroundImageTemplateJSON: function() {
            let json = JSON.parse(this.options.templates[0].json)
            return json.backgroundImage
        },

        canvasGorizonCenter: function(canvas, position) {
            canvas.style.position = position;
            canvas.style.left = '50%';
            canvas.style.marginLeft = '-' + ($(canvas).width()/2).toString() + 'px';
        },

        getWidthHeightTemplate: function(){
            return this.options.sizeTemplate
            // get size template background image
            var backImgJSON = this.getBackgroundImageTemplateJSON();
            let srcWidth = backImgJSON.width;
            let srcHeight = backImgJSON.height;
            // template size (rectangles)
            let width = 800;
            let height = (800 * srcHeight) / srcWidth;
            return {'width': width, 'height': height}
        },
    
        drawImage: async function(canvasSelector, image) {
            // 2. снапшот картинку в канвас для снапшотов (нужно изменить размеры)
            // original size с тега видео
            // 3. просто картинку в канвас снапшотов ( не нужно изменять размеры)
            // image size == original
            var canvas = this.$el.find(canvasSelector)[0];
            if (!canvas)
                return
            let canvasf = new fabric.Canvas(canvas);

            // if from webcam original will set
            let originW = this.originalWidth;
            let originH = this.originalHeight;
            // если не переданы оригинальные размеры, то
            // принимаем за оригинальные размеры изображения
            if (!originW && !originH) {
                originW = image.width;
                originH = image.height;
            }
            // если изображение слишком большое
            // уменьшаем его до размера диалогового окна
            if (originW > this.$el.width()) {
                canvasf.setWidth (this.$el.width())
                canvasf.setHeight( (this.$el.width() * originH)/originW);
            }
            else {
                canvasf.setWidth(originW);
                canvasf.setHeight(originH);
            }

            let position = 'inherit';
            this.canvasGorizonCenter(this.$('.canvas-container')[0], position);
            canvas.style.position = position

            let sizeTemplate = this.getWidthHeightTemplate();
            let width = sizeTemplate.width;
            let height = sizeTemplate.height;
            let scaleWidth = canvasf.width / width;
            let scaleHeight = canvasf.height / height;

            let image_canvas = new fabric.Image(image);
            image_canvas.set({
                left: 0,
                top: 0,
                width:image.width,
                height:image.height,
                scaleX: canvasf.width / image_canvas.width,
                scaleY: canvasf.height / image_canvas.height,
                selectable: true,
                preserveObjectStacking: true
            })
            canvasf.add(image_canvas);
            canvasf.renderAll();
            let padding = false;

            canvasf.on('mouse:move', function() { if (padding) {image_canvas.set('opacity', 0.5); canvasf.renderAll();}});
            canvasf.on('mouse:up', function(e) { padding = false; canvasf.discardActiveObject(); image_canvas.set('opacity', 1); canvasf.renderAll();});
            canvasf.on('mouse:down', function(e) { padding = true; });

            for (let i = 0; i < this.rectangles.length; i++) {
                let rect = this.rectangles[i];
                var rectangle = new fabric.Rect({
                    width: rect.width * scaleWidth,
                    height:  rect.height * scaleHeight,
                    fill: 'green',
                    opacity: 0.4,
                    left: rect.left * scaleWidth,
                    top: rect.top * scaleHeight,
                    selectable: false,
                  })
                  var textSample = new fabric.Text(rect.name, {
                    fill: 'white',
                    fontSize: 20,
                    textAlign: "center",
                    textBaseline: "middle",
                    originX: 'center',
                    originY: 'center',
                    left: rect.left * scaleWidth + (rect.width * scaleWidth / 2),
                    top:  rect.top * scaleHeight + (rect.height * scaleHeight / 2),
                    selectable: false,
                });
                canvasf.add(rectangle);
                canvasf.add(textSample);
            }
            canvasf.renderAll();
            this.canvasf = canvasf;
            this.scaleOrigin =  {
                'width': originW/ width,
                'height': originH/ height,
            }
            this.scaleCanvasf =  {
                'width': canvasf.width/ width,
                'height': canvasf.height/ height,
            }
        },
    
        drawVideo: async function(sourceSelector, canvasSelector) {
            // 1. текущую картинку с тега видео
            if (Webcam.live)
                var video = this.$el.find(sourceSelector)[0];
            else
                return

            var canvas = this.$el.find(canvasSelector)[0];
            if (!canvas)
                return
            var ctx = canvas.getContext('2d');

            //source
            // если изображение с камеры слишком большое
            // уменьшаем его до размера диалогового окна
            if (video)
            if (video.videoWidth > this.$el.width()) {
                canvas.width = this.$el.width();
                canvas.height = (this.$el.width() * video.videoHeight)/video.videoWidth;
            }
            else {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }
            else {
                // await this.sleep(50);
                // console.log(this.rectangles)
                // this.drawVideo("video", "#ocr_canvas");
                return
            }

            let position = 'inherit';
            this.canvasGorizonCenter(canvas, position);

            let sizeTemplate = this.getWidthHeightTemplate();
            let width = sizeTemplate.width;
            let height = sizeTemplate.height;
            let scaleWidth = canvas.width / width;
            let scaleHeight = canvas.height / height;

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            for (let i = 0; i < this.rectangles.length; i++) {
                let rect = this.rectangles[i];
                ctx.fillStyle = 'rgba(11, 195, 20, 0.5)';
                ctx.strokeStyle = "green";
                ctx.lineWidth = "2";
                ctx.stroke();
                ctx.fillRect(
                    rect.left * scaleWidth,
                    rect.top * scaleHeight,
                    rect.width * scaleWidth,
                    rect.height * scaleHeight
                );

                ctx.font = "20px Georgia";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "green";
                ctx.fillText(rect.name,
                    rect.left * scaleWidth + (rect.width * scaleWidth / 2),
                    rect.top * scaleHeight + (rect.height * scaleHeight / 2));
            }

            await this.sleep(50);
            console.log(this.rectangles)
            this.drawVideo("video", "#ocr_canvas");
        },

        sleep: function(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        getRectanglesFromJSON: function() {
            this.rectangles = this.options.rectangles;
            return
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

        draw_rectangles: function async () {
            // размеры камеры не влияют на изображение в html
            // они влияют только на размер snap изображения
            let options = {
                width: 3840,
                height: 2160,
                dest_width: 3840,
                dest_height: 2160,
                image_format: 'jpeg',
                jpeg_quality: 90,
                force_flash: false,
                fps: 45,
                swfURL: '/ocr/static/src/libs/webcam.swf',
            };
            //if (this.props.webcamRear)
            options.constraints = {
                video: true,
                facingMode: "environment"
            };

            Webcam.set(options);
            Webcam.attach(this.$('#live_webcam')[0]);
            this.getRectanglesFromJSON()
            Webcam.on('live', async (data) => {
                this.drawVideo("video", "#ocr_canvas");
            });
        },

        switch_mode: function() {
            $('.ocr_file').hide();
            $('.ocr_photo').hide();
            $('.ocr_next').show();
        },

        init: function(parent, options) {
            this.options = options;
            this.parent = parent;
            this.ready_init_recognize = this.init_recognize();
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
                           new options.OcrDialogSelectTmpl(parent, options).open();
                        }
                    },
                    {
                        text: _t("Select file"),
                        classes: 'btn-primary ocr_file',
                        click: () => {
                            this.switch_mode();
                            this.$el.find('.o_input_file').click();
                        }
                    },
                    {
                        text: _t("Take photo"),
                        classes: 'btn-primary ocr_photo',
                        click: function() {
                            this.switch_mode();
                            let video = this.$el.find("video")[0];
                            this.originalWidth = video.videoWidth;
                            this.originalHeight = video.videoHeight;
                            Webcam.snap((data) => {  
                                this.originalImage = data; 
                                // set original size
                                this.drawBase64Image(data)
                            });
                        }
                    },
                    {
                        text: _t("Next"),
                        classes: 'btn-success ocr_next',
                        click: async function() {
                            // remove all obj, except image
                            for (let i = 0; i < this.rectangles.length*2; i++) {
                                var object = this.canvasf.item(this.canvasf.getObjects().length-1);
                                this.canvasf.remove(object);
                            }
                            this.options.sizeTemplate = this.getWidthHeightTemplate();
                            this.options.canvasImage = this.canvasf.toDataURL({format: 'jpeg', quality: 1 })
                            let fields = await this.recognize(this.options.canvasImage, this.scaleCanvasf)
                            //let fields = await this.recognize(this.originalImage, this.scaleOrigin)
                            this.options.ocr_result = fields;
                            new this.options.OcrDialogConfirm(this.parent, this.options).open();
                            this.close();
                        }
                    }

                ]
            }, options || {}));

            // upload file
            this.useFileAPI = !!window.FileReader;
            this.max_upload_size = 64 * 1024 * 1024; // 64Mo
            this.accepted_file_extensions = '*';
            if (!this.useFileAPI) {
                this.fileupload_id = _.uniqueId('o_fileupload');
                $(window).on(this.fileupload_id, () => {
                    var args = [].slice.call(arguments).slice(1);
                    this.on_file_uploaded.apply(this, args);
                });
            }
        },

        start: function() {
            return this._super.apply(this, arguments).then(() => {
                this.opened().then(() => {
                    this.$el.append(QWeb.render('OcrDialogLoaderTime'));
                    this.draw_rectangles();
                });
            });
        },


        destroy: function() {
            if (this.fileupload_id) {
                $(window).off(this.fileupload_id);
            }
            if (Webcam.live){
                Webcam.off('live');
                Webcam.reset();
            }
            this._super.apply(this, arguments);
        },
    });

    return OcrDialog
});