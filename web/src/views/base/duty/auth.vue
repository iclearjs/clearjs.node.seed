<template>
    <a-modal v-model="currentValue" title="功能权限" :width="768" :body-style="{padding:0}" @ok="onOk" @cancel="onCancel"
             destroyOnClose :maskClosable="false">
        <a-card :bordered="false">
            <a-select slot="title" style="width: 250px" v-model="application">
                <template v-for="app in applications">
                    <a-select-option :value="app.idApplication._id" :key="app.idApplication._id">
                        <a-avatar shape="square" slot='avatar' size="small"
                                  :src="app.idApplication.icon?app.idApplication.icon:icon"/>
                        <span slot="title" style="margin-left: 12px">{{ app.idApplication.name }}</span>
                    </a-select-option>
                </template>
            </a-select>
            <a-row>
                <a-col :span="12" style="min-height: 280px;max-height: 500px;overflow: auto">
                    <a-tree v-model="checkedMenus" checkable autoExpandParent defaultExpandAll :tree-data="menus"
                            @select="onMenuSelect" @check="onMenuCheck"/>
                </a-col>
                <a-col :span="12" style="min-height: 280px;max-height: 500px;overflow: auto">
                    <a-checkbox-group v-model="checkedButtons" @change="onButtonCheck">
                        <a-row v-for="button in buttons" style="margin-top: 12px" :key="button._id">
                            <a-checkbox :value="button._id">
                                {{ button.name }}
                            </a-checkbox>
                        </a-row>
                    </a-checkbox-group>
                </a-col>
            </a-row>
        </a-card>
    </a-modal>
</template>

<script>
export default {
    name: "auth",
    data() {
        return {
            icon: require('../../../assets/icon/application.png'),
            currentValue: false,
            applications: [],
            application: '',
            menus: [],
            buttons: [],
            selectedMenu: '',
            checkedMenus: [],
            checkedButtons: [],
        }
    },
    props: {
        idDuty: {type: String},
        value: {
            type: Boolean,
            default: false
        }
    },
    watch: {
        value(val) {
            this.setCurrentValue(val);
        },
        application() {
            this.loadApplicationMenus()
        },
        idDuty() {
            if(this.application){
                this.loadApplicationMenus()
            }
        },
    },
    async created() {
        this.applications = (await this.$http.get('/core/authority/application')).data.records
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
        async loadApplicationMenus() {
            const result = (await this.$core.model('cdp_menu').get({
                params: {filter: {idApplication: this.application}, order: "order",}
            })).records;
            this.menus = this.$core.helper.listToTree(result, 0, {replaceFields: {key: '_id', value: '_id', title: 'name'}});
            const existMenus = (await this.$core.model('sys_duty_menu').get({
                params: {
                    filter: {
                        idApplication: this.application,
                        idDuty: this.idDuty
                    }
                }
            })).records;
            this.checkedMenus = existMenus.map(item => item.idMenu);
            this.buttons = [];
            this.checkedButtons = [];
            this.selectedMenu = {};
        },
        async onMenuSelect(value, node, extra) {
            this.selectedMenu = JSON.parse(JSON.stringify(node.node.dataRef));
            this.buttons = (await this.$core.model('cdp_menu_button').get({
                params: {filter: {idMenu: this.selectedMenu._id}, order: "order",}
            })).records;
            const existButtons = (await this.$core.model('sys_duty_button').get({
                params: {
                    filter: {
                        idApplication: this.application,
                        idDuty: this.idDuty,
                        idMenu: this.selectedMenu._id
                    }
                }
            })).records;
            this.checkedButtons = existButtons.map(item => item.idMenuButton);
        },
        async onMenuCheck(checkedMenus) {
            const exists = (await this.$core.model('sys_duty_menu').get({
                params: {
                    filter: {
                        idApplication: this.application,
                        idDuty: this.idDuty
                    }
                }
            })).records;
            if (exists[0]) {
                await this.$core.model('sys_duty_menu').delete(exists.map(item => item._id))
            }
            if (checkedMenus[0]) {
                await this.$core.model('sys_duty_menu').post(checkedMenus.map(item => {
                    return {
                        idDuty: this.idDuty,
                        idMenu: item,
                        idApplication: this.application
                    }
                }))
            }
        },
        async onButtonCheck(checkedButtons) {
            const exists = (await this.$core.model('sys_duty_button').get({
                params: {
                    filter: {
                        idApplication: this.application,
                        idDuty: this.idDuty,
                        idMenu: this.selectedMenu._id
                    }
                }
            })).records;
            if (exists[0]) {
                await this.$core.model('sys_duty_button').delete(exists.map(item => item._id))
            }
            if (checkedButtons.length > 0) {
                if (!this.checkedMenus.includes(this.selectedMenu._id)) {
                    this.checkedMenus.push(this.selectedMenu._id);
                    await this.onMenuCheck(this.checkedMenus);
                }
                await this.$core.model('sys_duty_button').post(checkedButtons.map(item => {
                    return {
                        idDuty: this.idDuty,
                        idMenu: this.selectedMenu._id,
                        idMenuButton: item,
                        idApplication: this.application
                    }
                }))
            } else {
                if (this.checkedMenus.includes(this.selectedMenu._id)) {
                    this.checkedMenus.splice(this.checkedMenus.indexOf(this.selectedMenu._id), 1);
                    await this.onMenuCheck(this.checkedMenus);
                }
            }
        }
    }
}
</script>

<style scoped>

</style>