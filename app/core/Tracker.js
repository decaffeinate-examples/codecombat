/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Tracker;
const {me} = require('core/auth');
const SuperModel = require('models/SuperModel');
const utils = require('core/utils');
const CocoClass = require('core/CocoClass');
const loadSegmentIo = require('core/services/segment');
const api = require('core/api');

const experiments = require('core/experiments');

const debugAnalytics = false;

module.exports = (Tracker = (function() {
  Tracker = class Tracker extends CocoClass {
    static initClass() {
      this.prototype.initialized = false;
      this.prototype.cookies = {required: false, answered: false, consented: false, declined: false};
    }
    constructor() {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      this.trackEvent = this.trackEvent.bind(this);
      this.trackSnowplow = this.trackSnowplow.bind(this);
      this.trackEventInternal = this.trackEventInternal.bind(this);
      super();
      if (window.tracker) {
        console.error('Overwrote our Tracker!', window.tracker);
      }
      window.tracker = this;
      this.supermodel = new SuperModel();
      this.isProduction = document.location.href.search('codecombat.com') !== -1;
      this.promptForCookieConsent();  // Will call finishInitialization
    }

    promptForCookieConsent() {
      if (!$.i18n.lng()) { return; }  // Will initialize once we finish initializing translations
      if (!me.get('country') || !me.inEU()) { return this.finishInitialization(); }
      this.cookies.required = true;
      if (this.cookiePopup != null) {
        this.cookiePopup.close();
      }
      window.cookieconsent.hasTransition = false;
      return window.cookieconsent.initialise({
        onPopupOpen() {
          return window.tracker.cookiePopup = this;
        },
        onInitialise(status) {
          window.tracker.cookiePopup = this;
          window.tracker.cookies.answered = ['allow', 'dismiss', 'deny'].includes(status);
          window.tracker.cookies.consented = ['allow', 'dismiss'].includes(status);
          window.tracker.cookies.declined = status === 'deny';
          if (debugAnalytics) { console.log('Initial cookie consent status:', status, window.tracker.cookies); }
          return window.tracker.finishInitialization();
        },
        onStatusChange(status) {
          window.tracker.cookies.answered = ['allow', 'dismiss', 'deny'].includes(status);
          window.tracker.cookies.consented = ['allow', 'dismiss'].includes(status);
          window.tracker.cookies.declined = status === 'deny';
          if (debugAnalytics) { return console.log('Cookie consent status change:', status, window.tracker.cookies); }
        },
        container: document.getElementById('#page-container'),
        palette: {popup: {background: "#000"}, button: {background: "#f1d600"}},
        hasTransition: false,
        revokable: true,
        law: false,
        location: false,
        type: 'opt-out',
        content: {
          message: $.i18n.t('legal.cookies_message'),
          dismiss: $.i18n.t('general.accept'),
          deny: $.i18n.t('legal.cookies_deny'),
          link: $.i18n.t('nav.privacy'),
          href: '/privacy'
        }
      });
    }

    finishInitialization() {
      if (this.initialized) { return; }
      this.initialized = true;
      this.trackReferrers();
      this.identify(); // Needs supermodel to exist first
      if (me.get('role')) { this.updateRole(); }
      if (me.isTeacher(true) && !me.get('unsubscribedFromMarketingEmails')) {
        return this.updateIntercomRegularly();
      }
    }

    trackReferrers() {
      let referrer, siteref;
      const elapsed = new Date() - new Date(me.get('dateCreated'));
      if (!(elapsed < (5 * 60 * 1000))) { return; }
      if (me.get('siteref') || me.get('referrer')) { return; }
      let changed = false;
      if (siteref = utils.getQueryVariable('_r')) {
        me.set('siteref', siteref);
        changed = true;
      }
      if (referrer = document.referrer) {
        me.set('referrer', referrer);
        changed = true;
      }
      if (changed) { return me.patch(); }
    }

    identify(traits) {
      // Save explicit traits for internal tracking
      if (traits == null) { traits = {}; }
      if (this.explicitTraits == null) { this.explicitTraits = {}; }
      for (let key in traits) { const value = traits[key]; this.explicitTraits[key] = value; }

      const traitsToReport = [
        'email', 'anonymous', 'dateCreated', 'hourOfCode', 'name', 'referrer', 'testGroupNumber', 'testGroupNumberUS',
        'gender', 'lastLevel', 'siteref', 'ageRange', 'schoolName', 'coursePrepaidID', 'role'
      ];

      if (me.isTeacher(true)) {
        traitsToReport.push('firstName', 'lastName');
      }
      for (let userTrait of Array.from(traitsToReport)) {
        if (me.get(userTrait) != null) { if (traits[userTrait] == null) { traits[userTrait] = me.get(userTrait); } }
      }
      if (me.isTeacher(true)) {
        traits.teacher = true;
      }
      traits.host = document.location.host;

      if (debugAnalytics) { console.log('Would identify', me.id, traits); }
      this.trackEventInternal('Identify', {id: me.id, traits});
      if (!this.shouldTrackExternalEvents()) { return; }

      if (me.isTeacher(true) && this.segmentLoaded && !me.get('unsubscribedFromMarketingEmails')) {
        traits.createdAt = me.get('dateCreated');  // Intercom, at least, wants this
        return analytics.identify(me.id, traits);
      }
    }

    trackPageView(includeIntegrations) {
      if (includeIntegrations == null) { includeIntegrations = []; }
      const name = Backbone.history.getFragment();
      const url = `/${name}`;

      if (debugAnalytics) { console.log(`Would track analytics pageview: ${url}`); }
      this.trackEventInternal('Pageview', {url: name, href: window.location.href});
      if (!this.shouldTrackExternalEvents()) { return; }

      // Google Analytics
      // https://developers.google.com/analytics/devguides/collection/analyticsjs/pages
      if (typeof ga === 'function') {
        ga('send', 'pageview', url);
      }
      if (features.codePlay) { if (typeof ga === 'function') {
        ga('codeplay.send', 'pageview', url);
      } }
      window.snowplow('trackPageView');

      if (me.isTeacher(true) && this.segmentLoaded) {
        const options = {};
        if (includeIntegrations != null ? includeIntegrations.length : undefined) {
          options.integrations = {All: false};
          for (let integration of Array.from(includeIntegrations)) {
            options.integrations[integration] = true;
          }
        }
        return analytics.page(url, {}, options);
      }
    }

    trackEvent(action, properties, includeIntegrations) {
      if (properties == null) { properties = {}; }
      if (includeIntegrations == null) { includeIntegrations = []; }
      if (debugAnalytics) { console.log('Tracking external analytics event:', action, properties, includeIntegrations); }
      if (!this.shouldTrackExternalEvents()) { return; }

      this.trackEventInternal(action, _.cloneDeep(properties));
      this.trackSnowplow(action, _.cloneDeep(properties));

      if (!['View Load', 'Script Started', 'Script Ended', 'Heard Sprite'].includes(action)) {
        // Google Analytics
        // https://developers.google.com/analytics/devguides/collection/analyticsjs/events
        const gaFieldObject = {
          hitType: 'event',
          eventCategory: properties.category != null ? properties.category : 'All',
          eventAction: action
        };
        if (properties.label != null) { gaFieldObject.eventLabel = properties.label; }
        if (properties.value != null) { gaFieldObject.eventValue = properties.value; }

        // NOTE these custom dimensions need to be configured in GA prior to being reported
        try {
          gaFieldObject.dimension1 = experiments.getRequestAQuoteGroup(me);
        } catch (e) {
          // TODO handle_error_ozaria
          console.error(e);
        }

        if (typeof ga === 'function') {
          ga('send', gaFieldObject);
        }
        if (features.codePlay) { if (typeof ga === 'function') {
          ga('codeplay.send', gaFieldObject);
        } }
      }

      if (me.isTeacher(true) && this.segmentLoaded) {
        const options = {};
        if (includeIntegrations) {
          // https://segment.com/docs/libraries/analytics.js/#selecting-integrations
          options.integrations = {All: false};
          for (let integration of Array.from(includeIntegrations)) {
            options.integrations[integration] = true;
          }
        }
        return (typeof analytics !== 'undefined' && analytics !== null ? analytics.track(action, {}, options) : undefined);
      }
    }

    trackSnowplow(event, properties) {
      let schema;
      if (this.shouldBlockAllTracking()) { return; }
      if ([
        'Simulator Result',
        'Started Level Load', 'Finished Level Load',
        'Start HoC Campaign', 'Show Amazon Modal Button', 'Click Amazon Modal Button', 'Click Amazon link',
        'Error in ssoConfirmView'  // TODO: Event for only detecting an error in prod. Tracking this only via GA. Remove when not required.
      ].includes(event)) { return; }
      // Trimming properties we don't use internally
      // TODO: delete properites.level for 'Saw Victory' after 2/8/15.  Should be using levelID instead.
      if (['Clicked Start Level', 'Inventory Play', 'Heard Sprite', 'Started Level', 'Saw Victory', 'Click Play', 'Choose Inventory', 'Homepage Loaded', 'Change Hero'].includes(event)) {
        delete properties.label;
      }

      if (event === 'View Load') { // TODO: Update snowplow schema to include these
        delete properties.totalEssentialEncodedBodySize;
        delete properties.totalEssentialTransferSize;
        delete properties.cachedEssentialResources;
        delete properties.totalEssentialResources;
      }

      // Remove personally identifiable data
      delete properties.name;
      delete properties.email;

      // SnowPlow
      const snowplowAction = event.toLowerCase().replace(/[^a-z0-9]+/ig, '_');
      properties.user = me.id;
      delete properties.category;
      //console.log "SnowPlow", snowplowAction, properties

      try {
        schema = require("schemas/events/" + snowplowAction + ".json");
      } catch (error) {
        console.warn('Schema not found for snowplow action: ', snowplowAction, properties);
        return;
      }

      if (!this.isProduction) {
        const result = tv4.validateResult(properties, schema);
        if (!result.valid) {
          const text = 'Snowplow event schema validation failed! See console';
          console.log('Snowplow event failure info:', {snowplowAction, properties, error: result.error});
          noty({text, layout: 'center', type: 'error', killer: false, timeout: 5000, dismissQueue: true, maxVisible: 3});
        }
      }

      return window.snowplow('trackUnstructEvent', {
        schema: `iglu:com.codecombat/${snowplowAction}/jsonschema/${schema.self.version}`,
        data: properties
      }
      );
    }

    trackEventInternal(event, properties) {
      if (this.shouldBlockAllTracking()) { return; }
      if (this.isProduction && me.isAdmin()) { return; }
      if (this.supermodel == null) { return; }
      // Skipping heavily logged actions we don't use internally
      // TODO: 'Error in ssoConfirmView' event is only for detecting an error in prod. Tracking this only via GA. Remove when not required.
      if (['Simulator Result', 'Started Level Load', 'Finished Level Load', 'View Load', 'Error in ssoConfirmView'].includes(event)) { return; }
      // Trimming properties we don't use internally
      // TODO: delete properites.level for 'Saw Victory' after 2/8/15.  Should be using levelID instead.
      if (['Clicked Start Level', 'Inventory Play', 'Heard Sprite', 'Started Level', 'Saw Victory', 'Click Play', 'Choose Inventory', 'Homepage Loaded', 'Change Hero'].includes(event)) {
        delete properties.category;
        delete properties.label;
      } else if (['Loaded World Map', 'Started Signup', 'Finished Signup', 'Login', 'Facebook Login', 'Google Login', 'Show subscription modal'].includes(event)) {
        delete properties.category;
      }

      if (this.explicitTraits != null) { for (let key in this.explicitTraits) { const value = this.explicitTraits[key]; properties[key] = value; } }
      if (debugAnalytics) { console.log('Tracking internal analytics event:', event, properties); }

      return api.analyticsLogEvents.post({event, properties});
    }

    trackTiming(duration, category, variable, label) {
      // https://developers.google.com/analytics/devguides/collection/analyticsjs/user-timings
      if (!(duration >= 0) || !(duration < (60 * 60 * 1000))) { return console.warn(`Duration ${duration} invalid for trackTiming call.`); }
      if (debugAnalytics) { console.log('Would track timing event:', arguments); }
      if (this.shouldTrackExternalEvents()) {
        return (typeof ga === 'function' ? ga('send', 'timing', category, variable, duration, label) : undefined);
      }
    }

    updateIntercomRegularly() {
      if (this.shouldBlockAllTracking() || application.testing || !this.isProduction) { return; }
      let timesChecked = 0;
      var updateIntercom = () => {
        // Check for new Intercom messages!
        // Intercom only allows 10 updates for free per page refresh; then 1 per 30min
        // https://developers.intercom.com/docs/intercom-javascript#section-intercomupdate
        if (typeof window.Intercom === 'function') {
          window.Intercom('update');
        }
        timesChecked += 1;
        const timeUntilNext = (timesChecked < 10 ? 5*60*1000 : 30*60*1000);
        return setTimeout(updateIntercom, timeUntilNext);
      };
      return setTimeout(updateIntercom, 5*60*1000);
    }

    updateRole() {
      if (me.isAdmin() || this.shouldBlockAllTracking()) { return; }
      if (!me.isTeacher(true)) { return; }
      return loadSegmentIo()
      .then(() => {
        this.segmentLoaded = true && me.useSocialSignOn();
        return this.identify();
      });
    }
      //analytics.page()  # It looks like we don't want to call this here because it somehow already gets called once in addition to this.
      // TODO: record any events and pageviews that have built up before we knew we were a teacher.

    updateTrialRequestData(attrs) {
      if (this.shouldBlockAllTracking()) { return; }
      return loadSegmentIo()
      .then(() => {
        this.segmentLoaded = true && me.useSocialSignOn();
        return this.identify(attrs);
      });
    }

    shouldBlockAllTracking() {
      const doNotTrack = ((typeof navigator !== 'undefined' && navigator !== null ? navigator.doNotTrack : undefined) || (typeof window !== 'undefined' && window !== null ? window.doNotTrack : undefined)) && !(((typeof navigator !== 'undefined' && navigator !== null ? navigator.doNotTrack : undefined) === 'unspecified') || ((typeof window !== 'undefined' && window !== null ? window.doNotTrack : undefined) === 'unspecified'));
      return me.isSmokeTestUser() || window.serverSession.amActually || doNotTrack || this.cookies.declined;
    }
      // Should we include application.testing in this?

    shouldTrackExternalEvents() {
      return !this.shouldBlockAllTracking() && this.isProduction && !me.isAdmin();
    }
  };
  Tracker.initClass();
  return Tracker;
})());
