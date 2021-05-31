const fs = require('fs');
const moment = require('moment');
const { sum, max, min } = require('lodash');
const gs = require('./getSheet');

function saveGsToJson(fname, data) {
    fs.writeFileSync(fname, JSON.stringify(data.data.values, null, 2));
}
function loadGsJson(fname) {
    return JSON.parse(fs.readFileSync(fname));
}

function loadCSV() {
    const fsStr = fs.readFileSync('Chase7478_2021y2d.CSV').toString().split('\n');
    return fsStr.slice(1).filter(x=>x).map(f=>f.split(','))
}
async function test() {
    
    const jlDataFileName = 'jlStatement.json';
    
    /*
    const jlSheetData = await gs.createSheet().readSheet('1kBhGYV6GdomJXYdAjSbTQSzmtsjU2zSJnlrBIWTmc2M', 'MaintainessRecord!A:H')
    //console.log(jlData.data.values);
    console.log(`saving ${jlDataFileName}`);
    saveGsToJson(jlDataFileName, jlSheetData);
    */
    
    const cardData = loadCSV().map(d => {
        const tdate = moment(d[0]);
        const pdate = moment(d[1]);
        const desc = d[2];
        const category = d[3];
        const type = d[4];
        const revAmount = amt => {
            return (-parseFloat(amt)).toFixed(2)            
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
    const jlData = loadGsJson(jlDataFileName).map((d,row) => {
        if (d[2]) {
            d[2] = d[2].replace(/[\$,]/g, '').trim();
            if (d[2].indexOf('(') >= 0) {
                d[2] = '-'+d[2].replace(/[\(\)]/g, '');
            }
            d[2] = parseFloat(d[2]).toFixed(2)
            if (d[0].length <= 5) {
                d[0] += '/2021';
            }
            return {
                row: row+1,
                date: moment(d[0]),
                amount: d[2],
                isCr: d[7] === 'cr',
                merchant: d[1],
                desc: d[4],
                person: d[5],
            };
        }
        return null;
    }).filter(x=>x);
    //console.log(jlData);
    //console.log(cardData.filter(d => d.isPayment))
    
    const doMatch = (dateCmp) => {
        cardData.filter(cd => !cd.matched && !cd.isPayment).map(cd => {
            const amountMatches = jlData.filter(jd => jd.amount === cd.amount && !jd.matched);
            if (amountMatches.length === 0) {
                console.log(`card data no match on amount ${cd.amount} ${cd.tdate.format('YYYY-MM-DD')} ${cd.type} ${cd.category} ${cd.desc}`);
                cd.noMatch = 'no amount found';
                return;
            }
            const dateMatched = amountMatches.filter(jd => dateCmp(jd, cd) && !jd.matched)[0];
            if (dateMatched) {
                cd.matched = dateMatched;
                dateMatched.matched = cd;
            } else {
                console.log(`card data no match on date ${cd.amount} ${cd.tdate.format('YYYY-MM-DD')} ${cd.type} ${cd.category} ${cd.desc}`);
                cd.noMatch = 'no date found';
            }
        });
    }
    doMatch((jd, cd) => {
        return jd.date.isSameOrBefore(cd.pdate) && jd.date.isSameOrAfter(cd.tdate.add(-4, 'days'));
    });


    console.log('================== items on card but not on jl ==================');
    cardData.filter(j => j.noMatch).map(cd => {
        console.log(`${cd.tdate.format('YYYY-MM-DD')},${cd.amount}, ${cd.type}, ${cd.category}, ${cd.desc}`);
    })
    const total = cardData.filter(d => d.noMatch).reduce((acc,d) => acc+parseFloat(d.amount),0);
    console.log(`total of items on card but not on jl ${total}`);
    console.log('================== items on card but not on jl ==================');
    console.log()
    console.log()

    const extrasOnJl = jlData.filter(j => j.isCr && !j.matched);
    extrasOnJl.map(j => {
        console.log(`${j.date.format('YYYY-MM-DD')}, ${j.row}, ${j.amount}, ${j.merchant}, ${j.desc}, ${j.person}`);
        //&& jj.date.diff(j.date)===0
        jlData.filter(jj => jj.amount === j.amount  && j !== jj).map(dj => {
            //console.log(`--->${dj.date.format('YYYY-MM-DD')}, ${j.date.format('YYYY-MM-DD')}, ${dj.row}, ${dj.amount}, ${dj.merchant}, ${dj.desc}, ${dj.person}`);
        })
    });
    const extraTotal = sum(extrasOnJl.map(d => parseFloat(d.amount)))    
    console.log(`total extra on jlsheet= ${extraTotal}`);
    
    const getMinMax = extrasOnJl => {
        const minRow = min(extrasOnJl);
        const maxRow = max(extrasOnJl);
        //console.log(extrasOnJl);
        //console.log(maxRow)
        const data = [];
        for (let i = 0; i < (maxRow - minRow + 1); i++) data[i] = [''];
        extrasOnJl.forEach(r => {
            data[r - minRow ] = ['dup'];
        })
        return {
            minRow,
            maxRow,
            data
        }
    }
    const mm = getMinMax(extrasOnJl.map(j=>j.row));
    //console.log(`${mm.minRow} ${mm.maxRow} ${mm.data.length}`)
    //console.log(mm.data)
    //const sheet = gs.createSheet();
    //await sheet.updateSheet('1kBhGYV6GdomJXYdAjSbTQSzmtsjU2zSJnlrBIWTmc2M', `MaintainessRecord!G${mm.minRow}:G${mm.maxRow}`, mm.data)
}

test();