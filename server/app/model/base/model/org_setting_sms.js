'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        idEvent: {
            name: '短信事件',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_event'
        },
        value: {
            name: '是否启用',
            type: Boolean
        },
    };

    const schema = app.MongooseSchema(collection, attributes, true, false, false);

    return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};