import { ethers, waffle } from 'hardhat';
import { BigNumber, utils, Signer, constants } from 'ethers';
import chai from 'chai';
const { expect } = chai;

// import artifacts
const GolomTraderArtifacts = ethers.getContractFactory('GolomTrader');
const RewardDistributorArtifacts = ethers.getContractFactory('RewardDistributor');
const VoteEscrowArtifacts = ethers.getContractFactory('VoteEscrow');
const EmitterArtifacts = ethers.getContractFactory('Emitter');

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
import { Emitter as EmitterTypes } from '../typechain/Emitter';

let testErc20: ERC20MockTypes;
let testErc721: ERC721MockTypes;
let testErc1155: ERC1155MockTypes;

let golomTrader: GolomTraderTypes;
let voteEscrow: VoteEscrowTypes;
let rewardDistributor: RewardDistributorTypes;
let emitter: EmitterTypes;

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
        emitter = (await await (await EmitterArtifacts).deploy(golomTrader.address)) as EmitterTypes;
        voteEscrow = (await (await VoteEscrowArtifacts).deploy()) as VoteEscrowTypes;
        rewardDistributor = (await (
            await RewardDistributorArtifacts
        ).deploy(
            Date.now(),
            golomTrader.address,
            testErc20.address,
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

    describe('#pushOrder', () => {
        it('should emit order', async () => {
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

            // emitter.pushOrder(order);
            expect(await emitter.pushOrder(order))
                .to.emit(emitter, 'NewOrder')
                .withArgs(
                    order.collection,
                    order.tokenId,
                    order.signer,
                    order.totalAmt,
                    order.exchange.paymentAmt,
                    order.exchange.paymentAddress,
                    order.prePayment.paymentAmt,
                    order.prePayment.paymentAddress,
                    order.isERC721,
                    order.tokenAmt,
                    order.refererrAmt,
                    order.nonce,
                    order.deadline,
                    order.v,
                    order.r,
                    order.s
                );
        });
    });
});
