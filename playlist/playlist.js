;(function($, document, window) {
	var defaults = {
		audioOnly: false,
		autoAdvance: true,
		autoPlay: true,
		controls: true,
		loop: false,
		//onComplete: false,
		target: false,
		transitionDelay: 0,
		videoOnly: false
	},
	pluginName = "playlist",
	playlistContainerName = pluginName,
	prefix = "pl-",
	version = "0.0.1";

	function Playlist(element, options) {
		this.version = version;

		this.element = element;

		this.options = $.extend({}, defaults, options);

		this._defaults = defaults;

		this._name = pluginName;

		this.init();
	}

	Playlist.prototype.init = function() {
		this._videoElements = $(this.element).find("video");
		this._audioElements = $(this.element).find("audio");

		if (this.options.videoOnly) {
			this._mediaElements = this._videoElements;
		} else {
			if (this.options.audioOnly) {
				this._mediaElements = this._audioElements;
			} else {
				this._mediaElements = $(this.element).find("video, audio");
			}
		}

		this.appendHTML(this.options.target ? this.options.target : this.element, this.options.target ? false : true);

		this.attachEvents();

		this.launch();
	}

	Playlist.prototype.appendHTML = function(target, after) {
		var playlist = this;

		this.playlistContainer = $("<div id='" + prefix + playlistContainerName + "'></div>");

		this.mediaContainer = $("<div id='" + prefix + playlistContainerName + "-media'></div>");

		if (after) {
			$(target).after(this.playlistContainer);
		} else {
			$(target).append(this.playlistContainer);
		}

		$(this.playlistContainer).append(this.mediaContainer);

		this.mediaElements = [];

		$(this._mediaElements).each(function() {
			playlist.mediaElements.push($(this).clone().appendTo(playlist.mediaContainer)[0]);

			$(this).hide();
		});

		if (this.options.controls) {
			// TODO: Add ability to choose location for controls.
			this.addControls(this.playlistContainer);
		}
	}

	Playlist.prototype.addControls = function(target) {
		this.controlsContainer = $("<div id='" + prefix + playlistContainerName + "-controls'></div>");

		$(target).append(this.controlsContainer);

		this.controls = {};

		// TODO: Add ability to customize the controls text.
		this.controls.previous = $("<a href='javascript:void(0);' id='" + prefix + playlistContainerName + "-controls-previous'>&lt; Previous</a>");
		this.controls.next = $("<a href='javascript:void(0);' id='" + prefix + playlistContainerName + "-controls-next'>Next &gt;</a>");
		this.controls.play = $("<a href='javascript:void(0);' id='" + prefix + playlistContainerName + "-controls-play'>Play</a>");
		this.controls.pause = $("<a href='javascript:void(0);' id='" + prefix + playlistContainerName + "-controls-pause'>Pause</a>");
		this.controls.stop = $("<a href='javascript:void(0);' id='" + prefix + playlistContainerName + "-controls-stop'>Stop</a>");

		$(this.controlsContainer).append(this.controls.previous);
		$(this.controlsContainer).append(this.controls.next);
		$(this.controlsContainer).append(this.controls.play);
		$(this.controlsContainer).append(this.controls.pause);
		$(this.controlsContainer).append(this.controls.stop);
	}

	Playlist.prototype.attachEvents = function() {
		if (this.mediaElements.length > 0) {
			var playlist = this;

			$(this.mediaElements).each(function() {
				$(this).on("loadedmetadata", function(event) {
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
						playlist.minWidth = height;
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
			});

			$(this.mediaElements).on("ended", function(event) {
				$(this)[0].pause();
				$(this)[0].currentTime = 0.0;

				$(this).hide();

				playlist.previousMedia = this;

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

				if (playlist.options.autoAdvance) {
					if (reachedEnd) {
						if (playlist.options.loop) {
							$(playlist.currentMedia).trigger("play");
						}
					} else {
						$(playlist.currentMedia).trigger("play");
					}
				}
			});

			$(this.controls.play).on("click", function(event) {
				event.preventDefault();

				playlist.play();
			});

			$(this.controls.pause).on("click", function(event) {
				event.preventDefault();

				playlist.pause();
			});

			$(this.controls.stop).on("click", function(event) {
				event.preventDefault();

				playlist.stop();
			});

			$(this.controls.previous).on("click", function(event) {
				event.preventDefault();

				playlist.previous();
			});

			$(this.controls.next).on("click", function(event) {
				event.preventDefault();

				playlist.next();
			});
		}
	}

	// TODO: Determine if this needs a better name.
	Playlist.prototype.launch = function() {
		if (this.mediaElements.length > 0) {
			this.currentMediaIndex = 0;

			this.currentMedia = this.mediaElements[this.currentMediaIndex];

			this.previousMedia = this.mediaElements[this.mediaElements.length -1];

			if (this.currentMediaIndex + 1 < this.mediaElements.length) {
				this.nextMedia = this.mediaElements[this.currentMediaIndex + 1];
			} else {
				this.nextMedia = this.mediaElements[0];
			}

			$(this.mediaElements).hide();

			$(this.currentMedia).show();

			if (this.options.autoPlay) {
				$(this.currentMedia).trigger("play");
			}
		}
	}

	Playlist.prototype.play = function() {
		if ($(this.currentMedia)[0].paused) {
			$(this.currentMedia)[0].play();
		}
	}

	Playlist.prototype.pause = function() {
		if (!$(this.currentMedia)[0].paused) {
			$(this.currentMedia)[0].pause();
		}
	}

	Playlist.prototype.stop = function() {
		// TODO: Stop the current media and go back to the beginning.
	}

	Playlist.prototype.previous = function() {
		$(this.currentMedia)[0].pause();
		$(this.currentMedia)[0].currentTime = 0.0;

		$(this.currentMedia).hide();

		this.nextMedia = this.currentMedia;

		this.currentMediaIndex -= 1;

		if (this.currentMediaIndex < 0) {
			this.currentMediaIndex = this.mediaElements.length - 1;
		}

		this.currentMedia = this.mediaElements[this.currentMediaIndex];

		if (this.currentMediaIndex - 1 < 0) {
			this.previousMedia = this.mediaElements[0];
		} else {
			this.previousMedia = this.mediaElements[this.CurrentMediaIndex - 1];
		}

		$(this.currentMedia).show();

		$(this.currentMedia)[0].play();
	}

	Playlist.prototype.next = function() {
		$(this.currentMedia)[0].pause();
		$(this.currentMedia)[0].currentTime = 0.0;

		$(this.currentMedia).hide();

		this.previousMedia = this.currentMedia;

		this.currentMediaIndex += 1;

		if (this.currentMediaIndex >= this.mediaElements.length) {
			this.currentMediaIndex = 0;
		}

		this.currentMedia = this.mediaElements[this.currentMediaIndex];

		if (this.currentMediaIndex + 1 < this.mediaElements.length) {
			this.nextMedia = this.mediaElements[this.currentMediaIndex + 1];
		} else {
			this.nextMedia = this.mediaElements[0];
		}

		$(this.currentMedia).show();

		$(this.currentMedia)[0].play();
	}

	Playlist.prototype.loadedMetadata = function(event) {
		var allLoaded = true;

		$(this.mediaElements).each(function() {
			if ($(this)[0].HAVE_METADATA === 0) {
				allLoaded = false;
			}
		});

		if (allLoaded) {
			this.loadedAllMetadata();
		}
	}

	Playlist.prototype.loadedAllMetadata = function() {
		$(this.mediaContainer).css("height", this.maxHeight);
		$(this.mediaContainer).css("width", this.maxWidth);
		$(this.mediaContainer).css("line-height", this.maxHeight.toString() + "px");
		$(this.mediaContainer).css("text-align", "center");
	}

	$.fn[pluginName] = $[pluginName] = function (options, callback) {
		return this.each(function() {
			if (!$.data(this, prefix + pluginName)) {
				$.data(this, prefix + pluginName, new Playlist(this, options));
			}
		});
	}
}(jQuery, document, this));
