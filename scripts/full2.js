// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat');
const types = {
    payment: [
        { name: 'paymentAmt', type: 'uint256' },
        { name: 'paymentAddress', type: 'address' }
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
        { name: 'deadline', type: 'uint256' }
    ]
};

const null_address = '0x0000000000000000000000000000000000000000';

async function createbid_and_fill(collection, trader, maker, exchange, taker, totalamt) {
    const domain = {
        name: 'GOLOM.IO',
        version: '1',
        chainId: 1,
        verifyingContract: trader.address
    };

    let deadline = Date.now() + 100000;
    let receipt = await (await collection.awardItem(maker.address)).wait();
    let tokenid = parseInt(receipt.events[0].args[2]);
    var current = await collection.connect(maker).setApprovalForAll(trader.address, true);
    await current.wait();
    const order = {
        collection: collection.address,
        tokenId: tokenid,
        signer: maker.address,
        orderType: 0,
        totalAmt: totalamt,
        exchange: { paymentAmt: 0, paymentAddress: exchange.address },
        prePayment: { paymentAmt: 0, paymentAddress: null_address },
        isERC721: true,
        tokenAmt: 1,
        refererrAmt: 0,
        root: '0x0000000000000000000000000000000000000000000000000000000000000000',
        reservedAddress: null_address,
        nonce: 1,
        deadline: deadline
    };

    // console.log(order);
    var signature2 = await maker._signTypedData(domain, types, order);
    //   console.log("21",signature2)
    //console.log('sig', signature2);
    var signature = signature2.substring(2);
    order.r = '0x' + signature.substring(0, 64);
    order.s = '0x' + signature.substring(64, 128);
    order.v = parseInt(signature.substring(128, 130), 16);

    var postPay = 0;
    var d = await trader
        .connect(taker)
        .fillAsk(order, 1, '0x0000000000000000000000000000000000000000', [postPay, '0x6067D233D5eA619d464a218eAf9921B9343e4d16'], {
            value: totalamt
        });
    // console.log('xxx');
    receipt = await d.wait();
    // console.log(receipt);
    console.log(receipt.cumulativeGasUsed);
    return receipt;
}

// 1645347600 = 20th
// async function travel

async function main() {
    const [owner, addr1, addr2, ex] = await hre.ethers.getSigners();

    let a = new Array(10);
    a = await hre.ethers.getSigners();
    console.log(a);
    // begin deploy
    const Funnel = await hre.ethers.getContractFactory('Funnel');
    const funnel = await Funnel.deploy();

    const Trader = await hre.ethers.getContractFactory('Molotrader');
    const trader = await Trader.deploy();

    await trader.deployed();
    const Ve = await hre.ethers.getContractFactory('ve');
    const ve = await Ve.deploy(funnel.address);

    const rewards_starts_at = 1645347600 + 50 * 24 * 3600;
    console.log('addr', trader.address, funnel.address);
    const rewardDistributor = await hre.ethers.getContractFactory('RewardDistributor');
    const rewarddistributor = await rewardDistributor.deploy(rewards_starts_at, trader.address, funnel.address, ve.address);
    // rewards starts at 1645347600
    console.log('current epoch', rewarddistributor.address, await rewarddistributor.epoch(), await rewarddistributor.trader());

    trader.setDistributor(rewarddistributor.address);
    funnel.setMinter(rewarddistributor.address);
    // end deployment

    //fake erc721
    const GameItem = await hre.ethers.getContractFactory('GameItem');
    var gameitem = await GameItem.deploy();

    console.log(await funnel.balanceOf(owner.address));
    let ve_underlying_amount = hre.ethers.utils.parseEther('10');
    console.log('trying with', ve_underlying_amount);
    let ve_underlying_approve_amount = hre.ethers.utils.parseUnits('10', 28);

    await funnel.approve(ve.address, ve_underlying_approve_amount);

    const lockDuration = 365 * 24 * 3600; // 1  year

    await hre.ethers.provider.send('evm_setNextBlockTimestamp', [rewards_starts_at - 1800]); // locking before epoch 1 begins
    await hre.ethers.provider.send('evm_mine');

    let re = await ve.create_lock(ve_underlying_amount, lockDuration);
    re = await ve.create_lock(ve_underlying_amount, lockDuration * 2);

    await hre.ethers.provider.send('evm_setNextBlockTimestamp', [rewards_starts_at + 5]); //rewards started
    await hre.ethers.provider.send('evm_mine');

    await createbid_and_fill(gameitem, trader, addr1, addr2, ex, hre.ethers.utils.parseEther('5'));
    await createbid_and_fill(gameitem, trader, addr1, addr2, ex, hre.ethers.utils.parseEther('14'));
    await createbid_and_fill(gameitem, trader, addr2, addr1, ex, hre.ethers.utils.parseEther('20'));

    re = await ve.create_lock(ve_underlying_amount, lockDuration * 2);

    await hre.ethers.provider.send('evm_setNextBlockTimestamp', [rewards_starts_at + 5 + 24 * 3600]); //rewards started + 1 day
    await hre.ethers.provider.send('evm_mine');
    await createbid_and_fill(gameitem, trader, addr1, addr2, ex, hre.ethers.utils.parseEther('5'));
    await createbid_and_fill(gameitem, trader, addr1, addr2, ex, hre.ethers.utils.parseEther('14'));
    await createbid_and_fill(gameitem, trader, addr2, addr1, ex, hre.ethers.utils.parseEther('20'));

    await hre.ethers.provider.send('evm_setNextBlockTimestamp', [rewards_starts_at + 5 + 24 * 3600 * 2]); //rewards started + 2 day
    await hre.ethers.provider.send('evm_mine');
    await hre.ethers.provider.send('evm_mine');
    await hre.ethers.provider.send('evm_mine');
    await hre.ethers.provider.send('evm_mine');
    await hre.ethers.provider.send('evm_mine');
    await hre.ethers.provider.send('evm_mine');
    await createbid_and_fill(gameitem, trader, addr1, addr2, ex, hre.ethers.utils.parseEther('5'));

    console.log('dd');
    console.log('here', rewards_starts_at + 5 + 24 * 3600 * 2);
    console.log(await ve.totalSupplyAtT(rewards_starts_at + 5 + 24 * 3600 * 2));

    console.log('b');
    await rewarddistributor.multiStakerClaim([1], [1]);
    console.log('dd2');

    await rewarddistributor.multiStakerClaim([2], [1]);
    console.log('dd3');
    // await rewarddistributor.multiStakerClaim([3], [1]);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
