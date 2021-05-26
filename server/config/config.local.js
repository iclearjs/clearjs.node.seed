'use strict';
module.exports = appInfo => {
    const config = exports = {};
    config.mongoose = {
        clients: {
            default: {
                url: "mongodb://47.111.230.18/608ac68594183e3730fde680",
                options: {
                    user: "hdjt",
                    pass: "hdjt",
                    useUnifiedTopology: true,
                },
            },
        },
        model: ['app/model/base/model']
    };
    return {
        ...config,
    };
};
