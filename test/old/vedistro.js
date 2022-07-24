// // test if simulating 1000+ nfts dont increase gas cost of claiming rewards
// // simulate lots of nfts and see if they get the intended rewards only and not different for a particular epoch only
// // lock 100 nfts at different epochs, go to epoch 150, , do 1000 trades, see if emission is good, reward for each nft is appropriate , use 5 exchange addresses claim exchange rewards and traders rewards
// const { expect } = require('chai');
// const { ethers } = require('hardhat');

// const types = {
//     payment: [
//         { name: 'paymentAmt', type: 'uint256' },
//         { name: 'paymentAddress', type: 'address' }
//     ],
//     order: [
//         { name: 'collection', type: 'address' },
//         { name: 'tokenId', type: 'uint256' },
//         { name: 'signer', type: 'address' },
//         { name: 'orderType', type: 'uint256' },
//         { name: 'totalAmt', type: 'uint256' },
//         { name: 'exchange', type: 'payment' },
//         { name: 'prePayment', type: 'payment' },
//         { name: 'isERC721', type: 'bool' },
//         { name: 'tokenAmt', type: 'uint256' },
//         { name: 'refererrAmt', type: 'uint256' },
//         { name: 'root', type: 'bytes32' },
//         { name: 'reservedAddress', type: 'address' },
//         { name: 'nonce', type: 'uint256' },
//         { name: 'deadline', type: 'uint256' }
//     ]
// };

// const null_address = '0x0000000000000000000000000000000000000000';

// async function createbid_and_fill(collection, trader, maker, exchange, taker, totalamt) {
//     const domain = {
//         name: 'GOLOM.IO',
//         version: '1',
//         chainId: 1,
//         verifyingContract: trader.address
//     };

//     let deadline = Date.now() + 100000;
//     let receipt = await (await collection.awardItem(maker.address)).wait();
//     let tokenid = parseInt(receipt.events[0].args[2]);
//     var current = await collection.connect(maker).setApprovalForAll(trader.address, true);
//     await current.wait();
//     const order = {
//         collection: collection.address,
//         tokenId: tokenid,
//         signer: maker.address,
//         orderType: 0,
//         totalAmt: totalamt,
//         exchange: { paymentAmt: 0, paymentAddress: exchange.address },
//         prePayment: { paymentAmt: 0, paymentAddress: null_address },
//         isERC721: true,
//         tokenAmt: 1,
//         refererrAmt: 0,
//         root: '0x0000000000000000000000000000000000000000000000000000000000000000',
//         reservedAddress: null_address,
//         nonce: 1,
//         deadline: deadline
//     };

//     // console.log(order);
//     var signature2 = await maker._signTypedData(domain, types, order);
//     //   console.log("21",signature2)
//     //console.log('sig', signature2);
//     var signature = signature2.substring(2);
//     order.r = '0x' + signature.substring(0, 64);
//     order.s = '0x' + signature.substring(64, 128);
//     order.v = parseInt(signature.substring(128, 130), 16);

//     var postPay = 0;
//     var d = await trader
//         .connect(taker)
//         .fillAsk(order, 1, '0x0000000000000000000000000000000000000000', [postPay, '0x6067D233D5eA619d464a218eAf9921B9343e4d16'], {
//             value: totalamt
//         });
//     // console.log('xxx');
//     receipt = await d.wait();
//     // console.log(receipt);
//     console.log(receipt.cumulativeGasUsed);
//     return receipt;
// }

// describe('vedistro', function() {
//     let token;
//     let ve_underlying;
//     let ve;
//     let owner;
//     let ve_underlying_amount = ethers.BigNumber.from('1000000000000000000000');

//     beforeEach(async function() {
//         // [owner] = await ethers.getSigners();
//         // token = await ethers.getContractFactory('Funnel');
//         // ve_underlying = await token.deploy();
//         // await ve_underlying.deployed();
//         // await ve_underlying.mint(owner.address, ve_underlying_amount);
//         // vecontract = await ethers.getContractFactory('contracts/ve.sol:ve');
//         // ve = await vecontract.deploy(ve_underlying.address);
//         // await ve.deployed();
//     });

//     it('Check supportsInterface handles unsupported interfaces correctly', async function() {
//         // const ERC721_FAKE = 0x780e9d61;
//         // expect(await ve.supportsInterface(ERC721_FAKE)).to.be.false;
//     });
// });
