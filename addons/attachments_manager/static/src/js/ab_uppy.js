/**
Copyright (C) 2020 Artem Shurshilov <shurshilov.a@yandex.ru>
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
zira.define('attachments_manager_uppy', function (require) {
    "use strict";
    var AttachmentBox = require('mail.AttachmentBox');
    var session = require('web.session');


    AttachmentBox.include({
        start: function () {
            var self = this;
            this._super.apply(this, arguments);
            if (session.am_uppy !== 'hide')
              this.init_uppy();
        },


        init_uppy: function (){
            // Initialize Uppy
            if (!$('.o_chatter_attachment').length)
                return;
            const uppy = Uppy.Core({
              //debug: true,
              autoProceed: true,
              restrictions: {
                //maxFileSize: 10000000,
                //maxNumberOfFiles: 3,
                //minNumberOfFiles: 2,
                //allowedFileTypes: ['image/*', 'video/*']
              }
            })
            .use(Uppy.Dashboard, {
              trigger: 'input.o_input_file',
              inline: true,
              target: '.o_chatter_attachment',
              allowMultipleUploads: true,
              //replaceTargetContent: true,
              showProgressDetails: true,
              //note: 'Images and video only, 2–3 files, up to 1 MB',
              height: 370,
              width: '100%',
              metaFields: [
                { id: 'name', name: 'Name', placeholder: 'file name' },
                { id: 'caption', name: 'Caption', placeholder: 'describe what the image is about' }
              ],
              browserBackButtonClose: true
            })
            .use(Uppy.GoogleDrive, { target: Uppy.Dashboard, companionUrl: 'https://companion.uppy.io' })
            .use(Uppy.Dropbox, { target: Uppy.Dashboard, companionUrl: 'https://companion.uppy.io' })
            .use(Uppy.Instagram, { target: Uppy.Dashboard, companionUrl: 'https://companion.uppy.io' })
            .use(Uppy.Facebook, { target: Uppy.Dashboard, companionUrl: 'https://companion.uppy.io' })
            .use(Uppy.OneDrive, { target: Uppy.Dashboard, companionUrl: 'https://companion.uppy.io' })
            .use(Uppy.Webcam, { target: Uppy.Dashboard })
            .use(Uppy.ScreenCapture, { target: Uppy.Dashboard })
            .use(Uppy.Tus, { endpoint: 'https://master.tus.io/files/' });

            // save files to zira
            uppy.on('complete', result => {
                var files = [];
                var file;
                for (var iterator = 0; iterator < result.successful.length; iterator++) {
                    file = result.successful[iterator];
                    files.push(file.data);
                }
                this.getParent().ondrop(files);
            });

            this.uppy = uppy;
        },
    });
});
