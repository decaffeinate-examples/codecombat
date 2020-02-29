/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let LevelChatView;
require('app/styles/play/level/chat.sass');
const CocoView = require('views/core/CocoView');
const template = require('templates/play/level/chat');
const {me} = require('core/auth');
const LevelBus = require('lib/LevelBus');

module.exports = (LevelChatView = (function() {
  LevelChatView = class LevelChatView extends CocoView {
    static initClass() {
      this.prototype.id = 'level-chat-view';
      this.prototype.template = template;
      this.prototype.open = false;
  
      this.prototype.events = {
        'keypress textarea': 'onChatKeydown',
        'click i': 'onIconClick'
      };
  
      this.prototype.subscriptions =
        {'bus:new-message': 'onNewMessage'};
    }

    constructor(options) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.clearOldMessages = this.clearOldMessages.bind(this);
      this.levelID = options.levelID;
      this.session = options.session;
      // TODO: we took out session.multiplayer, so this will not fire. If we want to resurrect it, we'll of course need a new way of activating chat.
      this.listenTo(this.session, 'change:multiplayer', this.updateMultiplayerVisibility);
      this.sessionID = options.sessionID;
      this.bus = LevelBus.get(this.levelID, this.sessionID);
      super();
      this.regularlyClearOldMessages();
      this.playNoise = _.debounce(this.playNoise, 100);
    }

    updateMultiplayerVisibility() {
      if (this.$el == null) { return; }
      try {
        return this.$el.toggle(Boolean(this.session.get('multiplayer')));
      } catch (e) {
        return console.error(`Couldn't toggle the style on the LevelChatView to ${Boolean(this.session.get('multiplayer'))} because of an error:`, e);
      }
    }

    afterRender() {
      this.chatTables = $('table', this.$el);
      return this.updateMultiplayerVisibility();
    }

    regularlyClearOldMessages() {
      return this.clearOldMessagesInterval = setInterval(this.clearOldMessages, 5000);
    }

    clearOldMessages() {
      const rows = $('.closed-chat-area tr');
      return (() => {
        const result = [];
        for (let row of Array.from(rows)) {
          row = $(row);
          const added = row.data('added');
          if ((new Date().getTime() - added) > (60 * 1000)) {
            result.push(row.fadeOut(1000, function() { return $(this).remove(); }));
          } else {
            result.push(undefined);
          }
        }
        return result;
      })();
    }

    onNewMessage(e) {
      if (!e.message.system) { this.$el.show(); }
      this.addOne(e.message);
      this.trimClosedPanel();
      if (e.message.authorID !== me.id) { return this.playNoise(); }
    }

    playNoise() {
      return this.playSound('chat_received');
    }

    messageObjectToJQuery(message) {
      const td = $('<td></td>');
      let {
        content
      } = message;
      content = _.string.escapeHTML(content);
      content = content.replace(/\n/g, '<br/>');
      content = content.replace(RegExp('  ', 'g'), '&nbsp; '); // coffeescript can't compile '/  /g'
      if (_.string.startsWith(content, '/me')) {
        content = message.authorName + content.slice(3);
      }

      if (message.system) {
        td.append($('<span class="system"></span>').html(content));

      } else if (_.string.startsWith(content, '/me')) {
        td.append($('<span class="action"></span>').html(content));

      } else {
        td.append($('<strong></strong>').text(message.authorName+': '));
        td.append($('<span></span>').html(content));
      }

      const tr = $('<tr></tr>');
      if (message.authorID === me.id) { tr.addClass('me'); }
      return tr.append(td);
    }

    addOne(message) {
      let doScroll;
      if (message.system && (message.authorID === me.id)) { return; }
      if (this.open) {
        const openPanel = $('.open-chat-area', this.$el);
        const height = openPanel.outerHeight();
        const distanceFromBottom = openPanel[0].scrollHeight - height - openPanel[0].scrollTop;
        doScroll = distanceFromBottom < 10;
      }
      const tr = this.messageObjectToJQuery(message);
      tr.data('added', new Date().getTime());
      this.chatTables.append(tr);
      if (doScroll) { return this.scrollDown(); }
    }

    trimClosedPanel() {
      const closedPanel = $('.closed-chat-area', this.$el);
      const limit = 5;
      const rows = $('tr', closedPanel);
      return (() => {
        const result = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if ((rows.length - i) <= limit) { break; }
          result.push(row.remove());
        }
        return result;
      })();
    }

    onChatKeydown(e) {
      if (key.isPressed('enter')) {
        const message = _.string.strip($(e.target).val());
        if (!message) { return false; }
        this.bus.sendMessage(message);
        $(e.target).val('');
        return false;
      }
    }

    onIconClick() {
      this.open = !this.open;
      const openPanel = $('.open-chat-area', this.$el).toggle(this.open);
      const closedPanel = $('.closed-chat-area', this.$el).toggle(!this.open);
      if (this.open) { this.scrollDown(); }
      if (window.getSelection != null) {
        const sel = window.getSelection();
        if (typeof sel.empty === 'function') {
          sel.empty();
        }
        return (typeof sel.removeAllRanges === 'function' ? sel.removeAllRanges() : undefined);
      } else {
        return document.selection.empty();
      }
    }

    scrollDown() {
      const openPanel = $('.open-chat-area', this.$el)[0];
      return openPanel.scrollTop = openPanel.scrollHeight || 1000000;
    }

    destroy() {
      key.deleteScope('level');
      if (this.clearOldMessagesInterval) { clearInterval(this.clearOldMessagesInterval); }
      return super.destroy();
    }
  };
  LevelChatView.initClass();
  return LevelChatView;
})());
