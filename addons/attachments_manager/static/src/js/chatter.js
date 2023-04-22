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
zira.define('attachments_manager_chatter', function (require) {
    "use strict";
    var core = require('web.core');
    var _t = core._t;
    var QWeb = core.qweb;
    var Chatter = require('mail.Chatter');
    var ActionManager = require('web.ActionManager');
    var AttachmentBox = require('mail.AttachmentBox');
    //var ListView = require('web.ListView');
    //var rpc = require('web.rpc');
    var utils = require('web.utils');
    var Dialog = require('web.Dialog');
    var session = require('web.session');
    var ListController = require('web.ListController');
    //var config = require('web.config');
 
    
    Chatter.include({
        start: function () {            
            var self = this;
            session.user_has_group('attachments_manager.group_restrict_manage_attachments').then(
            function(restrict_manage_attachments){
                if (restrict_manage_attachments) {
                    self.$el.find(".o_chatter_button_attachment_manager").hide();
                    self.$el.find(".o_chatter_button_attachment_url").hide();
                    self.$el.find(".o_form_binary_file_web_cam").hide();
                }
            });
            //self.webcam_start();
            // change sequence buttons followers block to end
            self.$('.o_followers').css('order',2);
            //self.drag_and_drop();
            var res = this._super.apply(this, arguments);
            //setTimeout(self.drag_and_drop(),1000)

            return res;
        },

        /* DRAG AND DROP
        /***********************************************
        */
        drag_and_drop: function(){
            var self = this;
            var main = self.$('#some-id');
            console.log(main);

            var counter_drag_enter = 0;
            $("html")
            .on("dragstart", function(e) {
                //e.preventDefault();
                e.preventDefault ? e.preventDefault() : (e.returnValue = false) 
                console.log('start');
                console.log(e);
                counter_drag_enter++;
                main.css('display','block');
                e.originalEvent.dataTransfer.effectAllowed = "move";
                e.originalEvent.dataTransfer.dropEffect = 'move';
            })
            .on("dragenter", function(e) {
                //e.preventDefault();
                e.preventDefault ? e.preventDefault() : (e.returnValue = false) 
                console.log('enter');
                console.log(e);
                counter_drag_enter++;
                main.css('display','block');
                                e.originalEvent.dataTransfer.effectAllowed = "move";
                e.originalEvent.dataTransfer.dropEffect = 'move';
            })
             .on("dragleave", function(e) {
                //e.preventDefault();
                e.preventDefault ? e.preventDefault() : (e.returnValue = false) 
                console.log('leave');
                counter_drag_enter--;
                if (0 === counter_drag_enter) {
                    main.css('display','none');
                }
            });

            main
            .on('dragover', function(e) {
                // Действия при попадании курсора в зону действия
                //e.preventDefault();
                //e.stopPropagation();
                e.preventDefault ? e.preventDefault() : (e.returnValue = false)
                main.css('display','block');
                console.log('over');
                e.originalEvent.dataTransfer.dropEffect = 'move';
            })
            .on('drop', function(e) {
                // Действия при отпускании кнопки мыши/клавиатуры
                //e.preventDefault();
                //e.stopPropagation();
                e.preventDefault ? e.preventDefault() : (e.returnValue = false) 
                counter_drag_enter = 0;
                main.css('display','none');
                e.originalEvent.dataTransfer.dropEffect = 'move';
                self.ondrop(event.dataTransfer.files);
            })
        },

        _openAttachmentBox: function () {
            var def = $.Deferred();
            if (this.fields.attachments) {
                this._closeAttachments();
            }
            this.fields.attachments = new AttachmentBox(this, this.record, this.attachments);
            var $anchor = this.$('.o_chatter_topbar');
            if (this._composer) {
                var $anchor = this.$('.o_thread_composer');
            } else {
                var $anchor = this.$('.o_chatter_topbar');
            }
            this.fields.attachments.insertAfter($anchor).then(function () {
                def.resolve();
            })
            this.$el.addClass('o_chatter_composer_active');
            this.$('.o_chatter_button_attachment').addClass('o_active_attach');

            this._isAttachmentBoxOpen = true;
            return def;
        },

        _fetchAttachments: function () {
            var self = this;
            var domain = [
                ['res_id', '=', this.record.res_id],
                ['res_model', '=', this.record.model],
            ];
            return this._rpc({
                model: 'ir.attachment',
                method: 'search_read',
                domain: domain,
                fields: ['id', 'name', 'mimetype', 'create_uid', 'create_date', 'file_size', 'public', 'type', 'url', 'is_favorite', 'website_visible'],
            }).then(function (result) {
                self._areAttachmentsLoaded = true;
                self.attachments = result;
                _.each(self.attachments, function (attachment) {
                    attachment.file_size = utils.human_size(attachment.file_size);
                    attachment.public = attachment.public;
                    attachment.create_uid = attachment.create_uid;
                    attachment.type = attachment.type;
                    attachment.weburl = attachment.url;
                    attachment.isfavorite = attachment.is_favorite;
                    attachment.website_visible = attachment.website_visible;
                });

            });

        },

        check_attachment_box: function () {
            console.log("check_attachment_box");
             var def = $.Deferred();

             if (!this._isAttachmentBoxOpen)
                this._openAttachmentBox().then(function () {
                    def.resolve();
                });
             else
                def.resolve();

             return def;
        },

        ondrop: function (files){
             console.log("ONDROP");
             var self = this;
             self.check_attachment_box().then(function () {
                 var form_upload = document.querySelector('form.o_form_binary_form');
                 if (form_upload.length == 0) {
                     return;
                 }

                 var form_data = new FormData(form_upload);
                 for (var iterator = 0, file; file = files[iterator]; iterator++) {
                     form_data.set('ufile', file);
                     console.log(file);
                     $.ajax({
                         url: form_upload.getAttribute('action'),
                         method: form_upload.getAttribute('method'),
                         type: form_upload.getAttribute('method'),
                         processData: false,
                         contentType: false,
                         data: form_data,
                         success: function (data) {
                             //$('body').append(data);
                             console.log("!!!!!!")
                             self._onReloadAttachmentBox();
                         },
    /*                     error: function (jqXHR, textStatus, errorThrown) {
                             console.error(jqXHR, textStatus, errorThrown);
                         }*/
                     });
                 }
            });
         },

        onwebcam: function (base64, mimetype){
             var self = this;
             self.check_attachment_box().then(function () {
                function urltoFile(url, filename, mimeType){
                    return (fetch(url)
                        .then(function(res){return res.arrayBuffer();})
                        .then(function(buf){return new File([buf], filename,{type:mimeType});})
                    );
                }

                urltoFile('data:'+mimetype+';base64,'+base64, 'snapshot.jpg', mimetype)
                .then(function(file){

                    var form_upload = document.querySelector('form.o_form_binary_form');
                    if (null === form_upload) {
                        return;
                    }
                     
                    var form_data = new FormData(form_upload);
                    form_data.set('ufile', file);

                    $.ajax({
                        url: form_upload.getAttribute('action'),
                        method: form_upload.getAttribute('method'),
                        type: form_upload.getAttribute('method'),
                        processData: false,
                        contentType: false,
                        data: form_data,
                        success: function (data) {
                             self._onReloadAttachmentBox();
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            console.error(jqXHR, textStatus, errorThrown);
                        }
                    });

                });
 
            });
         }

    });
    ActionManager.include({
        _handleAction: function (action, options) {
            if (action.type === 'ir.actions.act_close_wizard_and_reload_attachments') {
                return this.ir_actions_act_close_wizard_and_reload_attachments();
            }
            return this._super(action, options);
        },

        ir_actions_act_close_wizard_and_reload_attachments: function (action, options) {
           this._closeDialog();
           this.getCurrentController().widget.renderer.chatter._onReloadAttachmentBox();
        },
    });
});
