'use strict';
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

const Controller = require('egg').Controller;

class File extends Controller {
    constructor(ctx) {
        super(ctx);
    }

    async preview() {
        const error = {
            code: '0',
        };
        const file = await this.ctx.model.SysFile.findOne({_id: this.ctx.params.id})
            .catch(e => {
                if (e) {
                    error.code = '700';
                }
                console.info(e);
            });
        this.ctx.set('Content-Type', file.fileType);
        this.ctx.attachment(file.fileName);
        this.ctx.body = fs.readFileSync(path.join(this.ctx.app.config.fileDir, file.filePath));
    }

    async download() {
        const error = {
            code: '0',
        };
        const file = await this.ctx.model.SysFile.findOne({_id: this.ctx.params.id})
            .catch(e => {
                if (e) {
                    error.code = '700';
                }
                console.info(e);
            });
        this.ctx.attachment(file.fileName);
        this.ctx.set('Content-Type', 'application/octet-stream');
        this.ctx.body = fs.readFileSync(path.join(this.ctx.app.config.fileDir, file.filePath));
    }

    async remove() {
        const error = {
            code: '0',
        };
        fs.unlink(this.ctx.app.config.fileDir + this.ctx.params.id, function (err) {
            if (err) {
                throw err;
            }
        });
        this.ctx.body = error.code === '0' ? {
            error,
        } : {
            error,
        };
    }

    async upload() {
        const error = {
            code: '0',
        };
        if (!fs.existsSync(path.join(this.ctx.app.config.fileDir))) {
            mkdirp(path.join(this.ctx.app.config.fileDir));
        }
        const files = [];
        for (const file of this.ctx.request.files) {
            const fsWriteFileName = this.ctx.app.mongoose.Types.ObjectId() + '.' + file.filename.split('.')[file.filename.split('.').length - 1];
            try {
                await fs.writeFileSync(path.join(this.ctx.app.config.fileDir, fsWriteFileName), await fs.readFileSync(file.filepath));
                files.push({
                    fileName: file.filename,
                    fileSize: file.encoding,
                    fileType: file.mime,
                    filePath: fsWriteFileName,
                });
            } finally {
                this.ctx.cleanupRequestFiles();
            }
        }
        const records = await this.ctx.model.SysFile.create(files)
            .catch(e => {
                if (e) {
                    error.code = '700';
                }
                console.info(e);
            });
        this.ctx.body = error.code === '0' ? {
            error,
            records,
        } : {
            error,
        };
    }

    async uploadByBase64() {
        const error = {
            code: '0',
        };
        const objectID = this.ctx.app.mongoose.Types.ObjectId();
        if (!fs.existsSync(path.join(this.ctx.app.config.fileDir))) {
            mkdirp(path.join(this.ctx.app.config.fileDir), err => {
            });
        }
        await fs.writeFileSync(path.join(this.ctx.app.config.fileDir, objectID + '.png'), new Buffer(this.ctx.request.body.base64, 'base64'));
        const fileStat = await fs.statSync(path.join(this.ctx.app.config.fileDir, objectID + '.png'));
        const records = await this.ctx.model.SysFile.create({
            fileName: objectID + '.png',
            fileSize: fileStat.size,
            fileType: 'image/png',
            filePath: objectID + '.png',
        })
            .catch(e => {
                if (e) {
                    error.code = '700';
                }
                console.info(e);
            });
        this.ctx.body = error.code === '0' ? {
            error,
            records,
        } : {
            error,
        };
    }
}

module.exports = File;

