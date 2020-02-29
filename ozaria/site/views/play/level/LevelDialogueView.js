/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let LevelDialogueView;
require('ozaria/site/styles/play/level/level-dialogue-view.sass');
const CocoView = require('views/core/CocoView');
const template = require('ozaria/site/templates/play/level/level-dialogue-view');

module.exports = (LevelDialogueView = (function() {
  LevelDialogueView = class LevelDialogueView extends CocoView {
    static initClass() {
      this.prototype.id = 'level-dialogue-view';
      this.prototype.template = template;
  
      this.prototype.subscriptions =
        {'sprite:speech-updated': 'onSpriteDialogue'};
  
      this.prototype.events =
        {'click': 'onClick'};
    }

    constructor(options) {
      super(options);
      this.level = options.level;
      this.sessionID = options.sessionID;
    }

    onClick(e) {
      return Backbone.Mediator.publish('script:end-current-script', {});
    }

    onSpriteDialogue(e) {
      if (e.message) {
        const currentMessage = e.message.replace(/&lt;i class=&#39;(.+?)&#39;&gt;&lt;\/i&gt;/, "<i class='$1'></i>");
        $('.vega-dialogue').text(currentMessage);
        // The entire view is invisible until we have a message
        return $('#level-dialogue-view')[0].style.display = 'flex';
      }
    }

    isFullScreen() {
      return document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
    }
  };
  LevelDialogueView.initClass();
  return LevelDialogueView;
})());
