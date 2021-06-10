const fs = require('fs');
const moment = require('moment');

function parseCsvLine(str) {
    const res = str.split('').reduce((acc, c) => {
        while (true) {
            if (!acc.inQuote) {
                if (c === ',') {
                    acc.res.push(acc.cur);
                    acc.cur = '';
                    return acc;
                }
                if (c === '"') {
                    acc.inQuote = c;
                    return acc;
                }
                if (c === '\r') {
                    return acc;
                }
                if (c === '\n') {
                    if (acc.cur) {
                        acc.res.push(acc.cur);
                        acc.cur = '';
                    }
                    acc.allRess.push(acc.res);
                    acc.res = [];
                    return acc;
                }
                break;
            } else {
                if (c === acc.inQuote) {
                    if (acc.inQuoteLastChar != acc.inQuote) {
                        acc.inQuoteLastChar = c;
                        return acc;
                    } else {
                        acc.inQuoteLastChar = null;
                        acc.cur += c;
                        return acc;
                    }
                } else if (acc.inQuoteLastChar == acc.inQuote) {
                    acc.inQuote = false;
                    acc.inQuoteLastChar = null;
                    continue;
                }
                break;
            }
        }
        acc.cur += c;
        return acc;
    }, {
        res: [],
        allRess: [],
        inQuote: false,
        inQuoteLastChar: null,
        cur: '',
    });
    if (res.cur) {
        res.res.push(res.cur);
    }
    if (res.res.length) {
        res.allRess.push(res.res);
    }
    return res.allRess;
}
const datas = parseCsvLine(fs.readFileSync('./MaintainessRecord.csv').toString()).slice(1).map(d => {
    //console.log(d)
    let amount = parseFloat(d[1].trim().replace(/[$,]/g,'').trim() || '0');
    return {
        date: moment(d[0]).format('YYYY-MM-DD'),
        amount,
        cat: d[2],
        worker:d[3],
    }
});

const cutOff = moment('2020-11-01');
const ignoreCats = {
    'Commission Fee':true,
    'Management fee': true,
    'Lawn Maintenance': true,
    'Development Work': true,
}

const ignames = require('./names.json');
const cignores = {
    'Repair': true,
    'Supplies': true,
}

datas.reduce((acc, data) => {
    if (moment(data.date).isAfter(cutOff)) return acc;
    if (ignoreCats[data.cat]) return acc;
    if (data.worker === ignames.ingoreName) {        
        if (cignores[data.cat]) {
            console.log(`ignore ${ignames.ingoreName} of ${data.cat}`);
            return acc;
        }
    }
    acc.total += data.amount;
    acc.total = Math.round(acc.total * 100) / 100.0;
    console.log(`${data.date} amt=${data.amount} total=${acc.total}`);
    return acc;
}, {
    total:0,
})