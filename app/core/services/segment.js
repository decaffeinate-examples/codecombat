/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let loadSegmentio;
module.exports = (loadSegmentio = !me.useSocialSignOn() ? () => Promise.resolve([]) : _.once(() => new Promise(function(accept, reject) {
  const analytics = (window.analytics = window.analytics || []);
  analytics.invoked = true;
  analytics.methods = [
    'trackSubmit',
    'trackClick',
    'trackLink',
    'trackForm',
    'pageview',
    'identify',
    'reset',
    'group',
    'track',
    'ready',
    'alias',
    'page',
    'once',
    'off',
    'on'
  ];

  analytics.factory = t => (function() {
    const e = Array.prototype.slice.call(arguments);
    e.unshift(t);
    analytics.push(e);
    return analytics;
  });

  for (let method of Array.from(analytics.methods)) {
    analytics[method] = analytics.factory(method);
  }

  analytics.load = function(t) {
    const e = document.createElement('script');
    e.type = 'text/javascript';
    e.async = true;
    e.src = (document.location.protocol === 'https:' ? 'https://' : 'http://') + 'cdn.segment.com/analytics.js/v1/' + t + '/analytics.min.js';
    const n = document.getElementsByTagName('script')[0];
    n.parentNode.insertBefore(e, n);
    // Backbone.Mediator.publish 'application:service-loaded', service: 'segment'
    accept(analytics);
  };

  analytics.SNIPPET_VERSION = '3.1.0';
  return analytics.load('yJpJZWBw68fEj0aPSv8ffMMgof5kFnU9');
})));
    //analytics.page()  # Don't track the page view on initial inclusion
