'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        idUser: {
            name: 'idUser',
            type: app.mongoose.Schema.ObjectId,
            ref: 'sys_user'
        },
        userType: {
            name: 'userType',
            type: String
        },
        idBranch: {
            name: '所属部门',
            type: app.mongoose.Schema.ObjectId,
            ref: 'org_branch'
        },
        idBranchSettlement: {
            name: '核算部门',
            type: app.mongoose.Schema.ObjectId,
            ref: 'org_branch'
        },
        name: {
            name: '姓名',
            type: String
        },
        workNo: {
            name: '工号',
            type: String
        },
        job: {
            name: '职位',
            type: String
        },
        sex: {
            name: '性别',
            type: String
        },
        maritalStatus: {
            name: '婚姻状况',
            type: String
        },
        nationality: {
            name: '民族',
            type: String
        },
        major: {
            name: '专业',
            type: String
        },
        nativePlace: {
            name: '籍贯',
            type: Array
        },
        polity: {
            name: '政治面貌',
            type: String
        },
        idType: {
            name: '证件类型',
            type: String
        },
        idNo: {
            name: '证件号码',
            type: String
        },
        birthday: {
            name: '出生年月',
            type: Date
        },
        telephone: {
            name: '手机',
            type: String
        },
        email: {
            name: '邮箱',
            type: String
        },
        address: {
            name: '现居地址',
            type: String
        },
        permanentAddress: {
            name: '户籍地址',
            type: String
        },
        bankName: {
            name: '银行',
            type: String
        },
        bankAccount: {
            name: '银行卡号',
            type: String
        },
        degree: {
            name: '学历',
            type: String
        },
        leaveDate: {
            name: '离职时间',
            type: Date
        },
        entryDate: {
            name: '入职时间',
            type: Date
        },
        familyInfo: [new app.mongoose.Schema({
            call: {
                name: '称呼',
                type: String
            },
            age: {
                name: '年龄',
                type: String
            },
            name: {
                name: '姓名',
                type: String
            },
            company: {
                name: '任职单位',
                type: String
            },
        })],
        workInfo: [new app.mongoose.Schema({
            range: {
                name: '起止时间',
                type: Array
            },
            company: {
                name: '公司',
                type: String
            },
            post: {
                name: '职位',
                type: String
            },
            job: {
                name: '职务',
                type: String
            },
        })],
    };

    const schema = app.MongooseSchema(collection, attributes, true, false, false);

    return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};