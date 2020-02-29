/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Tracker = require('core/Tracker');

describe('Tracker', () => // Actually, we don't call updateIntercomRegularly while testing any more
xdescribe('updateIntercomRegularly', function() {
  beforeEach(function() {
    if (window.Intercom == null) { window.Intercom = () => {}; }
    spyOn(window, 'Intercom');
    // timerCallback = jasmine.createSpy("timerCallback")
    return jasmine.clock().install();
  });

  afterEach(() => jasmine.clock().uninstall());

  return it('calls Intercom("update") every 5 minutes until 10 times, then every 30 minutes', function() {
    window.tracker.updateIntercomRegularly();
    jasmine.clock().tick(10 * 5*60*1000);
    expect(window.Intercom.calls.count()).toBe(10);
    jasmine.clock().tick(30*60*1000);
    return expect(window.Intercom.calls.count()).toBe(11);
  });
}));
