﻿//  Displays streamus search suggestions and allows instant playing in the stream
define([
    'youTubeV2API',
    'video',
    'utility',
    'streamItems'
], function (YouTubeV2API, Video, Utility, StreamItems) {
    'use strict';

    var Omnibox = Backbone.Model.extend({
            
        defaults: {
            suggestedVideos: [],
            searchJqXhr: null
        },
        
        initialize: function() {
            var self = this;
            
            //  User has started a keyword input session by typing the extension's keyword. This is guaranteed to be sent exactly once per input session, and before any onInputChanged events.
            chrome.omnibox.onInputChanged.addListener(function (text, suggest) {

                //  Clear suggested videos
                self.get('suggestedVideos').length = 0;

                var trimmedSearchText = $.trim(text);

                //  Clear suggestions if there is no text.
                if (trimmedSearchText === '') {

                    suggest();

                } else {
                    
                    //  Do not display results if searchText was modified while searching, abort old request.
                    var previousSearchJqXhr = self.get('searchJqXhr');

                    if (previousSearchJqXhr) {
                        previousSearchJqXhr.abort();
                        self.set('searchJqXhr', null);
                    }

                    var searchJqXhr = YouTubeV2API.search({
                        text: trimmedSearchText,
                        //  Omnibox can only show 6 results
                        maxResults: 6,
                        success: function(videoInformationList) {
                            self.set('searchJqXhr', null);
                            
                            var suggestions = _.map(videoInformationList, function(videoInformation) {

                                var video = new Video({
                                    videoInformation: videoInformation
                                });
                                self.get('suggestedVideos').push(video);

                                var textStyleRegExp = new RegExp(text, "i");
                                
                                var safeTitle = _.escape(video.get('title'));
                                var styledTitle = safeTitle.replace(textStyleRegExp, '<match>$&</match>');

                                var description = '<dim>' + video.get('prettyDuration') + "</dim>  " + styledTitle;

                                return { content: 'http://youtu.be/' + video.get('id'), description: description };
                            });

                            suggest(suggestions);

                        }
                    });

                    self.set('searchJqXhr', searchJqXhr);
                }

            });

            chrome.omnibox.onInputEntered.addListener(function (text) {

                //  Find the cached video data by url
                var pickedVideo = _.find(self.get('suggestedVideos'), function (suggestedVideo) {
                    var url = 'http://youtu.be/' + suggestedVideo.get('id');
                    return text === url;
                });
                
                //  If the user doesn't make a selection (commonly when typing and then just hitting enter on their query)
                //  take the best suggestion related to their text.
                if (pickedVideo === undefined) {
                    pickedVideo = self.get('suggestedVideos')[0];
                }

                StreamItems.addByVideo(pickedVideo, true);

            });
            
        }
    });

    return new Omnibox();
});