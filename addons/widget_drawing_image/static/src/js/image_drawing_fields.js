/**
Copyright (C) 2021 Artem Shurshilov <shurshilov.a@yandex.ru>
Zira Proprietary License v1.0

This software and associated files (the "Software") may only be used (executed,
modified, executed after modifications) if you have purchased a valid license
from the authors, typically via Zira Apps, or if you have received a written
agreement from the authors of the Software (see the COPYRIGHT file).

You may develop Zira modules that use the Software as a library (typically
by depending on it, importing it and using its resources), but without copying
any source code or material from the Software. You may distribute those
modules under the license of your choice, provided that this license is
compatible with the terms of the Zira Proprietary License (For example:
LGPL, MIT, or proprietary licenses similar to this one).

It is forbidden to publish, distribute, sublicense, or sell copies of the Software
or modified copies of the Software.

The above copyright notice and this permission notice must be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.**/
zira.define('image_drawing_fields', function(require) {
    var base_f = require('web.basic_fields');
    var FieldBinaryImageNewTemplate = require('widget_image_binary_new_template');

    var utils = require('web.utils');
    var registry = require('web.field_registry');


    var FieldImageDrawingFields = FieldBinaryImageNewTemplate.include({
        events: _.extend({}, FieldBinaryImageNewTemplate.prototype.events, {
             'click #zoomin': '_zoomin',
             'click #zoomout': '_zoomout',
             'click #save_json': '_save_json',
             'click #load_json': '_load_json',
             'click #ocr_test': '_ocr_test',
             'click #add_field': '_add_field',
             'click #flip': '_flip_toogle',
        }),
        saveJSON: function() {
            console.log(this.json_field)
            this.json_field.val(JSON.stringify(this.canvas))
        },

        loadJSON: function(json) {
            this.canvas.loadFromJSON(json, () =>{
              this.canvas.renderAll();
              if (this.canvas.getObjects().length >= this.all_fields.length){
                this.$('#add_field').removeClass('btn-secondary')
                this.$('#add_field').addClass('btn-success')
              }
              this.not_rendered_fields = this._notRenderedFields();
            });

        },

        setCanvasZoom: async function() {
            let canvasWidth = this.canvas.width * this.canvasScale;
            let canvasHeight = this.canvas.height * this.canvasScale;

            await this.canvas.setWidth(canvasWidth);
            await this.canvas.setHeight(canvasHeight);
            if(this.bgImage)
                this.canvas.setBackgroundImage(this.bgImage, this.canvas.renderAll.bind(this.canvas), {
                    scaleX: canvasWidth / this.bgImage.width,
                    scaleY: canvasHeight / this.bgImage.height
                }); 
        },
        
        getImageCanvasUrl: function() {
            // 
            var url = this.placeholder;
            if (this.value) {
                if (!utils.is_bin_size(this.value)) {
                    // Use magic-word technique for detecting image type
                    url = 'data:image/' + (this.file_type_magic_word[this.value[0]] || 'png') + ';base64,' + this.value;
                } else {
                    var field = 'image';
                    var unique = this.recordData.__last_update;
                    url = this._getImageUrl(this.model, this.res_id, field, unique);
                }
            }
            return url;
        },

        imgageFlip: async function(url, degrees){
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
        
            // we’re done with the rotating so restore the unrotated context
            context.restore();
            return canvas.toDataURL();
        },
        recognize: async function(){
            var self = this;
            const worker = new Tesseract.createWorker ();
            //async function recognize() {
            await worker.load();
            await worker.loadLanguage(this.recordData.lang);
            await worker.initialize(this.recordData.lang);
            const values = [];
            for (let i = 0; i < self.rectangles.length; i++) {
                // check if vertical
                if (self.rectangles[i].name.split(',').length >1 &&self.rectangles[i].name.split(',')[1]==' vertical'){
                    // if vertical rotate image on -90 and change coords
                    // difference betwen image display and origin size
                    let scaleW = (this.bgImage.width/self.canvas.width)
                    let scaleH = (this.bgImage.height/self.canvas.height)
                    let rect = {
                        'left': this.rectangles[i].top* scaleH,
                        'top': self.canvas.width* scaleW- this.rectangles[i].width* scaleW-this.rectangles[i].left* scaleW,
                        'width': this.rectangles[i].height* scaleH,
                        'height': this.rectangles[i].width* scaleW
                    };
                    let image = await self.imgageFlip(self.getImageCanvasUrl(), -90)
                    const { data: { text } } = await worker.recognize(image,
                    { rectangle: rect });
                    values.push(self.rectangles[i].name)
                    values.push(text);

                }
                else{
                let rect = {
                    'left': this.rectangles[i].left* (this.bgImage.width/self.canvas.width),
                    'top': this.rectangles[i].top* (this.bgImage.height/self.canvas.height),
                    'width': this.rectangles[i].width* (this.bgImage.width/self.canvas.width ),
                    'height': this.rectangles[i].height* (this.bgImage.height/self.canvas.height)
                };
                // const { data: { text } } = await worker.recognize(self.getImageCanvasUrl(),
                // { rectangle: rect });
                const { data: { text } } = await worker.recognize(self.getImageCanvasUrl(),
                    {   rectangle: rect ,
                        // init_oem: Tesseract.OEM.TESSERACT_ONLY,
                        tessedit_char_whitelist: this.recordData.char_whitelist ? this.recordData.char_whitelist : ''
                    });
                values.push(self.rectangles[i].name)
                values.push(text);
            }
                
            }
            console.log(values, 'values');
            alert(values)
            await worker.terminate();
        },

        _renderedFields: function(){
            let rendered_fields = []
            let json = JSON.parse(JSON.stringify(this.canvas.getObjects()))
            for (let i=0; i<json.length;i++){
                let group = json[i];
                for (let j=0; j<group.objects.length;j++)
                    if (group.objects[j].type == 'text')
                        rendered_fields.push(group.objects[j].text)
            }
            return rendered_fields;
        },

        _notRenderedFields: function(){
            let rf = this._renderedFields();
            return _.filter(this.all_fields, function(x) { return !rf.includes(x) });
        },

        _render: function() {
            var self = this;
            console.log('START')
            console.log(this)
            this._super.apply(this, arguments);
            // if (this.attrs.options.json_field){
            //     console.log(this)
            //     console.log(this.$el.parent().parent())
            //     console.log(this.$el.parent().parent().find('[name='+this.attrs.options.json_field+']'))
            //     this.recordData[this.attrs.options.json_field].data = "123";
            //     this.json_field = this.$el.parent().find('[name='+this.attrs.options.json_field+']')
            //     this.$('#json').hide()
            // }
            // else
                this.json_field = this.$('#json')
            var url = self.getImageCanvasUrl();
            this.canvas = new fabric.Canvas(this.$('#canvas')[0]);          
            // list fields to parse (recognition)
            if (this.attrs.options.json_fields && this.recordData[this.attrs.options.json_fields])
                this.all_fields = JSON.parse(this.recordData[this.attrs.options.json_fields])
            else
                this.all_fields = [];
            this.not_rendered_fields = [...this.all_fields];

            this.canvasScale = 1;

            fabric.Image.fromURL(url, function(img) {
                self.bgImage = img;
                let width = img.width;
                let height = img.height;
                //if (img.width > 800) {
                    width=800;
                    height= (800 * img.height)/img.width;
                //}

                self.canvas.setWidth(width);
                self.canvas.setHeight(height);
                
                // self.$('.canvas-container').width(img.width);
                // self.$('.canvas-container').height(img.height);
                self.canvas.setBackgroundImage(img, self.canvas.renderAll.bind(self.canvas), {
                    scaleX: self.canvas.width / img.width,
                    scaleY: self.canvas.height / img.height
                });

                if (self.attrs.options.json_field && self.recordData[self.attrs.options.json_field])
                    self.loadJSON(JSON.parse(self.recordData[self.attrs.options.json_field]));

            });
 
            fabric.Object.prototype.transparentCorners = false;
            fabric.Object.prototype.cornerStyle = false;

        },

        _zoomin: function(){
            this.canvasScale *= 1.25;
            this.setCanvasZoom();
        },

        _zoomout: function(){
            this.canvasScale /= 1.25;
            this.setCanvasZoom();
        },

        _save_json: function(){
            this.saveJSON();
        },

        _load_json: function(){
            this.loadJSON(this.json_field.val());
        },

        _ocr_test: function(){
            let json = JSON.parse(JSON.stringify(this.canvas.getObjects()))
            this.rectangles = []

            for (let i=0; i<json.length;i++){
                // get coords rectangle
                let group = json[i];
                let rect = {}
                rect.left=group.left;
                rect.top=group.top;
                rect.width=group.width*group.scaleX;
                rect.height=group.height*group.scaleY;
                // get name text
                for (let j=0; j<group.objects.length;j++){
                    let obj = group.objects[j];
                    if (obj.type == 'text')
                        rect.name=obj.text                            
                }
                this.rectangles.push(rect)
            }
            this.recognize()
        },

        _flip_toogle: function(){
            if (this.flip){
                this.flip = false
                this.$('#flip').removeClass('btn-success')
                this.$('#flip').text('horizontal')
            }
            else{
                this.flip = true
                this.$('#flip').addClass('btn-success')
                this.$('#flip').text('vertical')
            }
        },

        _add_field: function(){
            console.log(this)
            var self = this;
            if (!this.all_fields.length){
                alert('Enter at least one field')
                return
            }

            if (self.canvas.getObjects().length >= self.all_fields.length){
                alert('All fields drawed')
                return
            }

            let field_name = self.not_rendered_fields.pop();

            if (!self.not_rendered_fields.length){
                self.$('#add_field').removeClass('btn-secondary')
                self.$('#add_field').addClass('btn-success')
            }

            if (this.flip)
                field_name += ', vertical'

            var textSample = new fabric.Text(field_name, {
                fill: 'white',
                fontSize: 12,
                originX: 'center',
                originY: 'center'
            });

            if (this.flip)
                var rectangle = new fabric.Rect({
                    width: 50,
                    height: 75,
                    fill: 'green',
                    stroke: 'black',
                    strokeWidth: 1,
                    opacity: 0.5,
                    cornerStyle: false,
                    originX: 'center',
                    originY: 'center'
                })
            else
                var rectangle = new fabric.Rect({
                    width: 75,
                    height: 50,
                    fill: 'green',
                    stroke: 'black',
                    strokeWidth: 1,
                    opacity: 0.5,
                    cornerStyle: false,
                    originX: 'center',
                    originY: 'center'
                })

            var g = new fabric.Group([rectangle, textSample],{
                left: 150,
                top: 100,
            });
            self.canvas.add(g);
        }


    });
    

});