'use strict';

module.exports = () => {
  return async (ctx, next) => {
    ctx.socket.on('error', function() {
      console.log('error');
    });
    console.log('connected',ctx.socket.id);
    await next();
    console.log('disconnect!');
  };
};
