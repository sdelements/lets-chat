//
// Userlist
//
var UserListView = Backbone.View.extend({
});

//
// Room
//
var RoomView = Backbone.View.extend({
    className: 'view',
    initialize: function() {
        this.template = this.options.template;
    },
    render: function() {
        var html = Mustache.to_html(this.template, this.model.toJSON());
        this.$el.html(html);
        this.$el.attr('data-id', this.model.id);
        this.$el.hide();
        return this.$el;
    }
});

//
// Tabs
//
var TabsView = Backbone.View.extend({
    el: '#rooms-menu ul',
    last: 'home',
    current: '',
    events: {
        'click .tab .close': 'tabclosed'
    },
    initialize: function() {
        this.template = this.options.template;
    },
    select: function(id) {
        this.$el.find('.tab[data-id=' + id + ']')
          .addClass('selected')
          .siblings().removeClass('selected');
        this.current = id;
    },
    add: function(room) {
        var tab = Mustache.to_html(this.template, room.toJSON());
        this.$el.append(tab);
    },
    remove: function(id) {
        this.$el.find('.tab[data-id=' + id + ']').remove();
        this.last = this.$el.find('.tab:last').data('id');
    },
    tabclosed: function(e) {
        e.preventDefault();
        var $tab = $(e.currentTarget).closest('.tab');
        this.trigger('tabclosed', {
            id: $tab.data('id')
        });
    }
});

//
// Panes Manager
//
var PanesView = Backbone.View.extend({
    el: '#panes',
    views: {},
    select: function(id) {
        this.$('.view').hide();
        this.$('.view[data-id=' + id + ']')
            .show()
            .siblings().hide();
    },
    add: function(view) {
        var $pane = view.render();
        this.views[view.model.id] = view;
        this.$el.append($pane);
    },
    remove: function(id) {
        this.views[id].remove();
        delete this.views[id];
    }
});

//
// Client
//
var ClientView = Backbone.View.extend({
    el: '#client',
    initialize: function() {
        var self = this;
        //
        // Vars
        //
        this.templates = this.options.templates;
        this.rooms = this.options.rooms;
        //
        // Subviews
        //
        this.tabs = new TabsView({
            template: this.templates('tab')
        });
        this.panes = new PanesView();
        //
        // New Room
        //
        this.rooms.bind('add', function(room) {
            self.tabs.add(room);
            self.panes.add(new RoomView({
                model: room,
                template: self.templates('room')
            }));
        });
        //
        // Leaving Room
        //
        this.rooms.bind('remove', function(room) {
            var id = room.id;
            self.tabs.remove(id);
            self.panes.remove(id);
            if (self.tabs.current == id) {
                self.switchView(self.tabs.last)
            }
        });
    },
    switchView: function(id) {
        if (id) {
            this.tabs.select(id);
            this.panes.select(id);
        } else {
            this.tabs.select('home');
            this.panes.select('home');
        }
    }
});