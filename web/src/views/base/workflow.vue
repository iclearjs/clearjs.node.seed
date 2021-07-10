<template>
    <workflow-design v-if="PageView === 'design'" v-model="PageView" :uid="selectedRow._id"></workflow-design>
    <a-card :bordered="false" v-else>
        <c-button-group style="margin-bottom: 6px" :buttons="menu.buttons.default" @click="click" :buttonsDisabled="buttonsDisabled" :record="selectedRow" :showSave="PageView==='editing'" :showBack="PageView==='edit'" :showBatch="PageView!=='edit'">
            <a-input-search v-if="['list','export'].includes(PageView)" v-model="query.like" slot="right" style="width: 200px" placeholder="请输入关键字" enter-button="搜索" @search="onTableChange({...query,page:1})">
                <c-filter slot="addonAfter" ref="cFilter" :filter="filter" style="display: inline-block" :idPage="PageConfig._id" :fields="PageConfig.widgets.filter(item=>item.mode==='listCard'&&item.listVisible===true)" @on-search="onSearch"></c-filter>
            </a-input-search>
        </c-button-group>
        <c-page-list v-if="['list','export'].includes(PageView)" :columns="PageConfig.widgets.filter(item=>{return item.mode=== (PageView==='list'?'listCard':'list')} )" :records="records" :count="count" :selectedRow.sync="selectedRow" :selectedRows.sync="selectedRows" :selectedRowKeys.sync="selectedRowKeys" :rowKey="rowKey" :selectType="selectType" :loading="loading" @onTableChange="onTableChange" :query.sync="query" :custom-row="customRow" :show-tabs="false"></c-page-list>
        <c-page-edit v-if="['edit','editing'].includes(PageView)" :columns="PageConfig.widgets.filter(item=>item.mode==='listCard')" :beforeRecordChange="beforeRecordChange" :onRecordChange="onRecordChange" :loading="loading" v-model="selectedRow" :disabled="PageView==='edit'"></c-page-edit>
    </a-card>
</template>

<script>
    import WorkflowDesign from "./workflow/design";
    import Page from "@/mixins/page"
    import PageList from '@/mixins/page_list'
    import PageEdit from '@/mixins/page_edit'

    export default {
        name: "workflow",
        components:{ WorkflowDesign},
        mixins: [Page, PageList, PageEdit],
        data() {
            return {
                visible:true,
                filter: {
                    idOrgan: this.idOrgan,
                    __r: 0
                },
                buttonsDisabled: {
                    design:(record)=>{return record && Object.keys(record).length>0},
                    publish:(record)=>{return record && Object.keys(record).length>0 && record.__s !==1},
                    stop:(record)=>{return record && Object.keys(record).length>0},
                    remove:(record)=>{return record && Object.keys(record).length>0 && record.__s !==1}
                },
                query: {
                    order: '-_id',
                    like: '',
                    likeBy: 'name,code'
                }
            }
        },
        mounted() {
            this.beforeChange.idPage = async ({record}) => {
               this.$refer('cdp_page_refer').show({
                    query: {page:1,limit:10,likeBy:'name',filter: {isWorkflow:true}},
                    storage: '_id',
                    selectType: 'radio',
                    selectedRowKeys: [record&&record.idPage&&record.idPage._id?record.idPage._id:record.idPage],
                    onOk: async (selectedRowKeys, selectedRows) => {
                       this.selectedRow.idPage = selectedRows[0];
                        this.selectedRow = JSON.parse(JSON.stringify(this.selectedRow))
                    }
                });
            };
        },
        methods: {
            setDefaultFilter(){
                this.filter = {__r:0};
                this.query.filter = {__r:0}
            },
            design(){
                this.PageView = 'design';
            },
            async copy() {
                function updateVersion(version, index) {
                    const array = version.split('.');

                    index = index || index === 0 ? index : array.length - 1;
                    if (!isNaN(Number(array[index]))) {
                        array[index] = Number(array[index]) + 1
                    } else {
                        array[index] = array[index] + 1
                    }
                    return array.join('.')
                }

                this.selectedRow.version = this.selectedRow.version ? updateVersion(this.selectedRow.version) : '1.0.0';
                this.$confirm({
                    title: '设置版本号',
                    content: (h) => {
                        return h('a-input', {
                            on: {
                                change({target}) {
                                    this.selectedRow.version = target.value
                                }
                            }
                        })
                    },
                    onOk: async () => {
                        const members = await this.$core.model('wf_workflow_design').get({params: {filter: {idWorkflow: this.selectedRow._id}}}).then(res => res.records);
                        await this.$http.post('/core/workflow/design/save', {
                            record:this.selectedRow,
                            nodes: members.filter(e => e.memberType === 'node'),
                            edges: members.filter(e => e.memberType === 'edge')
                        });
                        this.setSelectNull();
                        this.loadRecords()
                    }
                })
            },
            async stop() {
                await this.$core.model('wf_workflow').patch(this.selectedRow._id, {__s: 0});
                this.setSelectNull();
                this.loadRecords()
            },
            async publish() {
                this.$confirm({
                    title: '流程发布确认',
                    content: '流程发布后，单据将通过该流程进行审批，确认发布？',
                    onOk: async () => {
                        await this.$http.post('/core/workflow/design/publish/', {record:this.selectedRow});
                        this.loadRecords()
                    }
                });
            },
            async doRemove(records) {
                for(let record of records){
                    const workflow = await this.$http.get('/core/workflow/design/state/', {params: {idWorkflow: record._id}}).then(res => res.data.record);
                    if (workflow.state !== 'in' && workflow.__s !== 1) {
                        this.$confirm({
                            title: '流程删除确认',
                            content: '流程删除后，新建单据将无法调用改审批流，确认删除？',
                            onOk: async () => {
                                await this.$http.delete('/core/workflow/design/members/', {params: {idWorkflow: record._id}});
                                this.loadRecords();
                                this.setSelectNull();
                            }
                        });
                    } else {
                        this.$message.error(workflow.bills.length > 0 ? '该流程模板上存在流转单据,无法删除！' : '请停用该流程后重试。')
                    }
                }
            },
        },
    }
</script>

<style scoped>

</style>
