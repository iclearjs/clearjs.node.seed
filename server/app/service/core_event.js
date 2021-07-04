'use strict';

const Service = require('egg').Service;

class CoreEvent extends Service {
    async push(event,data,meta,sendTo) {
        const error = {
            code: '0',
        };
        if (!data) {
            error.code = 'PS01';
            error.message = 'param data missing';
        }
        return { error };
    }
    async sendAliSms(){

    }
    async sendTecentSms(){

    }
    async sendBaiduSms(){

    }
}

module.exports = CoreEvent;
