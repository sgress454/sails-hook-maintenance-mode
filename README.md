# sails-hook-maintenance-mode

[Sails JS](http://sailsjs.org) hook to provide a simple "maintenance mode" for an app, toggleable with an environment variable.  In maintenance mode, all requests receive an "under maintenance" page or message in response.

### Installation

`npm install sails-hook-maintenance-mode`

### Usage

To lift an app in maintenance mode, set the MAINTENANCE_MODE environment variable to "true".

```
MAINTENANCE_MODE=true sails lift
```

### Configuration

By default, configuration lives in `sails.config['maintenance-mode']`.  The configuration key (`maintenance-mode`) can be changed by setting `sails.config.hooks['sails-hook-maintenance-mode'].configKey`.

Parameter      | Type                | Default | Details
-------------- | ------------------- | ------- | :---------------------------------:
env_var        | ((string)) | `MAINTENANCE_MODE` | Environment variable to check 
view | ((string)) | _none_ | View to display in maintenance mode.  If not provided, the hook will use the `views/maintenance.ejs` view if your app has one.  Otherwise, it will show a default maintenance page.  Set to `false` to display text or JSON instead of a view (see `text_message` and `json_message` options)
viewLocals | ((dictionary)) | `{}` | Locals and options to use with your maintenance view.  You can use this to change up the message per environment, or to provide a different layout.
status | ((number)) | 503 (service unavailable) | Status code to respond with in maintenance mode.
json_message | ((json)) | _none_ | If `view` is set to `false` and `json_message` is provided, the [`res.json`](http://sailsjs.org/documentation/reference/response-res/res-json) method will be used with that value for the response in maintenance mode.
text_message | ((string)) | _none_ | If `view` is set to `false` and `text_message` is provided (and `json_message` is _not_ provided), the [`res.send`](http://sailsjs.org/documentation/reference/response-res/res-send) method will be used with that value for the response in maintenance mode.
backdoor_on_param    | ((string)) | _none_ | Parameter which can be used to unlock maintenance mode for a single session.  Use this to test updates to the site while the rest of the world still sees the maintenance page.
backdoor_off_param    | ((string)) | _none_ | Parameter which can be used to re-instate maintenance mode for a session after the `backdoor_on_param` has been used.

#### Example

```javascript
// [your-sails-app]/config/env/production.js
module.exports = {
  'maintenance-mode': {
    env_var: 'MAINTENANCE',
    view: false,
    text_message: "Site currently under maintenance, please try again later."
    backdoor_on_param: 'open_sesame',
    backdoor_off_param: 'close_sesame',
    status: 200
  }
};

```
