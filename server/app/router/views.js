'use strict';

module.exports = app => {
    const {router, controller} = app;
    router.get('/', controller.views.index);
    router.get('/404', controller.views.notfound);
    router.get('/swagger', controller.views.swagger);
};
