/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let SoundScriptModule;
const ScriptModule = require('./ScriptModule');

const currentMusic = null;
const standingBy = null;

const {me} = require('core/auth');

module.exports = (SoundScriptModule = class SoundScriptModule extends ScriptModule {
  static neededFor(noteGroup) {
    return (noteGroup.sound != null);
  }

  startNotes() {
    const notes = [];
    if (this.noteGroup.sound.suppressSelectionSounds != null) { notes.push(this.addSuppressSelectionSoundsNote()); }
    if (this.noteGroup.sound.music != null) { notes.push(this.addMusicNote()); }
    return notes;
  }

  endNotes() {
    return [];
  }

  skipNotes() {
    return this.startNotes();
  }

  addSuppressSelectionSoundsNote() {
    const note = {
      channel: 'level:suppress-selection-sounds',
      event: {suppress: this.noteGroup.sound.suppressSelectionSounds}
    };
    return note;
  }

  addMusicNote() {
    const note = {
      channel: 'music-player:play-music',
      event: this.noteGroup.sound.music
    };
    return note;
  }
});
