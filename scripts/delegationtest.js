// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
// require('@nomiclabs/hardhat-web3');

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

// fill bid function that takes, maker , taker , and amounts of all payments

// const contract = await MerkleProof.new();
const null_address = '0x0000000000000000000000000000000000000000';

async function main() {
    const [owner, addr1, addr2, ex] = await hre.ethers.getSigners();

    // deployment script
    const rewardDistributor = await hre.ethers.getContractFactory('RewardDistributor');
    const Funnel = await hre.ethers.getContractFactory('Funnel');
    const funnel = await Funnel.deploy();

    const Trader = await hre.ethers.getContractFactory('Molotrader');
    const trader = await Trader.deploy();

    await trader.deployed();
    const Ve = await hre.ethers.getContractFactory('ve');
    const ve = await Ve.deploy(funnel.address);
    const rewards_starts_at = 1655649628;
    console.log('addr', trader.address, funnel.address);
    const rewarddistributor = await rewardDistributor.deploy(rewards_starts_at, trader.address, funnel.address, ve.address);

    console.log(rewarddistributor.address, await rewarddistributor.epoch(), await rewarddistributor.trader());
    trader.setDistributor(rewarddistributor.address);
    funnel.setMinter(rewarddistributor.address);
    // deployment end

    console.log(await funnel.balanceOf(owner.address));
    let ve_underlying_amount = hre.ethers.utils.parseEther('10');
    console.log('trying with', ve_underlying_amount);
    let ve_underlying_approve_amount = hre.ethers.utils.parseUnits('10', 28);

    await funnel.approve(ve.address, ve_underlying_approve_amount);

    const lockDuration = 365 * 24 * 3600 * 4; // 4  year
    await hre.ethers.provider.send('evm_setNextBlockTimestamp', [rewards_starts_at]); //rewards started + 1 day

    await hre.ethers.provider.send('evm_mine');
    await hre.ethers.provider.send('evm_mine');

    let re = await ve.create_lock(ve_underlying_amount, lockDuration);
    re = await ve.create_lock(ve_underlying_amount, lockDuration);
    re = await ve.create_lock(ve_underlying_amount, lockDuration);
    re = await ve.create_lock(ve_underlying_amount, lockDuration);
    re = await ve.create_lock(ve_underlying_amount, lockDuration);
    re = await ve.create_lock(ve_underlying_amount, lockDuration);

    ve.delegate(1, 1);
    ve.delegate(2, 1);
    ve.delegate(3, 1);
    ve.delegate(4, 1);
    ve.delegate(5, 1);
    ve.delegate(6, 1);
    await hre.ethers.provider.send('evm_mine');
    const latestBlock = await hre.ethers.provider.getBlock('latest');
    console.log(latestBlock);
    console.log(await ve.getCurrentVotes(1));

    var txdata = await ve.populateTransaction.getCurrentVotes_gas(1);
    var g = await owner.estimateGas(txdata);
    // const receipt = await ve.getCurrentVotes_gas(1);
    console.log(g);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
