// Generated by CoffeeScript 1.7.1
(function() {
  var ChromeHistoryAPI, fillInVisit, getDomain, parse;

  ChromeHistoryAPI = require('./chrome_history_api');

  BH.Lib.SearchHistory = (function() {
    function SearchHistory(query) {
      this.query = query;
      this.history = new ChromeHistoryAPI();
    }

    SearchHistory.prototype.fetch = function(options, callback) {
      var defaultOptions, endTime, startAtResult, startTime;
      if (callback == null) {
        callback = function() {};
      }
      defaultOptions = {
        text: '',
        startTime: 0,
        maxResults: 5000
      };
      options = _.extend(defaultOptions, options);
      startTime = options.startTime, endTime = options.endTime;
      startAtResult = options.startAtResult;
      delete options.startAtResult;
      return chrome.storage.local.get('lastSearchCache', (function(_this) {
        return function(data) {
          var cache;
          cache = data.lastSearchCache;
          if ((cache != null ? cache.query : void 0) === _this.query && (cache != null ? cache.startTime : void 0) === startTime && (cache != null ? cache.endTime : void 0) === endTime && !startAtResult) {
            return callback(cache.results, new Date(cache.datetime));
          } else {
            return _this.history.query(options, function(history) {
              options = {
                options: {
                  text: _this.query
                },
                results: history
              };
              return _this.worker('searchSanitizer', options, function(results) {
                var setCache;
                setCache = function(results) {
                  return chrome.storage.local.set({
                    lastSearchCache: {
                      results: results,
                      datetime: new Date().getTime(),
                      query: _this.query,
                      startTime: startTime,
                      endTime: endTime
                    }
                  });
                };
                if (startTime && endTime) {
                  return _this.worker('rangeSanitizer', {
                    options: {
                      startTime: startTime,
                      endTime: endTime
                    },
                    results: results
                  }, function(sanitizedResults) {
                    setCache(sanitizedResults);
                    return callback(parse(sanitizedResults));
                  });
                } else {
                  setCache(results);
                  return callback(parse(results));
                }
              });
            });
          }
        };
      })(this));
    };

    SearchHistory.prototype.expireCache = function() {
      return chrome.storage.local.remove('lastSearchCache');
    };

    SearchHistory.prototype.deleteUrl = function(url, callback) {
      this.history.deleteUrl(url, function() {
        return callback();
      });
      return chrome.storage.local.get('lastSearchCache', (function(_this) {
        return function(data) {
          var results;
          results = data.lastSearchCache.results;
          data.lastSearchCache.results = _.reject(results, function(visit) {
            return visit.url === url;
          });
          return chrome.storage.local.set(data);
        };
      })(this));
    };

    SearchHistory.prototype.destroy = function(options, callback) {
      if (options == null) {
        options = {};
      }
      if (callback == null) {
        callback = function() {};
      }
      return this.fetch(options, (function(_this) {
        return function(history) {
          var i, visit, _i, _len, _results;
          _results = [];
          for (i = _i = 0, _len = history.length; _i < _len; i = ++_i) {
            visit = history[i];
            _results.push(_this.history.deleteUrl(visit.url, function() {
              if (i === history.length) {
                _this.expireCache();
                return callback();
              }
            }));
          }
          return _results;
        };
      })(this));
    };

    return SearchHistory;

  })();

  parse = function(visits) {
    var i, visit, _i, _len, _results;
    _results = [];
    for (i = _i = 0, _len = visits.length; _i < _len; i = ++_i) {
      visit = visits[i];
      _results.push(fillInVisit(visit));
    }
    return _results;
  };

  fillInVisit = function(visit) {
    visit.host = getDomain(visit.url);
    visit.location = visit.url;
    visit.path = visit.url.replace(visit.domain, '');
    if (visit.title === '') {
      visit.title = '(No Title)';
    }
    visit.name = visit.title;
    return visit;
  };

  getDomain = function(url) {
    var match;
    match = url.match(/\w+:\/\/(.*?)\//);
    if (match === null) {
      return null;
    } else {
      return match[0];
    }
  };

  module.exports = Search;

}).call(this);
