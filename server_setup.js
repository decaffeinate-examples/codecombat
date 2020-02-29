/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const express = require('express');
const path = require('path');
const useragent = require('express-useragent');
const fs = require('graceful-fs');
const log = require('winston');
const compressible = require('compressible');
const compression = require('compression');

const geoip = require('@basicer/geoip-lite');
const crypto = require('crypto');
const config = require('./server_config');
global.tv4 = require('tv4'); // required for TreemaUtils to work
global.jsondiffpatch = require('jsondiffpatch');
global.stripe = require('stripe')(config.stripe.secretKey);
const request = require('request');
const Promise = require('bluebird');
Promise.promisifyAll(request, {multiArgs: true});
Promise.promisifyAll(fs);
const wrap = require('co-express');
const morgan = require('morgan');
const timeout = require('connect-timeout');

const {countries} = require('./app/core/utils');

const productionLogging = function(tokens, req, res) {
  const status = res.statusCode;
  let color = 32;
  if (status >= 500) { color = 31;
  } else if (status >= 400) { color = 33;
  } else if (status >= 300) { color = 36; }
  const elapsed = (new Date()) - req._startTime;
  const elapsedColor = elapsed < 500 ? 90 : 31;
  if ((status === 404) && /\/feedback/.test(req.originalUrl)) { return null; }  // We know that these usually 404 by design (bad design?)
  if (((status !== 200) && (status !== 201) && (status !== 204) && (status !== 304) && (status !== 302)) || (elapsed > 500)) {
    return `[${config.clusterID}] \x1b[90m${req.method} ${req.originalUrl} \x1b[${color}m${res.statusCode} \x1b[${elapsedColor}m${elapsed}ms\x1b[0m`;
  }
  return null;
};

const developmentLogging = function(tokens, req, res) {
  const status = res.statusCode;
  let color = 32;
  if (status >= 500) { color = 31;
  } else if (status >= 400) { color = 33;
  } else if (status >= 300) { color = 36; }
  const elapsed = (new Date()) - req._startTime;
  const elapsedColor = elapsed < 500 ? 90 : 31;
  let s = `\x1b[90m${req.method} ${req.originalUrl} \x1b[${color}m${res.statusCode} \x1b[${elapsedColor}m${elapsed}ms\x1b[0m`;
  if (req.proxied) { s += ' (proxied)'; }
  return s;
};

const setupExpressMiddleware = function(app) {
  if (config.isProduction) {
    morgan.format('prod', productionLogging);
    app.use(morgan('prod'));
    app.use(compression({filter(req, res) {
      if (req.headers.host === 'codecombat.com') { return false; }  // CloudFlare will gzip it for us on codecombat.com
      return compressible(res.getHeader('Content-Type'));
    }
    })
    );
  } else if (!global.testing || config.TRACE_ROUTES) {
    morgan.format('dev', developmentLogging);
    app.use(morgan('dev'));
  }

  app.use(function(req, res, next) {
    res.header('X-Cluster-ID', config.clusterID);
    return next();
  });

  const public_path = path.join(__dirname, 'public');

  app.use('/', express.static(path.join(public_path, 'templates', 'static')));

  if ((config.buildInfo.sha !== 'dev') && config.isProduction) {
    app.use(`/${config.buildInfo.sha}`, express.static(public_path, {maxAge: '1y'}));
  } else {
    app.use('/dev', express.static(public_path, {maxAge: 0}));  // CloudFlare overrides maxAge, and we don't want local development caching.
  }

  app.use(express.static(public_path, {maxAge: 0}));

  if (config.proxy) {
    // Don't proxy static files with sha prefixes, redirect them
    const regex = /\/[0-9a-f]{40}\/.*/;
    const regex2 = /\/[0-9a-f]{40}-[0-9a-f]{40}\/.*/;
    app.use(function(req, res, next) {
      let newPath;
      if (regex.test(req.path)) {
        newPath = req.path.slice(41);
        return res.redirect(newPath);
      }
      if (regex2.test(req.path)) {
        newPath = req.path.slice(82);
        return res.redirect(newPath);
      }
      return next();
    });
  }

  setupProxyMiddleware(app); // TODO: Flatten setup into one function. This doesn't fit its function name.

  app.use(require('serve-favicon')(path.join(__dirname, 'public', 'images', 'favicon.ico')));
  app.use(require('cookie-parser')());
  app.use(require('body-parser').json({limit: '25mb', strict: false, verify(req, res, buf, encoding) {
    if (req.headers['x-hub-signature']) {
      // this is an intercom webhook request, with signature that needs checking
      try {
        const digest = crypto.createHmac('sha1', config.intercom.webhookHubSecret).update(buf).digest('hex');
        return req.signatureMatches = req.headers['x-hub-signature'] === `sha1=${digest}`;
      } catch (e) {
        return log.info('Error checking hub signature on Intercom webhook: ' + e);
      }
    }
  }
  })
  );
  app.use(require('body-parser').urlencoded({extended: true, limit: '25mb'}));
  app.use(require('method-override')());
  return app.use(require('cookie-session')({
    key: 'codecombat.sess',
    secret: config.cookie_secret
  })
  );
};

