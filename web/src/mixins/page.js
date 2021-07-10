import {mapGetters} from "vuex";


export default {
    data() {
        return {
            selectedRows: [],
            selectedRow: {},
            records: [],
            count: 0,
            selectedRowKeys: [],
            rowKey: '_id',
            exportRowKey: '_id',
            selectType: 'radio',
            loading: false,
            query: {
                limit: 10,
                page: 1,
                order: '-_id',
                likeBy:'',
            },
            filter: {},
            buttonsDisabled: {
                switch: (record) => {
                    return record && Object.keys(record).length > 0
                },
                modify: (record) => {
                    return record && Object.keys(record).length > 0
                },
                remove: (record) => {
                    return record && Object.keys(record).length > 0
                }
            },
            // idOrgan: '570c733bb49b01f00747fc92', /*hdjt*/
            // idOrgan: '5f0aff9077fe3a49e094c7a7', /*lt*/
            // idOrgan: '5bab78d4576fdc766659c318', /*za jia jv*/
            idOrgan: this.$cookies.get('LOGIN_GROUP'), /*cs*/
            contentHeight: window.innerHeight - 430,
            PageConfig: {
                widgets: []
            },
            PageView: 'list',
            PageEvent: '',
        }
    },
    computed: {
        ...mapGetters(["menu", "user", 'token','group']),
    },
    watch: {
        PageView(val) {
            if (val === 'list') {
                // this.loadRecords()
            }
        },
        '$route.query._id': {
            handler() {
                this.enterSelectedRecord();
            }, deep: true,
        }
    },
    async created() {
        await this.$core.page.getPageConfig(this.menu.idPage).then(async (PageConfig) => {
            if (PageConfig._id) {
                this.PageConfig = PageConfig;
                if (this.setCurrentDisabled !== void (0)) {
                    this.setCurrentDisabled()
                }
                this.query.populate = [...new Set([...(this.query.populate ? this.query.populate : '').split(','), ...PageConfig.populate])].join(',');
                this.afterLoadPageConfig && (await this.afterLoadPageConfig());
                this.setDefaultFilter && await this.setDefaultFilter();
                this.loadRecords();
            }
        });
        this.enterSelectedRecord()
    },
    methods: {
        async enterSelectedRecord() {
            if (this.$route.query._id) {
                await this.loadRecord({_id: this.$route.query._id});
                /* 重置路由参数 */
                this.$router.push({name:this.$route.name});
                this.selectedRow = JSON.parse(JSON.stringify(this.selectedRow));
                this.PageView = 'edit';
                // this.idOrgan = this.selectedRow.idOrgan;
            }
        },
        async setDefaultFilter() {
            this.filter = {};
        },
        onSearch(filter) {
            this.query.page = 1;
            this.onTableChange({...this.query, filter: filter});
        },

        async click(event, action) {
            this.selectType = ['batch', 'batchAction'].includes(action) ? 'checkbox' : 'radio';
            this.PageEvent = action === 'batch' ? event : '';
            this.rowKey = this.PageEvent === 'batchExport' ? this.exportRowKey : '_id';
            switch (event) {
                case 'create':
                    this.PageView = 'editing';
                    break;
                case 'cancel':
                    this.PageView = this.selectedRow._id ? 'edit' : 'list';
                    break;
                case 'goBack':
                    this.PageView = 'list';
                    break;
                default:
                    break;
            }
            const eventCallback = await this[event]();
            switch (event) {
                case 'modify':
                    if (eventCallback === void (0) || eventCallback) {
                        this.PageView = 'editing';
                    }
                    break;
                case 'remove':
                    if (eventCallback === void (0) || eventCallback) {
                        this.PageView = 'list';
                    }
                    break;
                case 'change':
                    if (eventCallback === void (0) || eventCallback) {
                        this.PageView = 'change';
                    }
                    break;
                default:
                    break;
            }
        },
        /* 按钮操作 后重新加载数据并 取消选中状态*/
        setSelectNull() {
            this.records = [];
            this.selectedRow = {};
            this.selectedRows = [];
            this.selectedRowKeys = []
        },

        async create() {
            this.selectedRow = {};
        },
        async modify() {
            await this.loadRecord(this.selectedRow)
        },
        async refresh() {
            this.PageView === 'list' ? this.loadRecords() : this.loadRecord(this.selectedRow);
        },
        /* 数据 筛选条件  @this.filter 各页面自定义条件, @this.query.filter 传入动态条件,@this.searchFilter 查询方案条件 */
        async onTableChange(query) {
            if (this.PageEvent && this[this.PageEvent + 'OnTableChange']) {
                this[this.PageEvent + 'OnTableChange'](query)
            } else {
                this.loadRecords(query)
            }
        },
        customRow(record, index) {
            return {
                on: {
                    click: () => {
                        if (this.PageEvent && this[this.PageEvent + 'OnClick']) {
                            this[this.PageEvent + 'OnClick'](record, index)
                        } else {
                            if (this.selectType === 'radio') {
                                this.selectedRowKeys = [record[this.rowKey]];
                                this.selectedRow = record;
                                this.selectedRows = [record]
                            } else {
                                let currentSelectedRowKeys = [];
                                let currentSelectedRows = [];
                                if (this.selectedRowKeys.includes(eval('record.' + this.rowKey))) {
                                    currentSelectedRowKeys = this.selectedRowKeys.filter(el => el !== eval('record.' + this.rowKey))
                                } else {
                                    currentSelectedRowKeys = [...this.selectedRowKeys, eval('record.' + this.rowKey)]
                                }
                                this.selectedRowKeys = currentSelectedRowKeys;
                                this.selectedRow = record;
                                currentSelectedRowKeys.forEach(key => {
                                    for (let csr of [...this.selectedRows, record]) {
                                        if (key === eval('csr.' + this.rowKey)) {
                                            currentSelectedRows.push(csr);
                                            break
                                        }
                                    }
                                });
                                this.selectedRowKeys = currentSelectedRowKeys;
                                this.selectedRows = currentSelectedRows;

                            }
                        }
                    },
                    dblclick: () => {
                        if (this.PageEvent && this[this.PageEvent + 'OnDblClick']) {
                            this[this.PageEvent + 'OnDblClick'](record, index)
                        } else {
                            this.PageView = 'edit';
                            this.loadRecord(record)
                        }
                    },
                },
            }
        },
        async loadRecord(record) {
            this.loading = true;
            this.selectedRow = await this.$core.model(this.PageConfig.idEntityCard.dsCollection).getByID(record._id, {params: {populate: this.query.populate}}).then(res => res.records[0]);
            this.loading = false;
        },

        async loadRecords(query) {
            this.loading = true;
            this.query = query ? query : this.query;
            this.query.limit = this.PageConfig.widgets.filter(el => el.field === 'p_id').length > 0 ? 500 : this.query.limit;
            let {records, count} = await this.$core.model(this.PageConfig.idEntityCard.dsCollection).get({
                params: {
                    ...this.query,
                    pipeline: [],
                }
            }).then(res => res);
            this.records = records;
            this.count = count;
            this.loading = false;
        },
    }
}
