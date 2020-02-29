/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const cluster = require('cluster');

const config = {};

if (process.env.COCO_SECRETS_JSON_BUNDLE) {
  const object = JSON.parse(process.env.COCO_SECRETS_JSON_BUNDLE);
  for (let k in object) {
    const v = object[k];
    process.env[k] = v;
  }
}

config.clusterID = `${os.hostname()}`;
if (cluster.worker != null) {
 config.clusterID += `/${cluster.worker.id}`;
}

config.unittest = global.testing;
config.proxy = process.env.COCO_PROXY;

config.timeout = parseInt(process.env.COCO_TIMEOUT) || (60*1000);

config.chinaDomain = "bridge.koudashijie.com;koudashijie.com;ccombat.cn;contributors.codecombat.com";
config.chinaInfra = process.env.COCO_CHINA_INFRASTRUCTURE || false;

config.brazilDomain = "br.codecombat.com;contributors.codecombat.com";
config.port = process.env.COCO_PORT || process.env.COCO_NODE_PORT || process.env.PORT  || 3000;
config.ssl_port = process.env.COCO_SSL_PORT || process.env.COCO_SSL_NODE_PORT || 3443;
config.cloudflare = {
  token: process.env.COCO_CLOUDFLARE_API_KEY || '',
  email: process.env.COCO_CLOUDFLARE_API_EMAIL || ''
};

config.github = {
  client_id: process.env.COCO_GITHUB_CLIENT_ID || 'fd5c9d34eb171131bc87',
  client_secret: process.env.COCO_GITHUB_CLIENT_SECRET || '2555a86b83f850bc44a98c67c472adb2316a3f05'
};

config.mongo = {
  port: process.env.COCO_MONGO_PORT || 27017,
  host: process.env.COCO_MONGO_HOST || 'localhost',
  db: process.env.COCO_MONGO_DATABASE_NAME || 'coco',
  analytics_port: process.env.COCO_MONGO_ANALYTICS_PORT || 27017,
  analytics_host: process.env.COCO_MONGO_ANALYTICS_HOST || 'localhost',
  analytics_db: process.env.COCO_MONGO_ANALYTICS_DATABASE_NAME || 'analytics',
  analytics_collection: process.env.COCO_MONGO_ANALYTICS_COLLECTION || 'analytics.log.event',
  mongoose_replica_string: process.env.COCO_MONGO_MONGOOSE_REPLICA_STRING || '',
  readpref: process.env.COCO_MONGO_READPREF || 'primary'
};

if (process.env.COCO_MONGO_ANALYTICS_REPLICA_STRING != null) {
  config.mongo.analytics_replica_string = process.env.COCO_MONGO_ANALYTICS_REPLICA_STRING;
} else {
  config.mongo.analytics_replica_string = `mongodb://${config.mongo.analytics_host}:${config.mongo.analytics_port}/${config.mongo.analytics_db}`;
}

if (process.env.COCO_MONGO_LS_REPLICA_STRING != null) {
  config.mongo.level_session_replica_string = process.env.COCO_MONGO_LS_REPLICA_STRING;
}

if (process.env.COCO_MONGO_LS_AUX_REPLICA_STRING != null) {
  config.mongo.level_session_aux_replica_string = process.env.COCO_MONGO_LS_AUX_REPLICA_STRING;
}

config.sphinxServer = process.env.COCO_SPHINX_SERVER || '';

config.apple =
  {verifyURL: process.env.COCO_APPLE_VERIFY_URL || 'https://sandbox.itunes.apple.com/verifyReceipt'};

config.closeIO =
  {apiKey: process.env.COCO_CLOSEIO_API_KEY || ''};

config.google =
  {recaptcha_secret_key: process.env.COCO_GOOGLE_RECAPTCHA_SECRET_KEY || ''};

config.stripe =
  {secretKey: process.env.COCO_STRIPE_SECRET_KEY || 'sk_test_MFnZHYD0ixBbiBuvTlLjl2da'};

config.paypal = {
  clientID: process.env.COCO_PAYPAL_CLIENT_ID || 'AcS4lYmr_NwK_TTWSJzOzTh01tVDceWDjB_N7df3vlvW4alTV_AF2rtmcaZDh0AmnTcOof9gKyLyHkm-',
  clientSecret: process.env.COCO_PAYPAL_CLIENT_SECRET || 'EEp-AscLo_-_59jMBgrPFWUaMrI_HJEY8Mf1ESD7OJ8DSIFbKtVe1btqP2SAZXR_llP_oosvJYFWEjUZ'
};

if (config.unittest) {
  config.port += 1;
  config.ssl_port += 1;
  config.mongo.host = 'localhost';
} else {
  config.mongo.username = process.env.COCO_MONGO_USERNAME || '';
  config.mongo.password = process.env.COCO_MONGO_PASSWORD || '';
}