const setupCountryTaggingMiddleware = app => app.use(function(req, res, next) {
  let countryInfo, ip;
  if (req.country || (req.user != null ? req.user.get('country') : undefined)) { return next(); }
  if (!(ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress)) { return next(); }
  ip = ip.split(/,? /)[0];  // If there are two IP addresses, say because of CloudFlare, we just take the first.
  const geo = geoip.lookup(ip);
  if (countryInfo = _.find(countries, {countryCode: (geo != null ? geo.country : undefined)})) {
    req.country = countryInfo.country;
  }
  return next();
});

const setupCountryRedirectMiddleware = function(app, country, host) {
  if (country == null) { country = 'china'; }
  if (host == null) { host = 'cn.codecombat.com'; }
  const hosts = host.split(/;/g);
  const shouldRedirectToCountryServer = function(req) {
    let left;
    const reqHost = ((left = req.hostname != null ? req.hostname : req.host) != null ? left : '').toLowerCase();  // Work around express 3.0
    return (req.country === country) && !Array.from(hosts).includes(reqHost) && (reqHost.indexOf(config.unsafeContentHostname) === -1);
  };

  return app.use(function(req, res, next) {
    if (shouldRedirectToCountryServer(req) && hosts.length) {
      res.writeHead(302, {"Location": 'http://' + hosts[0] + req.url});
      return res.end();
    } else {
      return next();
    }
  });
};

const setupOneSecondDelayMiddleware = function(app) {
  if(config.slow_down) {
    return app.use((req, res, next) => setTimeout((() => next()), 1000));
  }
};

const setupMiddlewareToSendOldBrowserWarningWhenPlayersViewLevelDirectly = function(app) {
  const isOldBrowser = function(req) {
    // https://github.com/biggora/express-useragent/blob/master/lib/express-useragent.js
    let ua, v;
    if (!(ua = req.useragent)) { return false; }
    if (ua.isiPad || ua.isiPod || ua.isiPhone || ua.isOpera) { return true; }
    if (!ua || !['Chrome', 'Safari', 'Firefox', 'IE'].includes(ua.Browser) || !ua.Version) { return false; }
    const b = ua.Browser;
    try {
      v = parseInt(ua.Version.split('.')[0], 10);
    } catch (TypeError) {
      log.error('ua.Version does not have a split function.', JSON.stringify(ua, null, '  '));
      return false;
    }
    if ((b === 'Chrome') && (v < 17)) { return true; }
    if ((b === 'Safari') && (v < 6)) { return true; }
    if ((b === 'Firefox') && (v < 21)) { return true; }
    if ((b === 'IE') && (v < 11)) { return true; }
    return false;
  };

  app.use('/play/', useragent.express());
  return app.use('/play/', function(req, res, next) {
    if ((req.path != null ? req.path.indexOf('web-dev-level') : undefined) >= 0) { return next(); }
    if (req.query['try-old-browser-anyway'] || !isOldBrowser(req)) { return next(); }
    return res.sendfile(path.join(__dirname, 'public', 'index_old_browser.html'));
  });
};

const setupRedirectMiddleware = app => app.all('/account/profile/*', function(req, res, next) {
  const nameOrID = req.path.split('/')[3];
  return res.redirect(301, `/user/${nameOrID}/profile`);
});

const setupFeaturesMiddleware = app => app.use(function(req, res, next) {
  // TODO: Share these defaults with run-tests.js
  let features;
  req.features = (features = {
    freeOnly: false
  });

  if ((req.headers.host === 'brainpop.codecombat.com') || (req.session.featureMode === 'brain-pop')) {
    features.freeOnly = true;
    features.campaignSlugs = ['dungeon'];
    features.playViewsOnly = true;
    features.noAuth = true;
    features.brainPop = true;
    features.noAds = true;
  }

  if ((req.headers.host === 'cp.codecombat.com') || (req.session.featureMode === 'code-play')) {
    features.freeOnly = true;
    features.campaignSlugs = ['dungeon', 'forest', 'desert'];
    features.playViewsOnly = true;
    features.codePlay = true; // for one-off changes. If they're shared across different scenarios, refactor
  }

  if (/cn\.codecombat\.com/.test(req.get('host')) || /koudashijie/.test(req.get('host')) || (req.session.featureMode === 'china')) {
    features.china = true;
    features.freeOnly = true;
    features.noAds = true;
  }

  if (config.picoCTF || (req.session.featureMode === 'pico-ctf')) {
    features.playOnly = true;
    features.noAds = true;
    features.picoCtf = true;
  }

  if (config.chinaInfra) {
    features.chinaInfra = true;
  }

  return next();
});

// When config.TRACE_ROUTES is set, this logs a stack trace every time an endpoint sends a response.
// It's great for finding where a mystery endpoint is!
// The same is done for errors in the error-handling middleware.
const setupHandlerTraceMiddleware = app => app.use(function(req, res, next) {
  const oldSend = res.send;
  res.send = function() {
    const result = oldSend.apply(this, arguments);
    console.trace();
    return result;
  };
  return next();
});

