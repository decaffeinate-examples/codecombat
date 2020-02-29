/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let CoursesNotAssignedModal;
const ModalView = require('views/core/ModalView');
const State = require('models/State');
const template = require('templates/courses/courses-not-assigned-modal');

const { STARTER_LICENSE_COURSE_IDS } = require('core/constants');

module.exports = (CoursesNotAssignedModal = (function() {
  CoursesNotAssignedModal = class CoursesNotAssignedModal extends ModalView {
    static initClass() {
      this.prototype.id = 'courses-not-assigned-modal';
      this.prototype.template = template;
    }

    initialize(options) {
      this.i18nData = _.pick(options, ['selected', 'numStudentsWithoutFullLicenses', 'numFullLicensesAvailable']);
      this.state = new State({
        promoteStarterLicenses: false
      });
      if (Array.from(STARTER_LICENSE_COURSE_IDS).includes(options.courseID)) {
        this.supermodel.trackRequest(me.getLeadPriority())
          .then(({ priority }) => this.state.set({ promoteStarterLicenses: (priority === 'low') && (me.get('preferredLanguage') !== 'nl-BE')}));
      }
      return this.listenTo(this.state, 'change', this.render);
    }
  };
  CoursesNotAssignedModal.initClass();
  return CoursesNotAssignedModal;
})());
