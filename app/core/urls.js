/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
module.exports = {
  projectGallery({ courseInstanceID }) {
    return `/students/project-gallery/${courseInstanceID}`;
  },

  playDevLevel({level, session, course}) {
    level = level.attributes || level;
    session = session.attributes || session;
    course = (course != null ? course.attributes : undefined) || course;
    let shareURL = `${window.location.origin}/play/${level.type}-level/${level.slug}/${session._id}`;
    if (course) { shareURL += `?course=${course._id}`; }
    return shareURL;
  },

  courseArenaLadder({level, courseInstance}) {
    level = level.attributes || level;
    courseInstance = courseInstance.attributes || courseInstance;
    return `/play/ladder/${level.slug}/course/${courseInstance._id}`;
  },

  courseLevel({level, courseInstance}) {
    let url = `/play/level/${level.get('slug')}?course=${courseInstance.get('courseID')}&course-instance=${courseInstance.id}`;
    if (level.get('primerLanguage')) { url += `&codeLanguage=${level.get('primerLanguage')}`; }
    return url;
  },

  courseWorldMap({course, courseInstance}) {
    course = course.attributes || course;
    courseInstance = courseInstance.attributes || courseInstance;
    return `/play/${course.campaignID}?course-instance=${courseInstance._id}`;
  },

  courseRanking({course, courseInstance}) {
    course = course.attributes || course;
    courseInstance = courseInstance.attributes || courseInstance;
    return `students/ranking/${course.campaignID}?course-instance=${courseInstance._id}`;
  },

  courseProjectGallery({courseInstance}) {
    return `/students/project-gallery/${courseInstance.id}`;
  }
};
