var _ = require('@sailshq/lodash');

module.exports = function(sails) {

  return {

    defaults: {
      __configKey__: {
        'envVar': 'MAINTENANCE_MODE',
        'textMessage': 'Site currently under maintenance.',
        'whitelistedUrls': [],
        status: 503
      }
    },

    configure: function() {

      var self = this;

      // Allow deprecated snake_case config for now.
      _.each(['env_var','whitelist_urls','json_message','text_message','backdoor_on_param','backdoor_off_param'], function(key) {
        if (!_.isUndefined(sails.config[self.configKey][key]) && _.isUndefined(sails.config[self.configKey][_.camelCase(key)])) {
          sails.config[self.configKey][_.camelCase(key)] = sails.config[self.configKey][key];
          sails.log.warn('The `' + key + '` configuration key in sails-hook-maintenance-mode is deprecated.  Please use `' + _.camelCase(key) + '` instead.');
        }
      });

      // If no view is configured, try to default to views/maintenance.ejs if it exists
      if ('undefined' === typeof sails.config[this.configKey].view) {
        try {
          if (require('fs').existsSync(require('path').resolve(sails.config.appPath, 'views', 'maintenance.ejs'))) {
            sails.config[this.configKey].view = 'maintenance';
          }
        } catch(e) {}
      }

    },

    initialize: function(cb) {
      var self = this;

      // Determine if maintenance mode is enabled
      var inMaintenanceMode = process.env[sails.config[self.configKey].envVar];
      if (inMaintenanceMode === 'true' || inMaintenanceMode === true) {

        // Bind a route that will run before all user and blueprint routes.
        // NOTE -- this will not necessarily run before all other HOOK routes.
        sails.on('router:before', function() {

          // Make this a wildcard route that will match any URL
          sails.router.bind('/*', function(req, res, next) {

            // If the URL matches one of the whitelisted URLs...
            if (_.isArray(sails.config[self.configKey].whitelistUrls) && _.find(sails.config[self.configKey].whitelistUrls, function(whitelistedUrl) {
              return req.url.match(whitelistedUrl);
            })) {
              return next();
            }

            // If a backdoor was provided for maintenance mode...
            if (sails.config[self.configKey].backdoorOnParam) {

              // If the "close backdoor" param was used, then close the back door so that requests
              // will once again be met with the maintenance mode page.
              if (sails.config[self.configKey].backdoorOffParam && req.param(sails.config[self.configKey].backdoorOffParam)) {
                req.session.unlockMaintenanceMode = false;
              }

              // If the "open backdoor" param was used now or previously, continue serving the request
              // instead of showing maintenance mode.
              if (req.param(sails.config[self.configKey].backdoorOnParam) || req.session.unlockMaintenanceMode) {
                req.session.unlockMaintenanceMode = true;
                return next();
              }
            }

            // Set the response status
            res.status(sails.config[self.configKey].status || 200);

            // If the "view" config was explicitly set to false, just show a JSON or text message.
            if (sails.config[self.configKey].view === false || res.wantsJSON) {
              if (sails.config[self.configKey].jsonMessage) {
                return res.json(sails.config[self.configKey].jsonMessage);
              }
              return res.send(sails.config[self.configKey].textMessage);
            }
            // If "view" config was set, then serve that view
            else if (sails.config[self.configKey].view) {
              return res.view(sails.config[self.configKey].view, sails.config[self.configKey].viewLocals || {});
            }
            // Otherwise if "view" config was left completely blank, serve our default maintenance page
            else {
              return res.view(require('path').resolve(__dirname, 'maintenance.ejs'), {layout: false});
            }
          }, 'all', {skipAssets: true});

        });

      }

      return cb();

    }

  };

};
