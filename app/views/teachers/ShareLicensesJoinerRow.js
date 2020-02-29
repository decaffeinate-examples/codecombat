/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ShareLicensesJoinerRow;
const store = require('core/store');
const api = require('core/api');
const ShareLicensesStoreModule = require('./ShareLicensesStoreModule');
const User = require('models/User');

module.exports = (ShareLicensesJoinerRow = {
  name: 'share-licenses-joiner-row',
  template: require('templates/teachers/share-licenses-joiner-row')(),
  storeModule: ShareLicensesStoreModule,
  props: {
    joiner: {
      type: Object,
      default() { return {}; }
    },
    prepaid: {
      type: Object,
      default() {
        return {joiners: []};
      }
    }
  },
  created() {},
  data() {
    return {me};
  },
  computed: {
    broadName() {
      return (new User(this.joiner)).broadName();
    }
  },
  components: {},
  methods:
    {
      revokeTeacher() {
        return this.$emit('revokeJoiner', this.prepaid._id, this.joiner);
      }
    }
});
