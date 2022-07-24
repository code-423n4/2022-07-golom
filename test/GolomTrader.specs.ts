// for all order types test
// if cancel by order is working and only the creater can cancel nobody else can cancel
// if cancel by nonce is working and only the creater can cancel nobody else can cancel
// fill by amount is working, multiple address can fill, upto the specified amount and not more then that
// orders with reserved address set, only the reserved address can fill those orders
// for criteria orders test if tokenids that match criteria only can fill and of the specified collections can fill

import { ethers, waffle } from 'hardhat';
import { BigNumber, utils, Signer, constants } from 'ethers';
import chai from 'chai';
const { expect } = chai;

// import artifacts
const GolomTraderArtifacts = ethers.getContractFactory('GolomTrader');
const RewardDistributorArtifacts = ethers.getContractFactory('RewardDistributor');
const VoteEscrowArtifacts = ethers.getContractFactory('VoteEscrow');

const ERC721MockArtifacts = ethers.getContractFactory('ERC721Mock');
const ERC1155MockArtifacts = ethers.getContractFactory('ERC1155Mock');
const ERC20MockArtifacts = ethers.getContractFactory('ERC20Mock');

// import typings
import { GolomTrader as GolomTraderTypes } from '../typechain/GolomTrader';
import { RewardDistributor as RewardDistributorTypes } from '../typechain/RewardDistributor';
import { VoteEscrow as VoteEscrowTypes } from '../typechain/VoteEscrow';

import { ERC721Mock as ERC721MockTypes } from '../typechain/ERC721Mock';
import { ERC1155Mock as ERC1155MockTypes } from '../typechain/ERC1155Mock';
import { ERC20Mock as ERC20MockTypes } from '../typechain/ERC20Mock';

let testErc20: ERC20MockTypes;
let testErc721: ERC721MockTypes;
let testErc1155: ERC1155MockTypes;

let golomTrader: GolomTraderTypes;
let voteEscrow: VoteEscrowTypes;
let rewardDistributor: RewardDistributorTypes;

let accounts: Signer[];
let governance: Signer;
let maker: any;
let taker: any;
let exchange: any;
let prepay: any;
let postpay: any;

let domain: any;

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

