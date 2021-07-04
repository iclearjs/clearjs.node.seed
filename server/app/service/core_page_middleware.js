'use strict';

const Service = require('egg').Service;

class BasePageMiddlewareService extends Service {
    async beforeCreate(data) {
        const error = {
            code: '0',
        };
        if (!data) {
            error.code = 'PS01';
            error.message = 'param data missing';
        }
        return { error, data };
    }

    async afterCreate(data) {
        const error = {
            code: '0',
        };
        if (!data) {
            error.code = 'PS01';
            error.message = 'param data missing';
        }
        return error;
    }

    async beforeModify(data) {
        const error = {
            code: '0',
        };
        if (!data) {
            error.code = 'PS01';
            error.message = 'param data missing';
        }
        return { error, data };
    }

    async afterModify(_id) {
        const error = {
            code: '0',
        };
        if (!_id) {
            error.code = 'PS01';
            error.message = 'param _id missing';
        }

        return error;
    }

    async beforeChange(data) {
        const error = {
            code: '0',
        };
        if (!data) {
            error.code = 'PS01';
            error.message = 'param data missing';
        }
        return { error, data };
    }

    async afterChange(data) {
        const error = {
            code: '0',
        };
        if (!data) {
            error.code = 'PS01';
            error.message = 'param data missing';
        }
        return error;
    }

    async beforeSubmit(_id) {
        const error = {
            code: '0',
        };
        if (!_id) {
            error.code = 'PS01';
            error.message = 'param _id missing';
        }

        return error;

    }

    async afterSubmit(_id) {
        const error = {
            code: '0',
        };
        if (!_id) {
            error.code = 'PS01';
            error.message = 'param _id missing';
        }

        return error;
    }

    async beforeVerify(_id) {
        const error = {
            code: '0',
        };
        if (!_id) {
            error.code = 'PS01';
            error.message = 'param _id missing';
        }

        return error;

    }

    async afterVerify(_id) {
        const error = {
            code: '0',
        };
        if (!_id) {
            error.code = 'PS01';
            error.message = 'param _id missing';
        }
        // 进行 同步数据的
        return error;
    }

    async beforeAbandon(_id) {
        const error = {
            code: '0',
        };
        if (!_id) {
            error.code = 'PS01';
            error.message = 'param _id missing';
        }

        return error;
    }

    async afterAbandon(_id) {
        const error = {
            code: '0',
        };
        if (!_id) {
            error.code = 'PS01';
            error.message = 'param _id missing';
        }

        return error;
    }

    async beforeRevoke(_id) {
        const error = {
            code: '0',
        };
        if (!_id) {
            error.code = 'PS01';
            error.message = 'param _id missing';
        }

        return error;
    }

    async afterRevoke(_id) {
        const error = {
            code: '0',
        };
        if (!_id) {
            error.code = 'PS01';
            error.message = 'param _id missing';
        }

        return error;
    }

    async beforeClose(_id) {
        const error = {
            code: '0',
        };
        if (!_id) {
            error.code = 'PS01';
            error.message = 'param _id missing';
        }

        return error;
    }

    async afterClose(_id) {
        const error = {
            code: '0',
        };
        if (!_id) {
            error.code = 'PS01';
            error.message = 'param _id missing';
        }

        return error;
    }

    async beforeOpen(_id) {
        const error = {
            code: '0',
        };
        if (!_id) {
            error.code = 'PS01';
            error.message = 'param _id missing';
        }

        return error;
    }

    async afterOpen(_id) {
        const error = {
            code: '0',
        };
        if (!_id) {
            error.code = 'PS01';
            error.message = 'param _id missing';
        }

        return error;
    }

    async beforeRemove(_id) {
        const error = {
            code: '0',
        };
        if (!_id) {
            error.code = 'PS01';
            error.message = 'param _id missing';
        }

        return error;
    }

    async afterRemove(data) {
        const error = {
            code: '0',
        };
        if (!data) {
            error.code = 'PS01';
            error.message = 'param data missing';
        }
        return error;
    }
}

module.exports = BasePageMiddlewareService;
