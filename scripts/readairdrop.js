var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('thingnew.json', 'utf8'));
// console.log(obj);
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
var rewards = {
    3: { reward: 100, count: 0, total: 0 },
    6: { reward: 100, count: 0, total: 0 },
    10: { reward: 100, count: 0, total: 0 },
    20: { reward: 100, count: 0, total: 0 },
    35: { reward: 100, count: 0, total: 0 }
    60: { reward: 100, count: 0, total: 0 },
    120: { reward: 100, count: 0, total: 0 },
    20: { reward: 100, count: 0, total: 0 },
    1000: { reward: 100, count: 0, total: 0 },

};
let count = 0;
for (const [key, value] of Object.entries(obj)) {
    if (value / 10 ** 18 > 2000) {
        console.log(key, value);
        count = count + 1;
    }
}

console.log(count);
