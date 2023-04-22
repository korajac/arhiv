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
zira.define('attachments_manager_view', function (require) {
    "use strict";
    var core = require('web.core');
    var _t = core._t;
    var QWeb = core.qweb;
    var AttachmentBox = require('mail.AttachmentBox');


    AttachmentBox.include({
        events: _.extend({}, AttachmentBox.prototype.events, {
            // view menu
            "click .o_cp_switch_list": "_onListViewControlButton",
            "click .o_cp_switch_kanban": "_onKanbanViewControlButton",
            "click .o_cp_refresh": "_onRefreshButton",
  
        }),


        _onRefreshButton: function (evt) {
            this.trigger_up('reload_attachment_box');
        },

        _onKanbanViewControlButton: function (evt) {
            this.trigger_up('reload_attachment_box');
        },

        _activeListView: function () {
/*            var pagingRows = 20;
            var paginationOptions = {
                innerWindow: 1,
                left: 0,
                right: 0
            };*/
            var options = {
              valueNames: [ "id", "name", "create_uid", "create_date","mimetype","url","weburl","type","public","isfavorite"],
              //page: pagingRows,
              //plugins: [ ListPagination(paginationOptions) ],
            };
            var hackerList = new List('hacker-list', options);
        },

        _onListViewControlButton: function (evt) {
            // highlight button view
            this.$('.o_cp_switch_buttons button.active').removeClass('active');
            $(evt.currentTarget).addClass("active");
            console.log(this);
            var AttachmentsList = this._createListView(evt, this.attachmentIDs, 'manager');
            this.$('.o_chatter_attachment').html(AttachmentsList);
            this._activeListView();
        },


        _createListView: function (evt, attachments, mode) {
            var self = this;
            if (!attachments)
                return;

            // render list view
            var AttachmentsList = $(QWeb.render("AttachmentsList", {attachments: attachments, count: attachments.length, mode: mode}));

            // attach actions
/*            this.$('.remove-list').on('click', self._onEditAttachment.bind(self));*/
            AttachmentsList.find('.import-list').on('click',  function(evt) {
                evt.stopPropagation();
                evt.preventDefault();
                self._onAddCurrentRecordAM(evt);
                self.trigger_up('reload_attachment_box');
            });

            AttachmentsList.find('.unlike-list').on('click', function(evt) {
                evt.stopPropagation();
                evt.preventDefault();
                self._onUnlikeList(evt).then( res =>{
                    AttachmentsList.find('tr[data-id="'+$(evt.target).data('id')+'"]').remove();
                });
            });

            AttachmentsList.find('tr').on('click', function(evt) {
                evt.stopPropagation();
                evt.preventDefault();
                self._onSidebar(evt);
            });

            return AttachmentsList;
        },
    });
});
