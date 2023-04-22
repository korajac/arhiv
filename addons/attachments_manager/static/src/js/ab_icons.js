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
zira.define('attachments_manager_icons', function (require) {
    "use strict";
    var core = require('web.core');
    var _t = core._t;
    var AttachmentBox = require('mail.AttachmentBox');


    AttachmentBox.include({
        events: _.extend({}, AttachmentBox.prototype.events, {
            // svg big menu
            "click .folder_picker": "_onUploadAttachments",
            "click .link_picker": "_onAddURL",
            "click .camera_picker": "_onCamera",
            "click .screencast_picker": "_onScreenCast",
        }),

        _onAddURL: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            var self = this;
            console.log(this)
            self.getParent().do_action({
                name: _t('Attachment Management'),
                type: 'ir.actions.act_window',
                res_model: 'ir.attachment.add_url',
                view_mode: 'form,tree',
                view_type: 'form',
                target: 'new',
                views: [[false, 'form']],
                context: {
                    'default_res_model': self.getParent().context.default_model,
                    'default_res_id': self.getParent().context.default_res_id
                }
            }, {
            on_close: function () {
                self.trigger_up('reload_attachment_box');
            },
            });
        },

        _onCamera: function (evt) {
            this.$('button[aria-controls="uppy-DashboardContent-panel--Webcam"]').click();
        },

        _onScreenCast: function (evt) {
            this.$('button[aria-controls="uppy-DashboardContent-panel--ScreenCapture"]').click();
        },
    });
});
