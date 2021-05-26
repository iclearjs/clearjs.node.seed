'use strict';

module.exports = (app,schema) => {
    /**https://mongoosejs.com/docs/middleware.html*/

    schema.pre('save',async (next)=>{
        next();
    })

    schema.post('save', function(doc, next) {
        next();
    });

    return schema;
};
