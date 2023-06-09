zira.define('mass_mailing.editor', function (require) {
"use strict";

require('web.dom_ready');
var ajax = require('web.ajax');
var core = require('web.core');
var rte = require('web_editor.rte');
var options = require('web_editor.snippets.options');
var snippets_editor = require('web_editor.snippet.editor');
var weWidgets = require('web_editor.widget');

var $editable_area = $('#editable_area');
var zira_top = window.top.zira;

// Snippet option for resizing  image and column width inline like excel
options.registry.sizing_x = options.Class.extend({
    /**
     * @override
     */
    start: function () {
        var def = this._super.apply(this, arguments);

        this.containerWidth = this.$target.parent().closest("td, table, div").width();

        var self = this;
        var offset, sib_offset, target_width, sib_width;

        this.$overlay.find(".o_handle.e, .o_handle.w").removeClass("readonly");
        this.isIMG = this.$target.is("img");
        if (this.isIMG) {
            this.$overlay.find(".o_handle.w").addClass("readonly");
            this.$overlay.find(".oe_snippet_move, .oe_snippet_clone").addClass('d-none');
        }

        var $body = $(document.body);
        this.$overlay.find(".o_handle").on('mousedown', function (event) {
            event.preventDefault();
            var $handle = $(this);
            var compass = false;

            _.each(['n', 's', 'e', 'w'], function (handler) {
                if ($handle.hasClass(handler)) { compass = handler; }
            });
            if (self.isIMG) { compass = "image"; }

            $body.on("mousemove.mass_mailing_width_x", function (event) {
                event.preventDefault();
                offset = self.$target.offset().left;
                target_width = self.get_max_width(self.$target);
                if (compass === 'e' && self.$target.next().offset()) {
                    sib_width = self.get_max_width(self.$target.next());
                    sib_offset = self.$target.next().offset().left;
                    self.change_width(event, self.$target, target_width, offset, true);
                    self.change_width(event, self.$target.next(), sib_width, sib_offset, false);
                }
                if (compass === 'w' && self.$target.prev().offset()) {
                    sib_width = self.get_max_width(self.$target.prev());
                    sib_offset = self.$target.prev().offset().left;
                    self.change_width(event, self.$target, target_width, offset, false);
                    self.change_width(event, self.$target.prev(), sib_width, sib_offset, true);
                }
                if (compass === 'image') {
                    self.change_width(event, self.$target, target_width, offset, true);
                }
            });
            $body.one("mouseup", function () {
                $body.off('.mass_mailing_width_x');
            });
        });

        return def;
    },
    change_width: function (event, target, target_width, offset, grow) {
        target.css("width", grow ? (event.pageX - offset) : (offset + target_width - event.pageX));
        this.trigger_up('cover_update');
    },
    get_int_width: function (el) {
        return parseInt($(el).css("width"), 10);
    },
    get_max_width: function ($el) {
        return this.containerWidth - _.reduce(_.map($el.siblings(), this.get_int_width), function (memo, w) { return memo + w; });
    },
    onFocus: function () {
        this._super.apply(this, arguments);

        if (this.$target.is("td, th")) {
            this.$overlay.find(".o_handle.e, .o_handle.w").toggleClass("readonly", this.$target.siblings().length === 0);
        }
    },
});

options.registry.table_item = options.Class.extend({
    onClone: function (options) {
        this._super.apply(this, arguments);

        // If we cloned a td or th element...
        if (options.isCurrent && this.$target.is("td, th")) {
            // ... and that the td or th element was alone on its row ...
            if (this.$target.siblings().length === 1) {
                var $tr = this.$target.parent();
                $tr.clone().empty().insertAfter($tr).append(this.$target); // ... move the clone in a new row instead
                return;
            }

            // ... if not, if the clone neighbor is an empty cell, remove this empty cell (like if the clone content had been put in that cell)
            var $next = this.$target.next();
            if ($next.length && $next.text().trim() === "") {
                $next.remove();
                return;
            }

            // ... if not, insert an empty col in each other row, at the index of the clone
            var width = this.$target.width();
            var $trs = this.$target.closest("table").children("thead, tbody, tfoot").addBack().children("tr").not(this.$target.parent());
            _.each($trs.children(":nth-child(" + this.$target.index() + ")"), function (col) {
                $(col).after($("<td/>", {style: "width: " + width + "px;"}));
            });
        }
    },
    onRemove: function () {
        this._super.apply(this, arguments);

        // If we are removing a td or th element which was not alone on its row ...
        if (this.$target.is("td, th") && this.$target.siblings().length > 0) {
            var $trs = this.$target.closest("table").children("thead, tbody, tfoot").addBack().children("tr").not(this.$target.parent());
            if ($trs.length) { // ... if there are other rows in the table ...
                var $last_tds = $trs.children(":last-child");
                if (_.reduce($last_tds, function (memo, td) { return memo + (td.innerHTML || ""); }, "").trim() === "") {
                    $last_tds.remove(); // ... remove the potential full empty column in the table
                } else {
                    this.$target.parent().append("<td/>"); // ... else, if there is no full empty column, append an empty col in the current row
                }
            }
        }
    },
});

var fn_popover_update = $.summernote.eventHandler.modules.popover.update;
$.summernote.eventHandler.modules.popover.update = function ($popover, oStyle, isAirMode) {
    fn_popover_update.call(this, $popover, oStyle, isAirMode);
    $("span.o_table_handler, div.note-table").remove();
};

ajax.loadXML("/mass_mailing/static/src/xml/mass_mailing.xml", core.qweb);

snippets_editor.Class.include({
    _computeSnippetTemplates: function (html) {
        var self = this;
        var ret = this._super.apply(this, arguments);

        var $themes = this.$("#email_designer_themes").children();
        if ($themes.length === 0) return ret;

        /**
         * Initialize theme parameters.
         */
        var all_classes = "";
        var themes_params = _.map($themes, function (theme) {
            var $theme = $(theme);
            var name = $theme.data("name");
            var classname = "o_" + name + "_theme";
            all_classes += " " + classname;
            var images_info = _.defaults($theme.data("imagesInfo") || {}, {all: {}});
            _.each(images_info, function (info) {
                info = _.defaults(info, images_info.all, {module: "mass_mailing", format: "jpg"});
            });
            return {
                name: name,
                className: classname || "",
                img: $theme.data("img") || "",
                template: $theme.html().trim(),
                nowrap: !!$theme.data('nowrap'),
                get_image_info: function (filename) {
                    if (images_info[filename]) {
                        return images_info[filename];
                    }
                    return images_info.all;
                }
            };
        });
        $themes.parent().remove();

        var $body = $(document.body);
        var $snippets = this.$(".oe_snippet");
        var $snippets_menu = this.$el.find("#snippets_menu");

        /**
         * Create theme selection screen and check if it must be forced opened.
         * Reforce it opened if the last snippet is removed.
         */
        var $dropdown = $(core.qweb.render("mass_mailing.theme_selector", {
            themes: themes_params
        }));
        var first_choice;
        check_if_must_force_theme_choice();

        /**
         * Add proposition to install enterprise themes if not installed.
         */
        var $mail_themes_upgrade = $dropdown.find(".o_mass_mailing_themes_upgrade");
        $mail_themes_upgrade.on("click", function (e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            zira_top[window.callback+"_do_action"]("mass_mailing.action_mass_mailing_configuration");
        });

        /**
         * Switch theme when a theme button is hovered. Confirm change if the theme button
         * is pressed.
         */
        var selected_theme = false;
        $dropdown.on("mouseenter", ".dropdown-item", function (e) {
            if (first_choice) return;
            e.preventDefault();
            var theme_params = themes_params[$(e.currentTarget).index()];
            switch_theme(theme_params);
        });
        $dropdown.on("click", ".dropdown-item", function (e) {
            e.preventDefault();
            var theme_params = themes_params[$(e.currentTarget).index()];
            if (first_choice) {
                switch_theme(theme_params);
                $body.removeClass("o_force_mail_theme_choice");
                first_choice = false;

                if ($mail_themes_upgrade.length) {
                    $dropdown.remove();
                    $snippets_menu.empty();
                }
            }

            switch_images(theme_params, $snippets);

            selected_theme = theme_params;

            // Notify form view
            zira_top[window.callback+"_downup"]($editable_area.addClass("o_dirty").html());
        });

        /**
         * If the user opens the theme selection screen, indicates which one is active and
         * saves the information...
         * ... then when the user closes check if the user confirmed its choice and restore
         * previous state if this is not the case.
         */
        $dropdown.on("shown.bs.dropdown", function () {
            check_selected_theme();
            $dropdown.find(".dropdown-item").removeClass("selected").filter(function () {
                return ($(this).has(".o_thumb[style=\""+ "background-image: url(" + (selected_theme && selected_theme.img) + "_small.png)"+ "\"]").length > 0);
            }).addClass("selected");
        });
        $dropdown.on("hidden.bs.dropdown", function () {
            switch_theme(selected_theme);
        });

        /**
         * On page load, check the selected theme and force switching to it (body needs the
         * theme style for its edition toolbar).
         */
        check_selected_theme();
        $body.addClass(selected_theme.className);
        switch_images(selected_theme, $snippets);

        $dropdown.insertAfter($snippets_menu);

        return ret;

        function check_if_must_force_theme_choice() {
            first_choice = editable_area_is_empty();
            $body.toggleClass("o_force_mail_theme_choice", first_choice);
        }

        function editable_area_is_empty($layout) {
            $layout = $layout || $editable_area.find(".o_layout");
            var $mail_wrapper = $layout.children(".o_mail_wrapper");
            var $mail_wrapper_content = $mail_wrapper.find('.o_mail_wrapper_td');
            if (!$mail_wrapper_content.length) { // compatibility
                $mail_wrapper_content = $mail_wrapper;
            }
            return (
                $editable_area.html().trim() === ""
                || ($layout.length > 0 && ($layout.html().trim() === "" || $mail_wrapper_content.length > 0 && $mail_wrapper_content.html().trim() === ""))
            );
        }

        function check_selected_theme() {
            var $layout = $editable_area.find(".o_layout");
            if ($layout.length === 0) {
                selected_theme = false;
            } else {
                _.each(themes_params, function (theme_params) {
                    if ($layout.hasClass(theme_params.className)) {
                        selected_theme = theme_params;
                    }
                });
            }
        }

        function switch_images(theme_params, $container) {
            if (!theme_params) return;
            $container.find("img").each(function () {
                var $img = $(this);
                var src = $img.attr("src");

                var m = src.match(/^\/web\/image\/\w+\.s_default_image_(?:theme_[a-z]+_)?(.+)$/);
                if (!m) {
                    m = src.match(/^\/\w+\/static\/src\/img\/(?:theme_[a-z]+\/)?s_default_image_(.+)\.[a-z]+$/);
                }
                if (!m) return;

                var file = m[1];
                var img_info = theme_params.get_image_info(file);

                if (img_info.format) {
                    src = "/" + img_info.module + "/static/src/img/theme_" + theme_params.name + "/s_default_image_" + file + "." + img_info.format;
                } else {
                    src = "/web/image/" + img_info.module + ".s_default_image_theme_" + theme_params.name + "_" + file;
                }

                $img.attr("src", src);
            });
        }

        function switch_theme(theme_params) {
            if (!theme_params || switch_theme.last === theme_params) return;
            switch_theme.last = theme_params;

            $body.removeClass(all_classes).addClass(theme_params.className);

            var $old_layout = $editable_area.find('.o_layout');

            var $new_wrapper;
            var $new_wrapper_content;
            if (theme_params.nowrap) {
                $new_wrapper = $('<div/>', {class: 'oe_structure'});
                $new_wrapper_content = $new_wrapper;
            } else {
                // This wrapper structure is the only way to have a responsive
                // and centered fixed-width content column on all mail clients
                $new_wrapper = $('<table/>', {class: 'o_mail_wrapper'});
                $new_wrapper_content = $('<td/>', {class: 'o_mail_no_options o_mail_wrapper_td oe_structure'});
                $new_wrapper.append($('<tr/>').append(
                    $('<td/>', {class: 'o_mail_no_resize o_not_editable', contenteditable: 'false'}),
                    $new_wrapper_content,
                    $('<td/>', {class: 'o_mail_no_resize o_not_editable', contenteditable: 'false'})
                ));
            }
            var $new_layout = $('<div/>', {class: 'o_layout ' + theme_params.className}).append($new_wrapper);

            var $contents;
            if (first_choice) {
                $contents = theme_params.template;
            } else if ($old_layout.length) {
                $contents = ($old_layout.hasClass('oe_structure') ? $old_layout : $old_layout.find('.oe_structure').first()).contents();
            } else {
                $contents = $editable_area.contents();
            }

            $new_wrapper_content.append($contents);
            switch_images(theme_params, $new_wrapper_content);
            $editable_area.empty().append($new_layout);
            $old_layout.remove();

            if (first_choice) {
                self._registerDefaultTexts($new_wrapper_content);
                if(theme_params.name == 'basic') {
                    $editable_area.focusIn();
                }
            }
            self._disableUndroppableSnippets();
        }
    },
    cleanForSave: function () {
        this._super.apply(this, arguments);
        // remove font-family from all elements for plain text theme (just like gmail)
        var $basicTheme = this.$editable.find('.o_basic_theme');
        if($basicTheme.length && this.$editable.data('oe-model') === 'mail.mass_mailing') {
            this.$editable.find('*').css('font-family', '');
        }
    }
});

var callback = window ? window["callback"] : undefined;
zira_top[callback+"_updown"] = function (value, fields_values, field_name) {
    if (!window || window.closed) {
        delete zira_top[callback+"_updown"];
        return;
    }

    var $editable = $("#editable_area");
    var _val = $editable.prop("innerHTML");
    var editor_enable = $('body').hasClass('editor_enable');
    value = value || "";

    if (value !==_val) {
        if (editor_enable) {
            if (value !== fields_values[field_name]) {
                rte.history.recordUndo($editable);
            }
            core.bus.trigger('deactivate_snippet');
        }

        if (value.indexOf('on_change_model_and_list') === -1) {
            $editable.html(value);

            if (editor_enable) {
                if (value !== fields_values[field_name]) {
                    $editable.trigger("content_changed");
                }
            }
        }
    }

    if (fields_values.mailing_model && editor_enable) {
        if (value.indexOf('on_change_model_and_list') !== -1) {
            zira_top[callback+"_downup"](_val);
        }
    }
};

if ($editable_area.html().indexOf('on_change_model_and_list') !== -1) {
    $editable_area.empty();
}
// Adding compatibility for the outlook compliance of mailings.
// Commit of such compatibility : a14f89c8663c9cafecb1cc26918055e023ecbe42
options.registry.background.include({
    start: function () {
        this._super();
        var $table_target = this.$target.find('table:first');
        if ($table_target) {
            this.$target = $table_target;
        }
    }
});

/**
 * Primary and link buttons are "hacked" by mailing themes scss. We thus
 * have to show them first in the link dialog, and even if they are a duplicate
 * of other colors. We also have to fix their preview if possible.
 */
weWidgets.LinkDialog.include({
    /**
     * @constructor
     */
    init: function () {
        this._super.apply(this, arguments);
        this.__showDuplicateColorButtons = true;
    },
    /**
     * @override
     */
    start: function () {
        var self = this;
        var ret = this._super.apply(this, arguments);

        this.opened().then(function () {
            // Ugly hack to put primary choice next to the link choice and the
            // rest on another lines (the rest are colors independent from the
            // mailing theme).
            var $mainButtons = self.$('.o_link_dialog_color_item.btn-primary');
            $mainButtons.insertAfter(self.$('.o_link_dialog_color_item.btn-link'));
            $mainButtons.before(' ');
            $mainButtons.last().after('<br/>');

            // More ugly hack to show the real color for link and primary
            // which depend on the mailing themes. Note: the hack is not enough
            // has the mailing theme changes those colors in some environment,
            // sometimes (for example 'btn-primary in this snippet looks like
            // that')... we'll consider this a limitation until a master
            // refactoring of those mailing themes.
            self.__realMMColors = {};
            var $previewArea = $('<div/>').addClass('o_mail_snippet_general');
            $(self.editable).find('.o_layout').append($previewArea);
            _.each(['link', 'primary'], function (type) {
                var $el = $('<a href="#" class="btn btn-' + type + '"/>');
                $el.appendTo($previewArea);
                self.__realMMColors[type] = {
                    'border-color': $el.css('border-top-color'),
                    'background-color': $el.css('background-color'),
                    'color': $el.css('color'),
                };
                $el.remove();

                self.$('.o_link_dialog_color_item.btn-' + type)
                    .css(_.pick(self.__realMMColors[type], 'background-color', 'color'));
            });
            $previewArea.remove();

            self._adaptPreview();
        });

        return ret;
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    _adaptPreview: function () {
        var self = this;
        this._super.apply(this, arguments);
        if (this.__realMMColors) {
            var $preview = this.$("#link-preview");
            $preview.css('border-color', '');
            $preview.css('background-color', '');
            $preview.css('color', '');
            _.each(['link', 'primary'], function (type) {
                if ($preview.hasClass('btn-' + type) || type === 'link' && !$preview.hasClass('btn')) {
                    $preview.css(self.__realMMColors[type]);
                }
            });
        }
    },
});
});
