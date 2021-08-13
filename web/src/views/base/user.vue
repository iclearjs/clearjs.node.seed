<template>
  <a-card :bordered="false">
    <c-button-group style="margin-bottom: 6px"  :buttons="menu.buttons.default" @click="click" :buttonsDisabled="buttonsDisabled" :record="selectedRow" :showSave="PageView==='editing'" :showBack="PageView==='edit'" :showBatch="PageView!=='edit'">
      <a-input-search v-if="['list','export'].includes(PageView)" v-model="query.like" slot="right" style="width: 200px" placeholder="请输入关键字"  enter-button="搜索"  @search="onTableChange({...query,page:1})">
        <c-filters slot="addonAfter"  ref="cFilter" :filter="filter" style="display: inline-block"  :uid="PageConfig._id" @on-search="onSearch"></c-filters>
      </a-input-search>
    </c-button-group>
    <c-page-list  v-if="['list','export'].includes(PageView)"  :columns="PageConfig.widgets.filter(item=>{return item.mode=== (PageView==='list'?'listCard':'list')} )" :records="records" :count="count" :selectedRow.sync="selectedRow" :selectedRows.sync="selectedRows" :selectedRowKeys.sync="selectedRowKeys" :rowKey="rowKey" :selectType="selectType" :loading="loading" @onTableChange="onTableChange" :query.sync="query" :custom-row="customRow" :show-tabs="false"></c-page-list>
    <c-page-edit v-if="['edit','editing'].includes(PageView)" :columns="PageConfig.widgets.filter(item=>item.mode==='listCard')" :beforeRecordChange="beforeRecordChange" :onRecordChange="onRecordChange"  :loading="loading"  v-model="selectedRow" :disabled="PageView==='edit'"></c-page-edit>

    <a-modal :title="eventModal.title" v-model="eventModal.visible"  :maskClosable="false" destroyOnClose
             :body-style="{paddingTop:0}"
             @ok="eventModalOk(eventModal.form,eventModal.event)" @cancel="resetForm()">
      <a-form-model  ref="eventModal" :model="eventModal.form" :label-col="eventModal.labelCol" :wrapper-col="eventModal.wrapperCol">
        <a-form-model-item label="离职日期" :required="true" v-if="eventModal.event === 'leaveWork'">
          <a-date-picker  v-model="eventModal.form.leaveDate" valueFormat="YYYY-MM-DD" />
        </a-form-model-item>
        <a-form-model-item label="停薪期间" :required="true" v-if="eventModal.event === 'leaveWork'">
          <c-input-refer refer="sc_period_refer"  v-model="eventModal.form.endPeriod" display="periodCode" storage="_id"></c-input-refer>
        </a-form-model-item>

        <a-form-model-item label="薪酬类别" :required="true" v-if="['changeCL','entryWork'].includes(eventModal.event)">
          <c-input-refer refer="cm_compensationCl_refer" v-model="eventModal.form.idCompensationCl" display="compensationClName"
                         storage="_id" placeholder="薪酬类别"></c-input-refer>
        </a-form-model-item>
        <a-form-model-item label="启薪期间" :required="true" v-if="['changeCL','entryWork'].includes(eventModal.event)">
          <c-input-refer refer="sc_period_refer"  v-model="eventModal.form.startPeriod" display="periodCode" storage="_id"></c-input-refer>
        </a-form-model-item>

      </a-form-model>
    </a-modal>

    <a-modal title="开通账号" v-model="openAccountModal.visible"  :maskClosable="false" destroyOnClose
             :body-style="{paddingTop:0}"
             @ok="doRegister(openAccountModal.form)" @cancel="openAccountModal.visible = false">
      <a-form-model  ref="openAccountModal" :model="openAccountModal.form" :label-col="openAccountModal.labelCol" :wrapper-col="openAccountModal.wrapperCol">
        <a-form-model-item label="账号" :required="true" >
          <a-input  v-model="openAccountModal.form.userCode" placeholder="请输入登录账号"/>
        </a-form-model-item>
        <a-form-model-item label="预置密码" :required="true" >
          <a-input-password v-model="openAccountModal.form.userPwd"  placeholder="请输入密码" />
        </a-form-model-item>
      </a-form-model>
    </a-modal>
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
      openAccountModal:{
        event:'',
        visible:false,
        labelCol:{span:5},
        wrapperCol:{span:19},
        form:{
          userCode:'',
          userPwd:'123456',
        }
      },
      eventModal:{
        event:'',
        visible:false,
        labelCol:{span:5},
        wrapperCol:{span:19},
        form:{

        }
      },
      buttonsDisabled: {
        leaveWork: (record) => {
          return record && record.__s === 1
        },
        register: (record) => {
          return record && record._id
        },

        remove: (record) => {
          return record && record._id
        },
        entryWork: (record) => {
          return record && record.__s === 0
        },
        changeCL: (record) => {
          return record && record.__s === 1
        },
      },
      query:{
        likeBy:'name,workNo'
      }
    }
  },
  methods:{
    setDefaultFilter(){
      this.filter = {idOrgan:this.idOrgan,userType:{$in:['User','Admin']}};
      this.query.filter = this.filter
    },
    resetForm() {
      this.$refs['eventModal'].resetFields();
      this.eventModal.visible = false;
    },
    create(){
      this.selectedRow = {__s:0}
    },

    register(){
      if(this.selectedRow && !this.selectedRow.idUser){
        this.openAccountModal.form.idOrganUser = this.selectedRow._id;
        this.openAccountModal.form.userCode = this.selectedRow.telephone?this.selectedRow.telephone:this.selectedRow.workNo
        this.openAccountModal.visible = true;
      }
    },

    async doRegister(form){
      if(!form.userCode){
        this.$message.error('请输入登录账号')
        return;
      }
      await this.$http.post(this.$url.registerByOrganUser,form)
      this.openAccountModal.visible = false
      this.loadRecords()

    },

    async changeCL(){
      const cmPsnDoc = await this.$core.model('cm_psnDoc').get({params:{filter:{__s:1,idOrganUser:this.selectedRow._id}}}).then(el=>el.records[0]);
      if(cmPsnDoc){
        this.eventModal.form.idCompensationCl  = cmPsnDoc.idCompensationCl
      }
      this.eventModal.event = 'changeCL';
      this.eventModal.title = '薪酬类别变更';
      this.eventModal.visible = true;
    },
    entryWork(){
      this.eventModal.event = 'entryWork';
      this.eventModal.title = '人员入职';
      this.eventModal.visible = true;
    },
    leaveWork(){
      this.eventModal.event = 'leaveWork';
      this.eventModal.title = '人员离职';
      this.eventModal.visible = true;
    },
    async eventModalOk(data,event){
      if(!this.selectedRow || !this.selectedRow._id){
        this.$message.error('请选择操作人员');
        return
      }
      if(event === 'leaveWork'){
        const {leaveDate,endPeriod} = data;
        await this.$core.model('org_organ_user').patch(this.selectedRow._id,{leaveDate,__s:0});
        const cmPsn = await this.$core.model('cm_psnDoc').get({params:{filter:{__s:1,idOrganUser:this.selectedRow._id}}}).then(el=>el.records);
        for(let cp of cmPsn){
          await this.$core.model('cm_psnDoc').patch(cp._id,{__s:0,endPeriod})
        }
        this.eventModal.visible = false;
      }
      if(event === 'entryWork'){
        const {startPeriod,idCompensationCl} = data;
        await this.$core.model('org_organ_user').patch(this.selectedRow._id,{__s:1});
        await this.$core.model('cm_psnDoc').post({__s:1,startPeriod,idOrganUser:this.selectedRow._id,idCompensationCl,idOrgan:this.idOrgan});
        this.eventModal.visible = false;
      }

      if(event === 'changeCL'){
        const {startPeriod,idCompensationCl} = data;
        await this.$core.model('org_organ_user').patch(this.selectedRow._id,{__s:1});

        const cmPsn = await this.$core.model('cm_psnDoc').get({params:{filter:{__s:1,idOrganUser:this.selectedRow._id}}}).then(el=>el.records);
        for(let cp of cmPsn){
          await this.$core.model('cm_psnDoc').patch(cp._id,{__s:0,endPeriod:startPeriod,leaveReason:'薪酬类别变更'})
        }
        await this.$core.model('cm_psnDoc').post({__s:1,startPeriod,idOrganUser:this.selectedRow._id,idCompensationCl,idOrgan:this.idOrgan});
        this.eventModal.visible = false;
      }
      this.PageView === 'list' ? this.loadRecords() : this.loadRecord(this.selectedRow);
    },
  }
}
</script>

<style scoped>

</style>
