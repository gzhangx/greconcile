const fs = require('fs');
const moment = require('moment');
const gs = require('./getSheet');

function saveGsToJson(fname, data) {
    fs.writeFileSync(fname, JSON.stringify(data.data.values, null, 2));
}
function loadGsJson(fname) {
    return JSON.parse(fs.readFileSync(fname));
}
async function test() {
    
    const cardStatementDataFileName = 'cardStatement.json';
    const jlDataFileName = 'jlStatement.json';
    /*
    const sheet = gs.createSheet();
    const cardStatementData = await sheet.readSheet('1sKppFHJy_MRRgHuV2PzhliSzuje7O0Rb-ntiOrLDVPA', 'ChaseCard!A:F')
    //console.log(cardStatementData.data.values);
    saveGsToJson(cardStatementDataFileName, cardStatementData);

    

    const jlData = await sheet.readSheet('1kBhGYV6GdomJXYdAjSbTQSzmtsjU2zSJnlrBIWTmc2M', 'MaintainessRecord!A:H')
    //console.log(jlData.data.values);
    saveGsToJson(jlDataFileName, jlData);
    */
    
    const cardData = loadGsJson(cardStatementDataFileName).map(d => {
        const tdate = moment(d[0]);
        const pdate = moment(d[1]);
        const desc = d[2];
        const category = d[3];
        const type = d[4];
        const revAmount = amt => {
            if (amt.indexOf('-') >= 0) {
                return amt.replace('-', '');
            }
            return `-${amt}`;
        }
        const amount = revAmount(d[5]);
        return {
            tdate,
            pdate,
            desc,
            category,
            type,
            amount,
            isPayment: type === 'Payment'
        }
    });
    const jlData = loadGsJson(jlDataFileName).filter(d => d).map(d => {
        if (d[2]) {
            d[2] = d[2].replace(/[\$,]/g, '').trim();
            if (d[2].indexOf('(') >= 0) {
                d[2] = '-'+d[2].replace(/[\(\)]/g, '');
            }
            return {
                date: moment(d[0]),
                amount: d[2],
                isCr: d[7] === 'cr'
            };
        }
        return null;
    }).filter(x=>x);
    console.log(jlData);
    console.log(cardData.filter(d => d.isPayment))
    
    const doMatch = (dateCmp) => {
        cardData.filter(cd => !cd.matched && !cd.isPayment).map(cd => {
            const amountMatches = jlData.filter(jd => jd.amount === cd.amount && !jd.matched);
            if (amountMatches.length === 0) {
                console.log(`card data no match on amount ${cd.amount} ${cd.tdate.format('YYYY-MM-DD')} ${cd.type} ${cd.category} ${cd.desc}`)
            }
        });
    }
    doMatch();
}

test();