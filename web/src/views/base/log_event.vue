<template>
  <a-card :bordered="false">
    <c-button-group style="margin-bottom: 6px" :buttons="menu.buttons?menu.buttons.default:[]" @click="click"
                    :buttonsDisabled="buttonsDisabled" :record="selectedRow" :showSave="PageView==='editing'"
                    :showBack="PageView==='edit'" :showBatch="PageView!=='edit'">
      <a-input-search v-if="['list','export'].includes(PageView)" v-model="query.like" slot="right" style="width: 200px"
                      placeholder="请输入关键字" enter-button="搜索" @search="onTableChange({...query,page:1})">
        <c-filter slot="addonAfter" ref="cFilter" :filter="filter" style="display: inline-block"
                  :idPage="PageConfig._id"
                  :fields="PageConfig.widgets.filter(item=>item.mode==='listCard'&&item.listVisible===true)"
                  @on-search="onSearch"></c-filter>
      </a-input-search>
    </c-button-group>
    <a-modal title="查询" v-model="searchForm.visible" :maskClosable="false" destroyOnClose
             :body-style="{paddingTop:0}"
             @ok="loadRecords()" @cancel="resetForm">
      <a-form-model ref="searchForm" :model="searchForm.model" :label-col="searchForm.labelCol"
                    :wrapper-col="searchForm.wrapperCol">
        <a-form-model-item label="发生日期" :required="true">
          <a-range-picker v-model="searchForm.model.dateRange"
                          @change="(moment,dateStr)=>{searchForm.model.dateRange=dateStr}"/>
        </a-form-model-item>
      </a-form-model>
    </a-modal>
    <c-page-list v-if="['list','export'].includes(PageView)"
                 :columns="PageConfig.widgets.filter(item=>{return item.mode=== (PageView==='list'?'listCard':'list')} )"
                 :records="records" :count="count" :selectedRow.sync="selectedRow" :selectedRows.sync="selectedRows"
                 :selectedRowKeys.sync="selectedRowKeys" :rowKey="rowKey" :selectType="selectType" :loading="loading"
                 @onTableChange="onTableChange" :query.sync="query" :custom-row="customRow"
                 :show-tabs="false"></c-page-list>
    <c-page-edit v-if="['edit','editing'].includes(PageView)"
                 :columns="PageConfig.widgets.filter(item=>item.mode==='listCard')"
                 :beforeRecordChange="beforeRecordChange" :loading="loading"
                 v-model="selectedRow" :disabled="PageView==='edit'"></c-page-edit>
  </a-card>
</template>

<script>
import Page from "@/mixins/page"
import PageList from '@/mixins/page_list'
import PageEdit from '@/mixins/page_edit'

export default {
  mixins: [Page, PageList, PageEdit],
  data() {
    return {
      searchForm: {
        visible: false,
        labelCol: {span: 6},
        wrapperCol: {span: 18},
        model: {
          dateRange: [],
        },
      }
    }
  },
  computed: {
    getParams({searchForm, idOrgan, PageConfig}) {
      const {dateRange} = searchForm.model;
      const params = {filter: {}, idOrgan, idPage: PageConfig._id};
      if (dateRange && dateRange.length) {
        params.startDate = dateRange[0]
        params.endDate = dateRange[1]
      }
      return params
    }
  },
  methods: {
    setDefaultFilter() {
      this.filter = {
        idOrgan: this.idOrgan
      };
      this.query.filter = this.filter
    },
    search() {
      this.searchForm.visible = true
    },
    resetForm() {
      this.$refs.searchForm.resetFields();
      this.searchForm.Visible = false;
    },
    async loadRecords(query) {
      this.loading = true;
      this.query = query ? query : this.query;
      this.query.limit = this.PageConfig.widgets.filter(el => el.field === 'p_id').length > 0 ? 500 : this.query.limit;
      let {records, count} = await this.$core.model(this.PageConfig.idEntityCard.dsCollection).get({
        params: {
          ...this.query,
          ...this.getParams,
          pipeline: [],
        }
      }).then(res => res);
      this.records = records;
      this.count = count;
      this.loading = false;
    }
  },
}
</script>

<style scoped>

</style>