'use strict';
module.exports = appInfo => {
  const config = exports = {};
  config.mongoose = {
    clients: {
      default: {
        url: 'mongodb://119.3.37.79/61168cfbb9912dad04c7ac5c',
        options: {
          user: 'tt',
          pass: 'tt',
          useUnifiedTopology: true,
        },
      },
    },
    model: [ 'app/model/base/model' ],
  };
  return {
    ...config,
  };
};
