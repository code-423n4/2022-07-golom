// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat');
var fs = require('fs');

const axios = require('axios');
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//this gives events inclusive of start block and end block
async function main(start, end) {
    var dict = {};

    let contract = await hre.ethers.getVerifiedContractAt('0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b');
    let filter = contract.filters.OrdersMatched(null, null);
    console.log(filter);

    var not_completed = true;
    let _start = start;
    let _end = 0;
    while (not_completed) {
        if (_start + 500 < end) {
            _end = _start + 500;
        } else {
            _end = end;
            not_completed = false;
        }
        console.log(_start, _end);
        let eventsWith = await contract.queryFilter(filter, _start, _end);
        console.log(eventsWith.length);
        var reqaddress = '';
        for (let index = 0; index < eventsWith.length; index++) {
            const element = eventsWith[index];
            // console.log(await element.getBlock());
            reqaddress = element.args.maker;
            if (reqaddress in dict) {
                dict[reqaddress] = dict[reqaddress] + parseInt(element.args.price);
            } else {
                dict[reqaddress] = parseInt(element.args.price);
            }
            reqaddress = element.args.taker;
            if (reqaddress in dict) {
                dict[reqaddress] = dict[reqaddress] + parseInt(element.args.price);
            } else {
                dict[reqaddress] = parseInt(element.args.price);
            }
        }
        _start = _end + 1;
    }

    contract = await hre.ethers.getVerifiedContractAt('0x7f268357a8c2552623316e2562d90e642bb538e5');
    filter = contract.filters.OrdersMatched(null, null);
    console.log(filter);
    start = 14120913; // contract deployed at 14120913
    not_completed = true;
    _start = start;
    _end = 0;
    while (not_completed) {
        if (_start + 500 < end) {
            _end = _start + 500;
        } else {
            _end = end;
            not_completed = false;
        }
        console.log(_start, _end);
        let eventsWith = await contract.queryFilter(filter, _start, _end);
        console.log(eventsWith.length);
        reqaddress = '';
        for (let index = 0; index < eventsWith.length; index++) {
            const element = eventsWith[index];
            // console.log(await element.getBlock());
            reqaddress = element.args.maker;
            if (reqaddress in dict) {
                dict[reqaddress] = dict[reqaddress] + parseInt(element.args.price);
            } else {
                dict[reqaddress] = parseInt(element.args.price);
            }
            reqaddress = element.args.taker;
            if (reqaddress in dict) {
                dict[reqaddress] = dict[reqaddress] + parseInt(element.args.price);
            } else {
                dict[reqaddress] = parseInt(element.args.price);
            }
        }
        _start = _end + 1;
    }

    var dictstring = JSON.stringify(dict);
    console.log(dictstring);

    fs.writeFile('thing.json', dictstring, function(err, result) {
        if (err) console.log('error', err);
    });

    await sleep(5000);
}

main(12545218, 14239569)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
