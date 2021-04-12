<template>
    <a-modal v-model="currentValue" title="职责分配" :width="768" :body-style="{padding:0}" @ok="onOk" @cancel="onCancel" destroyOnClose :maskClosable="false">
        <a-card :bordered="false">
            <a-tabs type="card">
                <a-tab-pane key="1" tab="人员">
                    <c-input-table v-model="roleUser" :fields="userFields" :onRecordChange="onRecordChangeUser" :onRecordRemove="onRecordRemoveUser"></c-input-table>
                </a-tab-pane>
                <a-tab-pane key="2" tab="职责">
                    <c-input-table v-model="roleDuty" :fields="dutyFields" :onRecordChange="onRecordChangeDuty" :onRecordRemove="onRecordRemoveDuty"></c-input-table>
                </a-tab-pane>
            </a-tabs>
        </a-card>
    </a-modal>
</template>

<script>
export default {
    name: "duty",
    data() {
        return {
            currentValue: false,
            dutyFields: [
                {
                    field: 'idOrgan',
                    name: '组织',
                    widget: 'RadioRefer',
                    idRefer:'org_organ_refer',
                    referDisplay:'organName',
                    referStorage:'_id',
                    visible:true
                },
                {
                    field: 'idDuty',
                    name: '职责',
                    widget: 'RadioRefer',
                    idRefer:'sys_duty_refer',
                    referDisplay:'dutyName',
                    referStorage:'_id',
                    visible:true
                },
            ],
            userFields: [
                {
                    field: 'idUser',
                    name: '人员',
                    widget: 'RadioRefer',
                    idRefer:'sys_user_refer',
                    referDisplay:'userName',
                    referStorage:'_id',
                    visible:true
                },
            ],
            roleDuty: [],
            roleUser: [],
        }
    },
    props: {
        idRole: {type: String},
        value: {
            type: Boolean,
            default: false
        }
    },
    watch: {
        value(val) {
            this.setCurrentValue(val);
        },
        idRole() {
             this.loadData();
        },
    },
    async created() {

    },
    methods: {
        setCurrentValue(val) {
            this.currentValue = val;
        },
        onOk() {
            this.$emit('input', false)
        },
        onCancel() {
            this.$emit('input', false)
        },
        async loadData(){
            this.roleDuty=(await this.$clear.model('sys_role_duty').get({
                params: {
                    filter: {
                        idRole: this.idRole,
                    },
                    populate:'idOrgan,idDuty'
                }
            })).records;
            this.roleUser=(await this.$clear.model('sys_user_role').get({
                params: {
                    filter: {
                        idRole: this.idRole,
                    },
                    populate:'idUser'
                }
            })).records;
        },
        async onRecordChangeDuty(value, field, scope) {
            this.roleDuty[scope.index][field] = value;
            this.roleDuty[scope.index]['idRole'] = this.idRole;

            if (this.roleDuty[scope.index]._id) {
                await this.$clear.model('sys_role_duty').put(this.roleDuty[scope.index]._id, this.roleDuty[scope.index]);
            } else {
                await this.$clear.model('sys_role_duty').post(this.roleDuty[scope.index]);
            }
            await this.loadData()
        },
        async onRecordRemoveDuty(record,index){
            this.$confirm({
                title: '提示',
                content: this.$t('operate.notice.remove'),
                onOk: async () => {
                    await this.$clear.model('sys_role_duty').delete(record._id);
                    await this.loadData();
                },
                onCancel:async ()=>{
                    return false
                }
            });
        },
        async onRecordChangeUser(value, field, scope) {
            this.roleUser[scope.index][field] = value;
            this.roleUser[scope.index]['idRole'] = this.idRole;

            if (this.roleUser[scope.index]._id) {
                await this.$clear.model('sys_user_role').put(this.roleUser[scope.index]._id, this.roleUser[scope.index]);
            } else {
                await this.$clear.model('sys_user_role').post(this.roleUser[scope.index]);
            }
            await this.loadData()
        },
        async onRecordRemoveUser(record,index){
            this.$confirm({
                title: '提示',
                content: this.$t('operate.notice.remove'),
                onOk: async () => {
                    await this.$clear.model('sys_user_role').delete(record._id);
                    await this.loadData();
                },
                onCancel:async ()=>{
                    return false
                }
            });
        }
    }
}
</script>

<style scoped>

</style>