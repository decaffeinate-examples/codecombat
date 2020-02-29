/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Prepaid;
const CocoModel = require('./CocoModel');
const schema = require('schemas/models/prepaid.schema');

const { STARTER_LICENSE_COURSE_IDS } = require('core/constants');

module.exports = (Prepaid = (function() {
  Prepaid = class Prepaid extends CocoModel {
    static initClass() {
      this.className = "Prepaid";
      this.prototype.urlRoot = '/db/prepaid';
    }

    openSpots() {
      if (this.get('redeemers') != null) { return this.get('maxRedeemers') - __guard__(this.get('redeemers'), x => x.length); }
      return this.get('maxRedeemers');
    }
  
    usedSpots() {
      return _.size(this.get('redeemers'));
    }

    totalSpots() {
      return this.get('maxRedeemers');
    }

    userHasRedeemed(userID) {
      for (let redeemer of Array.from(this.get('redeemers'))) {
        if (redeemer.userID === userID) { return redeemer.date; }
      }
      return null;
    }

    initialize() {
      this.listenTo(this, 'add', function() {
        const maxRedeemers = this.get('maxRedeemers');
        if (_.isString(maxRedeemers)) {
          return this.set('maxRedeemers', parseInt(maxRedeemers));
        }
      });
      return super.initialize(...arguments);
    }
        
    status() {
      const endDate = this.get('endDate');
      if (endDate && (new Date(endDate) < new Date())) {
        return 'expired';
      }

      const startDate = this.get('startDate');
      if (startDate && (new Date(startDate) > new Date())) {
        return 'pending';
      }
      
      if (this.openSpots() <= 0) {
        return 'empty';
      }
      
      return 'available';
    }

    redeem(user, options) {
      if (options == null) { options = {}; }
      options.url = _.result(this, 'url')+'/redeemers';
      options.type = 'POST';
      if (options.data == null) { options.data = {}; }
      options.data.userID = user.id || user;
      return this.fetch(options);
    }

    includesCourse(course) {
      const courseID = (typeof course.get === 'function' ? course.get('name') : undefined) || course;
      if (this.get('type') === 'starter_license') {
        let left, needle;
        return (needle = courseID, Array.from(((left = this.get('includedCourseIDs')) != null ? left : [])).includes(needle));
      } else {
        return true;
      }
    }

    revoke(user, options) {
      if (options == null) { options = {}; }
      options.url = _.result(this, 'url')+'/redeemers';
      options.type = 'DELETE';
      if (options.data == null) { options.data = {}; }
      options.data.userID = user.id || user;
      return this.fetch(options);
    }

    hasBeenUsedByTeacher(userID) {
      if ((this.get('creator') === userID) && _.detect(this.get('redeemers'), { teacherID: undefined })) {
        return true;
      }
      return _.detect(this.get('redeemers'), { teacherID: userID });
    }
  };
  Prepaid.initClass();
  return Prepaid;
})());

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}