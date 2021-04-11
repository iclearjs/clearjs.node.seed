'use strict';

module.exports = {
    QueryParams: {
        limit: {type: 'integer', required: false},
        page: {type: 'integer', required: false},
        order: {type: 'string', required: false},
        filter: {type: 'object', required: false},
        like: {type: 'string', required: false},
        likeBy: {type: 'string', required: false},
        pipeline: {type: 'object', required: false},
    },
};
