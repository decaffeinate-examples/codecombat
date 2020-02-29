/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Levels = require('collections/Levels');
const utils = require('core/utils');

// Returns whether a user has started a course as well as if they've completed
// all the required levels in the course.
//
// @param {Object<key=string, value=bool> | undefined} userLevels - Key value store of level original and completion state.
// @param {Set<string>} levelsInCourse - *Required* level originals in the course.
// @return {[bool, bool, int]} - user started value, allcomplete state and total levels completed.
const hasUserCompletedCourse = function(userLevels, levelsInCourse) {
  let userStarted = false;
  let allComplete = true;
  let completed = 0;
  let userLevelsSeen = 0;
  for (let level in userLevels) {
    const complete = userLevels[level];
    if (levelsInCourse.has(level)) {
      userStarted = true;
      if (complete) {
        completed++;
      } else {
        allComplete = false;
      }
      userLevelsSeen++;
    }
  }
  if (!userStarted) { allComplete = false; }

  return [userStarted, allComplete && (userLevelsSeen === levelsInCourse.size), completed];
};

module.exports = {
  // Result: Each course instance gains a property, numCompleted, that is the
  //   number of students in that course instance who have completed ALL of
  //   the levels in that course
  calculateDots(classrooms, courses, courseInstances) {
    let classroom, level;
    const userLevelsCompleted = {};
    const sessions = _.flatten(((() => {
      const result = [];
      for (classroom of Array.from(classrooms.models)) {         result.push((classroom.sessions != null ? classroom.sessions.models : undefined) || []);
      }
      return result;
    })()));
    for (let session of Array.from(sessions)) {
      const user = session.get('creator');
      if (userLevelsCompleted[user] == null) { userLevelsCompleted[user] = {}; }
      level = session.get('level').original;
      if (!userLevelsCompleted[user][level]) { userLevelsCompleted[user][level] = session.completed(); }
    }
    return (() => {
      const result1 = [];
      for (classroom of Array.from(classrooms.models)) {
        result1.push((() => {
          const result2 = [];
          for (let courseIndex = 0; courseIndex < courses.models.length; courseIndex++) {
            var course = courses.models[courseIndex];
            const instance = courseInstances.findWhere({ courseID: course.id, classroomID: classroom.id });
            if (!instance) { continue; }
            if (!(classroom.sessions != null ? classroom.sessions.loaded : undefined)) {
              instance.sessionsLoaded = false;
              continue;
            }
            instance.sessionsLoaded = true;
            instance.numCompleted = 0;
            instance.started = false;
            const levelsInVersionedCourse = new Set(((() => {
              const result3 = [];
              for (level of Array.from(classroom.getLevels({courseID: course.id}).models)) {                 if (!(level.get('practice') || level.get('assessment'))) {
                  result3.push(level.get('original'));
                }
              }
              return result3;
            })()));

            let levelsCompletedByStudents = 0;
            for (let userID of Array.from(instance.get('members'))) {
              const [userStarted, allComplete, levelsCompleted] = Array.from(hasUserCompletedCourse(userLevelsCompleted[userID], levelsInVersionedCourse));
              levelsCompletedByStudents += levelsCompleted;
              if (!instance.started) { instance.started = userStarted; }
              if (allComplete) { ++instance.numCompleted; }
            }
            result2.push(instance.percentLevelCompletion = Math.floor((levelsCompletedByStudents / (levelsInVersionedCourse.size * instance.get('members').length)) * 100));
          }
          return result2;
        })());
      }
      return result1;
    })();
  },

  calculateEarliestIncomplete(classroom, courses, courseInstances, students) {
    // Loop through all the combinations of things, return the first one that somebody hasn't finished
    for (let courseIndex = 0; courseIndex < courses.models.length; courseIndex++) {
      const course = courses.models[courseIndex];
      const instance = courseInstances.findWhere({ courseID: course.id, classroomID: classroom.id });
      if (!instance) { continue; }
      const levels = classroom.getLevels({courseID: course.id});
      for (let levelIndex = 0; levelIndex < levels.models.length; levelIndex++) {
        var level = levels.models[levelIndex];
        const userIDs = [];
        for (let user of Array.from(students.models)) {
          var userID = user.id;
          const sessions = _.filter(classroom.sessions.models, session => (session.get('creator') === userID) && (session.get('level').original === level.get('original')));
          if (!_.find(sessions, s => s.completed())) {
            userIDs.push(userID);
          }
        }
        if (userIDs.length > 0) {
          const users = _.map(userIDs, id => students.get(id));
          const levelNumber = classroom.getLevelNumber(level.get('original'), levelIndex + 1);
          return {
            courseName: utils.i18n(course.attributes, 'name'),
            courseNumber: courseIndex + 1,
            levelNumber,
            levelName: level.get('name'),
            users
          };
        }
      }
    }
    return null;
  },

  calculateLatestComplete(classroom, courses, courseInstances, students, userLevelCompletedMap) {
    // Loop through all the combinations of things in reverse order, return the level that anyone's finished
    const courseModels = courses.models.slice();
    const iterable = courseModels.reverse();
    for (let i = 0, courseIndex = i; i < iterable.length; i++, courseIndex = i) { //
      const course = iterable[courseIndex];
      courseIndex = courses.models.length - courseIndex - 1; //compensate for reverse
      const instance = courseInstances.findWhere({ courseID: course.id, classroomID: classroom.id });
      if (!instance) { continue; }
      const levels = classroom.getLevels({courseID: course.id});
      const levelModels = levels.models.slice();
      const iterable1 = levelModels.reverse();
      for (let j = 0, levelIndex = j; j < iterable1.length; j++, levelIndex = j) { //
        const level = iterable1[levelIndex];
        levelIndex = levelModels.length - levelIndex - 1; //compensate for reverse
        const userIDs = [];
        for (let user of Array.from(students.models)) {
          const userID = user.id;
          if (userLevelCompletedMap[userID] != null ? userLevelCompletedMap[userID][level.get('original').toString()] : undefined) {
            userIDs.push(userID);
          }
        }
        if (userIDs.length > 0) {
          const users = _.map(userIDs, id => students.get(id));
          const levelNumber = classroom.getLevelNumber(level.get('original'), levelIndex + 1);
          return {
            courseName: utils.i18n(course.attributes, 'name'),
            courseNumber: courseIndex + 1,
            levelNumber,
            levelName: level.get('name'),
            users
          };
        }
      }
    }
    return null;
  },

  calculateConceptsCovered(classrooms, courses, campaigns, courseInstances, students) {
    // Loop through all level/user combination and record
    //   whether they've started, and completed, each concept
    const conceptData = {};
    for (let classroom of Array.from(classrooms.models)) {
      conceptData[classroom.id] = {};

      for (let courseIndex = 0; courseIndex < courses.models.length; courseIndex++) {
        const course = courses.models[courseIndex];
        const levels = classroom.getLevels({courseID: course.id});

        for (let level of Array.from(levels.models)) {
          var concept;
          var levelID = level.get('original');

          for (concept of Array.from(level.get('concepts'))) {
            if (!conceptData[classroom.id][concept]) {
              conceptData[classroom.id][concept] = { completed: true, started: false };
            }
          }

          for (concept of Array.from(level.get('concepts'))) {
            for (var userID of Array.from(classroom.get('members'))) {
              const sessions = _.filter(classroom.sessions.models, session => (session.get('creator') === userID) && (session.get('level').original === levelID));

              if (_.size(sessions) === 0) { // haven't gotten to this level yet, but might have completed others before
                for (concept of Array.from(level.get('concepts'))) {
                  conceptData[classroom.id][concept].completed = false;
                }
              }
              if (_.size(sessions) > 0) { // have gotten to the level and at least started it
                for (concept of Array.from(level.get('concepts'))) {
                  conceptData[classroom.id][concept].started = true;
                }
              }
              if (!_.find(sessions, s => s.completed())) { // level started but not completed
                for (concept of Array.from(level.get('concepts'))) {
                  conceptData[classroom.id][concept].completed = false;
                }
              }
            }
          }
        }
      }
    }
    return conceptData;
  },

  calculateAllProgress(classrooms, courses, courseInstances, students) {
    // Loop through all combinations and record:
    //   Completeness for each student/course
    //   Completeness for each student/level
    //   Completeness for each class/course (across all students)
    //   Completeness for each class/level (across all students)

    // class -> course
    //   class -> course -> student
    //   class -> course -> level
    //     class -> course -> level -> student

    let s;
    const progressData = {};
    for (let classroom of Array.from(classrooms.models)) {
      progressData[classroom.id] = {};

      for (let courseIndex = 0; courseIndex < courses.models.length; courseIndex++) {
        const course = courses.models[courseIndex];
        const instance = courseInstances.findWhere({ courseID: course.id, classroomID: classroom.id });
        if (!instance) {
          progressData[classroom.id][course.id] = { completed: false, started: false };
          continue;
        }
        progressData[classroom.id][course.id] = { completed: true, started: false }; // to be updated

        const levels = classroom.getLevels({courseID: course.id});
        progressData[classroom.id][course.id].levelCount = levels.models.length;
        progressData[classroom.id][course.id].userCount = students.models.length;
        for (let level of Array.from(levels.models)) {
          var courseProgress;
          var levelID = level.get('original');
          progressData[classroom.id][course.id][levelID] = {
            completed: students.size() > 0,
            started: false,
            numStarted: 0
            // numCompleted: 0
          };
          const isOptional = level.get('practice') || level.get('assessment') || level.isLadder();
          const sessionsForLevel = _.filter(classroom.sessions.models, session => session.get('level').original === levelID);

          for (let user of Array.from(students.models)) {
            var dates;
            var userID = user.id;
            courseProgress = progressData[classroom.id][course.id];
            if (courseProgress[userID] == null) { courseProgress[userID] = { completed: true, started: false, levelsCompleted: 0 }; } // Only set it the first time through a user
            courseProgress[levelID][userID] = { completed: true, started: false }; // These don't matter, will always be set
            var sessions = _.filter(sessionsForLevel, session => session.get('creator') === userID);

            courseProgress[levelID][userID].session = __guard__((_.find(sessions, s => s.completed()) || _.first(sessions)), x => x.toJSON());

            if (_.size(sessions) === 0) { // haven't gotten to this level yet, but might have completed others before
              if (!isOptional) { if (!courseProgress.started) { courseProgress.started = false; } } //no-op
              if (!isOptional) { courseProgress.completed = false; }
              if (!isOptional) { if (!courseProgress[userID].started) { courseProgress[userID].started = false; } } //no-op
              if (!isOptional) { courseProgress[userID].completed = false; }
              if (!courseProgress[levelID].started) { courseProgress[levelID].started = false; } //no-op
              courseProgress[levelID].completed = false;
              courseProgress[levelID][userID].started = false;
              courseProgress[levelID][userID].completed = false;
            }

            if (_.size(sessions) > 0) { // have gotten to the level and at least started it
              if (!isOptional) { courseProgress.started = true; }
              if (!isOptional) { courseProgress[userID].started = true; }
              courseProgress[levelID].started = true;
              courseProgress[levelID][userID].started = true;
              dates = _.map(sessions, s => new Date(s.get('changed')));
              courseProgress[levelID][userID].lastPlayed = new Date(Math.max(...Array.from(dates || [])));
              courseProgress[levelID].numStarted += 1;
              courseProgress[levelID][userID].codeConcepts = _.flatten(_.map(sessions, s => s.get('codeConcepts') || []));
            }

            if (_.find(sessions, s => s.completed())) { // have finished this level
              if (!isOptional) { if (courseProgress.completed) { courseProgress.completed = true; } } //no-op
              if (!isOptional) { if (courseProgress[userID].completed) { courseProgress[userID].completed = true; } } //no-op
              if (!isOptional) { courseProgress[userID].levelsCompleted += 1; }
              if (courseProgress[levelID].completed) { courseProgress[levelID].completed = true; } //no-op
              // courseProgress[levelID].numCompleted += 1
              courseProgress[levelID][userID].completed = true;
              dates = ((() => {
                const result = [];
                for (s of Array.from(sessions)) {                   result.push(new Date(s.get('dateFirstCompleted') || s.get('changed')));
                }
                return result;
              })());
              courseProgress[levelID][userID].dateFirstCompleted = new Date(Math.max(...Array.from(dates || [])));
            } else { // level started but not completed
              if (!isOptional) { courseProgress.completed = false; }
              if (!isOptional) { courseProgress[userID].completed = false; }
              if (isOptional) {
                // Weird behavior! Since practice levels are optional, the level is considered 'incomplete'
                // for the class as a whole only if any started-but-not-completed sessions exist
                if (courseProgress[levelID][userID].started) { courseProgress[levelID].completed = false; }
              } else {
                courseProgress[levelID].completed = false;
              }
              courseProgress[levelID][userID].completed = false;
              courseProgress[levelID].dateFirstCompleted = null;
              courseProgress[levelID][userID].dateFirstCompleted = null;
            }
          }

          if (isOptional && courseProgress && !courseProgress[levelID].started) {
            courseProgress[levelID].completed = false; // edge for practice levels, not considered complete if never started either
          }
        }
      }
    }

    _.assign(progressData, progressMixin);
    return progressData;
  },

  courseLabelsArray(courses) {
    return courses.map(course => course.acronym());
  },

  hasUserCompletedCourse
};

var progressMixin = {
  get(options) {
    if (options == null) { options = {}; }
    const { classroom, course, level, user } = options;
    if (!classroom) { throw new Error("You must provide a classroom"); }
    if (!course) { throw new Error("You must provide a course"); }
    const defaultValue = { completed: false, started: false };
    if (options.level) {
      const levelID = level.get('original');
      if (options.user) {
        return __guard__(__guard__(this[classroom.id] != null ? this[classroom.id][course.id] : undefined, x1 => x1[levelID]), x => x[user.id]) || defaultValue;
      } else {
        return __guard__(this[classroom.id] != null ? this[classroom.id][course.id] : undefined, x2 => x2[levelID]) || defaultValue;
      }
    } else {
      if (options.user) {
        return __guard__(this[classroom.id] != null ? this[classroom.id][course.id] : undefined, x3 => x3[user.id]) || defaultValue;
      } else {
        return (this[classroom.id] != null ? this[classroom.id][course.id] : undefined) || defaultValue;
      }
    }
  }
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}