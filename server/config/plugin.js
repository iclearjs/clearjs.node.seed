'use strict';

/** @type Egg.EggPlugin */
module.exports = {
    static: {
        enable: true,
    },
    security: {
        enable: true,
    },
    cors: {
        enable: true,
        package: 'egg-cors',
    },
    mongoose: {
        enable: true,
        package: '@clearjs/mongoose',
    },
    swaggerdoc : {
        enable: true,
        package: 'egg-swagger-doc',
    },
    nunjucks : {
        enable: true,
        package: 'egg-view-nunjucks',
    }
};
