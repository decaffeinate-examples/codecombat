/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const store = new Vuex.Store({
  strict: !application.isProduction(),

  state: {
    pageErrors: [],
    localesLoaded: {},
    features: {}
  },

  mutations: {
    addPageError(state, error) { return state.pageErrors.push(error); },
    clearPageErrors(state) { return state.pageErrors = []; },
    addLocaleLoaded(state, localeCode) {
      const addition = {};
      addition[localeCode] = true;
      return state.localesLoaded = _.assign(addition, state.localesLoaded);
    },
    updateFeatures(state, features) { return state.features = features; }
  },

  modules: {
    me: require('./modules/me').default,
    courses: require('./modules/courses'),
    game: require('./modules/game'),
    schoolAdministrator: require('./modules/schoolAdministrator').default,
    classrooms: require('./modules/classrooms').default,
    courseInstances: require('./modules/courseInstances').default,
    levelSessions: require('./modules/levelSessions').default,
    users: require('./modules/users').default,
    interactives: require('./modules/interactives').default,
    campaigns: require('./modules/campaigns').default,
    tints: require('./modules/tints').default,
    layoutChrome: require('./modules/layoutChrome').default,
    unitMap: require('./modules/unitMap').default
  }
});

module.exports = store;
