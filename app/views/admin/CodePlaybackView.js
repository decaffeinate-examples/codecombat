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
let CodePlaybackView;
require('app/styles/admin/codeplayback-view.sass');
const CocoView = require('views/core/CocoView');
const LZString = require('lz-string');
const CodeLog = require('models/CodeLog');
const aceUtils = require('core/aceUtils');
const utils = require('core/utils');
const MusicPlayer = require('lib/surface/MusicPlayer');

const template = require('templates/admin/codeplayback-view');

module.exports = (CodePlaybackView = (function() {
  CodePlaybackView = class CodePlaybackView extends CocoView {
    static initClass() {
      this.prototype.id = 'codeplayback-view';
      this.prototype.template = template;
      this.prototype.controlsEnabled = true;
      this.prototype.events = {
        'click #play-button': 'onPlayClicked',
        'input #slider': 'onSliderInput',
        'click #pause-button': 'onPauseClicked',
        'click .speed-button': 'onSpeedButtonClicked'
      };
    }

    constructor(options) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.updateSlider = this.updateSlider.bind(this);
      super();
      this.spade = new Spade();
      this.options = options;
      this.options.decompressedLog = LZString.decompressFromUTF16(this.options.rawLog);
      if (this.options.decompressedLog == null) { return; }
      this.options.events = this.spade.expand(JSON.parse(this.options.decompressedLog));
      this.maxTime = this.options.events[this.options.events.length - 1].timestamp;
    }
      //@spade.play(@options.events, $('#codearea').context)

    afterRender() {
      if (this.options.events == null) { return; }
      const initialSource = this.options.events[0].difContent;
      let codeLanguageGuess = 'python';
      if (/^ *var /m.test(initialSource)) { codeLanguageGuess = 'javascript'; }
      this.ace = aceUtils.initializeACE(this.$('#acearea')[0], codeLanguageGuess);
      this.ace.$blockScrolling = Infinity;
      this.ace.setValue(this.options.events[0].difContent);
      this.$el.find('#start-time').text('0s');
      this.$el.find('#end-time').text((this.maxTime / 1000) + 's');
      return (() => {
        const result = [];
        for (let ev of Array.from(this.options.events)) {
          const div = $('<div></div>');
          div.addClass('event');
          div.css('left', `calc(${(ev.timestamp / this.maxTime) * 100}% + 7px - ${(15 * ev.timestamp) / this.maxTime}px)`);
          result.push(this.$el.find('#slider-container').prepend(div));
        }
        return result;
      })();
    }

    updateSlider() {
      this.$el.find('#slider')[0].value = (this.spade.elapsedTime / this.maxTime) * 100;
      this.$el.find('#start-time').text((this.spade.elapsedTime / 1000).toFixed(0) + 's');
      if (this.spade.elapsedTime >= this.maxTime) {
        this.clearPlayback();
        return this.fun();
      }
    }

    onPlayClicked(e) {
      this.clearPlayback();
      this.spade.play(this.options.events, this.ace, this.$el.find('#slider')[0].value / 100);
      this.interval = setInterval(this.updateSlider, 1);
      return this.fun();
    }

    fun() {
      if ((this.spade.speed === 8) && this.spade.playback) {
        me.set('music', true);
        me.set('volume', 1);
        if (!this.musicPlayer) {
          const musicFile = 'https://archive.org/download/BennyHillYaketySax/MusicaDeCirco-BennyHill.mp3';
          this.musicPlayer = new MusicPlayer();
          return Backbone.Mediator.publish('music-player:play-music', {play: true, file: musicFile});
        }
      } else {
        if (this.musicPlayer != null) {
          this.musicPlayer.destroy();
        }
        return this.musicPlayer = undefined;
      }
    }

    onSpeedButtonClicked(e) {
      this.spade.speed = $(e.target).data('speed');
      $(e.target).siblings().removeClass('clicked');
      $(e.target).addClass('clicked');
      return this.fun();
    }

    onSliderInput(e) {
      this.clearPlayback();
      this.$el.find('#start-time').text((((this.$el.find('#slider')[0].value / 100) * this.maxTime) / 1000).toFixed(0) + 's');
      const render = this.spade.renderTime(this.options.events, this.ace, this.$el.find('#slider')[0].value / 100);
      this.ace.setValue(render.result);
      if ((render.selFIndex != null) && (render.selEIndex != null)) {
        this.ace.selection.moveCursorToPosition(render.selFIndex);
        return this.ace.selection.setSelectionAnchor(render.selEIndex.row, render.selEIndex.column);
      }
    }

    clearPlayback() {
      if (this.interval != null) { clearInterval(this.interval); }
      this.interval = undefined;
      if (this.spade.playback != null) { clearInterval(this.spade.playback); }
      return this.spade.playback = undefined;
    }

    onPauseClicked(e) {
      this.clearPlayback();
      return this.fun();
    }

    destroy() {
      this.clearPlayback();
      if (this.musicPlayer != null) {
        this.musicPlayer.destroy();
      }
      return super.destroy();
    }
  };
  CodePlaybackView.initClass();
  return CodePlaybackView;
})());
