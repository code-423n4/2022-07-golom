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

function percentage(array) {
    var sum = 0;
    for (var i = 0; i < array.length; i++) {
        sum = sum + parseInt(array[i]);
    }
    for (i = 0; i < array.length; i++) {
        array[i] = parseInt(array[i]) / sum;
    }
    return array;
}

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
    console.log(await ve.locked(1), await ve.locked(2));

    console.log('funnel token in distributor', await funnel.balanceOf(rewarddistributor.address)); //
    console.log('funnel token in Ve', await funnel.balanceOf(ve.address)); //

    // begin
    // await hre.ethers.provider.send('evm_setNextBlockTimestamp', [rewards_starts_at + 5]); // rewards starts
    // await hre.ethers.provider.send('evm_mine');

    // let b = await createbid_and_fill(gameitem, trader, addr1, addr2, ex, hre.ethers.utils.parseEther('1'));
    // console.log(rewarddistributor.address, b);
    // console.log('funnel token in distributor', await funnel.balanceOf(rewarddistributor.address)); //
    // console.log('funnel token in Ve', await funnel.balanceOf(ve.address)); //

    // await createbid_and_fill(gameitem, trader, addr1, addr2, ex, hre.ethers.utils.parseEther('5'));
    // await createbid_and_fill(gameitem, trader, addr1, addr2, ex, hre.ethers.utils.parseEther('14'));
    // await createbid_and_fill(gameitem, trader, addr2, addr1, ex, hre.ethers.utils.parseEther('20'));
    // // let prov = hre.ethers.getDefaultProvider();
    // // console.log('eth in distributor', await prov.getBalance(rewardDistributor.address)); //

    // await hre.ethers.provider.send('evm_setNextBlockTimestamp', [rewards_starts_at + 5 + 24 * 3600]); // next day
    // await hre.ethers.provider.send('evm_mine');

    // await createbid_and_fill(gameitem, trader, addr1, addr2, ex, hre.ethers.utils.parseEther('0.001'));
    // console.log('funnel token in distributor', await funnel.balanceOf(rewarddistributor.address)); //

    // await createbid_and_fill(gameitem, trader, addr1, addr2, ex, hre.ethers.utils.parseEther('0.001'));

    // // await rewarddistributor.multiStakerClaim(1, 1, 1);
    // // await rewarddistributor.multiStakerClaim(2, 1, 1);

    // await rewarddistributor.multiStakerClaim([1], [1]);
    // await rewarddistributor.multiStakerClaim([2], [1]);

    // await hre.ethers.provider.send('evm_setNextBlockTimestamp', [rewards_starts_at + 5 + 24 * 3600 * 2]); // next day
    // await hre.ethers.provider.send('evm_mine');
    // await createbid_and_fill(gameitem, trader, addr1, addr2, ex, hre.ethers.utils.parseEther('0.001'));

    // re = await ve.create_lock(ve_underlying_amount, lockDuration);
    // // re = await ve.create_lock(ve_underlying_amount, lockDuration * 2);
    // // re = await ve.create_lock(ve_underlying_amount, lockDuration * 3);
    // // re = await ve.create_lock(ve_underlying_amount, lockDuration * 4);
    // await rewarddistributor.multiStakerClaim([1], [2]);
    // await rewarddistributor.multiStakerClaim([2], [2]);

    // // let d = await ve.locked(1);
    // // console.log(d[1] - 1645347605);
    // // console.log('bal', await ve.balanceOfNFT(1));
    // // d = await ve.locked(2);
    // // console.log(d[1] - 1645347605);
    // // console.log('bal', await ve.balanceOfNFT(2));
    // // d = await ve.locked(3);
    // // console.log(d[1] - 1645347605);
    // // console.log('bal', await ve.balanceOfNFT(3));

    // // // console.log('bal', await ve.balanceOfNFT(1));

    // // ve.increase_amount(1, ve_underlying_amount);

    // // console.log('bal', await ve.balanceOfNFT(1));

    // await hre.ethers.provider.send('evm_setNextBlockTimestamp', [rewards_starts_at + 5 + 3 * 24 * 3600]);
    // await hre.ethers.provider.send('evm_mine');
    // let balance = [await ve.balanceOfNFT(1), await ve.balanceOfNFT(2), await ve.balanceOfNFT(3)];
    // console.log(balance);
    // let balance_percent = percentage(balance);
    // console.log(balance_percent);

    // await createbid_and_fill(gameitem, trader, addr1, addr2, ex, hre.ethers.utils.parseEther('5'));

    // await rewarddistributor.multiStakerClaim([1], [3]);
    // await rewarddistributor.multiStakerClaim([2], [3]);
    // await rewarddistributor.multiStakerClaim([3], [3]);

    // await hre.ethers.provider.send('evm_setNextBlockTimestamp', [rewards_starts_at + 5 + 4 * 24 * 3600]);
    // await hre.ethers.provider.send('evm_mine');
    // await createbid_and_fill(gameitem, trader, addr1, addr2, ex, hre.ethers.utils.parseEther('5'));

    // let token = [];
    // let weth = [];

    // // await rewarddistributor.multiStakerClaim([1], [4]);
    // // await rewarddistributor.multiStakerClaim([2], [4]);
    // let receipt = await (await rewarddistributor.multiStakerClaim([1], [4])).wait();
    // token[0] = parseInt(receipt.events[0].data);
    // weth[0] = parseInt(receipt.events[1].data);

    // receipt = await (await rewarddistributor.multiStakerClaim([2], [4])).wait();
    // token[1] = parseInt(receipt.events[0].data);
    // weth[1] = parseInt(receipt.events[1].data);

    // receipt = await (await rewarddistributor.multiStakerClaim([3], [4])).wait();
    // token[2] = parseInt(receipt.events[0].data);
    // weth[2] = parseInt(receipt.events[1].data);

    // console.log(balance, token, weth);
    // console.log(percentage(token));
    // console.log(percentage(weth));

    //end

    // re = await ve.create_lock(ve_underlying_amount, lockDuration * 3);
    // await createbid_and_fill(gameitem, trader, addr1, addr2, ex, hre.ethers.utils.parseEther('0.5'));
    // await createbid_and_fill(gameitem, trader, addr1, addr2, ex, hre.ethers.utils.parseEther('1.4'));
    // await createbid_and_fill(gameitem, trader, addr2, addr1, ex, hre.ethers.utils.parseEther('2.0'));

    // re = await ve.create_lock(ve_underlying_amount, lockDuration * 3);

    // await hre.ethers.provider.send('evm_setNextBlockTimestamp', [1645347600 + 5 * 24 * 3600]);
    // await hre.ethers.provider.send('evm_mine');

    // console.log('bal', await ve.balanceOfNFT(1));

    // function increase_amount

    // console.log('bal', await ve.balanceOfNFT(2));
    // console.log('bal', await ve.balanceOfNFT(3));
    // console.log('bal', await ve.balanceOfNFT(4));

    // await hre.ethers.provider.send('evm_setNextBlockTimestamp', [1645347605]);
    // await hre.ethers.provider.send('evm_mine');

    // // Balance should be zero before and 1 after creating the lock

    // let re = await ve.create_lock(ve_underlying_amount, lockDuration * 2);
    // console.log('xxxx');
    // //console.log(await re.wait());
    // console.log(await funnel.balanceOf(owner.address));

    // // await ve.checkpoint();
    // re = await ve.create_lock(ve_underlying_amount, lockDuration);
    // //console.log(await re.wait());

    // console.log('owner', await ve.ownerOf(1));
    // console.log(await ve.balanceOf(owner.address));

    // console.log(await ve.locked(1));
    // console.log(await ve.balanceOfNFT(1));
    // console.log(await ve.tokenURI(1));
    // console.log(await ve.locked(2));
    // console.log(await ve.balanceOfNFT(2));

    // console.log(await ve.user_point_history(1, 1));
    // console.log(await ve.user_point_history(2, 1));

    // // await hre.ethers.provider.send('evm_setNextBlockTimestamp', [1645347605 + 3 * 24 * 3600]);
    // await hre.ethers.provider.send('evm_mine');
    // await hre.ethers.provider.send('evm_mine');
    // await hre.ethers.provider.send('evm_mine');

    // console.log(await ve.locked(1));
    // console.log(await ve.balanceOfNFT(1));
    // console.log(await ve.locked(2));
    // console.log(await ve.balanceOfNFT(2));
    // console.log(await ve.user_point_history(1, 1));
    // console.log(await ve.user_point_history(2, 1));

    // lock tokens before epoch 1
    // do same amt of trade everyday for 100 days
    // calculate gas fees to claim reward for each epoch and amt of rewards

    let balance = [];
    let receipt;
    let token = [];
    let weth = [];
    for (let index = 0; index < 300; index++) {
        console.log('index', index);
        await hre.ethers.provider.send('evm_setNextBlockTimestamp', [rewards_starts_at + 5 + index * 24 * 3600]); // epoch index+1
        await hre.ethers.provider.send('evm_mine');

        await createbid_and_fill(gameitem, trader, addr1, addr2, ex, hre.ethers.utils.parseEther('0.5'));
        await createbid_and_fill(gameitem, trader, addr1, addr2, ex, hre.ethers.utils.parseEther('1.4'));
        await createbid_and_fill(gameitem, trader, addr2, addr1, ex, hre.ethers.utils.parseEther('2.0'));

        // if (index % 10 == 5) {
        //     let d = await ve.checkpoint();
        //     let receipt = await d.wait();
        //     // console.log(receipt);
        //     console.log('chkp', receipt.cumulativeGasUsed);
        // }

        //        const element = array[index];
        console.log((await funnel.totalSupply()) / 10 ** 18);
        if (index > 1) {
            receipt = await (await rewarddistributor.multiStakerClaim([1], [index - 1])).wait();
            token[0] = parseInt(receipt.events[0].data);
            weth[0] = parseInt(receipt.events[1].data);
            console.log(receipt.cumulativeGasUsed);

            receipt = await (await rewarddistributor.multiStakerClaim([2], [index - 1])).wait();
            token[1] = parseInt(receipt.events[0].data);
            weth[1] = parseInt(receipt.events[1].data);
            console.log(receipt.cumulativeGasUsed);

            if (index == 10) {
                re = await ve.create_lock(ve_underlying_amount, lockDuration * 2);
            }
            // if (index % 10 == 0) {
            //     let d = await ve.checkpoint();
            //     let receipt = await d.wait();
            //     // console.log(receipt);
            //     console.log('chkp', receipt.cumulativeGasUsed);
            // }
            if (index > 10) {
                balance = [await ve.balanceOfNFT(1), await ve.balanceOfNFT(2), await ve.balanceOfNFT(3)];
                console.log('bal', percentage(balance));
                receipt = await (await rewarddistributor.multiStakerClaim([3], [index - 1])).wait();
                token[2] = parseInt(receipt.events[0].data);
                weth[2] = parseInt(receipt.events[1].data);
                console.log(receipt.cumulativeGasUsed);
                console.log('token', percentage(token));
                console.log('weth', percentage(weth));
            }
        }
    }

    // for (let index = 1; index < 1000; index++) {
    //     let d = await rewarddistributor.multiStakerClaim([1], [index]);
    //     let receipt = await d.wait();
    //     // console.log(receipt);
    //     console.log(receipt.cumulativeGasUsed);

    //     d = await rewarddistributor.multiStakerClaim([2], [index]);
    //     receipt = await d.wait();
    //     // console.log(receipt);
    //     console.log(receipt.cumulativeGasUsed);

    //     // await createbid_and_fill(gameitem, trader, addr1, addr2, ex, hre.ethers.utils.parseEther('5'));
    //     // await createbid_and_fill(gameitem, trader, addr1, addr2, ex, hre.ethers.utils.parseEther('14'));
    //     // await createbid_and_fill(gameitem, trader, addr2, addr1, ex, hre.ethers.utils.parseEther('20'));

    //     //        const element = array[index];
    // }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
