'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        noticeTitle: {
            name: '通知标题',
            type: String
        },
        noticeContent: {
            name: '通知内容',
            type: String
        },
        publishArea: {
            name: '发布区域',
            type: Array
        },
        idNoticeClass: {
            name: '通知类别id',
            type: app.mongoose.Schema.ObjectId,
            ref: 'sys_notice_class'
        },
        publishType: {
            name: '发布类型',
            type: String
        },
        isEngine: {
            name: '是否底层公告',
            type: Boolean,
            default: 'true'
        },
        idUser: {
            name: '用户',
            type: app.mongoose.Schema.ObjectId,
            ref: 'sys_user'
        },
    };

    const schema = app.MongooseSchema(collection, attributes, true, true, false);

    return app.mongooseDB.get('default').model(collection, schema, collection);

};