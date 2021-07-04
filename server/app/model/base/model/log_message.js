'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        idUser: {
            name: '被推送者',
            type: app.mongoose.Schema.ObjectId,
            ref: 'sys_user'
        },
        idOrganUser: {
            name: '被推送者',
            type: app.mongoose.Schema.ObjectId,
            ref: 'org_organ_user'
        },
        title: {
            name: '推送标题',
            type: String
        },
        content: {
            name: '推送内容',
            type: String
        },
        type: {
            name: '推送类型',
            type: String
        },
        event: {
            name: '推送事件编码',
            type: String
        },
        meta: {
            name: 'meta',
            type: Object,
            default: {}
        },
        isRead: {
            name: 'isRead',
            type: Boolean
        },
        isShow: {
            name: 'isShow',
            type: Boolean
        },
    };

    const schema = app.MongooseSchema(collection, attributes, true, false, false);

    return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};