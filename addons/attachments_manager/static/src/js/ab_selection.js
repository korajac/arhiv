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
zira.define('attachments_manager_selection', function (require) {
    "use strict";
    var AttachmentBox = require('mail.AttachmentBox');

    AttachmentBox.include({
        start: function () {
            var self = this;
            this._super.apply(this, arguments);
            this.selection = Selection.create({
                // Class for the selection-area
                class: 'am-selection-area',

                // All elements in this container can be selected
                selectables: ['.o_attachment_wrap'],

                // The container is also the boundary in this case
                boundaries: ['.o_chatter_attachment'],

                // Enable single-click selection (Also disables range-selection via shift + ctrl)
                singleClick: false,

                // On scrollable areas the number on px per frame is devided by this amount.
                // Default is 10 to provide a enjoyable scroll experience.
                scrollSpeedDivider: 10,

                // Disable touch mode
                disableTouch : true

            }).on('start', ({inst, selected, oe}) => {
                // Remove class if the user isn't pressing the control key or ⌘ key
                if (!oe.ctrlKey && !oe.metaKey) {

                    // Unselect all elements
                    for (const el of selected) {
                        el.classList.remove('am-wrap-selected');
                        inst.removeFromSelection(el);
                    }

                    // Clear previous selection
                    inst.clearSelection();
                }

            }).on('move', ({changed: {removed, added}}) => {
                // Add a custom class to the elements that where selected.
                for (const el of added) {
                    el.classList.add('am-wrap-selected');
                }

                // Remove the class from elements that where removed
                // since the last selection
                for (const el of removed) {
                    el.classList.remove('am-wrap-selected');
                }

            }).on('stop', ({inst}) => {
                console.log(this);
                // Remember selection in case the user wants to add smth in the next one
                inst.keepSelection();
                self._onSidebarSelection(inst);

            });

        },
    });
});