config.mail = {
  username: process.env.COCO_MAIL_SERVICE_USERNAME || '',
  supportPrimary: process.env.COCO_MAIL_SUPPORT_PRIMARY || '',
  supportPremium: process.env.COCO_MAIL_SUPPORT_PREMIUM || '',
  supportSchools: process.env.COCO_MAIL_SUPPORT_SCHOOLS || '',
  mailChimpAPIKey: process.env.COCO_MAILCHIMP_API_KEY || '',
  mailChimpWebhook: process.env.COCO_MAILCHIMP_WEBHOOK || '/mail/webhook',
  sendgridAPIKey: process.env.COCO_SENDGRID_API_KEY || '',
  delightedAPIKey: process.env.COCO_DELIGHTED_API_KEY || '',
  cronHandlerPublicIP: process.env.COCO_CRON_PUBLIC_IP || '',
  cronHandlerPrivateIP: process.env.COCO_CRON_PRIVATE_IP || ''
};

config.hipchat = {
  main: process.env.COCO_HIPCHAT_API_KEY || '',
  tower: process.env.COCO_HIPCHAT_TOWER_API_KEY || '',
  artisans: process.env.COCO_HIPCHAT_ARTISANS_API_KEY || ''
};

config.slackToken = process.env.COCO_SLACK_TOKEN || '';

config.clever = {
    client_id: process.env.COCO_CLEVER_CLIENTID,
    client_secret: process.env.COCO_CLEVER_SECRET,
    redirect_uri: process.env.COCO_CLEVER_REDIRECT_URI
  };

config.queue = {
  accessKeyId: process.env.COCO_AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.COCO_AWS_SECRET_ACCESS_KEY || '',
  region: 'us-east-1',
  simulationQueueName: 'simulationQueue'
};

config.mongoQueue =
  {queueDatabaseName: 'coco_queue'};

config.salt = process.env.COCO_SALT || 'pepper';
config.cookie_secret = process.env.COCO_COOKIE_SECRET || 'chips ahoy';

config.isProduction = config.mongo.host !== 'localhost';

// Domains (without subdomain prefix, with port number) for main hostname (usually codecombat.com)
// and unsafe web-dev iFrame content (usually codecombatprojects.com).
config.mainHostname = process.env.COCO_MAIN_HOSTNAME || 'localhost:3000';
config.unsafeContentHostname = process.env.COCO_UNSAFE_CONTENT_HOSTNAME || 'localhost:3000';

if (process.env.COCO_PICOCTF) {
  config.picoCTF = true;
  config.picoCTF_api_url = 'http://staging.picoctf.com/api';
  config.picoCTF_login_URL = 'http://staging.picoctf.com';
  config.picoCTF_auth = {username: 'picodev', password: 'pico2016rox!ftw'};
} else {
  config.picoCTF = false;
}


if (!config.unittest &&  !config.isProduction) {
  // change artificially slow down non-static requests for testing
  config.slow_down = false;
}

if (process.env.COCO_STATSD_HOST) {
  config.statsd = {
    host: process.env.COCO_STATSD_HOST,
    port: process.env.COCO_STATSD_PORT || 8125,
    prefix: process.env.COCO_STATSD_PREFIX || ''
  };
}

config.snowplow = {
  user: process.env.COCO_SNOWPLOW_USER || 'user',
  database: process.env.COCO_SNOWPLOW_DATABASE || 'database',
  password: process.env.COCO_SNOWPLOW_PASSWORD || 'password',
  host: process.env.COCO_SNOWPLOW_HOST || 'host',
  port: process.env.COCO_SNOWPLOW_PORT || 1
};

config.buildInfo = { sha: 'dev' };

config.intercom = {
  accessToken: process.env.COCO_INTERCOM_ACCESS_TOKEN || 'dGVzdA==', //base64 "test"
  webhookHubSecret: process.env.COCO_INTERCOM_WEBHOOK_HUB_SECRET || 'abcd'
};

config.bitly =
  {accessToken: process.env.COCO_BITLY_ACCESS_TOKEN || ''};

config.zenProspect =
  {apiKey: process.env.COCO_ZENPROSPECT_API_KEY || ''};

config.apcspFileUrl = process.env.COCO_APCSP_FILE_URL || `http://localhost:${config.port}/apcsp-local/`;

if (fs.existsSync(path.join(__dirname, '.build_info.json'))) {
  config.buildInfo = JSON.parse(fs.readFileSync(path.join(__dirname, '.build_info.json'), 'utf8'));
}

// This logs a stack trace every time an endpoint sends a response or throws an error.
// It's great for finding where a mystery endpoint is!
config.TRACE_ROUTES = (process.env.TRACE_ROUTES != null);

// Enables server-side gzip compression for network responses
// Only use this if testing network response sizes in development
// (In production, CloudFlare compresses things for us!)
config.forceCompression = (process.env.COCO_FORCE_COMPRESSION != null);

module.exports = config;
