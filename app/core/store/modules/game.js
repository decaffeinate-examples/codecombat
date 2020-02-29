/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const levelSchema = require('schemas/models/level');
const api = require('core/api');

// TODO: Be explicit about the properties being stored
const emptyLevel = _.zipObject((Array.from(_.keys(levelSchema.properties)).map((key) => [key, null])));

// This module should eventually include things such as: session, player code, score, thangs, etc
module.exports = {
  namespaced: true,
  state: {
    level: emptyLevel,
    hintsVisible: false,
    timesCodeRun: 0,
    timesAutocompleteUsed: 0,
    playing: false
  },
  mutations: {
    setPlaying(state, playing) {
      return state.playing = playing;
    },
    setLevel(state, updates) {
      return state.level = $.extend(true, {}, updates);
    },
    setHintsVisible(state, visible) {
      return state.hintsVisible = visible;
    },
    incrementTimesCodeRun(state) {
      return state.timesCodeRun += 1;
    },
    setTimesCodeRun(state, times) {
      return state.timesCodeRun = times;
    },
    incrementTimesAutocompleteUsed(state) {
      return state.timesAutocompleteUsed += 1;
    },
    setTimesAutocompleteUsed(state, times) {
      return state.timesAutocompleteUsed = times;
    }
  }
};

Backbone.Mediator.subscribe('level:set-playing', function(e) {
  let left;
  const playing = (left = (e != null ? e : {}).playing) != null ? left : true;
  return application.store.commit('game/setPlaying', playing);
});
