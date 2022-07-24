// for all order types test
// if cancel by order is working and only the creater can cancel nobody else can cancel
// if cancel by nonce is working and only the creater can cancel nobody else can cancel
// fill by amount is working, multiple address can fill, upto the specified amount and not more then that
// orders with reserved address set, only the reserved address can fill those orders
// for criteria orders test if tokenids that match criteria only can fill and of the specified collections can fill
const { expect } = require('chai');
const { ethers } = require('hardhat');

async function createbid_and_fill(collection, trader, maker, exchange, taker, totalamt, order = null) {
    const domain = {
        name: 'GOLOM.IO',
        version: '1',
        chainId: 1,
        verifyingContract: trader.address,
    };

    let deadline = Date.now() + 100000;
    let receipt = await (await collection.awardItem(maker.address)).wait();
    let tokenid = parseInt(receipt.events[0].args[2]);
    var current = await collection.connect(maker).setApprovalForAll(trader.address, true);
    await current.wait();
    if (order == null) {
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
            nonce: 0,
            deadline: deadline,
        };
    }

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
        .fillAsk(
            order,
            1,
            '0x0000000000000000000000000000000000000000',
            [postPay, '0x6067D233D5eA619d464a218eAf9921B9343e4d16'],
            {
                value: totalamt,
            }
        );
    // console.log('xxx');
    receipt = await d.wait();
    // console.log(receipt);
    console.log(receipt.cumulativeGasUsed);
    return receipt;
}

