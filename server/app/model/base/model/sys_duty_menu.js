'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        idDuty: {
            name: 'idDuty',
            type: app.mongoose.Schema.ObjectId,
            ref: 'sys_duty'
        },
        idApplication: {
            name: 'idApplication',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_application'
        },
        idMenu: {
            name: 'idMenu',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_menu'
        },
    };

    const schema = app.MongooseSchema(collection, attributes, true, true, false);

    return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};