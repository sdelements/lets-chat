/*
 * UPLOAD/FILE VIEWS
 * The king of all views.
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.UploadView = Backbone.View.extend({
        events: {
            'submit form': 'nope'
        },
        initialize: function(options) {
            this.template = Handlebars.compile($('#template-upload-preview').html());
            this.rooms = options.rooms;
            this.rooms.on('add', this.add, this);
            this.rooms.on('remove', this.remove, this);
            this.render();
        },
        render: function() {
            var that = this;
            this.$('[name="files[]"]').fileupload({
                dataType: 'json',
                autoUpload: false,
                disableImageResize: /Android(?!.*Chrome)|Opera/.test(window.navigator.userAgent),
                previewMaxWidth: 100,
                previewMaxHeight: 100,
                previewCrop: true,
            }).on('fileuploadsubmit', _.bind(this.submit, this))
              .on('fileuploadadd', _.bind(this.meta, this))
              .on('fileuploadprocessalways', _.bind(this.preview, this));
        },
        add: function(room) {
            var $option = $('<option />');
            $option
                .attr('value', room.id)
                .text(room.get('name'))
                .appendTo(this.$('select[name="room"]'));
        },
        remove: function(room) {

        },
        submit: function(e, data) {

        },
        meta: function(e, data) {

        },
        preview: function(e, data) {
            var index = data.index,
                file = data.files[index];
            if (!file.preview) {
                return;
            }
            var $html = $(this.template(file));
            $html.append(file.preview).prependTo(this.$('.lcb-upload-preview-files'));
        },
        nope: function(e) {
            e.preventDefault();
        }
    });

}(window, $, _);
