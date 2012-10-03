;(function($, document, window) {
	var defaults = {
			audioOnly: false,
			autoAdvance: true,
			autoPlay: true,
			callbacks: {
				onCompleteFirst: false,
				onCompleteLast: false,
                onLoadFirst: false,
                onLoadLast: false,
                onPlay: false,
				onSkipBackward: false,
				onSkipForward: false
            },
			controls: true,
            loop: false,
            target: false,
            transitionDelay: 0,
            videoOnly: false
        },
        pluginName = "playlist",
        playlistContainerName = pluginName,
        prefix = "pl-",
        version = "0.0.2";

    function Playlist(element, options) {
        this.version = version;

        this.element = element;

        this.options = $.extend({}, defaults, options);

        this._defaults = defaults;

        this._name = pluginName;

        this.init();
    }

    Playlist.prototype.init = function() {
		var playlist = this;

        playlist._videoElements = $(playlist.element).find("video");
        playlist._audioElements = $(playlist.element).find("audio");

        if (playlist.options.videoOnly) {
            playlist._mediaElements = playlist._videoElements;
        } else {
            if (playlist.options.audioOnly) {
                playlist._mediaElements = playlist._audioElements;
            } else {
                playlist._mediaElements = $(playlist.element).find("video, audio");
            }
        }

        playlist.appendHTML(playlist.options.target ? playlist.options.target : playlist.element, playlist.options.target ? false : true);

        playlist.attachEvents();

        playlist.launch();
    };

    Playlist.prototype.appendHTML = function(target, after) {
        var playlist = this;

        playlist.playlistContainer = $("<div id='" + prefix + playlistContainerName + "'></div>");

        playlist.mediaContainer = $("<div id='" + prefix + playlistContainerName + "-media'></div>");

        if (after) {
            $(target).after(playlist.playlistContainer);
        } else {
            $(target).append(playlist.playlistContainer);
        }

        $(playlist.playlistContainer).append(playlist.mediaContainer);

        playlist.mediaElements = [];

        $(playlist._mediaElements).each(function() {
            playlist.mediaElements.push($(this).clone().appendTo(playlist.mediaContainer)[0]);

            $(this).hide();
        });

        if (playlist.options.controls) {
            // TODO: Add ability to choose location for controls.
            playlist.addControls(playlist.playlistContainer);
        }
    };

    Playlist.prototype.addControls = function(target) {
		var playlist = this;

		// TODO: Consider making this a ul so we have a proper list of controls.
        playlist.controlsContainer = $("<div id='" + prefix + playlistContainerName + "-controls'></div>");

        $(target).append(playlist.controlsContainer);

        playlist.controls = {};

        // TODO: Add ability to customize the controls text.
        // TODO: Add ability to show/hide individual controls.
        playlist.controls.previous = $("<a href='javascript:void(0);' id='" + prefix + playlistContainerName + "-controls-previous'>&lt; Previous</a>");
        playlist.controls.play = $("<a href='javascript:void(0);' id='" + prefix + playlistContainerName + "-controls-play'>Play</a>");
        playlist.controls.pause = $("<a href='javascript:void(0);' id='" + prefix + playlistContainerName + "-controls-pause'>Pause</a>");
        playlist.controls.stop = $("<a href='javascript:void(0);' id='" + prefix + playlistContainerName + "-controls-stop'>Stop</a>");
        playlist.controls.next = $("<a href='javascript:void(0);' id='" + prefix + playlistContainerName + "-controls-next'>Next &gt;</a>");

        $(playlist.controlsContainer).append(playlist.controls.previous);
        $(playlist.controlsContainer).append(playlist.controls.play);
        $(playlist.controlsContainer).append(playlist.controls.pause);
        $(playlist.controlsContainer).append(playlist.controls.stop);
        $(playlist.controlsContainer).append(playlist.controls.next);
    };

    Playlist.prototype.attachEvents = function() {
        var playlist = this;

        if (playlist.mediaElements.length > 0) {
			$(playlist.mediaElements).on("loadedmetadata", function(event) {
				var height = $(this).height();
                var width = $(this).width();

                if (playlist.minHeight) {
                    if (height < playlist.minHeight) {
                        playlist.minHeight = height;
                    }
                } else {
                    playlist.minHeight = height;
                }

                if (playlist.maxHeight) {
                    if (height > playlist.maxHeight) {
                        playlist.maxHeight = height;
                    }
                } else {
                    playlist.maxHeight = height;
                }

                if (playlist.minWidth) {
                    if (width < playlist.minWidth) {
                        playlist.minWidth = width;
                    }
                } else {
                    playlist.minWidth = width;
                }

                if (playlist.maxWidth) {
                    if (width > playlist.maxWidth) {
                        playlist.maxWidth = width;
                    }
                } else {
                    playlist.maxWidth = width;
                }

                playlist.loadedMetadata(event);
            });

            $(playlist.mediaElements).on("ended", function(event) {
				playlist.next(false);
            });

            $(playlist.controls.play).on("click", function(event) {
                event.preventDefault();

                playlist.play();
            });

            $(playlist.controls.pause).on("click", function(event) {
                event.preventDefault();

                playlist.pause();
            });

            $(playlist.controls.stop).on("click", function(event) {
                event.preventDefault();

                playlist.resetPlaylist();
            });

            $(playlist.controls.previous).on("click", function(event) {
                event.preventDefault();

                playlist.previous();
            });

            $(playlist.controls.next).on("click", function(event) {
                event.preventDefault();

                playlist.next(true);
            });
        }
    }

    Playlist.prototype.launch = function() {
		var playlist = this;

        if (playlist.mediaElements.length > 0) {
			playlist.resetPlaylist();

            if (playlist.options.autoPlay) {
                $(playlist.currentMedia).trigger("play");
            }
        }
    };

    Playlist.prototype.play = function() {
		var playlist = this;

        if ($(playlist.currentMedia)[0].paused) {
            $(playlist.currentMedia).trigger("play");
        }
    };

    Playlist.prototype.pause = function() {
		var playlist = this;

        if (!$(playlist.currentMedia)[0].paused) {
            $(playlist.currentMedia).trigger("pause");
        }
    };

    Playlist.prototype.resetPlaylist = function() {
		var playlist = this;

		if (playlist.currentMedia) {
	        $(playlist.currentMedia).trigger("pause");
	        $(playlist.currentMedia)[0].currentTime = 0.0;
		}

        playlist.currentMediaIndex = 0;

        playlist.currentMedia = playlist.mediaElements[playlist.currentMediaIndex];

        playlist.previousMedia = playlist.mediaElements[playlist.mediaElements.length -1];

        if (playlist.currentMediaIndex + 1 < playlist.mediaElements.length) {
            playlist.nextMedia = playlist.mediaElements[playlist.currentMediaIndex + 1];
        } else {
            playlist.nextMedia = playlist.mediaElements[0];
        }

		$(playlist.mediaElements).hide();

		$(playlist.currentMedia).show();
    };

    Playlist.prototype.previous = function() {
		var playlist = this;

        $(playlist.currentMedia).trigger("pause");
        $(playlist.currentMedia)[0].currentTime = 0.0;

        $(playlist.currentMedia).hide();

        playlist.nextMedia = playlist.currentMedia;

        playlist.currentMediaIndex -= 1;

        if (playlist.currentMediaIndex < 0) {
            playlist.currentMediaIndex = playlist.mediaElements.length - 1;
        }

        playlist.currentMedia = playlist.mediaElements[playlist.currentMediaIndex];

        if (playlist.currentMediaIndex - 1 < 0) {
            playlist.previousMedia = playlist.mediaElements[0];
        } else {
            playlist.previousMedia = playlist.mediaElements[playlist.CurrentMediaIndex - 1];
        }

        $(playlist.currentMedia).show();

        $(playlist.currentMedia).trigger("play");
    };

    Playlist.prototype.next = function(manual) {
		var playlist = this;

		$(playlist.currentMedia)[0].pause();
        $(playlist.currentMedia)[0].currentTime = 0.0;

        $(playlist.currentMedia).hide();

        playlist.previousMedia = this.currentMedia;

        playlist.currentMediaIndex += 1;

        var reachedEnd = false;

        if (playlist.currentMediaIndex >= playlist.mediaElements.length) {
            playlist.currentMediaIndex = 0;

            reachedEnd = true;
        }

        playlist.currentMedia = playlist.mediaElements[playlist.currentMediaIndex];

        if (playlist.currentMediaIndex + 1 < playlist.mediaElements.length) {
            playlist.nextMedia = playlist.mediaElements[playlist.currentMediaIndex + 1];
        } else {
            playlist.nextMedia = playlist.mediaElements[0];
        }

        $(playlist.currentMedia).show();

		if (manual) {
			$(playlist.currentMedia).trigger("play");
		} else {
	        if (playlist.options.autoAdvance) {
	            if (reachedEnd) {
	                if (playlist.options.loop) {
	                    $(playlist.currentMedia).trigger("play");
	                }
	            } else {
	                $(playlist.currentMedia).trigger("play");
	            }
	        }
		}
    };

    Playlist.prototype.loadedMetadata = function(event) {
		var playlist = this;

        console.log("event", event);

        console.log("event.currentTarget", event.currentTarget);

        console.log("setting metadata-loaded", $(event.currentTarget).data("metadata-loaded", true));

        var allLoaded = true;

        $(playlist.mediaElements).each(function() {
            console.log("$(this).data(\"metadata-loaded\")", $(this).data("metadata-loaded"));

            if (!$(this).data("metadata-loaded")) {
                allLoaded = false;
            }
        });

        console.log("allLoaded", allLoaded);

        if (allLoaded) {
            this.loadedAllMetadata();
        }
    };

    Playlist.prototype.loadedAllMetadata = function() {
		var playlist = this;

        console.log(this.maxHeight);

        console.log(this.maxWidth);

        $(playlist.mediaContainer).css("height", playlist.maxHeight);
        $(playlist.mediaContainer).css("width", playlist.maxWidth);
        $(playlist.mediaContainer).css("line-height", playlist.maxHeight.toString() + "px");
        $(playlist.mediaContainer).css("text-align", "center");
    };

    $.fn[pluginName] = $[pluginName] = function (options, callback) {
        return this.each(function() {
            if (!$.data(this, prefix + pluginName)) {
                $.data(this, prefix + pluginName, new Playlist(this, options));
            }
        });
    };
}(jQuery, document, this));
