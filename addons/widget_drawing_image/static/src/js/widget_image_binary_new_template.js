zira.define('widget_image_binary_new_template', function(require) {
    var AbstractField = require('web.AbstractField');
    var base_f = require('web.basic_fields');
    
    //AbstractFieldBinary = base_f.AbstractFieldBinary;
    var core = require('web.core');
    var utils = require('web.utils');
    var session = require('web.session');
    var field_utils = require('web.field_utils');
    var registry = require('web.field_registry');
    var qweb = core.qweb;
    var _t = core._t;
    var _lt = core._lt;

    var AbstractFieldBinary = AbstractField.extend({
        events: _.extend({}, AbstractField.prototype.events, {
            'change .o_input_file': 'on_file_change',
            'click .o_select_file_button': function () {
                this.$('.o_input_file').click();
            },
            'click .o_clear_file_button': '_onClearClick',
        }),
        init: function (parent, name, record) {
            this._super.apply(this, arguments);
            this.fields = record.fields;
            this.useFileAPI = !!window.FileReader;
            this.max_upload_size = 25 * 1024 * 1024; // 25Mo
            if (!this.useFileAPI) {
                var self = this;
                this.fileupload_id = _.uniqueId('o_fileupload');
                $(window).on(this.fileupload_id, function () {
                    var args = [].slice.call(arguments).slice(1);
                    self.on_file_uploaded.apply(self, args);
                });
            }
        },
        destroy: function () {
            if (this.fileupload_id) {
                $(window).off(this.fileupload_id);
            }
            this._super.apply(this, arguments);
        },
        on_file_change: function (e) {
            var self = this;
            var file_node = e.target;
            if ((this.useFileAPI && file_node.files.length) || (!this.useFileAPI && $(file_node).val() !== '')) {
                if (this.useFileAPI) {
                    var file = file_node.files[0];
                    if (file.size > this.max_upload_size) {
                        var msg = _t("The selected file exceed the maximum file size of %s.");
                        this.do_warn(_t("File upload"), _.str.sprintf(msg, utils.human_size(this.max_upload_size)));
                        return false;
                    }
                    var filereader = new FileReader();
                    filereader.readAsDataURL(file);
                    filereader.onloadend = function (upload) {
                        var data = upload.target.result;
                        data = data.split(',')[1];
                        self.on_file_uploaded(file.size, file.name, file.type, data);
                    };
                } else {
                    this.$('form.o_form_binary_form input[name=session_id]').val(this.getSession().session_id);
                    this.$('form.o_form_binary_form').submit();
                }
                this.$('.o_form_binary_progress').show();
                this.$('button').hide();
            }
        },
        on_file_uploaded: function (size, name) {
            if (size === false) {
                this.do_warn(_t("File Upload"), _t("There was a problem while uploading your file"));
                // TODO: use crashmanager
                console.warn("Error while uploading file : ", name);
            } else {
                this.on_file_uploaded_and_valid.apply(this, arguments);
            }
            this.$('.o_form_binary_progress').hide();
            this.$('button').show();
        },
        on_file_uploaded_and_valid: function (size, name, content_type, file_base64) {
            this.set_filename(name);
            this._setValue(file_base64);
            this._render();
        },
        /**
         * We need to update another field.  This method is so deprecated it is not
         * even funny.  We need to replace this with the mechanism of field widgets
         * declaring statically that they need to listen to every changes in other
         * fields
         *
         * @deprecated
         *
         * @param {any} value
         */
        set_filename: function (value) {
            var filename = this.attrs.filename;
            if (filename && filename in this.fields) {
                var changes = {};
                changes[filename] = value;
                this.trigger_up('field_changed', {
                    dataPointID: this.dataPointID,
                    changes: changes,
                    viewType: this.viewType,
                });
            }
        },
    
        //--------------------------------------------------------------------------
        // Private
        //--------------------------------------------------------------------------
        /**
         * Clear the file input
         *
         * @private
         */
        _clearFile: function (){
            this.$('.o_input_file').val('');
            this.set_filename('');
            this._setValue(false);
            this._render();
        },
    
        //--------------------------------------------------------------------------
        // Handlers
        //--------------------------------------------------------------------------
        /**
         * On "clear file" button click
         *
         * @param {MouseEvent} ev
         * @private
         */
        _onClearClick: function (ev) {
            this._clearFile();
        },
    });

    var FieldBinaryImageNewTemplate = AbstractFieldBinary.extend({
        description: _lt("Image"),
        fieldDependencies: _.extend({}, AbstractFieldBinary.prototype.fieldDependencies, {
            __last_update: {type: 'datetime'},
        }),

        template: 'FieldBinaryImageDrawingFields',
        placeholder: "/web/static/src/img/placeholder.png",
        events: _.extend({}, AbstractFieldBinary.prototype.events, {
            'click img': function () {
                if (this.mode === "readonly") {
                    this.trigger_up('bounce_edit');
                }
            },
        }),
        supportedFieldTypes: ['binary'],
        file_type_magic_word: {
            '/': 'jpg',
            'R': 'gif',
            'i': 'png',
            'P': 'svg+xml',
        },
        accepted_file_extensions: 'image/*',
        /**
         * Returns the image URL from a model.
         *
         * @private
         * @param {string} model    model from which to retrieve the image
         * @param {string} res_id   id of the record
         * @param {string} field    name of the image field
         * @param {string} unique   an unique integer for the record, usually __last_update
         * @returns {string} URL of the image
         */
        _getImageUrl: function (model, res_id, field, unique) {
            return session.url('/web/image', {
                model: model,
                id: JSON.stringify(res_id),
                field: field,
                // unique forces a reload of the image when the record has been updated
                unique: field_utils.format.datetime(unique).replace(/[^0-9]/g, ''),
            });
        },
        _render: function () {
            var self = this;
            var url = this.placeholder;
            if (this.value) {
                if (!utils.is_bin_size(this.value)) {
                    // Use magic-word technique for detecting image type
                    url = 'data:image/' + (this.file_type_magic_word[this.value[0]] || 'png') + ';base64,' + this.value;
                } else {
                    var field = this.nodeOptions.preview_image || this.name;
                    var unique = this.recordData.__last_update;
                    url = this._getImageUrl(this.model, this.res_id, field, unique);
                }
            }
            var $img = $(qweb.render("FieldBinaryImageDrawingFields-img", {widget: this, url: url}));
            // override css size attributes (could have been defined in css files)
            // if specified on the widget
            var width = this.nodeOptions.size ? this.nodeOptions.size[0] : this.attrs.width;
            var height = this.nodeOptions.size ? this.nodeOptions.size[1] : this.attrs.height;
            if (width) {
                $img.attr('width', width);
                $img.css('max-width', width + 'px');
            }
            if (height) {
                $img.attr('height', height);
                $img.css('max-height', height + 'px');
            }
            this.$('> img').remove();
            this.$('#container_drawing_fields').remove();
            this.$el.prepend($img);

            $img.one('error', function () {
                $img.attr('src', self.placeholder);
                self.do_warn(false, _t("Could not display the selected image"));
            });

            return this._super.apply(this, arguments);
        },
        /**
         * Only enable the zoom on image in read-only mode, and if the option is enabled.
         *
         * @override
         * @private
         */
        _renderReadonly: function () {
            this._super.apply(this, arguments);

            if(this.nodeOptions.zoom) {
                var unique = this.recordData.__last_update;
                var url = this._getImageUrl(this.model, this.res_id, 'image', unique);
                var $img;
                var imageField = _.find(Object.keys(this.recordData), function(o) {
                    return o.startsWith('image');
                });

                if(this.nodeOptions.background)
                {
                    if('tag' in this.nodeOptions) {
                        this.tagName = this.nodeOptions.tag;
                    }

                    if('class' in this.attrs) {
                        this.$el.addClass(this.attrs.class);
                    }

                    const image_field = this.field.manual ? this.name:'image';
                    var urlThumb = this._getImageUrl(this.model, this.res_id, image_field, unique);

                    this.$el.empty();
                    $img = this.$el;
                    $img.css('backgroundImage', 'url(' + urlThumb + ')');
                } else {
                    $img = this.$('img');
                }
                var zoomDelay = 0;
                if (this.nodeOptions.zoom_delay) {
                    zoomDelay = this.nodeOptions.zoom_delay;
                }

                if(this.recordData[imageField]) {
                    $img.attr('data-zoom', 1);
                    $img.attr('data-zoom-image', url);

                    $img.zoomZira({
                        event: 'mouseenter',
                        timer: zoomDelay,
                        attach: '.o_content',
                        attachToTarget: true,
                        onShow: function () {
                            var zoomHeight = Math.ceil(this.$zoom.height());
                            var zoomWidth = Math.ceil(this.$zoom.width());
                            if( zoomHeight < 128 && zoomWidth < 128) {
                                this.hide();
                            }
                            core.bus.on('keydown', this, this.hide);
                            core.bus.on('click', this, this.hide);
                        },
                        beforeAttach: function () {
                            this.$flyout.css({ width: '512px', height: '512px' });
                        },
                        preventClicks: this.nodeOptions.preventClicks,
                    });
                }
            }
        },
    });

registry.add('image_drawing_fields', FieldBinaryImageNewTemplate)
return FieldBinaryImageNewTemplate;


});