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
zira.define('attachments_manager_control_buttons', function (require) {
    "use strict";
    var core = require('web.core');
    var _t = core._t;
    var QWeb = core.qweb;
    var AttachmentBox = require('mail.AttachmentBox');
    var Dialog = require('web.Dialog');
    var session = require('web.session');


    AttachmentBox.include({
        events: _.extend({}, AttachmentBox.prototype.events, {
            // control buttons
            //"click .oe_button_control_new": "_onOpenContextControl",
            "click .oe_button_download_all": "_onDownloadAll",
            "click .oe_button_favorites": "_openFavorites",
            "click .oe_button_download_filter": "_openAttachmentManager",
            "click .oe_button_webcam_rear": "_openCamera",
        }),

        start: function () {
            var self = this;
            this._super.apply(this, arguments);
            //webcam binding button
            self.webcam_start();
        },

        _openAttachmentManager: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            var self = this;
            console.log(this);
            self.do_action({
                name: _t('Attachment Management'),
                type: 'ir.actions.act_window',
                res_model: 'ir.attachment',
                domain: [
                    '&',
                    ['res_model', '=', self.currentResModel],
                    ['res_id', '=', self.currentResID]
                ],
                view_mode: 'tree,form',
                view_type: 'form',
                views: [
                    [false, 'list'],
                    [false, 'form']
                ],
                //target: 'new',
                context: {
                    'default_res_model': self.currentResModel,
                    'default_res_id': self.currentResID,
                    //'search_default_am': 1,
                    'attachments_manager': 1
                }
            });
        },

        _onDownloadAll: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            var url = '/web/binary/download_document?res_id=' + this.getParent().context.default_res_id + '&res_model=' + this.getParent().context.default_model;
            this.download_zip(url);
        },

        download_zip: function(url){
            window.location.href = url;
        },

        _openFavorites: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();

            return this._rpc({
                model: 'ir.attachment',
                method: 'search_read',
                domain: [['favorite_users_ids','in',session.uid],['is_favorite','=',true]],
                fields: ['id', 'name', 'mimetype', 'create_uid', 'create_date', 'file_size', 'public', 'type', 'url', 'is_favorite'],
            }).then( attachments => {
                var AttachmentsList = this._createListView(evt, attachments, 'favorites');
                var popup_preview = new Dialog(this, {
                    size: 'large',
                    dialogClass: 'o_act_window',
                    title: _t("Attachments favorites"),
                    $content: AttachmentsList,
                    buttons: [
                        {
                            text: _t("Close"), close: true
                        }
                    ]
                }).open();
                popup_preview.opened( res => {
                    this._activeListView();
                });
                popup_preview.on('closed', this, () => {
                    this.trigger_up('reload_attachment_box');
                });
            });
        },

        _onDeleteFavoritesAM: function (evt) {
            //var res_ids = this.getSelectedIds();
            var res_ids = [$(evt.target).data('id')];

            return this._rpc({
                model: 'ir.attachment',
                method: 'delete_favorites',
                args: [
                    res_ids
                ],
            }).then( res => {
                console.log('attachment success delete from favorites');
                // TODO by trigger
                $('.close').click();
            });
        },

        _onAddCurrentRecordAM: function (evt) {
            var self = this;
            //var res_ids = this.getSelectedIds();
            var res_ids = [$(evt.target).data('id')];

            return this._rpc({
                model: 'ir.attachment',
                method: 'add_current',
                args: [
                    res_ids,
                    self.getParent().context.default_model,
                    self.getParent().context.default_res_id
                ],
            }).then( res => {
                console.log('attachment success add to current record');
                if (res == 0)
                    alert("Some attachmens already import");
                else
                    // TODO by trigger
                    $('.close').click();
            });

        },



        _openCamera: function(){
            var self = this;
            var WebCamDialog = $(QWeb.render("WebCamDialog"));
            var img_data;
            new Dialog(self, {
                size: 'large',
                dialogClass: 'o_act_window',
                title: _t("WebCam Booth"),
                $content: WebCamDialog,
                buttons: [
                    {
                        text: _t("Take Snapshot"), classes: 'btn-primary take_snap_btn',
                        click: function () {
                            Webcam.snap( function(data) {
                                img_data = data;
                                // Display Snap besides Live WebCam Preview
                                WebCamDialog.find("#webcam_result").html('<img src="'+img_data+'"/>');
                            });
                            // Remove "disabled" attr from "Save & Close" button
                            $('.save_close_btn').removeAttr('disabled');
                        }
                    },
                    {
                        text: _t("Save & Close"), 
                        classes: 'btn-primary save_close_btn', 
                        close: true,
                        click: function () {
                            if (!img_data)
                                return;
                            var img_data_base64 = img_data.split(',')[1];

                            /*
                                Size in base64 is approx 33% overhead the original data size.

                                Source: -> http://stackoverflow.com/questions/11402329/base64-encoded-image-size
                                        -> http://stackoverflow.com/questions/6793575/estimating-the-size-of-binary-data-encoded-as-a-b64-string-in-python

                                        -> https://en.wikipedia.org/wiki/Base64
                                        [ The ratio of output bytes to input bytes is 4:3 (33% overhead).
                                        Specifically, given an input of n bytes, the output will be "4[n/3]" bytes long in base64,
                                        including padding characters. ]
                            */

                            // From the above info, we doing the opposite stuff to find the approx size of Image in bytes.
                            //var approx_img_size = 3 * (img_data_base64.length / 4)  // like... "3[n/4]"

                            // Upload image in Binary Field
                            self.getParent().onwebcam(img_data_base64, "image/jpeg");
                            //self.on_file_uploaded(approx_img_size, "web-cam-preview.jpeg", "image/jpeg", img_data_base64);
                            Webcam.reset();
                        }
                    },
                    {
                        text: _t("Close"),
                        close: true,
                        click: function () {
                            Webcam.reset();
                        }
                    }
                ]
            }).open();
            Webcam.attach(WebCamDialog.find('#live_webcam')[0]);

            // At time of Init "Save & Close" button is disabled
            $('.save_close_btn').attr('disabled', 'disabled');

            // Placeholder Image in the div "webcam_result"
            WebCamDialog.find("#webcam_result").html('<img src="/attachments_manager/static/src/libs/webcam_placeholder.png"/>');
        },

        webcam_start: function(){
            Webcam.set({
                width: 320,
                height: 240,
                dest_width: 320,
                dest_height: 240,
                image_format: 'jpeg',
                jpeg_quality: 90,
                force_flash: false,
                fps: 45,
                swfURL: '/attachments_manager/static/src/libs/webcam.swf',
                //force_flash: true,
                constraints: {
                    video: true,
                    facingMode: "environment"
                }
            });
        }

    });

});
