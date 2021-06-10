const fs = require('fs');
const moment = require('moment');

const lines = fs.readFileSync('./MaintainessRecord.csv').toString().split('\n').map(r => {
    const d = r.split(',');
    let amount = d[1].trim().replace(/[$]/g,'').trim();
    return {
        date: moment(d[0]).format('YYYY-MM-DD'),
        amount,
        cat: d[2],
        worker:d[3],
    }
});
console.log(lines)