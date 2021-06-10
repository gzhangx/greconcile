const fs = require('fs');
const moment = require('moment');

function parseCsvLine(str) {
    const res = str.split('').reduce((acc, c) => {
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
            }
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
            }
            if (acc.inQuoteLastChar == acc.inQuote) {
                acc.inQuote = false;
                acc.inQuoteLastChar = null;
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
const lines = parseCsvLine(fs.readFileSync('./MaintainessRecord.csv').toString()).map(d => {
    console.log(d)
    let amount = d[1].trim().replace(/[$]/g,'').trim();
    return {
        date: moment(d[0]).format('YYYY-MM-DD'),
        amount,
        cat: d[2],
        worker:d[3],
    }
});
console.log(lines)