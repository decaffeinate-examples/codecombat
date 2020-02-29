/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let SpritesScriptModule;
const ScriptModule = require('./ScriptModule');
const {me} = require('core/auth');
const utils = require('core/utils');

module.exports = (SpritesScriptModule = class SpritesScriptModule extends ScriptModule {
  static neededFor(noteGroup) {
    return (noteGroup.sprites != null ? noteGroup.sprites.length : undefined);
  }

  startNotes() {
    let sprite;
    const notes = [];
    this.moveSums = {};
    this.speakingSprites = {};
    for (sprite of Array.from(this.noteGroup.sprites || [])) {
      if (sprite.move != null) { notes.push(this.spriteMoveNote(sprite)); }
    }
    for (sprite of Array.from(this.noteGroup.sprites || [])) {
      if (sprite.say != null) { notes.push(this.spriteSayNote(sprite, this.noteGroup.script)); }
      if (sprite.select != null) { notes.push(this.spriteSelectNote(sprite)); }
    }
    return (Array.from(notes).filter((n) => n));
  }

  spriteMoveNote(sprite, instant) {
    if (instant == null) { instant = false; }
    const duration = instant ? 0 : sprite.move.duration;
    const note = {
      channel: 'sprite:move',
      event: {
        pos: sprite.move.target,
        duration,
        spriteID: sprite.id
      }
    };
    if (duration) {
      if (this.moveSums[sprite.id] == null) { this.moveSums[sprite.id] = 0; }
      note.delay = this.scrubbingTime + this.moveSums[sprite.id];
      this.moveSums[sprite.id] += sprite.move.duration;
    }
    return note;
  }

  spriteSayNote(sprite, script) {
    if (this.speakingSprites[sprite.id]) { return; }
    let {
      responses
    } = sprite.say;
    if (!script.skippable && !responses) { responses = []; }
    for (let response of Array.from(responses != null ? responses : [])) {
      response.text = utils.i18n(response, 'text');
    }
    const text = utils.i18n(sprite.say, 'text');
    const blurb = utils.i18n(sprite.say, 'blurb');
    const sound = utils.i18n(sprite.say, 'sound');
    const note = {
      channel: 'level:sprite-dialogue',
      event: {
        message: text,
        blurb,
        mood: sprite.say.mood || 'explain',
        responses,
        spriteID: sprite.id,
        sound
      }
    };
    this.maybeApplyDelayToNote(note);
    return note;
  }

  spriteSelectNote(sprite) {
    const note = {
      channel: 'level:select-sprite',
      event: {
        thangID: sprite.select ? sprite.id : null
      }
    };
    return note;
  }

  endNotes() {
    const notes = {};
    for (let sprite of Array.from(this.noteGroup.sprites || [])) {
      if (notes[sprite.id] == null) { notes[sprite.id] = {}; }
      if (sprite.move != null) { notes[sprite.id]['move'] = (this.spriteMoveNote(sprite, true)); }
      if (sprite.say != null) { notes[sprite.id]['say'] = { channel: 'level:sprite-clear-dialogue' }; }
    }
    const noteArray = [];
    for (let spriteID in notes) {
      for (let type in notes[spriteID]) {
        noteArray.push(notes[spriteID][type]);
      }
    }
    return noteArray;
  }
});
