'use strict';

module.exports = {
    GeneratorQuery(data){
        const query = {};
        query.filter = data.filter === undefined || typeof data.filter==='object'? {} : JSON.parse(data.filter);
        query.project = data.project === undefined || typeof data.project==='object'? {} : JSON.parse(data.project);
        if (data.like) {
            query.filter.$or = [];
            for (const key of data.likeBy.split(',')) {
                query.filter.$or.push({[key]: new RegExp(data.like, 'i')});
            }
        }
        query.order = data.order === undefined ? '_id' : (data.order==='-_id'?data.order:data.order + ' _id');
        query.limit = data.limit === undefined ? 500 : parseInt(data.limit);
        query.skip = data.page === undefined ? 0 : (parseInt(data.page) - 1) * (data.limit === undefined ? 0 : parseInt(data.limit));
        query.security = data.security === undefined ? 4 : parseInt(data.security);
        query.populate=data.populate;
        return query;
    },
};
