
export default {
    data() {
        return {
            history: [],
            exportRowKey: 'records._id',
            beforeRecordChange: {
                records: {
                    idMaterielChildren: async ({index}) => {
                        (await this.$refer('bd_materiel_refer')).show({
                            display:'materielName',
                            query:{page:1,limit:10,filter:{}},
                            storage: '_id',
                            onOk: (_id) => {
                                this.$MaterielChildren({
                                    idMateriel: _id,
                                    value: this.selectedRow.records[index].idMaterielChildren,
                                    onOk: (idMaterielChildren, materielChildren) => {
                                        this.handleMaterielChildren(materielChildren, index)
                                    },
                                    onCancel: () => {
                                        this.beforeRecordChange.records.idMaterielChildren({index})
                                    }
                                })
                            }
                        });
                    },
                    idMateriel: async ({index}) => {
                        await this.$refer('bd_materiel_refer').show({
                            display:'materielName',
                            query:{page:1,limit:10,filter:{}},
                            storage: '_id',
                            onOk: (_id) => {
                                this.$MaterielChildren({
                                    idMateriel: _id,
                                    value: this.selectedRow.records[index].idMateriel,
                                    onOk: (idMaterielChildren, materielChildren) => {
                                        this.handleMaterielChildren(materielChildren, index)
                                    },
                                    onCancel: () => {
                                        this.beforeRecordChange.records.idMateriel({index})
                                    }
                                })
                            }
                        });
                    }
                }
            }
        }
    },
    watch: {
        PageView() {
            this.setCurrentDisabled()
        }
    },
    methods: {
        create() {
            this.selectedRow = {billDate: this.$moment()}
        },
        setCurrentDisabled() {
            for (let item of this.PageConfig.widgets) {
                if (item.mode === 'listCard' && item.p_id !== 0 && item.field === 'conversionRate') {
                    item.readonly = (record) => {
                        return !record.isFloatUnit
                    }
                }
                if (item.mode === 'listCard' && item.p_id !== 0 && ['openReason', 'closeReason'].includes(item.field)) {
                    item.visible = !!this.selectedRow[item.field];
                    item.cardVisible = !!this.selectedRow[item.field]
                }
                this.setCustomerWidgets !== void (0) && this.setCustomerWidgets(item);
            }
        },

        handleMaterielChildren(materielChildren, index) {
            const records = this.selectedRow.records.map((r, i) => {
                if (i === index) {
                    r.idMaterielChildren = materielChildren;
                    r.idMateriel = materielChildren.idMateriel;
                    r.idMaterielClass = materielChildren.idMateriel.idMaterielClass;
                    r.idAuxiliaryUnit = materielChildren.idMateriel.idAuxiliaryUnit;
                    r.idMainUnit = materielChildren.idMateriel.idMainUnit;
                    r.isFloatUnit = materielChildren.idMateriel.isFloatUnit;
                    r.conversionRate = materielChildren.idMateriel.conversionRate || 1;
                }
                return r
            });
            this.selectedRow = JSON.parse(JSON.stringify({...this.selectedRow, records}));
            /* 重新 计算 数量 件数 */
            if (!this.selectedRow.records[index]['quantity']) {
                this.selectedRow.records[index]['quantity'] = 0
            }
            this.onRecordChange(this.selectedRow.records[index]['quantity'], 'quantity', {
                text: this.selectedRow.records[index]['quantity'],
                record: this.selectedRow.records[index],
                index
            }, 'records')

        },
        fieldValidator(value, field, scope, model) {
            let content = ``;
            if (model === 'records') {
                switch (field) {
                    case 'idMaterielChildren':
                        if (!this.selectedRow.idSupplier) {
                            content += `请先选择供应商`
                        }
                        break;
                    case 'quantity':
                        this.PageConfig.widgets.map(el => {
                            if (el.field === 'quantity') {
                                el.rendonly = true
                            }
                        });
                        // if(!this.selectedRow.idSupplier){
                        //     content+=`请先选择供应商`
                        // }
                        break;
                    default:
                        break;
                }
            }
            content && this.$info({content});
            return !content
        },
        async onRecordChange(value, field, scope, model) {
            let records = this.selectedRow.records;

            function OperationTable(row, index, field) {
                row.isFloatUnit = row.isFloatUnit !== void (0) && row.isFloatUnit;
                row.conversionRate = row.conversionRate === void (0) ? 1 : row.conversionRate;
                // row.idOrgan = this.idOrgan;
                /* 数量计算 */
                switch (field) {
                    case 'quantity':
                        /** 数量变动
                         *   固定换算：件数 =  数量 / 换算
                         *   浮动换算：换算=  件数 / 数量
                         * */
                        if (row.isFloatUnit) {
                            if (row.quantity && (row.number || row.number === 0)) {
                                row.conversionRate = row.number / row.quantity;
                            }
                        } else {
                            if ((row.quantity || row.quantity === 0) && row.conversionRate) {
                                row.number = row.quantity / row.conversionRate;
                            }
                        }
                        break;
                    case 'number':
                        /** 件数变动
                         *   固定换算：数量 =  件数 * 换算
                         *   浮动换算：换算=  件数 / 数量
                         * */
                        if (row.isFloatUnit) {
                            if (row.quantity && (row.number || row.number === 0)) {
                                row.conversionRate = row.number / row.quantity;
                            }
                        } else {
                            if ((row.number || row.number === 0) && row.conversionRate) {
                                row.quantity = row.number * row.conversionRate;
                            }
                        }
                        break;

                    case 'conversionRate':
                        /** 换算率变动
                         * 1.件数 = 数量 / 换算
                         * */
                        if ((row.quantity || row.quantity === 0) && row.conversionRate) {
                            row.number = row.quantity / row.conversionRate
                        }
                        break;
                    default:

                        break;
                }
                // 金额计算
                switch (field) {
                    case 'rate':
                        /** 税率变动
                         * 含税单价 = 无税单价 *（1 + 税率）
                         * 含税金额 = 无税单价 *（1 + 税率）* 数量
                         * 税额 =  含税金额 - 无税金额
                         */
                        if (row.unitPrice || row.unitPrice === 0) {
                            row.unitPriceTax = row.unitPrice * (100 + row.rate) / 100;
                            if (row.quantity || row.quantity === 0) {
                                row.moneyTax = row.unitPrice * (100 + row.rate) / 100 * row.quantity;
                                row.tax = row.moneyTax - row.money
                            }
                        }
                        break;
                    case 'unitPrice':
                        /** 5.  无税单价变动
                         * 含税单价 = 无税单价 *（1 + 税率）
                         * 含税金额 = 无税单价 *（1 + 税率） * 数量
                         * 无税金额 = 无税单价 * 数量
                         * 税额 =  含税金额 - 无税金额
                         * */
                        if ((row.rate || row.rate === 0)) {
                            row.unitPriceTax = row.unitPrice * (100 + row.rate) / 100;
                            if (row.quantity || row.quantity === 0) {
                                row.moneyTax = row.unitPrice * (100 + row.rate) / 100 * row.quantity;
                                row.money = row.unitPrice * row.quantity;
                                row.tax = row.moneyTax - row.money
                            }
                        }
                        break;
                    case 'unitPriceTax':
                        /** 含税单价变动
                         * 无税单价 = 含税单价 /（1 + 税率）
                         * 无税金额 = 含税单价 /（1 + 税率） * 数量
                         * 含税金额 = 含税单价 * 数量
                         * 税额 =  含税金额 - 无税金额
                         */
                        if ((row.rate || row.rate === 0)) {
                            row.unitPrice = row.unitPriceTax / (100 + row.rate) * 100;
                            if (row.quantity || row.quantity === 0) {
                                row.money = row.unitPriceTax / (100 + row.rate) * 100 * row.quantity;
                                row.moneyTax = row.unitPriceTax * row.quantity;
                                row.tax = row.moneyTax - row.money
                            }
                        }
                        break;
                    case 'money':
                        /** 无税金额变动
                         * 无税单价 = 无税金额  / 数量
                         * 含税单价 = 无税金额  *（ 1 + 税率）/ 数量
                         * 含税金额 = 含税金额  *（ 1 + 税率）
                         * 税额 =  含税金额 - 无税金额
                         **/
                        if (row.quantity) {
                            row.unitPrice = row.money / row.quantity;
                            if (row.rate || row.rate === 0) {
                                row.unitPriceTax = row.money / row.quantity * (100 + row.rate) / 100;
                            }
                        }
                        if ((row.rate || row.rate === 0)) {
                            row.moneyTax = row.money * (100 + row.rate) / 100;
                            row.tax = row.moneyTax - row.money
                        }
                        break;
                    case 'moneyTax':
                        /** 含税金额变动
                         * 含税单价 = 含税金额  / 数量
                         * 无税单价 = 含税金额  /（ 1 + 税率）/ 数量
                         * 无税金额 = 含税金额  /（ 1 + 税率）
                         * 税额 =  含税金额 - 无税金额
                         **/
                        if (row.quantity) {
                            row.unitPriceTax = row.moneyTax / row.quantity;
                            if (row.rate || row.rate === 0) {
                                row.unitPrice = row.moneyTax / row.quantity / (100 + row.rate) * 100;
                            }
                            if ((row.rate || row.rate === 0)) {
                                row.money = row.moneyTax / (100 + row.rate) * 100;
                                row.tax = row.moneyTax - row.money
                        }
                        }
                        break;
                    default:
                        if (row.quantity || row.quantity === 0) {
                            if (row.unitPrice) {
                                row.money = row.unitPrice * row.quantity;
                                if (!row.unitPriceTax) {
                                    row.unitPriceTax = row.unitPrice * (100 + (row.rate || 0)) / 100
                                }
                            }
                            if (row.unitPriceTax) {
                                row.moneyTax = row.unitPriceTax * row.quantity;
                                if (!row.unitPrice) {
                                    row.unitPrice = row.unitPriceTax / (100 + (row.rate || 0)) * 100;
                                    row.money = row.unitPrice * row.quantity;
                                }
                            }
                            if ((row.moneyTax || row.moneyTax === 0) && (row.money || row.money === 0)) {
                                row.tax = row.moneyTax - row.money;
                            }
                        } else {
                            row.moneyTax = 0;
                            row.money = 0;
                            row.tax = 0
                        }
                        break;
                }
                return row;
            }

            if (field === 'idMaterielChildren') {
                records[scope.index].contrast = value;
            }
            if (this.fieldValidator === void (0) || this.fieldValidator(value, field, scope, model)) {
                scope.record[field] = value;
            }
            records[scope.index] = OperationTable(scope.record, scope.index, field);
            this.selectedRow = {...this.selectedRow, records}
        },

        change() {
            this.history = this.selectedRow.records
        },

        async loadRecord(data) {
            this.loading = true;
            let result = await this.$clear.model(this.PageConfig.idEntityList.dsCollection).getByID(data._id, {params: {populate: 'records.idMaterielChildren,records.idMateriel.idAuxiliaryUnit,records.idMateriel.idMainUnit'}}).then(res => res.records[0]);
            result.records.forEach(el => {
                el.rowKey = el._id;
                el.idAuxiliaryUnit = el.idMateriel?.idAuxiliaryUnit;
                el.idMainUnit = el.idMateriel?.idMainUnit;
            });
            this.selectedRow = result;
            this.loading = false;
        },

        // async doConserve(record) {
        //     if (record._id) {
        //         if (this.PageView === 'change') {
        //             await this.$clear.model(this.PageConfig.idEntityCard.dsCollection + '_history').post({
        //                 records: this.history, idUser: this.user._id,
        //                 changedAt: new Date(), idRefPurOrder: record._id
        //             });
        //         }
        //         await this.$clear.model(this.PageConfig.idEntityCard.dsCollection).put(record._id, record);
        //         await this.loadRecord(record);
        //     } else {
        //         record.idOrgan = this.idOrgan;
        //         await this.loadRecord(await this.$clear.model(this.PageConfig.idEntityCard.dsCollection).post(record).then(res => res.records[0]))
        //     }
        // },
    }
}
