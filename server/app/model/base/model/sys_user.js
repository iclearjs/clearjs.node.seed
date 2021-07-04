'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        userCode: {
            name: 'userCode',
            type: String
        },
        userName: {
            name: 'userName',
            type: String
        },
        userInfo: {
            name: '用户关联信息',
            type: Object,
            default: {}
        },
        userType: {
            name: '用户类型',
            type: String
        },
        userPwd: {
            name: 'userPwd',
            type: String
        },
        avatarColor: {
            name: 'avatarColor',
            type: String
        },
        avatar: {
            name: 'avatar',
            type: String
        },
    };

    const schema = app.MongooseSchema(collection, attributes, false, true, false);

    return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};