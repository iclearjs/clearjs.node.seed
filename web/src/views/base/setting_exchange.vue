<template>
    <a-card :bordered="false">
        <a-select slot="title" style="width: 250px" v-model="application" @change="loadPages">
            <template v-for="app in applications">
                <a-select-option :value="app._id" :key="app._id">
                    <a-avatar shape="square" slot='avatar' size="small" :src="app.icon?app.icon:icon"/>
                    <span slot="title" style="margin-left: 12px">{{app.name}}</span>
                </a-select-option>
            </template>
        </a-select>
        <a-button-group slot="extra">
            <a-button type="primary" icon="reload" @click="PageView === 'editing'?loadRecords():loadApplications()"
                      :disabled="!application">刷新
            </a-button>
            <a-button type="danger" icon="back" @click="PageView = 'list'" v-if="PageView === 'editing'">返回
            </a-button>
        </a-button-group>
        <a-row :gutter="8" v-if="PageView === 'list'">
            <a-list :grid="{ gutter: 16, column: 4 }" :data-source="pages" :pagination="list.pagination">
                <a-list-item slot="renderItem" slot-scope="item, index">
                    <a-card hoverable>
                        <template slot="actions">
                            <a-icon type="layout" @click="page.param = item;PageView = 'editing'"/>
                        </template>
                        <a-card-meta :title="item.code" :description="item.name">
                            <a-avatar shape="square" slot='avatar' :size="50" :src="IconBill"/>
                        </a-card-meta>
                    </a-card>
                </a-list-item>
            </a-list>
        </a-row>
        <div v-if="PageView === 'editing'">
            <a-form-model ref="form" labelAlign="left" :model="page.param" :label-col="{span:4}"
                          :wrapper-col="{span:20}">
                <a-row :gutter="24">
                    <a-col span="12">
                        <a-form-model-item label="页面编码">
                            <a-input v-model="page.param.code" placeholder="页面编码" readonly/>
                        </a-form-model-item>
                    </a-col>
                    <a-col span="12">
                        <a-form-model-item label="页面名称">
                            <a-input v-model="page.param.name" placeholder="页面名称" readonly/>
                        </a-form-model-item>
                    </a-col>
                    <a-col span="24">
                        <a-form-model-item label="数据交换节点">
                            <a-tag v-for="item of events" :color="item.color" :key="item.code">{{item.name}}</a-tag>
                        </a-form-model-item>
                    </a-col>
                </a-row>
            </a-form-model>
            <a-tabs type="card" default-active-key="tabMemo" style="margin-top: 12px">
                <div slot="tabBarExtraContent">
                    <c-button-group style="margin-bottom: 6px" :buttons="menu.buttons?menu.buttons.default:[]" @click="click"
                                    :buttonsDisabled="buttonsDisabled" :record="selectedRow">
                    </c-button-group>
                </div>
                <a-tab-pane key="tabMemo" tab="数据交换设置">
                    <c-data-table row-key="_id" :columns="page.fields" :records="page.records" :query="page.query"
                                  selectType="radio" :count="page.records.length" :customRow="customRow"
                                  :selectedRowKeys.sync="selectedRowKeys"></c-data-table>
                </a-tab-pane>

            </a-tabs>
        </div>
        <a-modal title="新建/修改" v-model="modal.visible" :width="768" :maskClosable="false" destroyOnClose
                 @ok="conserve(modal.form)" @cancel="modal.visible =false">
            <a-row :gutter="12" type="flex" justify="start" style="margin-bottom: 12px">
                <a-col :span="24" style="padding: 2px 0">
                    <a-row type="flex" justify="center" align="middle">
                        <a-col :span="8"><span style="color: red">*</span>
                            <span style="font-weight: 500">数据交换节点:</span>
                        </a-col>
                        <a-col :span="16">
                            <a-radio-group v-model="modal.form.event" defaultValue="CREATE">
                                <a-radio-button v-for="(item, index) in events" :value="item.code" :label="item.name"
                                                :key="index">{{item.name}}
                                </a-radio-button>
                            </a-radio-group>

                        </a-col>
                    </a-row>
                </a-col>
                <a-col :span="24" style="padding: 2px 0">
                    <a-row type="flex" justify="center" align="middle">
                        <a-col :span="8"><span style="color: red">*</span>
                            <span style="font-weight: 500">交换接口(POST):</span>
                        </a-col>
                        <a-col :span="16">
                            <a-input v-model="modal.form.url" placeholder="交换接口"></a-input>
                        </a-col>
                    </a-row>
                </a-col>
                <a-col :span="24" style="padding: 2px 0">
                    <a-row type="flex" justify="center" align="middle">
                        <a-col :span="8"><span style="color: red">*</span>
                            <span style="font-weight: 500">设置组织:</span>
                        </a-col>
                        <a-col :span="16">
                            <c-input-refer refer="org_organ_refer" selectType="checkbox"
                                           :query="{page:1,limit:10,filter:{idGroupOrgan:this.idGroupOrgan}}"
                                           v-model="modal.form.organs" display="organName"
                                           storage="_id"></c-input-refer>
                        </a-col>
                    </a-row>
                </a-col>
                <a-col :span="24" style="padding: 2px 0">
                    <a-row type="flex" justify="center" align="middle">
                        <a-col :span="8">
                            <span style="font-weight: 500">交换描述:</span>
                        </a-col>
                        <a-col :span="16">
                            <a-input v-model="modal.form.description" placeholder="交换描述"></a-input>
                        </a-col>
                    </a-row>
                </a-col>
                <!--                    <a-col :span="12">-->
                <!--                        <a-row type="flex" justify="center" align="middle">-->
                <!--                            <a-col :span="6">-->
                <!--                                <span style="font-weight: 500">校验接口(POST):</span>-->
                <!--                            </a-col>-->
                <!--                            <a-col :span="18">-->
                <!--                                <a-input v-model="modal.form.url" placeholder="校验接口"></a-input>-->
                <!--                            </a-col>-->
                <!--                        </a-row>-->
                <!--                    </a-col>-->
            </a-row>
        </a-modal>
    </a-card>
