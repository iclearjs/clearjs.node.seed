'use strict';
module.exports = appInfo => {
    const config = exports = {};
    config.mongoose = {
        clients: {
            default: {
                url: "mongodb://192.168.192.100/60b5ce9dfd233dc94c4bbe71",
                options: {
                    user: "scm",
                    pass: "scm",
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
