<template>
    <a-card :bordered="false">
        <c-button-group style="margin-bottom: 6px"  :buttons="menu.buttons?menu.buttons.default:[]" @click="click" :buttonsDisabled="buttonsDisabled" :record="selectedRow" :showSave="PageView==='editing'" :showBack="PageView==='edit'" :showBatch="PageView!=='edit'">
            <a-input-search v-if="['list','export'].includes(PageView)" v-model="query.like" slot="right" style="width: 200px" placeholder="请输入关键字"  enter-button="搜索"  @search="onTableChange({...query,page:1})">
                <c-filter slot="addonAfter"  ref="cFilter" :filter="filter" style="display: inline-block"  :idPage="PageConfig._id" :fields="PageConfig.widgets.filter(item=>item.mode==='listCard'&&item.listVisible===true)" @on-search="onSearch"></c-filter>
            </a-input-search>
        </c-button-group>
        <c-page-list  v-if="['list','export'].includes(PageView)"  :columns="PageConfig.widgets.filter(item=>{return item.mode=== (PageView==='list'?'listCard':'list')} )" :records="records" :count="count" :selectedRow.sync="selectedRow" :selectedRows.sync="selectedRows" :selectedRowKeys.sync="selectedRowKeys" :rowKey="rowKey" :selectType="selectType" :loading="loading" @onTableChange="onTableChange" :query.sync="query" :custom-row="customRow" :show-tabs="false"></c-page-list>
        <c-page-edit v-if="['edit','editing'].includes(PageView)" :columns="PageConfig.widgets.filter(item=>item.mode==='listCard')" :beforeRecordChange="beforeRecordChange" :onRecordChange="onRecordChange"  :loading="loading"  v-model="selectedRow" :disabled="PageView==='edit'"></c-page-edit>
    </a-card>
</template>

<script>
    import Page from "@/mixins/page"
    import PageList from '@/mixins/page_list'
    import PageEdit from '@/mixins/page_edit'

    export default {
        name: "user",
        mixins:[Page,PageList,PageEdit],
        data(){
          return {
            query:{
              likeBy:'branchCode,branchName'
            }
          }
        },
        methods:{

        },
    }
</script>

<style scoped>

</style>
