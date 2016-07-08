// this.userId = document.getElementById('user-dropdown').querySelectorAll('[data-user-id]')[0].dataset.userId
//
import TwitterMassFollow from './twitter_mass_follow.js'
import Session from './session.js'
import CardProfile from './card_profile.js'
import StreamProfile from './stream_profile.js'

let extension = new TwitterMassFollow()

extension.load().then(() => {
  let session = new Session()
  
  session.pageChanged(() => {  
    let streamProfilesPresent = StreamProfile.isPresent()
    let cardProfilesPresent = CardProfile.isPresent()
    let profilesPresent = streamProfilesPresent || cardProfilesPresent
    if ( profilesPresent ) {
      let extension.unfollow = session.showsMyFollowers()
      extension.getProfile = (nth) => {
        if (streamProfilesPresent) {
          return StreamProfile.nth(nth)
        } else if (cardProfilesPresent) {
          return CardProfile.nth(nth)
        }
      }
      extension.show()
    } else {
      extension.hide()
    }
  })
})
  
/*
$.fn.isPresent = function() {
  return this.length > 0;
}

var USER_ID = $('#user-dropdown').find('[data-user-id]').data('user-id');

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
        self.followBtn = new Button($('.tmf-btn--follow'), function() {  this.follow(); }, 250);
        self.unfollowBtn = new Button($('.tmf-btn--unfollow'), function() {  this.unfollow(); }, 100);
        self.$el.addClass('flipInY');
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

Record.get(function() {
  tmf.init();
  tmf.toggle();
});

*/