describe('trader', function () {
    let a = new Array(10);

    let funnel;
    let trader;
    let ve;
    let gameitem;
    let gameitems;
    let rewards_starts_at;
    let rewarddistributor;
    let domain = {};

    let maker = a[0];
    let taker = a[1];
    let exchange = a[2];
    let prepay = a[3];
    let postpay = a[4];
    let totalamt = ethers.utils.parseEther('5');
    let deadline = Date.now() + 100000;
    let exchangeamt = ethers.utils.parseEther('1.123');
    let prepaymentamt = ethers.utils.parseEther('0.123');
    let postPayamt = ethers.utils.parseEther('1.002345');
    let tokenid;
    let tokenid1155;
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

    const null_address = '0x0000000000000000000000000000000000000000';

    beforeEach(async function () {
        a = await hre.ethers.getSigners();
        maker = a[0];
        taker = a[1];
        exchange = a[2];
        prepay = a[3];
        postpay = a[4];

        // begin deploy
        const Funnel = await hre.ethers.getContractFactory('Funnel');
        funnel = await Funnel.deploy();

        const Trader = await hre.ethers.getContractFactory('Molotrader');
        trader = await Trader.deploy();

        await trader.deployed();
        const Ve = await hre.ethers.getContractFactory('ve');
        ve = await Ve.deploy(funnel.address);

        rewards_starts_at = 1645347600 + 50 * 24 * 3600;
        // console.log('addr', trader.address, funnel.address);
        const rewardDistributor = await hre.ethers.getContractFactory('RewardDistributor');
        rewarddistributor = await rewardDistributor.deploy(
            rewards_starts_at,
            trader.address,
            funnel.address,
            ve.address
        );
        // rewards starts at 1645347600
        // console.log('current epoch', rewarddistributor.address, await rewarddistributor.epoch(), await rewarddistributor.trader());

        trader.setDistributor(rewarddistributor.address);
        funnel.setMinter(rewarddistributor.address);
        // end deployment

        //fake erc721
        const GameItem = await hre.ethers.getContractFactory('GameItem');
        gameitem = await GameItem.deploy();

        //fake erc721
        let GameItems = await hre.ethers.getContractFactory('GameItems');
        gameitems = await GameItems.deploy();

        let receipt = await (await gameitem.awardItem(maker.address)).wait();
        tokenid = parseInt(receipt.events[0].args[2]);

        receipt = await (await gameitems.awardItem(maker.address)).wait();
        tokenid1155 = 0;
        var current = await gameitem.connect(maker).setApprovalForAll(trader.address, true);
        await current.wait();

        current = await gameitems.connect(maker).setApprovalForAll(trader.address, true);
        await current.wait();

        domain = {
            name: 'GOLOM.IO',
            version: '1',
            chainId: 1,
            verifyingContract: trader.address,
        };
    });

    it('order type 0 works and payments are sent to intended', async function () {
        const order = {
            collection: gameitem.address,
            tokenId: tokenid,
            signer: maker.address,
            orderType: 0,
            totalAmt: totalamt,
            exchange: { paymentAmt: exchangeamt, paymentAddress: exchange.address },
            prePayment: { paymentAmt: prepaymentamt, paymentAddress: prepay.address },
            isERC721: true,
            tokenAmt: 1,
            refererrAmt: 0,
            root: '0x0000000000000000000000000000000000000000000000000000000000000000',
            reservedAddress: null_address,
            nonce: 0,
            deadline: deadline,
        };
        //console.log(order);

        var signature2 = await maker._signTypedData(domain, types, order);
        var signature = signature2.substring(2);
        order.r = '0x' + signature.substring(0, 64);
        order.s = '0x' + signature.substring(64, 128);
        order.v = parseInt(signature.substring(128, 130), 16);
        let maker_pre = await ethers.provider.getBalance(maker.address);
        let taker_pre = await ethers.provider.getBalance(taker.address);
        let exchange_pre = await ethers.provider.getBalance(exchange.address);
        let prepay_pre = await ethers.provider.getBalance(prepay.address);
        let postpay_pre = await ethers.provider.getBalance(postpay.address);
        // console.log(await trader.validateOrder(order));

        var d = await trader
            .connect(taker)
            .fillAsk(order, 1, '0x0000000000000000000000000000000000000000', [postPayamt, postpay.address], {
                value: totalamt.add(postPayamt),
            });
        var receipt = await d.wait();
        // console.log(receipt);
        console.log(receipt.cumulativeGasUsed);
        // console.log(await trader.validateOrder(order));

        let tx_fees = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);
        let trade_fees = totalamt.mul(new ethers.BigNumber.from('5')).div(new ethers.BigNumber.from('1000'));
        // check signer gets intentded amount
        let maker_intented_amount = totalamt.sub(exchangeamt).sub(prepaymentamt).sub(trade_fees);
        // .sub(0.5 * totalamt);
        expect(await ethers.provider.getBalance(maker.address)).to.equal(maker_pre.add(maker_intented_amount));
        // check taker subtract intented amount
        expect(await ethers.provider.getBalance(taker.address)).to.equal(
            taker_pre.sub(tx_fees).sub(totalamt).sub(postPayamt),
            new ethers.BigNumber.from('5').div(new ethers.BigNumber.from('100000000'))
        );
        // check exchange gets intented amount
        expect(await ethers.provider.getBalance(exchange.address)).to.equal(exchange_pre.add(exchangeamt));
        // check prepay gets intented amount
        expect(await ethers.provider.getBalance(prepay.address)).to.equal(prepay_pre.add(prepaymentamt));
        // check postpay gets intented amount
        expect(await ethers.provider.getBalance(postpay.address)).to.equal(postpay_pre.add(postPayamt));
        // check nft is transferred
        expect(await gameitem.ownerOf(tokenid)).to.equal(taker.address);
    });

    it('order type 0, cancel check', async function () {
        const order = {
            collection: gameitem.address,
            tokenId: tokenid,
            signer: maker.address,
            orderType: 0,
            totalAmt: totalamt,
            exchange: { paymentAmt: exchangeamt, paymentAddress: exchange.address },
            prePayment: { paymentAmt: prepaymentamt, paymentAddress: prepay.address },
            isERC721: true,
            tokenAmt: 1,
            refererrAmt: 0,
            root: '0x0000000000000000000000000000000000000000000000000000000000000000',
            reservedAddress: null_address,
            nonce: 0,
            deadline: deadline,
        };

        var signature2 = await maker._signTypedData(domain, types, order);
        var signature = signature2.substring(2);
        order.r = '0x' + signature.substring(0, 64);
        order.s = '0x' + signature.substring(64, 128);
        order.v = parseInt(signature.substring(128, 130), 16);
        //check if filling transaction if doesnt fail
        var txdata = await trader
            .connect(taker)
            .populateTransaction.fillAsk(
                order,
                1,
                '0x0000000000000000000000000000000000000000',
                [postPayamt, postpay.address],
                {
                    value: totalamt.add(postPayamt),
                }
            );
        var g = await taker.estimateGas(txdata);
        // cancel it from another account to be revered
        await expect(trader.connect(taker).cancelOrder(order)).to.be.reverted;
        await expect(trader.connect(exchange).cancelOrder(order)).to.be.reverted;
        // // check status is 3
        // // cancel from signer account
        await trader.connect(maker).cancelOrder(order);
        var [status, ,] = await trader.validateOrder(order);
        console.log(status);
        expect(status).to.equal(new ethers.BigNumber.from('2'));
        await expect(
            trader
                .connect(taker)
                .fillAsk(order, 1, '0x0000000000000000000000000000000000000000', [postPayamt, postpay.address], {
                    value: totalamt.add(postPayamt),
                })
        ).to.be.reverted;
        // check if tx now reverts
        // check status is now 2
    });

    it('order type 0 cancel by nonce', async function () {
        const order = {
            collection: gameitem.address,
            tokenId: tokenid,
            signer: maker.address,
            orderType: 0,
            totalAmt: totalamt,
            exchange: { paymentAmt: exchangeamt, paymentAddress: exchange.address },
            prePayment: { paymentAmt: prepaymentamt, paymentAddress: prepay.address },
            isERC721: true,
            tokenAmt: 1,
            refererrAmt: 0,
            root: '0x0000000000000000000000000000000000000000000000000000000000000000',
            reservedAddress: null_address,
            nonce: 0,
            deadline: deadline,
        };

        var signature2 = await maker._signTypedData(domain, types, order);
        var signature = signature2.substring(2);
        order.r = '0x' + signature.substring(0, 64);
        order.s = '0x' + signature.substring(64, 128);
        order.v = parseInt(signature.substring(128, 130), 16);
        var txdata = await trader
            .connect(taker)
            .populateTransaction.fillAsk(
                order,
                1,
                '0x0000000000000000000000000000000000000000',
                [postPayamt, postpay.address],
                {
                    value: totalamt.add(postPayamt),
                }
            );
        var g = await taker.estimateGas(txdata);
        // cancel it from another account to be revered
        await expect(trader.connect(taker).cancelOrder(order)).to.be.reverted;
        await expect(trader.connect(exchange).cancelOrder(order)).to.be.reverted;
        // // check status is 3
        // // cancel from signer account
        var [status, ,] = await trader.validateOrder(order);
        expect(status).to.equal(new ethers.BigNumber.from('3'));

        await trader.connect(maker).incrementNonce();
        [status, ,] = await trader.validateOrder(order);
        expect(status).to.equal(new ethers.BigNumber.from('2'));
        await expect(
            trader
                .connect(taker)
                .fillAsk(order, 1, '0x0000000000000000000000000000000000000000', [postPayamt, postpay.address], {
                    value: totalamt.add(postPayamt),
                })
        ).to.be.reverted;
        // check if tx now reverts
    });
    it('order type 0 multiple erc1155 fills', async function () {
        const order = {
            collection: gameitems.address,
            tokenId: tokenid,
            signer: maker.address,
            orderType: 0,
            totalAmt: totalamt,
            exchange: { paymentAmt: exchangeamt, paymentAddress: exchange.address },
            prePayment: { paymentAmt: prepaymentamt, paymentAddress: prepay.address },
            isERC721: false,
            tokenAmt: 10,
            refererrAmt: 0,
            root: '0x0000000000000000000000000000000000000000000000000000000000000000',
            reservedAddress: null_address,
            nonce: 0,
            deadline: deadline,
        };
        //console.log(order);

        var signature2 = await maker._signTypedData(domain, types, order);
        var signature = signature2.substring(2);
        order.r = '0x' + signature.substring(0, 64);
        order.s = '0x' + signature.substring(64, 128);
        order.v = parseInt(signature.substring(128, 130), 16);
        let maker_pre = await ethers.provider.getBalance(maker.address);
        let taker_pre = await ethers.provider.getBalance(taker.address);
        let exchange_pre = await ethers.provider.getBalance(exchange.address);
        let prepay_pre = await ethers.provider.getBalance(prepay.address);
        let postpay_pre = await ethers.provider.getBalance(postpay.address);
        // console.log(await trader.validateOrder(order));

        await trader
            .connect(taker)
            .fillAsk(order, 1, '0x0000000000000000000000000000000000000000', [postPayamt, postpay.address], {
                value: totalamt.add(postPayamt),
            });

        await trader
            .connect(taker)
            .fillAsk(order, 5, '0x0000000000000000000000000000000000000000', [postPayamt, postpay.address], {
                value: totalamt.mul(new ethers.BigNumber.from('5')).add(postPayamt),
            });
        await expect(
            trader
                .connect(taker)
                .fillAsk(order, 5, '0x0000000000000000000000000000000000000000', [postPayamt, postpay.address], {
                    value: totalamt.mul(new ethers.BigNumber.from('5')).add(postPayamt),
                })
        ).to.be.reverted;

        await expect(
            trader
                .connect(taker)
                .fillAsk(order, 5, '0x0000000000000000000000000000000000000000', [postPayamt, postpay.address], {
                    value: totalamt.mul(new ethers.BigNumber.from('5')).add(postPayamt),
                })
        ).to.be.reverted;

        await trader
            .connect(taker)
            .fillAsk(order, 4, '0x0000000000000000000000000000000000000000', [postPayamt, postpay.address], {
                value: totalamt.mul(new ethers.BigNumber.from('4')).add(postPayamt),
            });
    });

    it('order type 0 order amount can be reduced', async function () {
        // const ERC721_FAKE = 0x780e9d61;
        // expect(await ve.supportsInterface(ERC721_FAKE)).to.be.false;
    });

    it('order type 0 not fillable after deadline', async function () {
        // const ERC721_FAKE = 0x780e9d61;
        // expect(await ve.supportsInterface(ERC721_FAKE)).to.be.false;
    });

    it('order type 3 not fillable after deadline', async function () {
        // const ERC721_FAKE = 0x780e9d61;
        // expect(await ve.supportsInterface(ERC721_FAKE)).to.be.false;
    });
});
