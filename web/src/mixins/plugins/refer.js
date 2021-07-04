import BigNumber from 'bignumber.js'
export default {
    data(){return {
        accurateCalculation:{
            ...BigNumber,
            add:(...arg)=>{ let sum = 0; arg.forEach(num=>{ sum = BigNumber(sum).plus(num) }); return sum.toNumber() },
            subtract:(...arg)=>{ let result = arg[0]; arg.forEach((num,index)=>{ if(index !== 0 ) {result = BigNumber(result).minus(num)} }); return result.toNumber() },
            multiply:(...arg)=>{ let result = arg[0]; arg.forEach((num,index)=>{ if(index !== 0 ) {result = BigNumber(result).times(num)} }); return result.toNumber() },
            divide:(...arg)=>{ let result = arg[0]; arg.forEach((num,index)=>{ if(index !== 0 ) {result = BigNumber(result).div(num)} }); return result.toNumber() },
        }
    }},
    watch: {},
    methods: {
        formatReferHeadData(data) {
            let Json = JSON.parse(JSON.stringify(data));
            delete Json._id;
            Json.__s = 1;
            Json.__r = 0;
            delete Json.billCode;
            delete Json.idWorkflow;
            delete Json.billDate;
            delete Json.createdAt;
            delete Json.createdUser;
            delete Json.submitAt;
            delete Json.submitUser;
            delete Json.verifyAt;
            delete Json.verifyUser;
            delete Json.abandonUser;
            delete Json.abandonAt;
            delete Json.revokeAt;
            delete Json.revokeUser;
            delete Json.closeAt;
            delete Json.closeUser;
            delete Json.openAt;
            delete Json.openUser;
            return Json
        },
        formatReferRecord(record) {
            let Json = JSON.parse(JSON.stringify(record));
            delete Json._id;
            function judgeStringIncludes(key,field,type = 'end'){
                return type==='end'? key.indexOf(field) === key.length - field.length:key.indexOf(field) === 0
            }
            for(let key of Object.keys(Json)){

                if(key.indexOf('sum') === 0 && judgeStringIncludes(key,'Quantity')){
                    delete Json[key]
                }
                if(key.indexOf('sum') === 0 && judgeStringIncludes(key,'QuantityPre')){
                    delete Json[key]
                }
                if(key.indexOf('sum') === 0 && judgeStringIncludes(key,'Money')){
                    delete Json[key]
                }
                if(key.indexOf('sum') === 0 && judgeStringIncludes(key,'MoneyTax')){
                    delete Json[key]
                }

            }
            return Json
        },
        calcMoneyTax(params) {
            if(!params){
                return params
            }
            let {unitPrice, unitPriceTax, rate, quantity, money, moneyTax, tax} = params;
            if (unitPriceTax && !Number.isNaN(rate) && quantity) {
                return {unitPriceTax, rate, quantity,
                    unitPrice:BigNumber(unitPriceTax).times(100).div(BigNumber(100).plus(rate)).toNumber(),
                    money:BigNumber(unitPriceTax).times(100).div(BigNumber(100).plus(rate)).times(quantity).toNumber(),
                    moneyTax:BigNumber(unitPriceTax).times(quantity).toNumber(),
                    tax:BigNumber(unitPriceTax).times(rate).div(BigNumber(100).plus(rate)).times(quantity).toNumber()}
            }
            if (unitPrice && !Number.isNaN(rate) && quantity) {
                return {unitPrice, rate, quantity,
                    unitPriceTax:BigNumber(unitPrice).times(BigNumber(100).plus(rate)).div(100).toNumber(),
                    money:BigNumber(unitPrice).times(quantity).toNumber(),
                    moneyTax:BigNumber(unitPrice).times(BigNumber(100).plus(rate)).div(100).times(quantity).toNumber(),
                    tax:BigNumber(unitPrice).times(rate).times(quantity).div(100).toNumber()
                }
            }
            if (money && !Number.isNaN(rate) && quantity) {
                return {rate, quantity, money,
                    unitPrice:BigNumber(money).div(quantity).toNumber(),
                    unitPriceTax:BigNumber(money).div(quantity).times(BigNumber(100).plus(rate)).div(100).toNumber(),
                    moneyTax:BigNumber(money).times(BigNumber(100).plus(rate)).div(100).toNumber() ,
                    tax: BigNumber(money).times(rate).div(100).toNumber()}
            }
            if (moneyTax && !Number.isNaN(rate) && quantity) {
                return { rate, quantity, moneyTax,
                    unitPrice:BigNumber(moneyTax).div(quantity).times(100).div(BigNumber(100).plus(rate)).toNumber(),
                    unitPriceTax:BigNumber(moneyTax).div(quantity).toNumber(),
                    money:BigNumber(moneyTax) .times(100).div(BigNumber(100).plus(rate)).toNumber() ,
                    tax:BigNumber(moneyTax).times(rate).div(BigNumber(100).plus(rate)).toNumber()}

            }
            if (tax && !Number.isNaN(rate) && quantity) {
                return {rate, quantity, tax,
                    unitPrice:BigNumber(tax).times(100).div(rate).div(quantity).toNumber(),
                    unitPriceTax:BigNumber(tax).times(BigNumber(100).plus(rate)).div(quantity).toNumber(),
                    money:BigNumber(tax).times(100).div(rate).toNumber(),
                    moneyTax:BigNumber(tax).times(100).div(rate).plus(tax).toNumber()}
            }
            return params
        },
        formatMaterielChildrenData(record) {
            if (record===void(0) || typeof record !== 'object'){
                return {};
            }
            function ObjToID(val){
                return typeof val === 'object' && val !== void(0) ? val._id: val;
            }
            return {
                idMaterielChildren:ObjToID(record.idMaterielChildren)?ObjToID(record.idMaterielChildren):record._id,
                idMateriel:ObjToID(record.idMateriel),
                idMainUnit:ObjToID(record.idMainUnit)?ObjToID(record.idMainUnit):ObjToID(record?.idMateriel?.idMainUnit),
                idAuxiliaryUnit:ObjToID(record.idAuxiliaryUnit)?ObjToID(record.idAuxiliaryUnit):ObjToID(record?.idMateriel?.idAuxiliaryUnit),
                conversionRate:record.conversionRate?record.conversionRate:(record?.idMateriel?.conversionRate||1),
            }
        },

    }
}
