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
zira.define('attachments_manager_contextmenu', function (require) {
    "use strict";
    var AttachmentBox = require('mail.AttachmentBox');

    AttachmentBox.include({
        start: function () {
            var self = this;
            this._super.apply(this, arguments);

            $.contextMenu( 'destroy' );
            // make button open the menu
            self.$('.oe_button_control_new').on('click', function(e) {
                e.preventDefault();
                $('.oe_button_control_new').contextMenu();
            });

            $.contextMenu({
                selector: '.oe_button_control_new',
                className: 'data-title',
                build: function($trigger, e) {
                    console.log(e)
                    self._activeAttachment($(e.currentTarget).data('id'));
                    // this callback is executed every time the menu is to be shown
                    // its results are destroyed every time the menu is hidden
                    // e is the original contextmenu event, containing e.pageX and e.pageY (amongst other data)
                    return {
                        callback: function(key, options) {
                            e.target = e.currentTarget;
                            var zira_callback = self[key].bind(self);
                            console.log(self);
                            console.log($trigger);
                            zira_callback(e);
                        },
                        items: {
                            "_onUploadAttachments": {name: "My device", icon: "fa-folder-open-o", disabled: function(){ return false; }},
                            "_onAddURL": {name: "Add URL", icon: "fa-link", disabled: function(){
                                return false;
                            }},
                            "_onCamera": {name: "Camera front", icon: "fa-mobile-phone", disabled: function(){ return false; }},
                            "_openCamera": {name: "Camera rear", icon: "fa-camera", disabled: function(){ return false; }},
                            "_onScreenCast": {name: "From Screencast", icon: "fa-desktop", disabled: function(){
                                return false;
                            }},
                            "sep4": "---------",
                            "_onGoogleDrivePicker": {name: "From Google Drive", icon: "fa-google-plus", disabled: function(){ 
                                if ('_onGoogleDrivePicker' in self)
                                    return false;
                                return true;
                            }},
                            "_onMicrosoftOnedrivePicker": {name: "From Microsoft Onedrive", icon: "fa-cloud", disabled: function(){
                                if ('_onMicrosoftOnedrivePicker' in self)
                                    return false;
                                return true;
                            }},
                            "_onDropboxPicker": {name: "From Dropbox", icon: "fa-dropbox", disabled: function(){
                                if ('_onDropboxPicker' in self)
                                    return false;
                                return true;
                            }},
                            "sep5": "---------",
                            "hide_context": {name: "Close", icon: "fa-remove"}
                        },
                    };
                }
            });

            $.contextMenu({
                selector: '.o_attachment_wrap',
                className: 'data-title',
                build: function($trigger, e) {
                    console.log(e);
                    console.log($(e.currentTarget).data('id'));
                    self._activeAttachment($(e.currentTarget).data('id'));
                    // this callback is executed every time the menu is to be shown
                    // its results are destroyed every time the menu is hidden
                    // e is the original contextmenu event, containing e.pageX and e.pageY (amongst other data)
                    return {
                        callback: function(key, options) {
                            e.target = e.currentTarget;
                            var zira_callback = self[key].bind(self);
                            zira_callback(e);
                            //this._disableAttachment();
                        },
                        items: {
                            "_onEditAttachment": {name: "Edit record", icon: "fa-edit", disabled: function(){ return false; }},
                            "_onMagicEditAttachment": {name: "Image editor", icon: "fa-magic", disabled: function(){
                                var activeAttachmentID = this.data('id');
                                var attachment = self._getAttachmentsByID(activeAttachmentID);
                                return !(attachment.mimetype && attachment.mimetype.split('/')[0] === 'image');
                            }},
                            "_onDownloadAttachment": {name: "Download", icon: "fa-download", disabled: function(){ return false; }},
                            "_onOpenNewTab": {name: "Open new tab", icon: "fa-external-link", disabled: function(){ return false; }},
                            "_onCopyLink": {name: "Copy as link", icon: "fa-link", disabled: function(){
                                return false;
                            }},
                            "_onDeleteAttachment": {name: "Delete", icon: "fa-times", disabled: function(){
                                return false;
                            }},
                            "sep": "---------",
                            "fold1": {
                                "name": "More actions", 
                                "items": {
                                    "_onRenameAttachment": {name: "Rename", icon: "fa-i-cursor", disabled: function(){ return true; }},
                                    "_onSendEmail": {name: "Send email", icon: "fa-envelope-o", disabled: function(){ return true; }},
                                    "_onAddTag": {name: "Add tag", icon: "fa-tag", disabled: function(){ return false; }},
                                    "_onQRcode": {name: "QRcode", icon: "fa-qrcode", disabled: function(){
                                        return false;
                                    }},
                                },
                                //"icon": "fa-navicon"
                            },
                            "sep1": "---------",
                            "fold2": {
                                "name": "Preview new tab with..", 
                                "items": {
                                    "_onAttachmentView": {name: "Preview offlain", icon: "fa-eye", disabled: function(){ return false; }},
                                    "_onPreviewMSAttachment": {name: "Preview MS", icon: "fa-windows", disabled: function(key, options){
                                        if (this.data('type') == 'url')
                                            return false;
                                        // if (!this.data('public'))
                                        //     return true;
                                        var activeAttachmentID = this.data('id');
                                        var attachment = self._getAttachmentsByID(activeAttachmentID);
                                        return (attachment.mimetype && attachment.mimetype.split('/')[0] === 'image');
                                    }},
                                    "_onPreviewGoogleAttachment": {name: "Preview Google", icon: "fa-google", disabled: function(){
                                        if (this.data('type') == 'url')
                                            return false;
                                        // if (!this.data('public'))
                                        //     return true;
                                        var activeAttachmentID = this.data('id');
                                        var attachment = self._getAttachmentsByID(activeAttachmentID);
                                        return (attachment.mimetype && attachment.mimetype.split('/')[0] === 'image');
                                    }},
                                },
                                //"icon": "fa-eye"
                            },
                            "fold3": {
                                "name": "Edit embeded with..", 
                                "items": {
                                    "_onPreviewEmbededMSAttachment": {name: "Microsoft Office", icon: "fa-windows", disabled: function(key, options){
                                        if (this.data('type') == 'url')
                                            return false;
                                        // if (!this.data('public'))
                                        //     return true;
                                        var activeAttachmentID = this.data('id');
                                        var attachment = self._getAttachmentsByID(activeAttachmentID);
                                        return (attachment.mimetype && attachment.mimetype.split('/')[0] === 'image');
                                    }},
                                    "_onPreviewEmbededGoogleAttachment": {name: "Google Docs editor", icon: "fa-google", disabled: function(){
                                        if (this.data('type') == 'url')
                                            return false;
                                        // if (!this.data('public'))
                                        //     return true;
                                        var activeAttachmentID = this.data('id');
                                        var attachment = self._getAttachmentsByID(activeAttachmentID);
                                        return (attachment.mimetype && attachment.mimetype.split('/')[0] === 'image');
                                    }},
                                },
                                //"icon": "fa-eye"
                            },
                            "sep2": "---------",
                            "_onUnShareAttachment": {name: "Un Share", icon: "fa-share-alt-square", disabled: function(){
                                return !this.data('public') || this.data('type') == 'url';
                            }},
                            "_onShareAttachment": {name: "Share", icon: "fa-share-alt", disabled: function(){
                                return (this.data('public') || this.data('type') == 'url');
                            }},
                            "_onLike": {name: "Like", icon: "fa-heart", disabled: function(){
                                return this.data('isfavorite');
                            }},
                            "_onUnlike": {name: "Unlike", icon: "fa-heart-o", disabled: function(){
                                return !this.data('isfavorite');
                            }},
                            "sep3": "---------",
                            "_onWebsiteVisible": {name: "Website visible", icon: "fa-globe", disabled: function(){
                                if (self.currentResModel != 'product.product' && self.currentResModel != 'product.template')
                                    return true;
                                return this.data('website_visible');
                            }},
                            "_onWebsiteUnVisible": {name: "Website unvisible", icon: "fa-lock", disabled: function(){
                                if (self.currentResModel != 'product.product' && self.currentResModel != 'product.template')
                                    return true;
                                return !this.data('website_visible');
                            }},
                            "sep4": "---------",
                            "_openInfo": {name: "Info", icon: "fa-info-circle", disabled: function(){ return false; }},
                            "sep5": "---------",
                            "hide_context": {name: "Close", icon: "fa-remove"}
                        },
                    };
                }
            });

        },

        _onAddTag(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            var self = this;
            this._rpc({
                model: 'ir.model.data',
                method: 'xmlid_to_res_model_res_id',
                args: ["attachments_center.view_attachment_center_form"],
            })
            .then( (data) => {
                console.log(data)
                this.do_action({
                    name: 'Attachment Tags',
                    type: 'ir.actions.act_window',
                    res_model: 'ir.attachment',
                    target: 'new',
                    res_id: $(evt.target).data('id'),
                    views: [[data[1], 'form']],
                }, {
                    on_close: function () {
                        self.trigger_up('reload_attachment_box');
                    },
                });
            });

        },

        hide_context: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
        },

        _onOpenContextControl: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            this.$('.oe_button_control_new').contextMenu();
        },
    });
});
