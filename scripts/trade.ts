// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat');
import { ethers } from 'hardhat';

const types = {
    payment: [
        { name: 'paymentAmt', type: 'uint256' },
        { name: 'paymentAddress', type: 'address' },
    ],
    order: [
        { name: 'collection', type: 'address' },
        { name: 'tokenId', type: 'uint256' },
        { name: 'signer', type: 'address' },
        { name: 'orderType', type: 'uint256' },
        { name: 'totalAmt', type: 'uint256' },
        { name: 'exchange', type: 'payment' },
        { name: 'prePayment', type: 'payment' },
        { name: 'isERC721', type: 'bool' },
        { name: 'tokenAmt', type: 'uint256' },
        { name: 'refererrAmt', type: 'uint256' },
        { name: 'root', type: 'bytes32' },
        { name: 'reservedAddress', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
    ],
};


// fill bid function that takes, maker , taker , and amounts of all payments

const null_address = '0x0000000000000000000000000000000000000000';

async function main() {

    // await ethers.provider.send("evm_setNextBlockTimestamp", [1659201200])
    // await ethers.provider.send("evm_mine", [])
    const [owner, addr1, addr2, addr3] = await hre.ethers.getSigners();

    const trader = await ethers.getContractAt('GolomTrader', "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
    console.log(trader)

    const rewardDistributor = await ethers.getContractAt('RewardDistributor', "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9");
    console.log(await rewardDistributor.epoch())
    const GameItem = await hre.ethers.getContractFactory('ERC721Mock');
    var gameitem = await GameItem.deploy();

    var current = await gameitem.connect(addr1).setApprovalForAll(trader.address, true);
    await current.wait();


    var receipt = await (await gameitem.mint(addr1.address)).wait();
    var tokenid = parseInt(receipt.events[0].args[2]);

    const domain = {
        name: 'GOLOM.IO',
        version: '1',
        chainId: 31337,
        verifyingContract: trader.address
    };
    console.log(addr2.address, addr1.address);

    var totoamt = 1000000000000000;
    var deadline = Date.now() + 100000;
    const order = {
        collection: gameitem.address,
        tokenId: tokenid,
        signer: addr1.address,
        orderType: 0,
        totalAmt: totoamt,
        exchange: { paymentAmt: 100, paymentAddress: owner.address },
        prePayment: { paymentAmt: 100, paymentAddress: addr3.address },
        isERC721: true,
        tokenAmt: 1,
        refererrAmt: 10,
        root: '0x0000000000000000000000000000000000000000000000000000000000000000',
        reservedAddress: null_address,
        nonce: 0,
        deadline: deadline,
        r: '',
        s: '',
        v: 0,
    };
    console.log(order);
    var signature2 = await addr1._signTypedData(domain, types, order);
    //   console.log("21",signature2)
    console.log('sig', signature2);
    var signature = signature2.substring(2);
    order.r = '0x' + signature.substring(0, 64);
    order.s = '0x' + signature.substring(64, 128);
    order.v = parseInt(signature.substring(128, 130), 16);

    // //   console.log(order)

    console.log(order);
    console.log(addr1.address)
    console.log('signer current nonce', await trader.nonces(addr1.address));
    var postPay = 0;
    console.log(await gameitem.ownerOf(tokenid))
    //   const recoveredAddress = hre.ethers.utils.verifyTypedData(domain, types, order, signature2);
    //   console.log(recoveredAddress)
    //   // var signedMatch = ["0x30917a657ae7d1132bdca40187d781fa3b60002f",2608,"0x55ca81f5f00dee4a072f793d67296abd6b56ba0b",100000000000,[1000000,"0xcd105202276e97b531065a087cecf8f0b76ab737"],[1000000,"0xcd105202276e97b531065a087cecf8f0b76ab737"],true,1000000,20,1655555,27,"0xd3dc3475099d1f59fa88de9d0d547a6b26a5e38fb210f0bdded377e089d3eb5c","0xd3dc3475099d1f59fa88de9d0d547a6b26a5e38fb210f0bdded377e089d3eb5c"]
    var d = await trader.connect(addr2).fillAsk(order, 1, null_address, [postPay, '0x6067D233D5eA619d464a218eAf9921B9343e4d16'], {
        value: totoamt + postPay
    });

    receipt = await d.wait();
    console.log(receipt.cumulativeGasUsed);
    console.log(await gameitem.ownerOf(tokenid))

    await ethers.provider.send('evm_increaseTime', [24 * 3600]);    
    await ethers.provider.send("evm_mine", [])

    console.log(await rewardDistributor.epoch())

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
