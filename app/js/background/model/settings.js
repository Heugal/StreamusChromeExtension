﻿//  TODO: This is growing enormously. Need to refactor and kill it.
//  Exposed globally so that Chrome Extension's foreground can access through chrome.extension.getBackgroundPage()
var Settings = null;

define([
    'backbone'
], function (Backbone) {
    'use strict';

    var settingsModel = Backbone.Model.extend({
        
        defaults: function() {
            return {
                localDebug: false,
                testing: false,
                serverURL: '',
                suggestedQuality: getItem('suggestedQuality') || 'default',
                userId: getItem('userId') || null,
                youTubeInjectClicked: getItem('youTubeInjectClicked') || true,
                remindClearStream: getItem('remindClearStream') || true,
                remindDeletePlaylist: getItem('remindDeletePlaylist') || true,
                showTimeRemaining: getItem('showTimeRemaining') || false
            };
        },
        
        initialize: function () {
            //  BaseURL is needed for ajax requests to the server.
            if (this.get('localDebug')) {
                this.set('serverURL', 'http://localhost:61975/');
            }
            else {
                this.set('serverURL', 'http://streamus.apphb.com/');
            }

            this.on('change:suggestedQuality', function(model, suggestedQuality) {
                localStorage.setItem('suggestedQuality', suggestedQuality);
            });
            
            this.on('change:userId', function (model, userId) {
                localStorage.setItem('userId', JSON.stringify(userId));
            });

			this.on('change:youTubeInjectClicked', function (model, youTubeInjectClicked) {
                localStorage.setItem('youTubeInjectClicked', JSON.stringify(youTubeInjectClicked));
			});

			this.on('change:remindClearStream', function (model, remindClearStream) {
			    localStorage.setItem('remindClearStream', JSON.stringify(remindClearStream));
			});

            this.on('change:remindDeletePlaylist', function(model, remindDeletePlaylist) {
                localStorage.setItem('remindDeletePlaylist', JSON.stringify(remindDeletePlaylist));
            });

            this.on('change:showTimeRemaining', function(model, showTimeRemaining) {
                localStorage.setItem('showTimeRemaining', JSON.stringify(showTimeRemaining));
            });
            
        }
  
    });
    
    //  Fetch an item from localStorage, try and turn it from a string to an object literal if possible.
    //  If not, just allow the string type because its assumed to be correct.
    function getItem(key) {

        var item = localStorage.getItem(key);

        if (item !== null) {
            
            try {
                //  Make sure I don't send back 'null' or 'undefined' as string types.
                item = JSON.parse(item);
            } catch(exception) {
                //  Consume any exceptions because might try and parse a GUID which isn't valid JSON.
            }
        }

        return item;
    }
    
    Settings = new settingsModel();
    return Settings;
});