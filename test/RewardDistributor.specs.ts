import { ethers, waffle } from 'hardhat';
import { BigNumber, utils, Signer, constants } from 'ethers';
import chai from 'chai';
const { expect } = chai;

// import artifacts
const GolomTraderArtifacts = ethers.getContractFactory('GolomTrader');
const RewardDistributorArtifacts = ethers.getContractFactory('RewardDistributor');
const VoteEscrowArtifacts = ethers.getContractFactory('VoteEscrow');
const GolomTokenArtifacts = ethers.getContractFactory('GolomToken');

const ERC721MockArtifacts = ethers.getContractFactory('ERC721Mock');
const ERC1155MockArtifacts = ethers.getContractFactory('ERC1155Mock');
const ERC20MockArtifacts = ethers.getContractFactory('ERC20Mock');
const WETHArtifacts = ethers.getContractFactory('WETH');

// import typings
import { GolomTrader as GolomTraderTypes } from '../typechain/GolomTrader';
import { RewardDistributor as RewardDistributorTypes } from '../typechain/RewardDistributor';
import { VoteEscrow as VoteEscrowTypes } from '../typechain/VoteEscrow';
import { GolomToken as GolomTokenTypes } from '../typechain/GolomToken';

import { ERC721Mock as ERC721MockTypes } from '../typechain/ERC721Mock';
import { ERC1155Mock as ERC1155MockTypes } from '../typechain/ERC1155Mock';
import { ERC20Mock as ERC20MockTypes } from '../typechain/ERC20Mock';
import { WETH as WETHTypes } from '../typechain/WETH';

let testErc20: ERC20MockTypes;
let testErc721: ERC721MockTypes;
let testErc1155: ERC1155MockTypes;
let weth: WETHTypes;

let golomTrader: GolomTraderTypes;
let voteEscrow: VoteEscrowTypes;
let golomToken: GolomTokenTypes;
let rewardDistributor: RewardDistributorTypes;

let accounts: Signer[];
let governance: Signer;
let maker: any;
let taker: any;
let exchange: any;
let prepay: any;
let postpay: any;
let receiver: "0x0000000000000000000000000000000000000000";

let domain: any;

let genesisStartTime: number;

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

describe('RewardDistributor.sol', function () {
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
        weth = (await (await WETHArtifacts).deploy()) as WETHTypes;

        // deploy trader contract
        golomTrader = (await (await GolomTraderArtifacts).deploy(await governance.getAddress())) as GolomTraderTypes;
        // voteEscrow = (await (await VoteEscrowArtifacts).deploy()) as VoteEscrowTypes;
        golomToken = (await (await GolomTokenArtifacts).deploy(await governance.getAddress())) as GolomTokenTypes;

        genesisStartTime = Math.floor(Date.now() / 1000);

        rewardDistributor = (await (
            await RewardDistributorArtifacts
        ).deploy(
            weth.address,
            golomTrader.address,
            golomToken.address,
            await governance.getAddress()
        )) as RewardDistributorTypes;


        await golomToken.connect(governance).mintGenesisReward(rewardDistributor.address);
        await golomToken.connect(governance).setMinter(rewardDistributor.address);
        await golomToken.connect(governance).executeSetMinter();

        await rewardDistributor.connect(governance).addVoteEscrow(await governance.getAddress());
        await rewardDistributor.connect(governance).executeAddVoteEscrow();
        let timestamp = await getTimestamp();

        await ethers.provider.send('evm_mine', [timestamp + 86500]);

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
        it('should set set the genesis start time', async () => {});

        it('should set genesis end time', async () => {});

        it('should set trader contract', async () => {});

        it('should set rewardToken', async () => {});

        it('should set voting escroe', async () => {});

        it('should set governance', async () => {});
    });

    describe('#traderClaim', async () => {
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
            deadline: Date.now() + 100000000,
            r: '',
            s: '',
            v: 0,
        };

        let signature = (await maker._signTypedData(domain, types, order)).substring(2);

        order.r = '0x' + signature.substring(0, 64);
        order.s = '0x' + signature.substring(64, 128);
        order.v = parseInt(signature.substring(128, 130), 16);
        3;
        let timestamp = await getTimestamp();

        await ethers.provider.send('evm_mine', [timestamp + 100000]);

        // await golomTrader.connect(taker).fillAsk(
        //     order,
        //     1,
        //     '0x0000000000000000000000000000000000000000',
        //     {
        //         paymentAmt: prePaymentAmt,
        //         paymentAddress: await governance.getAddress(),
        //     },
        //     {
        //         value: utils.parseEther('10.25'),
        //     }
        // );

        let i: number = 0;

        while (i < 30) {
            await testErc721.mint(await maker.getAddress());

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
                deadline: Date.now() + 100000000,
                r: '',
                s: '',
                v: 0,
            };

            let signature = (await maker._signTypedData(domain, types, order)).substring(2);

            order.r = '0x' + signature.substring(0, 64);
            order.s = '0x' + signature.substring(64, 128);
            order.v = parseInt(signature.substring(128, 130), 16);

            const timestamp = await getTimestamp();

            await ethers.provider.send('evm_mine', [timestamp + 86400]);

            await golomTrader.connect(taker).fillAsk(
                order,
                1,
                '0x0000000000000000000000000000000000000000',
                {
                    paymentAmt: prePaymentAmt,
                    paymentAddress: await governance.getAddress(),
                },
                receiver,
                {
                    value: utils.parseEther('10.25'),
                }
            );

            i++;
        }

        await rewardDistributor.traderClaim(await maker.getAddress(), [1]);
    });

    describe('#exchangeClaim', async () => {
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
            deadline: Date.now() + 100000000,
            r: '',
            s: '',
            v: 0,
        };

        let signature = (await maker._signTypedData(domain, types, order)).substring(2);

        order.r = '0x' + signature.substring(0, 64);
        order.s = '0x' + signature.substring(64, 128);
        order.v = parseInt(signature.substring(128, 130), 16);
        3;
        let timestamp = await getTimestamp();

        await ethers.provider.send('evm_mine', [timestamp + 100000]);

        // await golomTrader.connect(taker).fillAsk(
        //     order,
        //     1,
        //     '0x0000000000000000000000000000000000000000',
        //     {
        //         paymentAmt: prePaymentAmt,
        //         paymentAddress: await governance.getAddress(),
        //     },
        //     {
        //         value: utils.parseEther('10.25'),
        //     }
        // );

        let i: number = 0;

        while (i < 30) {
            await testErc721.mint(await maker.getAddress());

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
                deadline: Date.now() + 100000000,
                r: '',
                s: '',
                v: 0,
            };

            let signature = (await maker._signTypedData(domain, types, order)).substring(2);

            order.r = '0x' + signature.substring(0, 64);
            order.s = '0x' + signature.substring(64, 128);
            order.v = parseInt(signature.substring(128, 130), 16);

            const timestamp = await getTimestamp();

            await ethers.provider.send('evm_mine', [timestamp + 86400]);

            await golomTrader.connect(taker).fillAsk(
                order,
                1,
                '0x0000000000000000000000000000000000000000',
                {
                    paymentAmt: prePaymentAmt,
                    paymentAddress: await governance.getAddress(),
                },
                receiver,
                {
                    value: utils.parseEther('10.25'),
                }
            );

            i++;
        }

        await rewardDistributor.exchangeClaim(await maker.getAddress(), [1]);
    });

    describe('#multiStakerClaim', async () => {});

    describe('#changeTrader', async () => {});

    describe('#executeChangeTrader', async () => {});
});

async function getTimestamp() {
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    const timestamp = blockBefore.timestamp;

    return timestamp;
}
