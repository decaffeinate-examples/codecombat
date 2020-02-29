/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {hslToHex} = require('core/utils');

module.exports.teamDataFromLevel = function(level) {
  const alliedSystem = _.find(level.get('systems', true), value => (value.config != null ? value.config.teams : undefined) != null);
  const teamNames = ((() => {
    const result = [];
    for (let teamName in alliedSystem.config.teams) {
      const teamConfig = alliedSystem.config.teams[teamName];
      if (teamConfig.playable) {
        result.push(teamName);
      }
    }
    return result;
  })());
  const teamConfigs = alliedSystem.config.teams;

  const teams = [];
  for (let team of Array.from(teamNames || [])) {
    var displayName, needle;
    const otherTeam = team === 'ogres' ? 'humans' : 'ogres';
    const {
      color
    } = teamConfigs[team];
    const bgColor = hslToHex([color.hue, color.saturation, color.lightness + ((1 - color.lightness) * 0.5)]);
    const primaryColor = hslToHex([color.hue, 0.5, 0.5]);
    if ((needle = level.get('slug'), ['wakka-maul'].includes(needle))) {
      displayName = _.string.titleize(team);
    } else {
      displayName = $.i18n.t(`ladder.${team}`);  // Use Red/Blue instead of Humans/Ogres
    }
    teams.push({
      id: team,
      name: _.string.titleize(team),
      displayName,
      otherTeam,
      otherTeamDisplayName: $.i18n.t(`ladder.${otherTeam}`),
      bgColor,
      primaryColor
    });
  }

  return teams;
};

module.exports.scoreForDisplay = score => score * 100;
