'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        idUser: {
            name: '主表id',
            type: app.mongoose.Schema.ObjectId,
            ref: 'sys_user'
        },
        socket: {
            name: 'socket的id',
            type: String
        },
        device: {
            name: '设备类型',
            type: String
        },
    };

    const schema = app.MongooseSchema(collection, attributes, false, true, false);

    return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};