</template>

<script>
    import {mapGetters} from "vuex";

    const WORKFLOW_PAGE_EVENT = [
        {code: 'SUBMIT', name: '提交', color: '#1890FF'},
        {code: 'VERIFY', name: '审核', color: '#1890FF'},
        {code: 'ABANDON', name: '弃审', color: '#1890FF'},
        {code: 'REVOKE', name: '撤回', color: '#1890FF'},
        {code: 'CHANGE', name: '变更', color: '#1890FF'},
        {code: 'OPEN', name: '打开', color: '#1890FF'},
        {code: 'CLOSE', name: '关闭', color: '#1890FF'},
    ], DEFAULT_PAGE_EVENT = [
        {code: 'CREATE', name: '创建', color: '#1890FF'},
        {code: 'MODIFY', name: '修改', color: '#1890FF'},
        {code: 'REMOVE', name: '删除', color: '#1890FF'},
    ];
    export default {
        name: "message-event",
        data() {
            return {
                modal: {
                    visible: false,
                    form: {},
                },
                selectedRowKeys: [],
                idOrgan: '',
                IconBill: require('../../assets/icon/page_bill.png'),
                applications: [],
                application: '',
                PageView: 'list',
                list: {
                    pagination: {
                        showSizeChanger: true,
                        showQuickJumper: true,
                        total: 0,
                        pageSize: 16,
                        pageSizeOptions: ['16', '32', '64', '128']
                    },
                },
                pages: [],
                page: {
                    param: {},
                    pagination: {
                        showSizeChanger: true,
                        showQuickJumper: true,
                        total: 0,
                        pageSize: 10,
                        pageSizeOptions: ['10', '20', '50', '100']
                    },
                    fields: [
                        {
                            name: '交换时机',
                            field: 'event',
                            widget: 'Radio',
                            idEnum: {range: [...DEFAULT_PAGE_EVENT, ...WORKFLOW_PAGE_EVENT]},
                            visible: true,
                            width: 80
                        },
                        {name: '组织', field: 'idOrgan.organName', widget: 'String', visible: true, width: 200},
                        {name: '交换接口', field: 'url', widget: 'String', visible: true},
                        {name: '描述', field: 'description', widget: 'String', visible: true},
                    ],
                    records: [],
                },
                buttonsDisabled: {
                    modify: (record) => {
                        return record && record._id
                    },
                    remove: (record) => {
                        return record && record._id
                    },
                },
            }
        },
        computed: {
            ...mapGetters(["menu", "group", "user"]),
            events() {
                if (this.page.param && this.page.param.isWorkflow) {
                    return [...DEFAULT_PAGE_EVENT, ...WORKFLOW_PAGE_EVENT]
                }
                return DEFAULT_PAGE_EVENT
            },
            selectedRow() {
                const record = this.page.records.filter(el => this.selectedRowKeys.includes(el._id))[0];
                return record ? record : {}
            },
            idGroupOrgan() {
                return
            }
        },
        watch: {
            PageView(val) {
                if (val === 'editing')
                    this.loadRecords()
            }
        },
        mounted() {
            this.loadApplications();
        },
        methods: {
            customRow(record) {
                return {
                    on: {
                        click: () => {
                            this.selectedRowKeys = [record._id]
                        },
                    }
                }
            },
            async click(event) {
                switch (event) {
                    case 'modify':
                        this.modal.form = this.selectedRow;
                        this.modal.form.organs = await this.$core.model('org_setting_exchange').get({
                            params: {
                                filter: {
                                    event: this.selectedRow.event,
                                    idPage: this.selectedRow.idPage,
                                    url: this.selectedRow.url
                                }
                            }
                        }).then(el => {
                            return el.records.map(r => r.idOrgan)
                        });
                        this.modal.visible = true;
                        break;
                    case 'create':
                        this.modal.form = {};
                        this.modal.visible = true;
                        break;
                    case 'remove':
                        this.$confirm({
                            content: '数据删除后无法恢复，是否确认删除？',
                            onOk: async () => {
                                await this.$core.model('org_setting_exchange').delete(this.selectedRow._id).then(el => {
                                    if (el.error.code === '0') {
                                        this.$message.success('删除成功')
                                    }
                                    this.loadRecords();
                                })
                            }
                        });
                        break;
                    default:
                        break;
                }
            },
            async loadApplications() {
                this.applications = (await this.$http.get('/core/authority/application')).data.records.map(el => el.idApplication)
                if (this.applications.length > 0 && !this.application) {
                    this.application = this.applications[0]._id;
                }
                this.loadPages(this.application)
            },
            async loadPages(idApplication) {
                if (!idApplication) {
                    this.pages = [];
                    this.list.pagination.total = 0;
                    return
                }
                this.pages = (await this.$core.model('cdp_page').get({
                    params: {
                        filter: {
                            idApplication,
                            type: 'bill'
                        }
                    }
                })).records;
                this.list.pagination.total = this.pages.length
            },
            async loadRecords() {
                /*@BUG groupOrganIds*/
                this.page.records = await this.$core.model('org_setting_exchange').get({
                    params: {
                        filter: {
                            // idOrgan: this.idGroupOrgan,
                            idPage: this.page.param._id
                        }, populate: 'idOrgan'
                    }
                }).then(el => {

                    return el.records
                });
            },
            async conserve(data) {
                if (data._id) {
                    const beforeUpdateRecord = await this.$core.model('org_setting_exchange').getByID(data._id).then(el => el.records[0]);
                    if (beforeUpdateRecord) {
                        let {event, url, description, organs} = data;
                        const updateRecords = await this.$core.model('org_setting_exchange').get({
                            params: {
                                filter: {
                                    idOrgan: {$in: organs},
                                    idPage: beforeUpdateRecord.idPage,
                                    event: beforeUpdateRecord.event,
                                    url: beforeUpdateRecord.url
                                }
                            }
                        }).then(el => el.records);
                        for (let ur of updateRecords) {
                            await this.$core.model('org_setting_exchange').patch(ur._id, {event, url, description});
                        }
                    }
                    this.loadRecords();
                    this.modal.visible = false;
                } else {
                    let {event, url, description, organs} = data;
                    const {_id: idPage, code, name, idApplication} = this.page.param;
                    const haveOrgans = await this.$core.model('org_setting_exchange').get({
                        params: {
                            filter: {
                                idOrgan: {$in: organs},
                                idPage,
                                event
                            }
                        }
                    }).then(el => el.records.map(el => el.idOrgan));
                    organs = organs.filter(idOrgan => !haveOrgans.includes(idOrgan));
                    await this.$core.model('org_setting_exchange').post(organs.map(idOrgan => {
                        return {idOrgan, event, url, description, idPage, code, name, idApplication}
                    }));
                    this.loadRecords();
                    this.modal.visible = false;
                }
            },

        },
    }
</script>

<style scoped>

</style>
