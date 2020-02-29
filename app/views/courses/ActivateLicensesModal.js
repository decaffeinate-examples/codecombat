/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ActivateLicensesModal;
require('app/styles/courses/activate-licenses-modal.sass');
const ModalView = require('views/core/ModalView');
const State = require('models/State');
const template = require('templates/courses/activate-licenses-modal');
const CocoCollection = require('collections/CocoCollection');
const Prepaids = require('collections/Prepaids');
const Classroom = require('models/Classroom');
const Classrooms = require('collections/Classrooms');
const User = require('models/User');
const Users = require('collections/Users');

module.exports = (ActivateLicensesModal = (function() {
  ActivateLicensesModal = class ActivateLicensesModal extends ModalView {
    static initClass() {
      this.prototype.id = 'activate-licenses-modal';
      this.prototype.template = template;
  
      this.prototype.events = {
        'change input[type="checkbox"][name="user"]': 'updateSelectedStudents',
        'change .select-all-users-checkbox': 'toggleSelectAllStudents',
        'change select.classroom-select': 'replaceStudentList',
        'submit form': 'onSubmitForm',
        'click #get-more-licenses-btn': 'onClickGetMoreLicensesButton'
      };
    }

    getInitialState(options) {
      const selectedUsers = options.selectedUsers || options.users;
      const selectedUserModels = _.filter(selectedUsers.models, user => !user.isEnrolled());
      return {
        selectedUsers: new Users(selectedUserModels),
        visibleSelectedUsers: new Users(selectedUserModels),
        error: null
      };
    }
  
    initialize(options) {
      this.state = new State(this.getInitialState(options));
      this.classroom = options.classroom;
      this.users = options.users.clone();
      this.users.comparator = user => user.broadName().toLowerCase();
      this.prepaids = new Prepaids();
      this.prepaids.comparator = 'endDate'; // use prepaids in order of expiration
      this.supermodel.trackRequest(this.prepaids.fetchMineAndShared());
      this.classrooms = new Classrooms();
      this.supermodel.trackRequest(this.classrooms.fetchMine({
        data: {archived: false},
        success: () => {
          return this.classrooms.each(classroom => {
            classroom.users = new Users();
            const jqxhrs = classroom.users.fetchForClassroom(classroom, { removeDeleted: true });
            return this.supermodel.trackRequests(jqxhrs);
          });
        }
        })
      );
    
      this.listenTo(this.state, 'change', function() {
        return this.renderSelectors('#submit-form-area');
      });
      this.listenTo(this.state.get('selectedUsers'), 'change add remove reset', function() {
        this.updateVisibleSelectedUsers();
        return this.renderSelectors('#submit-form-area');
      });
      this.listenTo(this.users, 'change add remove reset', function() {
        this.updateVisibleSelectedUsers();
        return this.render();
      });
      return this.listenTo(this.prepaids, 'sync add remove', function() {
        return this.state.set({
          unusedEnrollments: this.prepaids.totalMaxRedeemers() - this.prepaids.totalRedeemers()
        });
    });
    }
      
    onLoaded() {
      this.prepaids.reset(this.prepaids.filter(prepaid => prepaid.status() === 'available'));
      return super.onLoaded();
    }
  
    afterRender() {
      return super.afterRender();
    }
      // @updateSelectedStudents() # TODO: refactor to event/state style

    updateSelectedStudents(e) {
      const userID = $(e.currentTarget).data('user-id');
      const user = this.users.get(userID);
      if (this.state.get('selectedUsers').findWhere({ _id: user.id })) {
        this.state.get('selectedUsers').remove(user.id);
      } else {
        this.state.get('selectedUsers').add(user);
      }
      return this.$(".select-all-users-checkbox").prop('checked', this.areAllSelected());
    }
      // @render() # TODO: Have @state automatically listen to children's change events?

    enrolledUsers() {
      return this.users.filter(user => user.isEnrolled());
    }

    unenrolledUsers() {
      return this.users.filter(user => !user.isEnrolled());
    }

    areAllSelected() {
      return _.all(this.unenrolledUsers(), user => this.state.get('selectedUsers').get(user.id));
    }

    toggleSelectAllStudents(e) {
      if (this.areAllSelected()) {
        return this.unenrolledUsers().forEach((user, index) => {
          if (this.state.get('selectedUsers').findWhere({ _id: user.id })) {
            this.$(`[type='checkbox'][data-user-id='${user.id}']`).prop('checked', false);
            return this.state.get('selectedUsers').remove(user.id);
          }
        });
      } else {
        return this.unenrolledUsers().forEach((user, index) => {
          if (!this.state.get('selectedUsers').findWhere({ _id: user.id })) {
            this.$(`[type='checkbox'][data-user-id='${user.id}']`).prop('checked', true);
            return this.state.get('selectedUsers').add(user);
          }
        });
      }
    }
  
    replaceStudentList(e) {
      let users;
      const selectedClassroomID = $(e.currentTarget).val();
      this.classroom = this.classrooms.get(selectedClassroomID);
      if (!this.classroom) {
        users = _.uniq(_.flatten(this.classrooms.map(classroom => classroom.users.models)));
        this.users.reset(users);
        this.users.sort();
      } else {
        this.users.reset(this.classrooms.get(selectedClassroomID).users.models);
      }
      this.render();
      return null;
    }

    onSubmitForm(e) {
      e.preventDefault();
      this.state.set({error: null});
      const usersToRedeem = this.state.get('visibleSelectedUsers');
      return this.redeemUsers(usersToRedeem);
    }

    updateVisibleSelectedUsers() {
      return this.state.set({ visibleSelectedUsers: new Users(this.state.get('selectedUsers').filter(u => this.users.get(u))) });
    }

    redeemUsers(usersToRedeem) {
      if (!usersToRedeem.size()) {
        this.finishRedeemUsers();
        this.hide();
        return;
      }

      const user = usersToRedeem.first();
      const prepaid = this.prepaids.find(prepaid => prepaid.status() === 'available');
      return prepaid.redeem(user, {
        success: prepaid => {
          user.set('coursePrepaid', prepaid.pick('_id', 'startDate', 'endDate', 'type', 'includedCourseIDs'));
          usersToRedeem.remove(user);
          this.state.get('selectedUsers').remove(user);
          this.updateVisibleSelectedUsers();
          // pct = 100 * (usersToRedeem.originalSize - usersToRedeem.size() / usersToRedeem.originalSize)
          // @$('#progress-area .progress-bar').css('width', "#{pct.toFixed(1)}%")
          if (application.tracker != null) {
            application.tracker.trackEvent('Enroll modal finished enroll student', {category: 'Courses', userID: user.id});
          }
          return this.redeemUsers(usersToRedeem);
        },
        error: (prepaid, jqxhr) => {
          return this.state.set({ error: jqxhr.responseJSON.message });
        }
      });
    }

    finishRedeemUsers() {
      return this.trigger('redeem-users', this.state.get('selectedUsers'));
    }

    onClickGetMoreLicensesButton() {
      return (typeof this.hide === 'function' ? this.hide() : undefined);
    }
  };
  ActivateLicensesModal.initClass();
  return ActivateLicensesModal; // In case this is opened in /teachers/licenses itself, otherwise the button does nothing
})());
