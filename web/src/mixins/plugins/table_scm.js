import BigNumber from 'bignumber.js'
export default {
    data() {
        return {
            history: [],
            exportRowKey: 'records._id',
            beforeRecordChange: {
                records: {
                    idMaterielChildren: async ({index}) => {
                        await this.$refer('view_org_materiel_refer').show({
                            display:'materielName',
                            query:{page:1,limit:10,filter:{idOrgan:this.idOrgan}},
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
                        await this.$refer('view_org_materiel_refer').show({
                            display:'materielName',
                            query:{page:1,limit:10,filter:{idOrgan:this.idOrgan}},
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
            },
            query: {
                limit: 10,
                page: 1,
                order: '-_id',
                likeBy:`billCode,billName,${new Array(3).fill('tFree').map((el,index)=>'tFree' +(index + 1))},${new Array(3).fill('tFree').map((el,index)=>'records.mFree' +(index + 1))}` ,
            },
            accurateCalculation:{
                ...BigNumber,
                add:(...arg)=>{ let sum = 0; arg.forEach(num=>{ sum = BigNumber(sum).plus(num) }); return sum.toNumber() },
                subtract:(...arg)=>{ let result = arg[0]; arg.forEach((num,index)=>{ if(index !== 0 ) {result = BigNumber(result).minus(num)} }); return result.toNumber() },
                multiply:(...arg)=>{ let result = arg[0]; arg.forEach((num,index)=>{ if(index !== 0 ) {result = BigNumber(result).times(num)} }); return result.toNumber() },
                divide:(...arg)=>{ let result = arg[0]; arg.forEach((num,index)=>{ if(index !== 0 ) {result = BigNumber(result).div(num)} }); return result.toNumber() },
            }
        }
    },
    watch: {
        PageView() {
            this.setCurrentDisabled()
        }
    },
    methods: {
        async setDefaultRecord(){
            const token = await this.$clear.model('org_organ_user').getByID(this.token).then(el=>el.records[0]);
            return {billDate: this.$moment(),idUser:this.token,idBranch:token.idBranch}
        },
        async create() {
            this.selectedRow = await this.setDefaultRecord()
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
            if(this.PageView === 'change'){
                const formHeadFields = this.PageConfig.widgets.filter(el=>el.mode ==='listCard' && this.PageConfig.widgets.filter(el=>el.widget === 'Grid').map(el=>el._id).includes(el.p_id));
                for(let field of formHeadFields){
                    field.readonly = () => {
                        return this.PageView === 'change'
                    }
                }
            }
        },

        handleMaterielChildren(materielChildren, index) {
            const records = this.selectedRow.records.map((r, i) => {
                if (i === index) {
                    r.idMaterielChildren = materielChildren;
                    r.idMateriel = materielChildren.idMateriel;
                    r.contrast = materielChildren.contrast;
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
                                row.conversionRate = BigNumber(row.number).div(row.quantity).toNumber();

                            }
                        } else {
                            if ((row.quantity || row.quantity === 0) && row.conversionRate) {
                                row.number = BigNumber(row.quantity).div(row.conversionRate).toNumber();
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
                                row.conversionRate = BigNumber(row.number).div(row.quantity).toNumber()
                            }
                        } else {
                            if ((row.number || row.number === 0) && row.conversionRate) {
                                row.quantity = BigNumber(row.number).times(row.conversionRate).toNumber();
                            }
                        }
                        break;

                    case 'conversionRate':
                        /** 换算率变动
                         * 1.件数 = 数量 / 换算
                         * */
                        if ((row.quantity || row.quantity === 0) && row.conversionRate) {
                            row.number = BigNumber(row.quantity).div(row.conversionRate).toNumber()
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
                            row.unitPriceTax = BigNumber(row.unitPrice).times( BigNumber(100).plus(row.rate)).div(100).toNumber() ;
                            if (row.quantity || row.quantity === 0) {
                                row.moneyTax = BigNumber(row.unitPrice).times( BigNumber(100).plus(row.rate)).div(100).times(row.quantity).toNumber() ;
                                row.tax = BigNumber(row.moneyTax).minus(row.money).toNumber();
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
                            row.unitPriceTax = BigNumber(row.unitPrice).times( BigNumber(100).plus(row.rate)).div(100).toNumber() ;
                            if (row.quantity || row.quantity === 0) {
                                row.moneyTax = BigNumber(row.unitPrice).times( BigNumber(100).plus(row.rate)).div(100).times(row.quantity).toNumber() ;
                                row.money = BigNumber(row.unitPrice).times(row.quantity).toNumber();
                                row.tax = BigNumber(row.moneyTax).minus(row.money).toNumber();
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
                            row.unitPrice = BigNumber(row.unitPriceTax).div(BigNumber(100).plus(row.rate)).times(100).toNumber();
                            if (row.quantity || row.quantity === 0) {
                                row.money = BigNumber(row.unitPriceTax).div(BigNumber(100).plus(row.rate)).times(100).times(row.quantity).toNumber() ;
                                row.moneyTax = BigNumber(row.unitPriceTax).times(row.quantity).toNumber();
                                row.tax = BigNumber(row.moneyTax).minus(row.money).toNumber();
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
                            row.unitPrice = BigNumber(row.money).div(row.quantity).toNumber();
                            if (row.rate || row.rate === 0) {
                                row.unitPriceTax = BigNumber(row.money).div(row.quantity).times(BigNumber(100).plus(row.rate)).div(100).toNumber();
                            }
                        }
                        if ((row.rate || row.rate === 0)) {
                            row.moneyTax = BigNumber(row.money).times(BigNumber(100).plus(row.rate)).div(100).toNumber() ;
                            row.tax = BigNumber(row.moneyTax).minus(row.money).toNumber();
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
                            row.unitPriceTax = BigNumber(row.moneyTax).div(row.quantity).toNumber();
                            if (row.rate || row.rate === 0) {
                                row.unitPrice = BigNumber(row.moneyTax).div(row.quantity).div(BigNumber(100).plus(row.rate)).times(100).toNumber();
                            }
                            if ((row.rate || row.rate === 0)) {
                                row.money = BigNumber(row.moneyTax).div(BigNumber(100).plus(row.rate)).times(100).toNumber();
                                row.tax =BigNumber(row.moneyTax).minus(row.money).toNumber()
                        }
                        }
                        break;
                    default:
                        if (row.quantity || row.quantity === 0) {
                            if (row.unitPrice) {
                                row.money = BigNumber(row.unitPrice).times(row.quantity).toNumber();
                                if (!row.unitPriceTax) {
                                    row.unitPriceTax = BigNumber(row.unitPrice).times(BigNumber(100).plus(row.rate||0)).div(100).toNumber()
                                }
                            }
                            if (row.unitPriceTax) {
                                row.moneyTax = BigNumber(row.unitPriceTax).times(row.quantity).toNumber();
                                if (!row.unitPrice) {
                                    row.unitPrice = BigNumber(row.unitPriceTax).times(BigNumber(100).plus(row.rate||0)).times(100).toNumber();
                                    row.money = BigNumber(row.unitPrice).times(row.quantity).toNumber();
                                }
                            }
                            if ((row.moneyTax || row.moneyTax === 0) && (row.money || row.money === 0)) {
                                row.tax = BigNumber(row.moneyTax).minus(row.money).toNumber();
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

        async change() {
            await this.loadRecord(this.selectedRow);
            this.history = this.selectedRow.records
            /* 表头数据*/
        },

        async loadRecord(data) {
            this.loading = true;
            let result = await this.$clear.model(this.PageConfig.idEntityList.dsCollection).getByID(data._id, {params: {populate: 'records.idMaterielChildren,records.idMateriel.idAuxiliaryUnit,records.idMateriel.idMainUnit'}}).then(res => res.records[0]);
            result && result.records.forEach(el => {
                el.rowKey = el._id;
                el.idAuxiliaryUnit = el.idMateriel?.idAuxiliaryUnit;
                el.idMainUnit = el.idMateriel?.idMainUnit;
            });
            this.selectedRow = result?result:{};
            this.loading = false;
        },
        async doConserve(record) {
            if (record._id) {
                await this.$http.post(`/v1/page/${this.PageView === 'change'?"change":'modify'}/${this.PageConfig._id}/${record._id}`,{
                    ...record,
                    operateUser:this.user._id
                });
                await this.loadRecord(record);
            } else {
                record.idOrgan = this.idOrgan;
                record.createdUser = this.user._id;
                record = await this.$http.post(`/v1/page/create/${this.PageConfig._id}/`,{
                    ...record,
                    operateUser:this.user._id
                }).then(el=>el.data.records);
                await this.loadRecord(record)
            }
        },
    }
}
