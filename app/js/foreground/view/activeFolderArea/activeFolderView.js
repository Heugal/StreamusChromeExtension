//  This is the list of playlists on the playlists tab.
define([
    'genericForegroundView',
    'text!../template/activeFolder.htm',
    'contextMenuGroups',
    'utility',
    'streamItems',
    'playlistView',
    'genericPromptView',
    'createPlaylistView'
], function (GenericForegroundView, ActiveFolderTemplate, ContextMenuGroups, Utility, StreamItems, PlaylistView, GenericPromptView, CreatePlaylistView) {
    'use strict';

    var ActiveFolderView = GenericForegroundView.extend({
        
        tagName: 'ul',

        template: _.template(ActiveFolderTemplate),

        events: {
            'contextmenu': 'showContextMenu'
        },
        
        attributes: {
            'id': 'activeFolder'
        },
        
        //  Refreshes the playlist display with the current playlist information.
        render: function () {
            this.$el.html(this.template(this.model.toJSON()));

            var playlists = this.model.get('playlists');

            if (playlists.length > 0) {

                //  Build up the ul of li's representing each playlist.
                var listItems = playlists.map(function (playlist) {
                    var playlistView = new PlaylistView({
                        model: playlist
                    });

                    return playlistView.render().el;
                });

                //  Do this all in one DOM insertion to prevent lag in large folders.
                this.$el.append(listItems);
            }
            
            //  TODO: Make playlists sortable.
            var self = this;
            //  Allows for drag-and-drop of videos
            this.$el.sortable({
                axis: 'y',
                //  Adding this helps prevent unwanted clicks to play
                delay: 100,
                appendTo: 'body',
                containment: 'body',
                placeholder: "sortable-placeholder listItem",
                scroll: false,
                cursorAt: {
                    right: 35,
                    bottom: 40
                },
                tolerance: 'pointer',
                helper: 'clone',
                //  Whenever a video row is moved inform the Player of the new video list order
                update: function (event, ui) {
                    
                    var playlistId = ui.item.data('playlistid');

                    //  Run this code only when reorganizing playlists.
                    if (this === ui.item.parent()[0] && playlistId) {
                        //  It's important to do this to make sure I don't count my helper elements in index.
                        var index = parseInt(ui.item.parent().children('.playlist').index(ui.item));

                        var playlist = self.model.get('playlists').get(playlistId);
                        var originalindex = self.model.get('playlists').indexOf(playlist);

                        //  When moving an item down the list -- all the items shift up one which causes an off-by-one error when calling
                        //  movedPlaylistToIndex. Account for this by adding 1 to the index when moving down, but not when moving up since
                        //  no shift happens.
                        if (originalindex < index) {
                            index += 1;
                        }

                        self.model.movePlaylistToIndex(playlistId, index);
                    }
                    
                }
            });

            return this;
        },
        
        initialize: function () {
            this.listenTo(this.model.get('playlists'), 'add', this.addItem);
            Utility.scrollChildElements(this.el, 'span.playlitTitle');
        },

        addItem: function (playlist) {

            var playlistView = new PlaylistView({
                model: playlist
            });

            var element = playlistView.render().$el;

            if (this.$el.find('.playlist').length > 0) {

                var playlists = this.model.get('playlists');

                var currentPlaylistIndex = playlists.indexOf(playlist);

                var previousPlaylistId = playlists.at(currentPlaylistIndex - 1).get('id');

                var previousPlaylistElement = this.$el.find('.playlist[data-playlistid="' + previousPlaylistId + '"]');

                element.insertAfter(previousPlaylistElement);

            } else {
                element.appendTo(this.$el);
            }
        },
        
        showContextMenu: function(event) {

            //  Whenever a context menu is shown -- set preventDefault to true to let foreground know to not reset the context menu.
            event.preventDefault();

            if (event.target === event.currentTarget) {
                //  Didn't bubble up from a child -- clear groups.
                ContextMenuGroups.reset();
            }

            ContextMenuGroups.add({
                items: [{
                    text: chrome.i18n.getMessage('createPlaylist'),
                    onClick: function() {

                        var createPlaylistPromptView = new GenericPromptView({
                            title: chrome.i18n.getMessage('createPlaylist'),
                            okButtonText: chrome.i18n.getMessage('saveButtonText'),
                            model: new CreatePlaylistView()
                        });
                        
                        createPlaylistPromptView.fadeInAndShow();

                    }
                }]
            });
            
        }

    });

    return ActiveFolderView;
});