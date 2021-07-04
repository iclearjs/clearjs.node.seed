'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        organCode: {
            name: '组织编码',
            type: String
        },
        organName: {
            name: '组织名称',
            type: String
        },
        p_id: {
            name: '上级组织',
            type: String
        },
        order: {
            name: '排序',
            type: Number,
            default: 999
        },
        idGroupOrgan: {
            name: '集团组织',
            type: app.mongoose.Schema.ObjectId,
            ref: 'org_organ'
        },
    };

    const schema = app.MongooseSchema(collection, attributes, false, false, false);

    return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};