const props = {
  permissions: [],
  anonymous: true,
  preferredLanguage: 'en'
};

exports.serverConfig = {
  codeNinja: false,
  static: true
};

exports.features =
  {playViewsOnly: false};

exports.me = {
  showingStaticPagesWhileLoading() { return true; },
  isStudent() { return false; },
  isAnonymous() { return this.get('anonymous'); },
  hasSubscription() { return false; },
  isTeacher() { return false; },
  isAdmin() { return false; },
  level() { return 1; },
  useDexecure() { return true; },
  useSocialSignOn() { return true; },
  gems() { return 0; },
  getPhotoURL() { return ''; },
  displayName() { return ''; },
  broadName() { return ''; },
  get(prop) { return props[prop]; },
  isOnPremiumServer() { return false; },
  freeOnly() { return false; },
  isTarena() { return false; },
  useTarenaLogo() { return false; },
  hideTopRightNav() { return false; },
  hideFooter() { return false; },
  useGoogleAnalytics() { return true; },
  showChinaVideo() { return false; },
  getHomePageTestGroup() { return undefined; },
  showForumLink() { return true; },
  showGithubLink() { return true; },
  showChinaICPinfo() { return false; },
  showChinaResourceInfo() { return false; },
  hideDiplomatModal() { return false; },
  showOpenResourceLink() { return true; },
  useStripe() { return true; }
};

exports.view = {
  forumLink() { return 'http://discourse.codecombat.com/'; },
  isMobile() { return false; },
  showAds() { return false; },
  isOldBrowser() { return false; },
  isIPadBrowser() { return false; }
};
