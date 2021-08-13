'use strict';
const {MongooseSchema} = require('@clearjs/node').mongodb;
const numeral = require('numeral');

const AutoGenerateCode = async (prefix, collection, field) => {
    field = field ? field : 'code';
    const ctx = this.createAnonymousContext();
    const Prefix = prefix + new Date().getFullYear() + '' + numeral(new Date().getMonth() + 1).format('00') + '' + numeral(new Date().getDate()).format('0000');
    const record = await ctx.model[collection].findOne({[field]: new RegExp(Prefix, 'i')}).sort('-' + field);
    return Prefix + numeral(record ? parseInt(record.code.slice(prefix.length + 8)) + 1 : 1).format('0000');
}
module.exports = {MongooseSchema, AutoGenerateCode};
