
export default {
    data() {
        return {
            buttonsDisabled: {
                submit: (record) => {
                    return record && record.__s === 1
                },
                copy: (record) => {
                    return Object.keys(record).length > 0
                },
                modify: (record) => {
                    return Object.keys(record).length > 0 && record.__s === 1
                },
                revoke: (record) => {
                    return record && record.__s === 2
                },
                verify: (record) => {
                    return record && record.__s === 2
                },
                change: (record) => {
                    return record && record.__s === 3
                },
                abandon: (record) => {
                    return record && record.__s === 3
                },
                close: (record) => {
                    return record && record.__s === 3
                },
                open: (record) => {
                    return record && record.__s === 0
                },
                remove: (record) => {
                    return record && record.__s === 1
                },
            },
        }
    },
    methods: {


        //提交
        async submit() {
            await this.doSubmit([this.selectedRow]);
            this.PageView === 'list' && this.setSelectNull();
            this.PageView === 'list' ? this.loadRecords() : this.loadRecord(this.selectedRow);
        },
        //撤回
        async revoke() {
            await this.doRevoke([this.selectedRow]);
            this.PageView === 'list' && this.setSelectNull();
            this.PageView === 'list' ? this.loadRecords() : this.loadRecord(this.selectedRow);
        },
        //审核
        async verify() {
            await this.doVerify([this.selectedRow]);
            this.PageView === 'list' && this.setSelectNull();
            this.PageView === 'list' ? this.loadRecords() : this.loadRecord(this.selectedRow);
        },
        //弃审
        async abandon() {
            await this.doAbandon([this.selectedRow]);
            this.PageView === 'list' && this.setSelectNull();
            this.PageView === 'list' ? this.loadRecords() : this.loadRecord(this.selectedRow);
        },
        //打开
        async open() {
            await this.doOpen([this.selectedRow]);
            this.PageView === 'list' && this.setSelectNull();
            this.PageView === 'list' ? this.loadRecords() : this.loadRecord(this.selectedRow);
        },
        //关闭
        async close() {
            await this.doClose([this.selectedRow]);
            this.PageView === 'list' && this.setSelectNull();
            this.PageView === 'list' ? this.loadRecords() : this.loadRecord(this.selectedRow);
        },
        //停用、启用
        async switch() {
            await this.doSwitch([this.selectedRow]);
            this.PageView === 'list' && this.setSelectNull();
            this.PageView === 'list' ? this.loadRecords() : this.loadRecord(this.selectedRow);
        },
        //删除
        async remove() {
            await this.doRemove([this.selectedRow]);
            this.PageView === 'list' && this.setSelectNull();
            this.PageView === 'list' ? this.loadRecords() : this.loadRecord(this.selectedRow);
        },
        //批量提交
        async batchSubmit() {
            this.setSelectNull();
            this.query.page = 1;
            this.$refs.cFilter.clear();
            this.filter = {$and:[this.filter,{__s:1}]};
            this.loadRecords({...this.query, filter: this.filter})
        },
        async batchSubmitAction() {
            await this.doSubmit(this.selectedRows);
            this.loadRecords({...this.query, page:1})
        },
        async batchSubmitCancel() {
            this.setDefaultFilter();
            this.$refs.cFilter.clear();
            this.query.page = 1;
            this.loadRecords({...this.query, filter: this.filter})
        },
        //批量撤回
        async batchRevoke() {
            this.setSelectNull();
            this.query.page = 1;
            this.$refs.cFilter.clear();
            this.filter = {$and:[this.filter,{__s:2}]};
            this.loadRecords({...this.query, filter: this.filter})
        },
        async batchRevokeAction() {
            await this.doRevoke(this.selectedRows);
            this.loadRecords({...this.query, page:1})
        },
        async batchRevokeCancel() {
            this.setDefaultFilter();
            this.$refs.cFilter.clear();
            this.query.page = 1;
            this.loadRecords({...this.query, filter: this.filter})
        },
        //批量审核
        async batchVerify() {
            this.setSelectNull();
            this.query.page = 1;
            this.$refs.cFilter.clear();
            this.filter = {$and:[this.filter,{__s:2}]};
            this.loadRecords({...this.query, filter: this.filter})
        },
        async batchVerifyAction() {
            await this.doVerify(this.selectedRows);
            this.loadRecords({...this.query, page:1})
        },
        async batchVerifyCancel() {
            this.setDefaultFilter();
            this.$refs.cFilter.clear();
            this.query.page = 1;
            this.loadRecords({...this.query, filter: this.filter})
        },
        //批量弃审
        async batchAbandon() {
            this.setSelectNull();
            this.query.page = 1;
            this.$refs.cFilter.clear();
            this.filter = {$and:[this.filter,{__s:3}]};
            this.loadRecords({...this.query, filter: this.filter})
        },
        async batchAbandonCancel() {
            this.setDefaultFilter();
            this.$refs.cFilter.clear();
            this.query.page = 1;
            this.loadRecords({...this.query, filter: this.filter})
        },
        async batchAbandonAction() {
            await this.doAbandon(this.selectedRows);
            this.loadRecords({...this.query, page:1})
        },
        //批量打开
        async batchOpen() {
            this.setSelectNull();
            this.query.page = 1;
            this.$refs.cFilter.clear();
            this.filter = {$and:[this.filter,{__s:0}]};
            this.loadRecords({...this.query, filter: this.filter})
        },
        async batchOpenAction() {
            await this.doOpen(this.selectedRows);
            this.loadRecords({...this.query, page:1})
        },
        async batchOpenCancel() {
            this.setDefaultFilter();
            this.$refs.cFilter.clear();
            this.query.page = 1;
            this.loadRecords({...this.query, filter: this.filter})
        },
        //批量关闭
        async batchClose() {
            this.setSelectNull();
            this.query.page = 1;
            this.$refs.cFilter.clear();
            this.filter = {$and:[this.filter,{__s:3}]};
            this.loadRecords({...this.query, filter: this.filter})
        },
        async batchCloseAction() {
            await this.doClose(this.selectedRows);
            this.loadRecords({...this.query, page:1})
        },
        async batchCloseCancel() {
            this.setDefaultFilter();
            this.$refs.cFilter.clear();
            this.query.page = 1;
            this.loadRecords({...this.query, filter: this.filter})
        },
        //批量删除
        async batchRemove() {
            this.setSelectNull();
            this.query.page = 1;
            this.$refs.cFilter.clear();
            this.filter = {$and:[this.filter,{__s:1}]};
            this.loadRecords({...this.query, filter: this.filter})
        },
        async batchRemoveAction() {
            await this.doRemove(this.selectedRows);
            this.loadRecords({...this.query, page:1})
        },
        async batchRemoveCancel() {
            this.setDefaultFilter();
            this.$refs.cFilter.clear();
            this.query.page = 1;
            this.loadRecords({...this.query, filter: this.filter})
        },
        /*< 导出相关逻辑 */


        batchExport() {
            this.query.page = 1;
            this.$refs.cFilter.clear();
            this.setSelectNull();
            this.records = [];
            this.count = 0;
            this.PageView = 'export';
            this.$message.info('请设置查询条件，获取数据。')
        },
        batchExportCancel() {
            this.PageView = 'list';
            this.$refs.cFilter.clear();
            this.query.page = 1;
            this.loadRecords({...this.query, filter: this.filter});
        },

        batchExportAction() {
            let rowKey = this.exportRowKey ? this.exportRowKey : this.rowKey;
            if (this.selectedRows.length > 0) {
                this.doExport({filter: {[rowKey]: {$in: this.selectedRows.map(el => eval('el.' + rowKey))}}})
            } else {
                if (this.count > 5000) {
                    this.$confirm({
                        title: '数据输出确认',
                        content: '导出数据超出5000条，将进行分批导出。',
                        onOk: async () => {
                            for (let i = 0; i < this.count / 5000; i++) {
                                this.doExport({page: i + 1, limit: 5000, order: rowKey});
                            }
                        }
                    });
                } else if (this.count !== 0) {
                    const {filter,order,like,likeBy} = this.query;
                    this.doExport({filter,order,like,likeBy});
                } else {
                    this.$message.info('请设置查询条件，获取数据')
                }
            }
            this.setSelectNull();
            this.batchExportOnTableChange({...this.query, page: 1});
        },

        async batchExportOnTableChange(query) {
            this.loading = true;
            this.query = query ? query : this.query;
            this.query.pipeline = [];
            this.query.prePipeline = [];
            this.query.limit =this.PageConfig.widgets.filter(el => el.field === 'p_id').length > 0? 500: this.query.limit;
            switch (this.PageConfig.idEntityCard.type) {
                case 'view':
                    this.query.pipeline = JSON.parse(this.PageConfig.idEntityCard.dsConfig.pipeline);
                    break;
                default:
                    break;
            }
            const pipeline = JSON.parse(this.PageConfig.listConfig.pipeline);
            for (let key in pipeline) {
                if (pipeline.hasOwnProperty(key)) {
                    if (pipeline[key][0] && Object.keys(pipeline[key][0])[0] && Object.keys(pipeline[key][0])[0] === '$unwind') {
                        this.query.prePipeline = [...this.query.prePipeline, pipeline[key][0]];
                        this.query.pipeline = [...this.query.pipeline, ...pipeline[key].splice(1, pipeline[key].length - 1)];
                    } else {
                        this.query.pipeline = [...this.query.pipeline, ...pipeline[key]];
                    }
                }
            }
            const {records, count} = await this.$http.post('/v1/getByAggregate/' + this.PageConfig.idEntityCard.dsCollection, {
                ...this.query,
            }).then(res => res.data);
            this.records = records;
            this.count = count;
            this.loading = false;
        },


        async doSubmit(records) {
            for (let record of records) {
                await this.$http.post(`/v1/page/submit/${this.PageConfig._id}/${record._id}`,{
                    operateUser:this.user._id
                });
            }
        },
        async doRevoke(records) {
            for (let record of records) {
                await this.$http.post(`/v1/page/revoke/${this.PageConfig._id}/${record._id}`,{
                    operateUser:this.user._id
                });
            }
        },
        async doVerify(records) {
            if(records.length === 1){
                if(records[0].idWorkflow){
                    this.$WorkFlowAction({
                        workId:records[0]._id,
                        user:this.user,
                        onOk:()=>{
                            this.PageView === 'list' && this.setSelectNull();
                            this.PageView === 'list' ? this.loadRecords() : this.loadRecord(this.selectedRow);
                        },
                        onCancel:()=>{
                            this.PageView === 'list' && this.setSelectNull();
                            this.PageView === 'list' ? this.loadRecords() : this.loadRecord(this.selectedRow);
                        },
                    });
                }else{
                    await this.$http.post(`/v1/page/verify/${this.PageConfig._id}/${records[0]._id}`,{
                        operateUser:this.user._id
                    });
                }
            }else {
                for (let record of records) {
                    await this.$http.post(`/v1/page/verify/${this.PageConfig._id}/${record._id}`,{
                        operateUser:this.user._id
                    });
                }
            }
        },
        async doAbandon(records) {
            for (let record of records) {
                await this.$http.post(`/v1/page/abandon/${this.PageConfig._id}/${record._id}`,{
                    operateUser:this.user._id
                });
            }


        },
        async doOpen(records) {
            for (let record of records) {
                await this.$http.post(`/v1/page/open/${this.PageConfig._id}/${record._id}`,{
                    operateUser:this.user._id
                });
            }
        },
        async doClose(records) {
            for (let record of records) {
                await this.$http.post(`/v1/page/close/${this.PageConfig._id}/${record._id}`,{
                    operateUser:this.user._id
                });
            }
            this.PageView === 'list' && this.setSelectNull();
            this.PageView === 'list' ? this.loadRecords() : this.loadRecord(this.selectedRow);
        },
        async doRemove(records) {
            for (let record of records) {
                await this.$http.post(`/v1/page/remove/${this.PageConfig._id}/${record._id}`,{
                    operateUser:this.user._id
                });
            }
        },

        async doSwitch(records) {
            for (let record of records) {
                let __s = record.__s === 1 ? 0 : 1;
                await this.$clear.model(this.PageConfig.idEntityCard.dsCollection).patch(record._id, {
                    __s,
                    updatedAt: records.updatedAt,
                    updatedUser: this.user._id
                });
            }
        },

        async doExport(query) {
            query = query ? query : {};
            const url = this.$http.getUri({
                url: '/v1/page/export',
                params: {...query, idPage: this.PageConfig._id}
            });
            window.open(url)
        },
    }
}
