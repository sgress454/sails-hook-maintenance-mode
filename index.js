module.exports = function(sails) {

  return {

    defaults: {
      __configKey__: {
        env_var: "MAINTENANCE_MODE",
        text_message: "Site currently under maintenance.",
        status: 503
      }
    },

    configure: function() {

      // If no view is configured, try to default to views/maintenance.ejs if it exists
      if ('undefined' == typeof sails.config[this.configKey].view) {
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
      var inMaintenanceMode = process.env[sails.config[self.configKey].env_var];
      if (inMaintenanceMode == 'true' || inMaintenanceMode === true) {

        // Bind a route that will run before all user and blueprint routes.
        // NOTE -- this will not necessarily run before all other HOOK routes.
        sails.on('router:before', function() {

          // Make this a wildcard route that will match any URL
          sails.router.bind('/*', function(req, res, next) {

            // If a backdoor was provided for maintenance mode...
            if (sails.config[self.configKey].backdoor_on_param) {

              // If the "close backdoor" param was used, then close the back door so that requests
              // will once again be met with the maintenance mode page.
              if (sails.config[self.configKey].backdoor_off_param && req.param(sails.config[self.configKey].backdoor_off_param)) {
                req.session.unlockMaintenanceMode = false;
              }

              // If the "open backdoor" param was used now or previously, continue serving the request
              // instead of showing maintenance mode.
              if (req.param(sails.config[self.configKey].backdoor_on_param) || req.session.unlockMaintenanceMode) {
                req.session.unlockMaintenanceMode = true;
                return next();
              }              
            }

            // Set the response status
            res.status(sails.config[self.configKey].status || 200);

            // If the "view" config was explicitly set to false, just show a JSON or text message.
            if (sails.config[self.configKey].view === false || res.wantsJSON) {
              if (sails.config[self.configKey].json_message) {
                return res.json(sails.config[self.configKey].json_message);
              }
              return res.send(sails.config[self.configKey].text_message);              
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
