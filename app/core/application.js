/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const FacebookHandler = require('core/social-handlers/FacebookHandler');
const GPlusHandler = require('core/social-handlers/GPlusHandler');
const GitHubHandler = require('core/social-handlers/GitHubHandler');
const locale = require('locale/locale');
const {me} = require('core/auth');
const storage = require('core/storage');
const Tracker = require('core/Tracker');
const CocoModel = require('models/CocoModel');
const api = require('core/api');

marked.setOptions({gfm: true, sanitize: true, smartLists: true, breaks: false});

// TODO, add C-style macro constants like this?
window.SPRITE_RESOLUTION_FACTOR = 3;
window.SPRITE_PLACEHOLDER_WIDTH = 60;

// Prevent Ctrl/Cmd + [ / ], P, S
const ctrlDefaultPrevented = [219, 221, 80, 83];
const preventBackspace = function(event) {
  if ((event.keyCode === 8) && !elementAcceptsKeystrokes(event.srcElement || event.target)) {
    return event.preventDefault();
  } else if ((event.ctrlKey || event.metaKey) && !event.altKey && Array.from(ctrlDefaultPrevented).includes(event.keyCode)) {
    console.debug("Prevented keystroke", key, event);
    return event.preventDefault();
  }
};

var elementAcceptsKeystrokes = function(el) {
  // http://stackoverflow.com/questions/1495219/how-can-i-prevent-the-backspace-key-from-navigating-back
  if (el == null) { el = document.activeElement; }
  const tag = el.tagName.toLowerCase();
  const type = el.type != null ? el.type.toLowerCase() : undefined;
  const textInputTypes = ['text', 'password', 'file', 'number', 'search', 'url', 'tel', 'email', 'date', 'month', 'week', 'time', 'datetimelocal'];
  // not radio, checkbox, range, or color
  return ((tag === 'textarea') || ((tag === 'input') && Array.from(textInputTypes).includes(type)) || ['', 'true'].includes(el.contentEditable)) && !(el.readOnly || el.disabled);
};

const COMMON_FILES = ['/images/pages/base/modal_background.png', '/images/level/popover_background.png', '/images/level/code_palette_wood_background.png', '/images/level/code_editor_background_border.png'];
const preload = arrayOfImages => $(arrayOfImages).each(function() {
  return $('<img/>')[0].src = this;
});

// IE9 doesn't expose console object unless debugger tools are loaded
if (window.console == null) { window.console = {
  info() {},
  log() {},
  error() {},
  debug() {}
}; }
if (console.debug == null) { console.debug = console.log; }  // Needed for IE10 and earlier

const Application = {
  initialize() {
//    if features.codePlay and me.isAnonymous()
//      document.location.href = '//lenovogamestate.com/login/'
    const Router = require('core/Router');
    this.isProduction = () => document.location.href.search('https?://localhost') === -1;
    Vue.config.devtools = !this.isProduction();

    // propagate changes from global 'me' User to 'me' vuex module
    const store = require('core/store');
    me.on('change', () => store.commit('me/updateUser', me.changedAttributes()));
    store.commit('me/updateUser', me.attributes);
    store.commit('updateFeatures', features);
    if (me.showChinaRemindToast()) {
      setInterval(( () => noty({
        text: '你已经练习了一个小时了，建议休息一会儿哦',
        layout: 'topRight',
        type:'warning',
        killer: false,
        timeout: 5000
        })), 3600000);  // one hour
    }


    this.store = store;
    this.api = api;

    this.isIPadApp = ((typeof webkit !== 'undefined' && webkit !== null ? webkit.messageHandlers : undefined) != null) && ((navigator.userAgent != null ? navigator.userAgent.indexOf('CodeCombat-iPad') : undefined) !== -1);
    if (this.isIPadApp) { $('body').addClass('ipad'); }
    if (window.serverConfig.picoCTF) { $('body').addClass('picoctf'); }
    if ($.browser.msie && (parseInt($.browser.version) === 10)) {
      $("html").addClass("ie10");
    }
    this.tracker = new Tracker();
    if (me.useSocialSignOn()) {
      this.facebookHandler = new FacebookHandler();
      this.gplusHandler = new GPlusHandler();
      this.githubHandler = new GitHubHandler();
    }
    locale.load(me.get('preferredLanguage', true)).then(() => {
      return this.tracker.promptForCookieConsent();
    });
    const preferredLanguage = me.get('preferredLanguage') || 'en';
    $(document).bind('keydown', preventBackspace);
    preload(COMMON_FILES);
    moment.relativeTimeThreshold('ss', 1); // do not return 'a few seconds' when calling 'humanize'
    CocoModel.pollAchievements();
    if (!me.get('anonymous')) {
      this.checkForNewAchievement();
    }
    return $.i18n.init({
      lng: me.get('preferredLanguage', true),
      fallbackLng: 'en',
      resStore: locale,
      useDataAttrOptions: true
      //debug: true
      //sendMissing: true
      //sendMissingTo: 'current'
      //resPostPath: '/languages/add/__lng__/__ns__'
    }, t => {
      this.router = new Router();
      this.userIsIdle = false;
      const onIdleChanged = to => { return () => { return Backbone.Mediator.publish('application:idle-changed', {idle: (this.userIsIdle = to)}); }; };
      this.idleTracker = new Idle({
        onAway: onIdleChanged(true),
        onAwayBack: onIdleChanged(false),
        onHidden: onIdleChanged(true),
        onVisible: onIdleChanged(false),
        awayTimeout: 5 * 60 * 1000
      });
      return this.idleTracker.start();
    });
  },

  checkForNewAchievement() {
    let startFrom;
    if (me.get('lastAchievementChecked')) {
      startFrom = new Date(me.get('lastAchievementChecked'));
    } else {
      startFrom = me.created();
    }

    const daysSince = moment.duration(new Date() - startFrom).asDays();
    if (daysSince > 1) {
      return me.checkForNewAchievement().then(() => this.checkForNewAchievement());
    }
  },

  featureMode: {
    useChina() { return api.admin.setFeatureMode('china').then(() => document.location.reload()); },
    useCodePlay() { return api.admin.setFeatureMode('code-play').then(() => document.location.reload()); },
    usePicoCtf() { return api.admin.setFeatureMode('pico-ctf').then(() => document.location.reload()); },
    useBrainPop() { return api.admin.setFeatureMode('brain-pop').then(() => document.location.reload()); },
    clear() { return api.admin.clearFeatureMode().then(() => document.location.reload()); }
  },

  loadedStaticPage: (window.alreadyLoadedView != null),

  setHocCampaign(campaignSlug) { return storage.save('hoc-campaign', campaignSlug); },
  getHocCampaign() { return storage.load('hoc-campaign'); }

};

module.exports = Application;
window.application = Application;