describe('Trader.sol', function () {
    beforeEach(async function () {
        accounts = await ethers.getSigners();
        maker = accounts[0];
        taker = accounts[1];
        exchange = accounts[2];
        prepay = accounts[3];
        postpay = accounts[4];
        governance = accounts[5];

        testErc20 = (await (await ERC20MockArtifacts).deploy()) as ERC20MockTypes;
        testErc721 = (await (await ERC721MockArtifacts).deploy()) as ERC721MockTypes;
        testErc1155 = (await (await ERC1155MockArtifacts).deploy()) as ERC1155MockTypes;

        // deploy trader contract
        golomTrader = (await (await GolomTraderArtifacts).deploy(await governance.getAddress())) as GolomTraderTypes;
        voteEscrow = (await (await VoteEscrowArtifacts).deploy()) as VoteEscrowTypes;
        rewardDistributor = (await (
            await RewardDistributorArtifacts
        ).deploy(
            Date.now(),
            golomTrader.address,
            testErc20.address,
            voteEscrow.address,
            await governance.getAddress()
        )) as RewardDistributorTypes;

        domain = {
            name: 'GOLOM.IO',
            version: '1',
            chainId: 1,
            verifyingContract: golomTrader.address,
        };

        // set distributor
        await golomTrader.connect(governance).setDistributor(rewardDistributor.address);
        // await golomTrader.connect(governance).executeSetDistributor();

        await testErc721.mint(await maker.getAddress());
        await testErc721.connect(maker).setApprovalForAll(golomTrader.address, true);
        await testErc1155.connect(maker).setApprovalForAll(golomTrader.address, true);
    });

    describe('#constructor', () => {
        it('should set governance', async () => {
            expect(await golomTrader.owner()).to.be.equals(await governance.getAddress());
        });
    });

    describe('#fillAsk', () => {
        it('should revert if signed total amount is less than values', async () => {
            let exchangeAmount = ethers.utils.parseEther('1'); // cut for the exchanges
            let prePaymentAmt = ethers.utils.parseEther('0.25'); // royalty cut
            let totalAmt = ethers.utils.parseEther('1');
            let tokenId = await testErc721.current();

            const order = {
                collection: testErc721.address,
                tokenId: tokenId,
                signer: await maker.getAddress(),
                orderType: 0,
                totalAmt: totalAmt,
                exchange: { paymentAmt: exchangeAmount, paymentAddress: await exchange.getAddress() },
                prePayment: { paymentAmt: prePaymentAmt, paymentAddress: await prepay.getAddress() },
                isERC721: true,
                tokenAmt: 1,
                refererrAmt: 0,
                root: '0x0000000000000000000000000000000000000000000000000000000000000000',
                reservedAddress: constants.AddressZero,
                nonce: 0,
                deadline: Date.now() + 100000,
                r: '',
                s: '',
                v: 0,
            };

            let signature = (await maker._signTypedData(domain, types, order)).substring(2);

            order.r = '0x' + signature.substring(0, 64);
            order.s = '0x' + signature.substring(64, 128);
            order.v = parseInt(signature.substring(128, 130), 16);

            await expect(
                golomTrader.connect(taker).fillAsk(
                    order,
                    1,
                    '0x0000000000000000000000000000000000000000',
                    {
                        paymentAmt: prePaymentAmt,
                        paymentAddress: await governance.getAddress(),
                    },
                    {
                        value: utils.parseEther('15'),
                    }
                )
            ).to.be.revertedWith('amt not matching');
        });

        it('should revert if msg.value is less than signed amounts', async () => {
            let exchangeAmount = ethers.utils.parseEther('1'); // cut for the exchanges
            let prePaymentAmt = ethers.utils.parseEther('0.25'); // royalty cut
            let totalAmt = ethers.utils.parseEther('10');
            let tokenId = await testErc721.current();

            const order = {
                collection: testErc721.address,
                tokenId: tokenId,
                signer: await maker.getAddress(),
                orderType: 0,
                totalAmt: totalAmt,
                exchange: { paymentAmt: exchangeAmount, paymentAddress: await exchange.getAddress() },
                prePayment: { paymentAmt: prePaymentAmt, paymentAddress: await prepay.getAddress() },
                isERC721: true,
                tokenAmt: 1,
                refererrAmt: 0,
                root: '0x0000000000000000000000000000000000000000000000000000000000000000',
                reservedAddress: constants.AddressZero,
                nonce: 0,
                deadline: Date.now() + 100000,
                r: '',
                s: '',
                v: 0,
            };

            let signature = (await maker._signTypedData(domain, types, order)).substring(2);

            order.r = '0x' + signature.substring(0, 64);
            order.s = '0x' + signature.substring(64, 128);
            order.v = parseInt(signature.substring(128, 130), 16);

            await expect(
                golomTrader.connect(taker).fillAsk(
                    order,
                    1,
                    '0x0000000000000000000000000000000000000000',
                    {
                        paymentAmt: prePaymentAmt,
                        paymentAddress: await governance.getAddress(),
                    },
                    {
                        value: utils.parseEther('10'),
                    }
                )
            ).to.be.revertedWith('mgmtm');
        });

        it('should revert if orderType is not 0', async () => {
            let exchangeAmount = ethers.utils.parseEther('1'); // cut for the exchanges
            let prePaymentAmt = ethers.utils.parseEther('0.25'); // royalty cut
            let totalAmt = ethers.utils.parseEther('10');
            let tokenId = await testErc721.current();

            const order = {
                collection: testErc721.address,
                tokenId: tokenId,
                signer: await maker.getAddress(),
                orderType: 1,
                totalAmt: totalAmt,
                exchange: { paymentAmt: exchangeAmount, paymentAddress: await exchange.getAddress() },
                prePayment: { paymentAmt: prePaymentAmt, paymentAddress: await prepay.getAddress() },
                isERC721: true,
                tokenAmt: 1,
                refererrAmt: 0,
                root: '0x0000000000000000000000000000000000000000000000000000000000000000',
                reservedAddress: constants.AddressZero,
                nonce: 0,
                deadline: Date.now() + 100000,
                r: '',
                s: '',
                v: 0,
            };

            let signature = (await maker._signTypedData(domain, types, order)).substring(2);

            order.r = '0x' + signature.substring(0, 64);
            order.s = '0x' + signature.substring(64, 128);
            order.v = parseInt(signature.substring(128, 130), 16);

            await expect(
                golomTrader.connect(taker).fillAsk(
                    order,
                    1,
                    '0x0000000000000000000000000000000000000000',
                    {
                        paymentAmt: prePaymentAmt,
                        paymentAddress: await governance.getAddress(),
                    },
                    {
                        value: utils.parseEther('10.25'),
                    }
                )
            ).to.be.revertedWith('invalid orderType');
        });

        it('should revert if order status is not equal to 3', async () => {
            let exchangeAmount = ethers.utils.parseEther('1'); // cut for the exchanges
            let prePaymentAmt = ethers.utils.parseEther('0.25'); // royalty cut
            let totalAmt = ethers.utils.parseEther('10');
            let tokenId = await testErc721.current();

            const order = {
                collection: testErc721.address,
                tokenId: tokenId,
                signer: await maker.getAddress(),
                orderType: 0,
                totalAmt: totalAmt,
                exchange: { paymentAmt: exchangeAmount, paymentAddress: await exchange.getAddress() },
                prePayment: { paymentAmt: prePaymentAmt, paymentAddress: await prepay.getAddress() },
                isERC721: true,
                tokenAmt: 1,
                refererrAmt: 0,
                root: '0x0000000000000000000000000000000000000000000000000000000000000000',
                reservedAddress: constants.AddressZero,
                nonce: 0,
                deadline: (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp,
                r: '',
                s: '',
                v: 0,
            };

            let signature = (await maker._signTypedData(domain, types, order)).substring(2);

            order.r = '0x' + signature.substring(0, 64);
            order.s = '0x' + signature.substring(64, 128);
            order.v = parseInt(signature.substring(128, 130), 16);

            await expect(
                golomTrader.connect(taker).fillAsk(
                    order,
                    1,
                    '0x0000000000000000000000000000000000000000',
                    {
                        paymentAmt: prePaymentAmt,
                        paymentAddress: await governance.getAddress(),
                    },
                    {
                        value: utils.parseEther('10.25'),
                    }
                )
            ).to.be.revertedWith('order not valid');
        });

        it('should update the filled mapping', async () => {
            let exchangeAmount = ethers.utils.parseEther('1'); // cut for the exchanges
            let prePaymentAmt = ethers.utils.parseEther('0.25'); // royalty cut
            let totalAmt = ethers.utils.parseEther('10');
            let tokenId = await testErc721.current();

            const order = {
                collection: testErc721.address,
                tokenId: tokenId,
                signer: await maker.getAddress(),
                orderType: 0,
                totalAmt: totalAmt,
                exchange: { paymentAmt: exchangeAmount, paymentAddress: await exchange.getAddress() },
                prePayment: { paymentAmt: prePaymentAmt, paymentAddress: await prepay.getAddress() },
                isERC721: true,
                tokenAmt: 1,
                refererrAmt: 0,
                root: '0x0000000000000000000000000000000000000000000000000000000000000000',
                reservedAddress: constants.AddressZero,
                nonce: 0,
                deadline: Date.now() + 100000,
                r: '',
                s: '',
                v: 0,
            };

            let signature = (await maker._signTypedData(domain, types, order)).substring(2);

            order.r = '0x' + signature.substring(0, 64);
            order.s = '0x' + signature.substring(64, 128);
            order.v = parseInt(signature.substring(128, 130), 16);

            await golomTrader.connect(taker).fillAsk(
                order,
                1,
                '0x0000000000000000000000000000000000000000',
                {
                    paymentAmt: prePaymentAmt,
                    paymentAddress: await governance.getAddress(),
                },
                {
                    value: utils.parseEther('10.25'),
                }
            );

            // TODO: fix hash struct
            // await expect(golomTrader.filled()).to.be.revertedWith('invalid orderType');
        });

        it('should transfer the ERC721 token from seller to the buyer', async () => {
            let exchangeAmount = ethers.utils.parseEther('1'); // cut for the exchanges
            let prePaymentAmt = ethers.utils.parseEther('0.25'); // royalty cut
            let totalAmt = ethers.utils.parseEther('10');
            let tokenId = await testErc721.current();

            const order = {
                collection: testErc721.address,
                tokenId: tokenId,
                signer: await maker.getAddress(),
                orderType: 0,
                totalAmt: totalAmt,
                exchange: { paymentAmt: exchangeAmount, paymentAddress: await exchange.getAddress() },
                prePayment: { paymentAmt: prePaymentAmt, paymentAddress: await prepay.getAddress() },
                isERC721: true,
                tokenAmt: 1,
                refererrAmt: 0,
                root: '0x0000000000000000000000000000000000000000000000000000000000000000',
                reservedAddress: constants.AddressZero,
                nonce: 0,
                deadline: Date.now() + 100000,
                r: '',
                s: '',
                v: 0,
            };

            let signature = (await maker._signTypedData(domain, types, order)).substring(2);

            order.r = '0x' + signature.substring(0, 64);
            order.s = '0x' + signature.substring(64, 128);
            order.v = parseInt(signature.substring(128, 130), 16);

            await golomTrader.connect(taker).fillAsk(
                order,
                1,
                '0x0000000000000000000000000000000000000000',
                {
                    paymentAmt: prePaymentAmt,
                    paymentAddress: await governance.getAddress(),
                },
                {
                    value: utils.parseEther('10.25'),
                }
            );

            expect(await testErc721.balanceOf(await taker.getAddress())).to.be.equals('1');
        });

        it('should transfer the ERC1155 token from seller to the buyer', async () => {
            let exchangeAmount = ethers.utils.parseEther('1'); // cut for the exchanges
            let prePaymentAmt = ethers.utils.parseEther('0.25'); // royalty cut
            let totalAmt = ethers.utils.parseEther('10');
            let tokenId = '0';

            const order = {
                collection: testErc1155.address,
                tokenId: tokenId,
                signer: await maker.getAddress(),
                orderType: 0,
                totalAmt: totalAmt,
                exchange: { paymentAmt: exchangeAmount, paymentAddress: await exchange.getAddress() },
                prePayment: { paymentAmt: prePaymentAmt, paymentAddress: await prepay.getAddress() },
                isERC721: false,
                tokenAmt: 1,
                refererrAmt: 0,
                root: '0x0000000000000000000000000000000000000000000000000000000000000000',
                reservedAddress: constants.AddressZero,
                nonce: 0,
                deadline: Date.now() + 100000,
                r: '',
                s: '',
                v: 0,
            };

            let signature = (await maker._signTypedData(domain, types, order)).substring(2);

            order.r = '0x' + signature.substring(0, 64);
            order.s = '0x' + signature.substring(64, 128);
            order.v = parseInt(signature.substring(128, 130), 16);

            await golomTrader.connect(taker).fillAsk(
                order,
                1,
                '0x0000000000000000000000000000000000000000',
                {
                    paymentAmt: prePaymentAmt,
                    paymentAddress: await governance.getAddress(),
                },
                {
                    value: utils.parseEther('10.25'),
                }
            );

            expect(await testErc1155.balanceOf(await taker.getAddress(), '0')).to.be.equals('1');
        });

        it('should send the fees to the distributor', async () => {
            let exchangeAmount = ethers.utils.parseEther('1'); // cut for the exchanges
            let prePaymentAmt = ethers.utils.parseEther('0.25'); // royalty cut
            let totalAmt = ethers.utils.parseEther('10');
            let tokenId = await testErc721.current();

            const order = {
                collection: testErc721.address,
                tokenId: tokenId,
                signer: await maker.getAddress(),
                orderType: 0,
                totalAmt: totalAmt,
                exchange: { paymentAmt: exchangeAmount, paymentAddress: await exchange.getAddress() },
                prePayment: { paymentAmt: prePaymentAmt, paymentAddress: await prepay.getAddress() },
                isERC721: true,
                tokenAmt: 1,
                refererrAmt: 0,
                root: '0x0000000000000000000000000000000000000000000000000000000000000000',
                reservedAddress: constants.AddressZero,
                nonce: 0,
                deadline: Date.now() + 100000,
                r: '',
                s: '',
                v: 0,
            };

            let signature = (await maker._signTypedData(domain, types, order)).substring(2);

            order.r = '0x' + signature.substring(0, 64);
            order.s = '0x' + signature.substring(64, 128);
            order.v = parseInt(signature.substring(128, 130), 16);

            await golomTrader.connect(taker).fillAsk(
                order,
                1,
                '0x0000000000000000000000000000000000000000',
                {
                    paymentAmt: prePaymentAmt,
                    paymentAddress: await governance.getAddress(),
                },
                {
                    value: utils.parseEther('10.25'),
                }
            );

            expect(await ethers.provider.getBalance(rewardDistributor.address)).to.be.equals(utils.parseEther('0.05'));
        });

        it('should send the exchange share', async () => {
            let exchangeAmount = ethers.utils.parseEther('1'); // cut for the exchanges
            let prePaymentAmt = ethers.utils.parseEther('0.25'); // royalty cut
            let totalAmt = ethers.utils.parseEther('10');
            let tokenId = await testErc721.current();

            const balanceBefore = await ethers.provider.getBalance(await exchange.getAddress());

            const order = {
                collection: testErc721.address,
                tokenId: tokenId,
                signer: await maker.getAddress(),
                orderType: 0,
                totalAmt: totalAmt,
                exchange: { paymentAmt: exchangeAmount, paymentAddress: await exchange.getAddress() },
                prePayment: { paymentAmt: prePaymentAmt, paymentAddress: await prepay.getAddress() },
                isERC721: true,
                tokenAmt: 1,
                refererrAmt: 0,
                root: '0x0000000000000000000000000000000000000000000000000000000000000000',
                reservedAddress: constants.AddressZero,
                nonce: 0,
                deadline: Date.now() + 100000,
                r: '',
                s: '',
                v: 0,
            };

            let signature = (await maker._signTypedData(domain, types, order)).substring(2);

            order.r = '0x' + signature.substring(0, 64);
            order.s = '0x' + signature.substring(64, 128);
            order.v = parseInt(signature.substring(128, 130), 16);

            await golomTrader.connect(taker).fillAsk(
                order,
                1,
                '0x0000000000000000000000000000000000000000',
                {
                    paymentAmt: prePaymentAmt,
                    paymentAddress: await governance.getAddress(),
                },
                {
                    value: utils.parseEther('10.25'),
                }
            );

            const balanceAfter = await ethers.provider.getBalance(await exchange.getAddress());

            expect(balanceAfter.sub(balanceBefore)).to.be.equals(utils.parseEther('1'));
        });

        it('should send the pre payment share', async () => {
            let exchangeAmount = ethers.utils.parseEther('1'); // cut for the exchanges
            let prePaymentAmt = ethers.utils.parseEther('0.25'); // royalty cut
            let totalAmt = ethers.utils.parseEther('10');
            let tokenId = await testErc721.current();

            const balanceBefore = await ethers.provider.getBalance(await prepay.getAddress());

            const order = {
                collection: testErc721.address,
                tokenId: tokenId,
                signer: await maker.getAddress(),
                orderType: 0,
                totalAmt: totalAmt,
                exchange: { paymentAmt: exchangeAmount, paymentAddress: await exchange.getAddress() },
                prePayment: { paymentAmt: prePaymentAmt, paymentAddress: await prepay.getAddress() },
                isERC721: true,
                tokenAmt: 1,
                refererrAmt: 0,
                root: '0x0000000000000000000000000000000000000000000000000000000000000000',
                reservedAddress: constants.AddressZero,
                nonce: 0,
                deadline: Date.now() + 100000,
                r: '',
                s: '',
                v: 0,
            };

            let signature = (await maker._signTypedData(domain, types, order)).substring(2);

            order.r = '0x' + signature.substring(0, 64);
            order.s = '0x' + signature.substring(64, 128);
            order.v = parseInt(signature.substring(128, 130), 16);

            await golomTrader.connect(taker).fillAsk(
                order,
                1,
                '0x0000000000000000000000000000000000000000',
                {
                    paymentAmt: prePaymentAmt,
                    paymentAddress: await governance.getAddress(),
                },
                {
                    value: utils.parseEther('10.25'),
                }
            );

            const balanceAfter = await ethers.provider.getBalance(await prepay.getAddress());

            expect(balanceAfter.sub(balanceBefore)).to.be.equals(utils.parseEther('0.25'));
        });
    });

    // describe('#cancelOrder', () => {
    //     it('should set governance', async () => {
    //         // Do something with the accounts
    //     });
    // });

    // describe('#fillCriticalBid', () => {
    //     it('should set governance', async () => {
    //         // Do something with the accounts
    //     });
    // });

    // describe('#incrementNonce', () => {
    //     it('should set governance', async () => {
    //         // Do something with the accounts
    //     });
    // });

    describe('#setDistributor', () => {
        it('should revert if not called by owner', async () => {
            await expect(golomTrader.setDistributor(await maker.getAddress())).to.be.revertedWith(
                'Ownable: caller is not the owner'
            );
        });

        it('should set pending distributor', async () => {
            const newDistributor = await maker.getAddress();
            console.log({ newDistributor });
            await golomTrader.connect(governance).setDistributor(newDistributor);
            expect(await golomTrader.pendingDistributor()).to.be.equals(newDistributor);
        });
    });

    describe('#executeSetDistributor', () => {
        it('should set governance', async () => {
            // Do something with the accounts
        });
    });
});
