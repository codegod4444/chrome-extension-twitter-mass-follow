$.fn.isPresent = function() {
  return this.length > 0;
}

var USER_ID = $('#user-dropdown').find('[data-user-id]').data('user-id');

var Record = {
  storage:  chrome.storage.local,
  key:      USER_ID.toString(),  
  get:      function(success) {
    var self = this;
    this.storage.get(this.key, function(result) {
      self.result = result;
      success.call();
    });
  },
  set:      function() {
    this.storage.set(this.result);
  },
  add:      function(id) {
    if ( this.result[this.key] ) {
      this.result[this.key] += id;
    } else {
      this.result[this.key] = id;
    }
    this.set();
  },
  includes: function(id) {
    if ( this.result[this.key] ) {
      return this.result[this.key].includes(id);
    } else {
      return false;
    }
  }
}

var tmf = {
  init: function() {
    var self = this;
    self.$el = $('<div>').addClass('tmf animated').appendTo('body');
  },
  toggle: function() {
    var self = this;
    this.$el.removeClass('flipInY flipOutY tmf--active')
    if ( $('.ProfileCard').length > 10 ) {
      self.$el.load(chrome.extension.getURL('html/actions.html'), {}, function() {
        $('.tmf-btn').on('click', function() { self.$el.addClass('tmf--active') });
        self.followBtn = new Button($('.tmf-btn--follow'), function() {  this.follow(); });
        self.unfollowBtn = new Button($('.tmf-btn--unfollow'), function() {  this.unfollow(); });
        self.$el.addClass('flipInY');
        var messageObserver = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            var html = $('#message-drawer').html();
            // http://support.twitter.com/articles/66885-i-can-t-follow-people-follow-limits
            if ( html.includes('66885') ) {
              self.followBtn.setIdle();
            }
          });    
        });
        messageObserver.observe(document.getElementById('message-drawer'), { subtree: true, characterData: true, childList: true });
        $('#tmf_without_exception').on('change', function() {
          self.withoutException = this.checked;
          if ( this.checked ) {
            self.followBtn.$subtitle.text('without exception');
            self.unfollowBtn.$subtitle.text('without exception');
          } else {
            self.followBtn.$subtitle.text('who have never been unfollowed');
            self.unfollowBtn.$subtitle.text('who do not follow you');
          }
        });
      });
    } else {
      this.$el.addClass('flipOutY');
    }
  },
  withoutException: false
}

function Button($el, profileAction) {
  var self = this;
  self.$el = $el;
  self.count = 0;
  self.$title = $el.find('.tmf-btn__title');
  self.$subtitle = $el.find('.tmf-btn__subtitle');
  self.action = new BulkAction(profileAction);
  self.$el.on('click', function() {
    self.$el.addClass('tmf-btn--active');
    self.$title.text(self.count);
    if ( self.action.paused ) {
      self.action.proceed();
      self.$subtitle.text('Click to pause');
    } else {
      self.action.pause();
      self.$subtitle.text('Click to continue');
    }
  });
}
$.extend(Button.prototype, {
  incrementCount: function() {
    this.count++;
    this.$title.text(this.count);
  },
  setIdle: function() {
    var self = this;
    if ( !self.action.paused ) {
      var count = 60;
      self.action.pause();
      var countDown = setInterval(function() {
        if ( self.action.paused ) {
          self.$subtitle.text('Continuing in ' + count + ' seconds...');
          if ( 0 == count ) {
            clearInterval(countDown);
            $('#message-drawer').find('.message-text').text("");
            self.$el.click();
          } else {
            count--;
          }
        } else {
          clearInterval(countDown);
        }
      }, 1000);
    }
  }
});

function Profile(nth) {
  this.$el = $('.ProfileCard:eq(' + nth + ')');
  if ( this.isLoaded() ) {
    this.$btn = this.$el.find('.user-actions-follow-button');
    this.id = this.$el.data('user-id') + '-';
  }
}

$.extend(Profile.prototype, {
  isLoaded: function() {
    return this.$el.isPresent();
  },
  isFollowing: function() {
    return this.$el.find('.FollowStatus').isPresent();
  },
  isNotFollowing: function() {
    return !this.isFollowing();
  },
  isFollowable: function() {
    return this.$btn.children('.follow-text').is(':visible');
  },
  isFollowed: function() {
    return this.$btn.children('.following-text').is(':visible');
  },
  follow: function() {
    if ( this.isFollowable() ) {
      if ( tmf.withoutException || !Record.includes(this.id) ) {
        this.click();
        tmf.followBtn.incrementCount();
      } else {
        this.log('warn', 'Already unfollowed once');
      }
    }
  },
  unfollow: function() {
    if ( this.isFollowed() ) {
      if ( tmf.withoutException || this.isNotFollowing() ) {
        this.click();
        tmf.unfollowBtn.incrementCount();
        Record.add(this.id);
      }
    }
  },
  click: function() {
    this.log('success', 'Clicked on "' + this.$btn.children(':visible').text().trim() + '"');
    this.$btn.click();
    this.clicked = true;
  },
  log:  function(type, text) {
    $('<div>')
      .addClass('tmf-log')
      .addClass('tmf-log--' + type)
      .text(text)
      .insertBefore(this.$el.find('.ProfileCard-bio'));
  }
});

function BulkAction(callback) {
  this.callback = callback;
  this.paused = true;
}

$.extend(BulkAction.prototype, {
  nth:  0,
  loadAttempts: 0,
  _loadProfiles: function() {
    if ( this.loadAttempts < 10 ) {
      this.last.$btn.focus();
      this.loadAttempts++;
      this._sleep(700);
    }
  },
  _sleep: function(milliseconds) {
    var self = this;
    setTimeout(function() { self.run(); }, milliseconds);
  },
  run: function() {
    if ( this.paused ) {
      return;
    }
    var profile = new Profile(this.nth);
    if ( profile.isLoaded() ) {
      this.loadAttempts = 0;
      this.callback.call(profile);
      this.last = profile;
      this.nth++;
      if ( profile.clicked ) {
        this._sleep(100);
      } else {
        this.run();
      }
    } else {
      this._loadProfiles();
    }
  },
  pause: function() {
    this.paused = true;
  },
  proceed: function() {
    this.paused = false;
    this.run();
  }
});

Record.get(function() {
  tmf.init();
  tmf.toggle();
});

var observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    tmf.toggle();
  });    
});
observer.observe(document.querySelector('head > title'), { subtree: true, characterData: true, childList: true });
