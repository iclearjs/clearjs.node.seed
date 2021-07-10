<template>
    <div>
        <a-table :columns="table.columns" :data-source="table.data" rowKey="" :pagination="false" bordered>
            <template slot="title">
                <a-row type="flex" justify="space-between">
                    <a-col :span="4">
                        操作员
                    </a-col>
                    <a-col :span="4" v-if="!disabled">
                        <a-button type="primary" size="small"  @click="form.visible=true;form.model={}">添加</a-button>
                    </a-col>
                </a-row>
            </template>
            <template slot="action" slot-scope="value,record,index"  v-if="!disabled">
                <a-button type="danger" size="small" @click="remove(index)">删除</a-button>
            </template>
        </a-table>
        <a-modal title="新建/修改" v-model="form.visible"  :maskClosable="false" destroyOnClose @ok="conserve(form.model)" @cancel="resetForm">
            <a-form-model ref="ownerForm" :model="form.model"  :label-col="{span:4}" :wrapper-col="{span:18}" :rules="getFormRules()">
                <a-form-model-item label="分配方式" prop="ownerType">
                    <a-select v-model="form.model.ownerType" @change="()=>{delete form.model.idOrgan;delete form.model.idDuty;delete form.model.idRole;delete form.model.idUser;}">
                        <a-select-option value="DUTY">
                            按职责分配
                        </a-select-option>
                        <a-select-option value="ROLE">
                            按角色分配
                        </a-select-option>
                        <a-select-option value="USER">
                            按人员分配
                        </a-select-option>
                    </a-select>
                </a-form-model-item>
                <a-form-model-item label="分配人员" prop="name" v-if="!form.model.ownerType||form.model.ownerType==='USER'">
                    <c-input-refer refer="sys_user_refer"  v-model="form.model.idUser"  display="userName"></c-input-refer>
                </a-form-model-item>
            </a-form-model>
        </a-modal>
    </div>
</template>

<script>
    export default {
        name: "workflow-owner",
        data(){
            return {
                form: {
                    visible: false,
                    model: {},
                },
                currentValue:[],
                table:{
                    data:[],
                    columns: [
                        {
                            title: '分配方式',
                            align: 'center',
                            dataIndex: 'type',
                        },
                        {
                            title: '分配取值',
                            align: 'center',
                            dataIndex: 'label',
                        },
                        {
                            title: '操作',
                            align: 'center',
                            key: 'action',
                            scopedSlots: {customRender: 'action'},
                        },
                    ],
                }
            }
        },
        props:{
          value:{
              type:Array,
              default:function () {
                  return []
              }
          },
            disabled:{
              type:Boolean,
                default:false
            },
        },
        watch:{
            value(value){
                this.currentValue = value?value:[];
                this.loadData()
            }
        },
        mounted() {
            if(this.value) this.currentValue = this.value;
            this.loadData()
        },
        methods:{
            async loadData(){
                /* 加载 职责*/
                if(this.currentValue&&this.currentValue[0]){
                    this.table.data = await this.$http.post('/core/workflow/design/owner/translate',{owners:this.currentValue}).then(res=>res.data.records)
                    this.table.data = this.table.data.map((record, index) => {
                        return {...record, rowKey: index}
                    });
                }else{
                    this.table.data = []
                }

            },

            resetForm() {
                this.$refs.ownerForm.resetFields();
                this.form.visible = false;
            },

            async conserve(data) {
                this.currentValue.push(JSON.parse(JSON.stringify(data)));
                this.resetForm();
                this.loadData();
            },

            async remove(index) {
                this.currentValue.splice(index,1);
                this.$emit('input',this.currentValue);
                this.loadData();
            },

            getFormRules() {
                const fields = ['ownerType'];
                const rules = {};
                for (let field of fields) {
                    rules[field] = [{required: true, message: '必填', trigger: 'change'}]
                }
                return rules;
            },
        }
    }
</script>

<style scoped>

</style>
