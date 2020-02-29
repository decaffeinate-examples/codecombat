/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let TeacherSignupStoreModule;
const api = require('core/api');
const DISTRICT_NCES_KEYS = ['district', 'district_id', 'district_schools', 'district_students', 'phone'];
const SCHOOL_NCES_KEYS = DISTRICT_NCES_KEYS.concat(['id', 'name', 'students']);
const ncesData = _.zipObject(Array.from(SCHOOL_NCES_KEYS).map((key) => ['nces_'+key, '']));
require('core/services/segment')();
const User = require('models/User');

module.exports = (TeacherSignupStoreModule = {
  namespaced: true,
  state: {
    trialRequestProperties: _.assign(ncesData, {
      organization: '',
      district: '',
      city: '',
      state: '',
      country: '',
      phoneNumber: '',
      role: '',
      purchaserRole: '',
      numStudents: '',
      numStudentsTotal: '',
      notes: '',
      referrer: '',
      marketingReferrer: '',
      educationLevel: [],
      otherEducationLevel: false,
      otherEducationLevelExplanation: '',
      siteOrigin: 'create teacher',
      firstName: '',
      lastName: '',
      email: ''
    }),
    signupForm: {
      name: '',
      email: '',
      password: '',
      firstName: '',
      lastName: ''
    },
    ssoAttrs: {
      email: '',
      gplusID: '',
      facebookID: ''
    },
    ssoUsed: '' // 'gplus', or 'facebook'
  },
  mutations: {
    updateTrialRequestProperties(state, updates) {
      return _.assign(state.trialRequestProperties, updates);
    },
    updateSignupForm(state, updates) {
      return _.assign(state.signupForm, updates);
    },
    updateSso(state, { ssoUsed, ssoAttrs }) {
      _.assign(state.ssoAttrs, ssoAttrs);
      return state.ssoUsed = ssoUsed;
    }
  },
  actions: {
    createAccount({state, commit, dispatch, rootState}) {
      
      return Promise.resolve()
      .then(() => {
        return dispatch('me/save', {
          role: state.trialRequestProperties.role.toLowerCase()
        }, {
          root: true
        });
    }).then(() => {
        // add "other education level" explanation to the list of education levels
        const properties = _.cloneDeep(state.trialRequestProperties);
        if (properties.otherEducationLevel) {
          properties.educationLevel.push(properties.otherEducationLevelExplanation);
        }
        delete properties.otherEducationLevel;
        delete properties.otherEducationLevelExplanation;
        properties.email = state.signupForm.email;
        
        return api.trialRequests.post({
          type: 'course',
          properties
        });
      }).then(() => {
        const trialRequestIntercomData = _.pick(state.trialRequestProperties, ["siteOrigin", "marketingReferrer", "referrer", "notes", "numStudentsTotal", "numStudents", "purchaserRole", "role", "phoneNumber", "country", "state", "city", "district", "organization", "nces_students", "nces_name", "nces_id", "nces_phone", "nces_district_students", "nces_district_schools", "nces_district_id", "nces_district"]);
        trialRequestIntercomData.educationLevel_elementary = _.contains(state.trialRequestProperties.educationLevel, "Elementary");
        trialRequestIntercomData.educationLevel_middle = _.contains(state.trialRequestProperties.educationLevel, "Middle");
        trialRequestIntercomData.educationLevel_high = _.contains(state.trialRequestProperties.educationLevel, "High");
        trialRequestIntercomData.educationLevel_college = _.contains(state.trialRequestProperties.educationLevel, "College+");
        if (!User.isSmokeTestUser({ email: state.signupForm.email })) { return application.tracker.updateTrialRequestData(trialRequestIntercomData); }
      }).then(() => {
        const signupForm = _.omit(state.signupForm, attr => attr === '');
        const ssoAttrs = _.omit(state.ssoAttrs, attr => attr === '');
        const attrs = _.assign({}, signupForm, ssoAttrs, { userID: rootState.me._id });
        if (state.ssoUsed === 'gplus') {
          return api.users.signupWithGPlus(attrs);
        } else if (state.ssoUsed === 'facebook') {
          return api.users.signupWithFacebook(attrs);
        } else {
          return api.users.signupWithPassword(attrs);
        }
      });
    }
  }
});

module.exports = TeacherSignupStoreModule;