const setupSecureMiddleware = function(app) {
  // Cannot use express request `secure` property in production, due to
  // cluster setup.
  const isSecure = function() {
    return this.secure || (this.headers['x-forwarded-proto'] === 'https');
  };

  return app.use(function(req, res, next) {
    req.isSecure = isSecure;
    return next();
  });
};

exports.setupMiddleware = function(app) {
  app.use(timeout(config.timeout));
  if (config.TRACE_ROUTES) { setupHandlerTraceMiddleware(app); }
  setupSecureMiddleware(app);

  setupQuickBailToMainHTML(app);


  setupCountryTaggingMiddleware(app);

  setupMiddlewareToSendOldBrowserWarningWhenPlayersViewLevelDirectly(app);
  setupExpressMiddleware(app);
  setupFeaturesMiddleware(app);

  setupCountryRedirectMiddleware(app, 'china', config.chinaDomain);
  setupCountryRedirectMiddleware(app, 'brazil', config.brazilDomain);

  setupOneSecondDelayMiddleware(app);
  setupRedirectMiddleware(app);
  setupAjaxCaching(app);
  return setupJavascript404s(app);
};

/*Routing function implementations*/

var setupAjaxCaching = app => // IE/Edge are more aggressive about caching than other browsers, so we'll override their caching here.
// Assumes our CDN will override these with its own caching rules.
app.get('/db/*', function(req, res, next) {
  if (!req.xhr) { return next(); }
  // http://stackoverflow.com/questions/19999388/check-if-user-is-using-ie-with-jquery
  const userAgent = req.header('User-Agent') || "";
  if ((userAgent.indexOf('MSIE ') > 0) || !!userAgent.match(/Trident.*rv\:11\.|Edge\/\d+/)) {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', 0);
  }
  return next();
});

var setupJavascript404s = function(app) {
  app.get('/javascripts/*', (req, res) => res.status(404).send('Not found'));
  return app.get(/^\/?[a-f0-9]{40}/, (req, res) => res.status(404).send('Wrong hash'));
};

const templates = {};
const getStaticTemplate = function(file) {
  // Don't cache templates in devlopment so you can just edit then.
  if (templates[file] && config.isProduction) { return templates[file]; }
  return templates[file] = fs.readFileAsync(path.join(__dirname, 'public', 'templates', 'static', file), 'utf8');
};

const renderMain = wrap(function*(template, req, res) {
  template = yield getStaticTemplate(template);

  return res.status(200).send(template);
});

var setupQuickBailToMainHTML = function(app) {

  const fast = template => (function(req, res, next) {
    let features;
    req.features = (features = {});

    if (config.isProduction || true) {
      res.header('Cache-Control', 'public, max-age=60');
      res.header('Expires', 60);
    } else {
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.header('Pragma', 'no-cache');
      res.header('Expires', 0);
    }

    if (req.headers.host === 'cp.codecombat.com') {
      features.codePlay = true; // for one-off changes. If they're shared across different scenarios, refactor
    }
    if (/cn\.codecombat\.com/.test(req.get('host')) || /koudashijie\.com/.test(req.get('host'))) {
      features.china = true;
      if (template === 'home.html') {
        template = 'home-cn.html';
      }
    }

    if (config.chinaInfra) {
      features.chinaInfra = true;
    }

    return renderMain(template, req, res);
  });

  app.get('/', fast('home.html'));
  app.get('/home', fast('home.html'));
  app.get('/about', fast('about.html'));
  app.get('/features', fast('premium-features.html'));
  app.get('/privacy', fast('privacy.html'));
  app.get('/legal', fast('legal.html'));
  app.get('/play', fast('overworld.html'));
  app.get('/play/level/:slug', fast('main.html'));
  return app.get('/play/:slug', fast('main.html'));
};

// Mongo-cache doesnt support the .exec() promise, so we manually wrap it.
// getMandate = (app) ->
//   return new Promise (res, rej) ->
//     Mandate.findOne({}).cache(5 * 60 * 1000).exec (err, data) ->
//       return rej(err) if err
//       res(data)

/*Miscellaneous configuration functions*/

exports.setExpressConfigurationOptions = function(app) {
  app.set('port', config.port);
  app.set('views', __dirname + '/app/views');
  app.set('view engine', 'jade');
  app.set('view options', { layout: false });
  app.set('env', config.isProduction ? 'production' : 'development');
  if (config.isProduction) { return app.set('json spaces', 0); }
};

var setupProxyMiddleware = function(app) {
  if (config.isProduction) { return; }
  if (!config.proxy) { return; }
  const httpProxy = require('http-proxy');

  let target = 'https://very.direct.codecombat.com';
  const headers = {};

  if (process.env.COCO_PROXY_NEXT) {
    target = 'https://next.codecombat.com';
    headers['Host'] = 'next.codecombat.com';
  }

  const proxy = httpProxy.createProxyServer({
    target,
    secure: false,
    headers
  });
  log.info('Using dev proxy server');
  return app.use(function(req, res, next) {
    req.proxied = true;
    return proxy.web(req, res, function(e) {
      console.warn("Failed to proxy: ", e);
      return res.status(502).send({message: 'Proxy failed'});
    });
  });
};
