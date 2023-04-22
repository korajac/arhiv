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
zira.define('attachments_manager', function (require) {
    "use strict";
    var core = require('web.core');
    var _t = core._t;
    var QWeb = core.qweb;
    var AttachmentBox = require('mail.AttachmentBox');
    var session = require('web.session');


    AttachmentBox.include({
        events: _.extend({}, AttachmentBox.prototype.events, {
            // delete old events
            "click .o_attachment_view": "_pass",
            "click .o_attachment_delete_cross": "_pass",           
        }),

        start: function () {
            var self = this;
            this._super.apply(this, arguments);
            
            if (session.am_menu_type === 'list')
                this.$('#icons_menu').hide();
            if (session.am_menu_type === 'icons')
                this.$('.oe_button_control_new').hide();
            if (session.am_favorite === 'hide')
                this.$('.oe_button_favorites').hide();
            if (session.am_download_all === 'hide')
                this.$('.oe_button_download_all').hide();
            if (session.am_download_filter === 'hide')
                this.$('.oe_button_download_filter').hide();
            if (session.am_webcam === 'hide')
                this.$('.oe_button_webcam_rear').hide();
            if (session.am_default_upload === 'hide')
                this.$('.o_upload_attachments_button').hide();


            // check restricts role
            session.user_has_group('attachments_manager.group_restrict_manage_attachments').then(
            function(restrict_manage_attachments){
                if (restrict_manage_attachments) {
                    self.$el.find(".o_attachment_delete_cross").hide();
                    self.$el.find(".o_attachment_edit_cross").hide();
                }
            });
        },

        _getAttachmentsByID: function (activeAttachmentID){
            for (const attachment of this.attachmentIDs)
               if (attachment.id === activeAttachmentID)
                    return attachment;
        },

        _pass: function (evt) {
        },

        _activeAttachment: function (activeAttachmentID) {
            var el = this.$el.find('[data-id="'+activeAttachmentID+'"]:first');
            el.css('border', '3px solid #00A09D');
            
            this.activeAttachmentID = activeAttachmentID;
        },

        _disableAttachment: function () {
            // Unselect all elements
            var selected = this.selection.getSelection();
            for(var k = selected.length; k--;) {
                selected[k].classList.remove('am-wrap-selected');
                this.selection.removeFromSelection(selected[k]);
            }
/*            while (selected.length > 0) {
                selected[0].classList.remove('am-wrap-selected');
                this.selection.removeFromSelection(selected[0]);
            }*/
            // Clear previous selection
            this.selection.clearSelection();

            var el = this.$el.find('[data-id="'+this.activeAttachmentID+'"]');
            el.css('border-color', '');
            el.css('border', '');
        },
    });
});
