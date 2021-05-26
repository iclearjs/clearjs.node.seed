'use strict';



module.exports = app => {
    const model = require('path').basename(__filename, '.js');

    const attributes = {
        name: {
            type: String
        },
        idPage: {
            type: app.mongoose.Types.ObjectId,
            ref:'cdp_page'
        },
        code: {
            type: String
        },
        idApplication: {
            type: app.mongoose.Types.ObjectId,
            ref:'cdp_application'
        },
        version:{
            type:String,
            default:'0.0.0'
        },
    };

    const schema = app.MongooseSchema(model, attributes);

    return app.mongooseDB.get('default').model(model, schema, model);
};
