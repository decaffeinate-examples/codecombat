/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let GPlusHandler;
const CocoClass = require('core/CocoClass');
const {me} = require('core/auth');
const {backboneFailure} = require('core/errors');
const storage = require('core/storage');
const GPLUS_TOKEN_KEY = 'gplusToken';

const clientID = '800329290710-j9sivplv2gpcdgkrsis9rff3o417mlfa.apps.googleusercontent.com';

module.exports = (GPlusHandler = (GPlusHandler = (function() {
  GPlusHandler = class GPlusHandler extends CocoClass {
    static initClass() {
  
      this.prototype.startedLoading = false;
      this.prototype.apiLoaded = false;
      this.prototype.connected = false;
      this.prototype.person = null;
    }
    constructor() {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
        eval(`${thisName} = this;`);
      }
      if (!me.useSocialSignOn()) { throw new Error('Social single sign on not supported'); }
      this.accessToken = storage.load(GPLUS_TOKEN_KEY, false);
      super();
    }

    token() { return (this.accessToken != null ? this.accessToken.access_token : undefined); }

    fakeAPI() {
      window.gapi = {
        client: {
          load(api, version, cb) { return cb(); },
          people: {
            people: {
              get() { return {
                execute(cb) {
                  return cb({
                    resourceName: 'people/abcd',
                    names: [{
                      givenName: 'Mr',
                      familyName: 'Bean'
                    }],
                    emailAddresses: [{value: 'some@email.com'}]
                  });
                }
              }; }
            }
          }
        },

        auth2: {
          authorize(opts, cb) {
            return cb({access_token: '1234'});
          }
        }
      };

      this.startedLoading = true;
      return this.apiLoaded = true;
    }

    fakeConnect() {
      this.accessToken = {access_token: '1234'};
      return this.trigger('connect');
    }

    loadAPI(options) {
      if (options == null) { options = {}; }
      if (options.success == null) { options.success = _.noop; }
      if (options.context == null) { options.context = options; }
      if (this.apiLoaded) {
        options.success.bind(options.context)();
      } else {
        this.once('load-api', options.success, options.context);
      }

      if (!this.startedLoading) {
        const po = document.createElement('script');
        po.type = 'text/javascript';
        po.async = true;
        po.src = 'https://apis.google.com/js/client:platform.js?onload=init';
        const s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(po, s);
        this.startedLoading = true;
        return window.init = () => {
          this.apiLoaded = true;
          return this.trigger('load-api');
        };
      }
    }


    connect(options) {
      if (options == null) { options = {}; }
      if (options.success == null) { options.success = _.noop; }
      if (options.context == null) { options.context = options; }
      const authOptions = {
        client_id: clientID,
        scope: options.scope || 'profile email',
        response_type: 'permission'
      };
      if (me.get('gplusID') && me.get('email')) {  // when already logged in and reauthorizing for new scopes or new access token
        authOptions.login_hint = me.get('email');
      }
      return gapi.auth2.authorize(authOptions, e => {
        if (e.error && options.error) {
          options.error.bind(options.context)();
          return;
        }
        if (!e.access_token) { return; }
        this.connected = true;
        try {
        // Without removing this, we sometimes get a cross-domain error
          const d = _.omit(e, 'g-oauth-window');
          storage.save(GPLUS_TOKEN_KEY, d, 0);
        } catch (error) {
          e = error;
          console.error('Unable to save G+ token key', e);
        }
        this.accessToken = e;
        this.trigger('connect');
        return options.success.bind(options.context)();
      });
    }


    loadPerson(options) {
      if (options == null) { options = {}; }
      if (options.success == null) { options.success = _.noop; }
      if (options.context == null) { options.context = options; }
      // email and profile data loaded separately
      return gapi.client.load('people', 'v1', () => {
        return gapi.client.people.people.get({
            'resourceName': 'people/me',
            'personFields': 'names,genders,emailAddresses'
          }).execute(r => {
            const attrs = {};
            if (r.resourceName) {
              attrs.gplusID = r.resourceName.split('/')[1];   // resourceName is of the form 'people/<id>'
            }
            if (r.names != null ? r.names.length : undefined) {
              attrs.firstName = r.names[0].givenName;
              attrs.lastName = r.names[0].familyName;
            }
            if (r.emailAddresses != null ? r.emailAddresses.length : undefined) {
              attrs.email = r.emailAddresses[0].value;
            }
            if (r.genders != null ? r.genders.length : undefined) {
              attrs.gender = r.genders[0].value;
            }
            this.trigger('load-person', attrs);
            return options.success.bind(options.context)(attrs);
        });
      });
    }


    renderButtons() {
      if ((typeof gapi !== 'undefined' && gapi !== null ? gapi.plusone : undefined) == null) { return false; }
      return (typeof gapi.plusone.go === 'function' ? gapi.plusone.go() : undefined);  // Handles +1 button
    }

    // Friends logic, not in use

    loadFriends(friendsCallback) {
      if (!this.loggedIn) { return friendsCallback(); }
      const expiresIn = this.accessToken ? parseInt(this.accessToken.expires_at) - (new Date().getTime()/1000) : -1;
      const onReauthorized = () => gapi.client.request({path: '/plus/v1/people/me/people/visible', callback: friendsCallback});
      if (expiresIn < 0) {
        // TODO: this tries to open a popup window, which might not ever finish or work, so the callback may never be called.
        this.reauthorize();
        return this.listenToOnce(this, 'logged-in', onReauthorized);
      } else {
        return onReauthorized();
      }
    }

    reauthorize() {
      const params = {
        'client_id' : clientID,
        'scope' : scope
      };
      return gapi.auth.authorize(params, this.onGPlusLogin);
    }
  };
  GPlusHandler.initClass();
  return GPlusHandler;
})()));
