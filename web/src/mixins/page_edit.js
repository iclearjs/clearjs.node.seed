export default {
    data(){
        return {
            beforeChange: {},
            beforeRecordChange: {
                records: {},
            },
        }
    },
    methods: {
        async conserve() {
            const validate = () => {
                let fields = this.PageConfig.widgets.filter(item => item.mode === 'listCard');
                function isRowValAllow(row, field) {
                    let result = true;
                    switch (field.widget) {
                        case 'Number':
                            result = !!row[field.field] || row[field.field] === 0;
                            break;
                        case 'CheckBox':
                            break;
                        case 'radio':
                            result = !!row[field.field];
                            break;
                        default:
                            result = !!row[field.field];
                            break;
                    }
                    return result
                }

                let noFieldWidgets = fields.filter(item => ['Table', 'Grid', 'Tab'].includes(item.widget));
                let content = [];
                for (let nfw of noFieldWidgets) {
                    if (nfw.widget === 'Table') {
                        const tableFields = fields.filter(el => el.p_id === nfw._id && !el.readonly && el.visible && el.required);
                        const tab = fields.filter(el => el._id === nfw.p_id)[0];
                        this.selectedRow[nfw.field]&&this.selectedRow[nfw.field].forEach((item, index) => {
                            tableFields.forEach(field => {
                                if (!isRowValAllow(item, field)) {
                                    content.push(`表格${tab ? tab.name : ''}第${Number(index) + 1}行字段${field.name}值未填写。`)
                                }
                            })
                        })
                    }
                    if (nfw.widget === 'Grid') {
                        const gridFields = fields.filter(el => el.p_id === nfw._id && !el.readonly && el.visible && el.required && !['Table', 'Grid', 'Tab'].includes(el.widget));
                        for (let gf of gridFields) {
                            if (!isRowValAllow(this.selectedRow, gf)) {
                                content.push(`表单字段${gf.name}值未填写。`)
                            }
                        }
                    }
                    if (nfw.widget === 'Tab') {
                        const tabFields = fields.filter(el => el.p_id === nfw._id && !el.readonly && el.visible && el.required && !['Table', 'Grid', 'Tab'].includes(el.widget));
                        for (let tf of tabFields) {
                            if (!isRowValAllow(this.selectedRow, tf)) {
                                content.push(`表单字段${tf.name}值未填写。`)
                            }
                        }
                    }
                }
                if (content.length > 0) {
                    this.$message.warn({content: this.$createElement('div', content.map((el, i) => this.$createElement('p', Number(i) + 1 + '. ' + el)))})
                }
                return content.length === 0
            };
            if (!validate()) {
                return false
            }
            await this.doConserve(this.selectedRow);
            this.PageView = 'edit';
            return true;
        },

        async doConserve(record) {
            if (record._id) {
                await this.$http.post(`/core/page/modify/${this.PageConfig._id}/${record._id}`,{
                    ...record,
                    operateUser:this.user._id
                });
                await this.loadRecord(record);
            } else {
                record.idOrgan = this.idOrgan;
                record.createdUser = this.user._id;
                record = await this.$http.post(`/core/page/create/${this.PageConfig._id}/`,{
                    ...record,
                    operateUser:this.user._id
                }).then(el=>el.data.records);
                await this.loadRecord(record)
            }
        },

        async cancel() {
            if (this.selectedRow._id) {
                await this.loadRecord(this.selectedRow)
            }
        },

        async onRecordChange(value, field, scope, model) {
            let records = this.selectedRow[model];
            records[scope.index][field] = value;
            this.selectedRow = {...this.selectedRow, records}
        },

        async goBack() {
            this.setSelectNull();
            await this.onTableChange({...this.query, page: 1});
        },
    }
}
