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
zira.define('attachments_manager_slider', function (require) {
    "use strict";
    var core = require('web.core');
    var _t = core._t;
    var QWeb = core.qweb;
    var AttachmentBox = require('mail.AttachmentBox');
    var utils = require('web.utils');
    var Dialog = require('web.Dialog');
    var session = require('web.session');
    var config = require('web.config');



    AttachmentBox.include({
        events: _.extend({}, AttachmentBox.prototype.events, {
            // slider events
            'click .o_attachment_edit_cross': '_onEditAttachment',
            'click .o_attachment_magic_edit_cross': '_onMagicEditAttachment',
            'click .o_attachment_download': '_onDownloadAttachment',
            'click .o_attachment_preview_ms_cross': '_onPreviewMSAttachment',
            'click .o_attachment_preview_google_cross': '_onPreviewGoogleAttachment',
            'click .o_attachment_share_cross': '_onShareAttachment',
            'click .o_attachment_website_cross': '_onWebsiteVisible',
            'click .o_attachment_close_cross': '_onCloseSidebar',
            "dblclick .o_attachment_wrap": "_onAttachmentView",
            "click .o_attachment_wrap": "_onSidebar",

            
        }),


        init: function (parent, record, attachments) {
            console.log("INIT");
            console.log(parent);
            console.log(record);
            console.log(attachments);
            this.mobile = config.device.isMobile;
            // for 1 click and double click different
            this.timer = 0;
            this.delay = 200;
            this.prevent = false;
            // add unique to url, that browse dont cache images
            this.magicPreviewId = _.uniqueId('magic_preview');
            this._super.apply(this, arguments);
        },

        start: function () {
            var self = this;
            this._super.apply(this, arguments);

            $(document).mouseup(function (e){ // action click on web-document
                var div = $(".demos-menu"); // тут указываем ID элемента
                // если клик был не по нашему блоку
                if (!div.is(e.target) && div.has(e.target).length === 0) { // и не по его дочерним элементам
                    self._onCloseSidebar(e); // скрываем его
                }
            });
        },

        _onFindEvent: function (evt) {
            console.log('FIND EVENT');
            evt.stopPropagation();
            evt.preventDefault();
            if (evt.target.children.length)
                evt.target.children[0].click();
        },

        _onReloadSidebar: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            this._onCloseSidebar(evt);
            this._onSidebar(evt);
        },

        _onCloseSidebar: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            $('.demos-menu').remove();
            this._disableAttachment();
        },

        _onAddURL: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            var self = this;

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

        _onCopyLink: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            if (navigator.clipboard) {
              // поддержка имеется, включить соответствующую функцию проекта.
              navigator.clipboard.writeText(window.location.origin + $(evt.target).data('url') + encodeURIComponent($(evt.target).data('name')));
            } else {
              // поддержки нет. Придётся пользоваться execCommand или не включать эту функцию.
              console.log("Browser dont support copy navigator");
            }
        },

        _onQRcode: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            var self = this;
            var media = {
                    'url': window.location.origin + $(evt.target).data('url') + encodeURIComponent($(evt.target).data('name')),
                    'filename': $(evt.target).data('name')
            }
            var AttachmentPreview = $(QWeb.render("QRcodePreview", {widget:media}));
            var popup_preview = new Dialog(self, {
                size: 'large',
                dialogClass: 'o_act_window',
                title: _t("Attachments manager QRcode preview"),
                $content: AttachmentPreview,
                buttons: [
                    {
                        text: _t("Close"), close: true
                    }
                ]
            }).open();
            popup_preview.opened( res => {
                new QRCode($("#qrcode")[0], media.url);
            });
        },

        _onDeleteAttachmentMulti: function (activeIDS, ev) {
            ev.stopPropagation();
            var self = this;
            var options = {
                confirm_callback: function () {
                    self._rpc({
                        model: 'ir.attachment',
                        method: 'unlink',
                        args: [activeIDS],
                    })
                    .then(function () {
                        self.trigger_up('reload_attachment_box');
                    });
                }
            };
            var promptText = _.str.sprintf(_t("Do you really want to delete %s files?"), _.escape(activeIDS.length));
            Dialog.confirm(this, promptText, options);
        },

        _onDownloadAttachmentMulti: function (activeIDS, ev) {
            ev.stopPropagation();
            ev.preventDefault();
            var url = '/web/binary/download_document_ids?ids=[' + activeIDS.toString() +']';
            this.download_zip(url);
        },

        _siderDraw: function(attachment) {
            var self = this;
            var slider = $(QWeb.render("mail.Slidebar",{
                widget: self,
                attachment: attachment
            }));
            slider.appendTo($('body'));
            $('.demos-menu .o_attachment_edit_cross').on('click', self._onEditAttachment.bind(self));
            $('.demos-menu .o_attachment_magic_edit_cross').on('click', self._onMagicEditAttachment.bind(self));
            $('.demos-menu .o_attachment_download').on('click', self._onDownloadAttachment.bind(self));
            $('.demos-menu .o_attachment_preview_ms_cross').on('click', self._onPreviewMSAttachment.bind(self));
            $('.demos-menu .o_attachment_preview_google_cross').on('click', self._onPreviewGoogleAttachment.bind(self));
            $('.demos-menu .o_attachment_share_cross').on('click', self._onShareAttachment.bind(self));
            $('.demos-menu .o_attachment_website_cross').on('click', self._onWebsiteVisible.bind(self));
            $('.demos-menu .o_attachment_close_cross').on('click', self._onCloseSidebar.bind(self));
            $('.demos-menu .o_attachment_delete_cross').on('click', self._onDeleteAttachment.bind(self));
            $('.demos-menu .o_attachment_copy_cross').on('click', self._onCopyLink.bind(self));
            $('.demos-menu .o_attachment_open_new_tab_cross').on('click', self._onOpenNewTab.bind(self));
            
            $('.demos-menu .o_attachment_qrcode_cross').on('click', self._onQRcode.bind(self));
            $('.demos-menu .o_attachment_iframe_cross').on('click', self._onIframeWebURL.bind(self));
            $('.demos-menu .o_attachment_like_cross').on('click', self._onLike.bind(self));
            $('.demos-menu .o_attachment_unlike_cross').on('click', self._onUnlike.bind(self));
            $('.demos-menu .o_attachment_info_cross').on('click', self._openInfo.bind(self));
            $('.demos-menu .o_attachment_view').on('click', self._onAttachmentView.bind(self));

            $('.demos-menu .demo-block').on('click', self._onFindEvent.bind(self));
            $('.demos-menu').on('mousewheel', self._onMouseWheel.bind(self));
        },

        _onSidebarSelection: function (inst) {

            var self = this;

            // TOSO if 1 file selected and ctrl + on in selection.js
/*            if (this.selection.getSelection().length == 1){
                // close sidebar old
                $('.demos-menu').remove();
                this._disableAttachment();

                var activeAttachmentID = $(this.selection.getSelection()[0]).data('id');
                self._activeAttachment(activeAttachmentID);

                _.each(this.attachmentIDs, function (attachment) {
                    if (attachment.id === activeAttachmentID){
                        console.log(self, 'SIDEBAR SELECTION ONE');
                        if (!$('.demos-menu').length)
                            self._siderDraw(attachment);
                    }
                });
            }*/

            // if multi files selected
            if (this.selection.getSelection().length > 1){
                var activeAttachmentIDS = [];
                var activeIDS = [];
                for (const elem of this.selection.getSelection()){
                    activeIDS.push($(elem).data('id'));
                    activeAttachmentIDS.push(this._getAttachmentsByID($(elem).data('id')));
                }

                if (!$('.demos-menu').length){
                    var slider = $(QWeb.render("mail.SlidebarMulti",{
                        widget: self,
                        attachments: activeAttachmentIDS
                    }));
                    slider.appendTo($('body'));

                    $('.demos-menu .o_attachment_close_cross').on('click', self._onCloseSidebar.bind(self));
                    $('.demos-menu .o_attachment_delete_cross').on('click', self._onDeleteAttachmentMulti.bind(self, activeIDS));
                    $('.demos-menu .o_attachment_download').on('click', self._onDownloadAttachmentMulti.bind(self, activeIDS));
                    $('.demos-menu .demo-block').on('click', self._onFindEvent.bind(self));
                    $('.demos-menu').on('mousewheel', self._onMouseWheel.bind(self));
                }
            }         
        },

        _onSidebar: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            var self = this;

            // wait double click delay ms
            this.timer = setTimeout( () => {
              if (!this.prevent) {
                    self._onCloseSidebar(evt);
                    var activeAttachmentID = $(evt.currentTarget).data('id');
                    self._activeAttachment(activeAttachmentID);

                    _.each(this.attachmentIDs, function (attachment) {
                        if (attachment.id === activeAttachmentID){
                            console.log(self, 'SIDEBAR');
                            if (!$('.demos-menu').length)
                                self._siderDraw(attachment);
                        }
                    });
                }
            this.prevent = false;
            }, this.delay);           
        },

        _onOpenNewTab: function (ev) {
            ev.stopPropagation();
            ev.preventDefault();
            var activeAttachmentURL = $(ev.target).data('url');
            var url = window.location.origin + activeAttachmentURL.split('?')[0];
            window.open(url, '_blank');
        },

        _onWebsiteVisible: function (ev) {
            ev.stopPropagation();
            ev.preventDefault();
            var self = this;
            var share;
            if ($(ev.currentTarget).data('website_visible'))
                share = false;
            else
                share = true;

            return this._rpc({
                model: 'ir.attachment',
                method: 'write',
                args: [[$(ev.currentTarget).data('id')], {
                    website_visible: share
                }],
            }).then(function () {
                console.log('Attachment success save');
                self.trigger_up('reload_attachment_box');
                self._onCloseSidebar(ev);
                
            });
        },

        _onUnWebsiteVisible: function (ev) {
            ev.stopPropagation();
            ev.preventDefault();
            this._onShareAttachment(ev);
        },

        _onLike: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            return this._rpc({
                model: 'ir.attachment',
                method: 'write',
                args: [[Number($(evt.target).data('id'))], {
                    favorite_users_ids: [[4, session.uid]],
                }],
            }).then( res => {
                this.trigger_up('reload_attachment_box');
                console.log('attachment success like');
                this._onCloseSidebar(evt);
            });
        },

        _onUnlike: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            return this._rpc({
                model: 'ir.attachment',
                method: 'write',
                args: [[Number($(evt.target).data('id'))], {
                    favorite_users_ids: [[3, session.uid]],
                }],
            }).then(res => {
                this.trigger_up('reload_attachment_box');
                console.log('attachment success unlike');
                this._onCloseSidebar(evt);
            });
        },

        _onUnlikeList: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            return this._rpc({
                model: 'ir.attachment',
                method: 'write',
                args: [[Number($(evt.target).data('id'))], {
                    favorite_users_ids: [[3, session.uid]],
                }],
            }).then(res => {
                console.log('attachment success unlike list');
            });
        },

        _onIframeWebURL: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            var activeAttachmentURL = $(evt.currentTarget).data('url');
            var url = 'https://docs.google.com/viewer?url='+
            window.location.origin + activeAttachmentURL;
            $('<iframe src="'+url+'" width="50%" height="200%" style="right: 0px;position: absolute;"></iframe>').appendTo($('body'));
        },

        _onPrint: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
 /*           $('#printing').load($(evt.target).data('url'), function() {
                window.print(); //prints when text is loaded
            });*/
        },

        _onMouseWheel: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            var e = evt.originalEvent;
            var delta = Math.max(-1, Math.min(1, (e.deltaY || e.detail || e.wheelDelta)));
            $('.demos-menu').scrollLeft($('.demos-menu').scrollLeft() + delta*10);
        },

        _onDownloadAttachment: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            window.location.href = $(evt.target).data('url');
        },

        _onMagicEditAttachment: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            this.tui_image_open($(evt.target).data('url'), $(evt.target).data('id'), {});
        },

        _save_image: function (attachmentID, image) {
            return this._rpc({
                model: 'ir.attachment',
                method: 'write',
                args: [[attachmentID], {
                    datas: image,
                }],
            }).then(function () {
                console.log('image success save');
            });
        },

        tui_image_open: function(data, attachmentID, file) {
            var self = this;
            var tui_div = jQuery('<div/>', {
                id: 'tui-image-editor-container',
            });
            tui_div.appendTo($('body'));
            var zira_url = window.location.origin + data;
            // Create an instance of the tui imageEditor, loading a blank image
            var imageEditor = new tui.ImageEditor('#tui-image-editor-container', {
                includeUI: {
                    loadImage: {
                        //path: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                        path: zira_url + '&' + self.magicPreviewId,
                        name: 'Blank'
                    },
                    theme: blackTheme,
                    initMenu: 'filter',
                    menuBarPosition: 'bottom'
                },
            });
            $('#tui-image-editor-container').fadeIn('show');


            var close = $('<div class="tui-image-editor-close-btn" style="background-color: #fff;border: 1px solid #ddd;color: #222;font-family: "Noto Sans", sans-serif;font-size: 12px">Close</div>');
            var save = $('<div class="tui-image-editor-save-btn" style="background-color: #fff;border: 1px solid #ddd;color: #222;font-family: "Noto Sans", sans-serif;font-size: 12px">Save</div>');
            close.insertAfter($('.tui-image-editor-download-btn'));
            save.insertAfter($('.tui-image-editor-download-btn'));
            $('.tui-image-editor-close-btn').click(function() {
                $('#tui-image-editor-container').fadeOut();
            });
            $('.tui-image-editor-save-btn').click(function() {
                var data = imageEditor.toDataURL();
                data = data.split(',')[1];
                self._save_image(attachmentID, data).then(function () {
                    self.magicPreviewId = _.uniqueId('magic_preview');
                    self.getParent()._reloadAttachmentBox();
                    tui_div.remove();
                    //$('#tui-image-editor-container').fadeOut();
                });
            });

            // Auto resize the editor to the window size:
            window.addEventListener("resize", function() {
                imageEditor.ui.resizeEditor();
            });
        },

        _onEditAttachment: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            var self = this;
            this.do_action({
                name: _t('Attachment Editor'),
                type: 'ir.actions.act_window',
                res_model: 'ir.attachment',
                target: 'new',
                res_id: $(evt.target).data('id'),
                views: [[false, 'form']],
            }, {
                on_close: function () {
                    self.trigger_up('reload_attachment_box');
                },
            });
        },

        _generateAccessToken: async function (id) {
            let access_token = await this._rpc({
                model: 'ir.attachment',
                method: 'generate_access_token',
                args: [
                    [id]
                ],
            })
            return access_token;
        },
    
        _onPreviewMSAttachment: async function (ev) {
            ev.stopPropagation();
            ev.preventDefault();
            var activeAttachmentURL = $(ev.currentTarget).data('url');
            if ($(ev.currentTarget).data('type') != 'url' && !$(ev.currentTarget).data('public')){
                let access_token = await this._generateAccessToken($(ev.currentTarget).data('id'));
                activeAttachmentURL += '&access_token=' + access_token;
            }

            var url = 'https://view.officeapps.live.com/op/embed.aspx?src='+ encodeURIComponent(window.location.origin + activeAttachmentURL);
            if ($(ev.currentTarget).data('type') === 'url')
                url = $(ev.currentTarget).data('url');
            window.open(url, '_blank');
        },

        _onPreviewGoogleAttachment: async function (ev) {
            ev.stopPropagation();
            ev.preventDefault();
            var activeAttachmentURL = $(ev.currentTarget).data('url');
            if ($(ev.currentTarget).data('type') != 'url' && !$(ev.currentTarget).data('public')){
                let access_token = await this._generateAccessToken($(ev.currentTarget).data('id'));
                activeAttachmentURL += '&access_token=' + access_token;
            }
            var url = 'https://docs.google.com/viewer?url='+encodeURIComponent(window.location.origin + activeAttachmentURL);
            if ($(ev.currentTarget).data('type') === 'url')
                url = $(ev.currentTarget).data('url');
            window.open(url, '_blank');
        },

        _onPreviewEmbededGoogleAttachment: async function (ev) {
            var self = this;
            ev.stopPropagation();
            ev.preventDefault();
            $('#SplitScreenPreview').remove();

            var activeAttachmentURL = $(ev.currentTarget).data('url');
            if ($(ev.currentTarget).data('type') != 'url' && !$(ev.currentTarget).data('public')){
                let access_token = await this._generateAccessToken($(ev.currentTarget).data('id'));
                activeAttachmentURL += '&access_token=' + access_token;
            }
            var url = 'https://docs.google.com/gview?url='+
            encodeURIComponent(window.location.origin + activeAttachmentURL) + '&embedded=true';
            
            if ($(ev.currentTarget).data('type') !== 'binary')
                var AttachmentSplitPreview = $(QWeb.render("SplitScreenPreview", {widget:this, url: $(ev.currentTarget).data('url')}));
            else            
                var AttachmentSplitPreview = $(QWeb.render("SplitScreenPreview", {widget:this, url: url}));

            $('body').addClass('split-am');
            $('body').addClass('left-am');

            AttachmentSplitPreview.insertAfter(this.$el.parent());
            AttachmentSplitPreview.find('.close-button-split-am').on('click', self._onCloseSplitScreenPreview.bind(self));
        },

        _onPreviewEmbededMSAttachment: async function (ev) {
            var self = this;
            ev.stopPropagation();
            ev.preventDefault();
            $('#SplitScreenPreview').remove();

            var activeAttachmentURL = $(ev.currentTarget).data('url');
            if ($(ev.currentTarget).data('type') != 'url' && !$(ev.currentTarget).data('public')){
                let access_token = await this._generateAccessToken($(ev.currentTarget).data('id'));
                activeAttachmentURL += '&access_token=' + access_token;
            }
            var url = 'https://view.officeapps.live.com/op/embed.aspx?src='+
            encodeURIComponent(window.location.origin + activeAttachmentURL);


            if ($(ev.currentTarget).data('type') !== 'binary')
                var AttachmentSplitPreview = $(QWeb.render("SplitScreenPreview", {widget:this, url: $(ev.currentTarget).data('url')}));
            else            
                var AttachmentSplitPreview = $(QWeb.render("SplitScreenPreview", {widget:this, url: url}));

            $('body').addClass('split-am');
            $('body').addClass('left-am');

            AttachmentSplitPreview.insertAfter(this.$el.parent());
            AttachmentSplitPreview.find('.close-button-split-am').on('click', self._onCloseSplitScreenPreview.bind(self));
        },

        _onCloseSplitScreenPreview: function (ev) {
            ev.stopPropagation();
            ev.preventDefault();
            $('#SplitScreenPreview').remove();
            $('body').removeClass('split-am');
            $('body').removeClass('left-am');
        },

        _onShareAttachment: function (ev) {
            ev.stopPropagation();
            ev.preventDefault();
            var self = this;
            var share;
            if ($(ev.currentTarget).data('public'))
                share = false;
            else
                share = true;

            return this._rpc({
                model: 'ir.attachment',
                method: 'write',
                args: [[$(ev.currentTarget).data('id')], {
                    public: share
                }],
            }).then(function () {
                console.log('Attachment success save');
                self.trigger_up('reload_attachment_box');
                self._onCloseSidebar(ev);
                
            });
        },

        _onUnShareAttachment: function (ev) {
            ev.stopPropagation();
            ev.preventDefault();
            this._onShareAttachment(ev);
        },

        _openAudio: function (attachment) {
            var self = this;
            var media = {
                    'url': attachment.url.replace(window.location.origin, '') + encodeURIComponent(attachment.filename),
                    'filename': attachment.filename
                    //'mimetype': attachment.mimetype
            };
            var AttachmentPreview = $(QWeb.render("AttachmentAudioPreview", {widget:media}));
            var popup_preview = new Dialog(self, {
                size: 'large',
                dialogClass: 'o_act_window',
                title: _t("Attachments manager preview"),
                $content: AttachmentPreview,
                buttons: [
                    {
                        text: _t("Close"), close: true
                    }
                ]
            }).open();

            popup_preview.opened( res => {
                var visualizer = new Visualizer(
                    $('audio'),
                    $('.visualizer'),
                    $('canvas')
                );
            });
        },

        _openVideo: function (attachment) {
            var self = this;
            var media = {
                    'url': attachment.url.replace(window.location.origin, '') + encodeURIComponent(attachment.filename),
                    'filename': attachment.filename
            };
            var AttachmentPreview = $(QWeb.render("AttachmentVideoPreview", {widget:media}));
            var popup_preview = new Dialog(self, {
                size: 'large',
                dialogClass: 'o_act_window',
                title: _t("Attachments manager preview"),
                $content: AttachmentPreview,
                buttons: [
                    {
                        text: _t("Close"), close: true
                    }
                ]
            }).open();
        },

        _openInfo: function (ev) {
            ev.stopPropagation();
            ev.preventDefault();
            var activeAttachmentID = $(ev.currentTarget).data('id');
            var attachment = this._getAttachmentsByID(activeAttachmentID);

            var AttachmentInfo = $(QWeb.render("AttachmentInfo", {attachment:attachment}));
            var popup_preview = new Dialog(this, {
                size: 'large',
                dialogClass: 'o_act_window',
                title: _t("Attachments manager info"),
                $content: AttachmentInfo,
                buttons: [
                    {
                        text: _t("Close"), close: true
                    }
                ]
            }).open();
        },

        _setTextLanguage: function (text, event) {
                var $codeBlock = $('.code-view');
                $codeBlock.removeClass();
                $codeBlock.addClass('code-view');
                $codeBlock.addClass($('.code-lang').val());
                $codeBlock.text(text);

                hljs.highlightBlock($codeBlock[0]);
                //hljs.lineNumbersBlock($codeBlock[0]);
        },

       _downloadAttachmentFromZira: async function (attachment) {
            var def = $.Deferred();
            let url = attachment.url;
            let headers = {};
            fetch(url, headers).then( response =>{
                response.blob().then( blob =>{
                    def.resolve(blob);
                })
            })
            return def;
        },

        _openDocx: function (attachment) {
            var self = this;
            var def = this._downloadAttachmentFromZira(attachment);
            def.then(blob => {
                blob.arrayBuffer().then(buffer => {
/*                    var zip = new JSZip(buffer);
                    var doc = new window.docxtemplater().loadZip(zip);
                    var text = doc.getFullText();*/
                    mammoth.convertToHtml({arrayBuffer: buffer}).then(function (resultObject) {
                        //console.log(resultObject.value)
                        var media = {
                                'filename': attachment.name,
                                'html': resultObject.value
                        };
                        var AttachmentPreview = $(QWeb.render("DocxPreview", {widget:media}));
                        var popup_preview = new Dialog(self, {
                            size: 'large',
                            dialogClass: 'o_act_window',
                            title: _t("Attachments manager docx preview"),
                            $content: AttachmentPreview,
                            buttons: [
                                {
                                    text: _t("Close"), close: true
                                }
                            ]
                        }).open();
                    });

                });
            });
        },

        _openXlsx: function (attachment) {
            var self = this;
            var def = this._downloadAttachmentFromZira(attachment);
            def.then(blob => {
                blob.arrayBuffer().then(buffer => {

                    var wb = XLSX.read(new Uint8Array(buffer),{type:'array'});
                    var htmlstr = XLSX.write(wb,{type:'string',bookType:'html'});

                    var sheetName = wb.SheetNames[0];
                    var jsondata = XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{raw: true, defval:null});

                    var media = {
                            'filename': attachment.name,
                    };
                    var AttachmentPreview = $(QWeb.render("XlsxPreview", {widget:media}));
                    var popup_preview = new Dialog(self, {
                        //size: 'large',
                        fullscreen: true,
                        dialogClass: 'o_act_window',
                        title: _t("Attachments manager xlsx preview"),
                        $content: AttachmentPreview,
                        buttons: [
                            {
                                text: _t("Close"), close: true
                            }
                        ]
                    }).open();

                    popup_preview.opened( res => {
                        var grid = canvasDatagrid({
                            parentNode: this.$('#xlsx')[0],
                            data: jsondata
                        });
                        $('#xlsx').append(grid);
                        $('.modal-dialog').css('max-width', '100%');

                    });

                });

            });
        },

        _openText: function (attachment) {
            var self = this;
            var media = {
                    'url': attachment.url.replace(window.location.origin, '') + encodeURIComponent(attachment.filename),
                    'filename': attachment.filename
            };
            var AttachmentPreview = $(QWeb.render("AttachmentTextPreview", {widget:media}));
            var popup_preview = new Dialog(self, {
                size: 'large',
                dialogClass: 'o_act_window',
                title: _t("Attachments manager preview"),
                $content: AttachmentPreview,
                buttons: [
                    {
                        text: _t("Close"), close: true
                    }
                ]
            }).open();

            popup_preview.opened( res => {
                var def = $.ajax({
                  url: media.url,
                  dataType: "text",
                }).fail(function(jqXHR, textStatus) {
                    console.error(textStatus);
                }).done(function(text) {
                    self._setTextLanguage(text, 'default');
                    $('.code-lang').on('change', self._setTextLanguage.bind(self, text));
                }.bind(this));


            });
        },

        _onAttachmentView: function (ev) {
            ev.stopPropagation();
            ev.preventDefault();
            // disable one click function
            clearTimeout(this.timer);
            this.prevent = true;

            var self = this;
            if ($(ev.currentTarget).data('type') !== 'binary') {
                //window.location.href = $(ev.currentTarget).data('url');
                window.open($(ev.currentTarget).data('url'), '_blank');
                //window.open($(ev.currentTarget).data('weburl'), '_blank');
                need_super = false;
                return;
            }

            var activeAttachmentID = $(ev.currentTarget).data('id');
            var need_super = true;
            _.each(this.attachmentIDs, function (attachment) {

                if (attachment.id === activeAttachmentID){
                    console.log(attachment);
                    // TEXT 
                    if (attachment.mimetype.split('/').shift() == 'text' ||
                        ['application/javascript', 'application/json'].includes(attachment.mimetype)){
                        self._openText(attachment);
                        need_super = false;
                        return;
                    }
                    // AUDIO ONLY
                    if (attachment.mimetype.split('/').shift() == 'audio'){
                        self._openAudio(attachment);
                        need_super = false;
                        return;
                    }                    

                    // VIDEO ONLY
                    if (attachment.mimetype.split('/').shift() == 'video'){
                        self._openVideo(attachment);
                        need_super = false;
                        return;
                    }

                    // VIDEO and AUDIO
                    if (attachment.mimetype == 'application/octet-stream'){
                        // AUDIO check
                        var mimetypeMapAudio = {
                            '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg',
                            'wav': 'audio/wav', 'ogg': 'audio/ogg', 'mp3': 'audio/mpeg',
                        };
                        var extension = attachment.filename.split('.').pop();
                        var mimetypeAudio = mimetypeMapAudio[extension];

                        if (mimetypeAudio)
                            self._openAudio(attachment);
                        else
                            self._openVideo(attachment);


                        need_super = false;
                        return;
                    }

                    // OPEN DOCUMENTS
                    if (attachment.mimetype == 'application/vnd.oasis.opendocument.spreadsheet' ||
                        attachment.mimetype == 'application/vnd.oasis.opendocument.text' ||
                        attachment.mimetype == 'application/vnd.oasis.opendocument.presentation' ||
                        attachment.mimetype == 'application/vnd.oasis.opendocument.text-template' ||
                        attachment.mimetype == 'application/vnd.oasis.opendocument.presentation-template' ||
                        attachment.mimetype == 'application/vnd.oasis.opendocument.spreadsheet-template'){
                            var url = (window.location.origin || '') +
                            '/attachments_manager/static/src/libs/ViewerJS/index.html' +
                            '#' + attachment.url.replace(window.location.origin, '') + encodeURIComponent(attachment.filename);
                            window.open(url, '_blank');
                            need_super = false;
                            return;
                    }

                    // OPEN DOCX
                    if (attachment.mimetype == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml' ||
                        attachment.mimetype == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'){
                        //attachment.mimetype == 'application/msword'){
                        self._openDocx(attachment);
                        need_super = false;
                        return;
                    }

                    //OPEN XLSX
                    if (attachment.mimetype == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'){
                        self._openXlsx(attachment);
                        need_super = false;
                        return;
                    }

                    //OPEN PDF
/*                     if (attachment.mimetype == "application/pdf"){
                        var url = (window.location.origin || '') +
                        '/attachments_manager/static/src/libs/ViewerJS/index.html' +
                        '#' + attachment.url.replace(window.location.origin, '') + encodeURIComponent(attachment.filename);
                        window.open(url, '_blank');
                        need_super = false;
                        return;                       
                    }*/
                }
            });
            if (need_super)
                this._super.apply(this, arguments);
        },
    });
});
