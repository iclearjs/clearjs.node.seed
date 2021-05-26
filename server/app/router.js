'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
const fs = require('fs');
const path = require('path');

module.exports = app => {
    const routers = fs.readdirSync(path.join(app.baseDir, '/app/router'))
    for (let router of routers) {
        require(path.join(app.baseDir,'app/router', router))(app);
    }
};
