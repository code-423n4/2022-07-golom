// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat');
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// fill bid function that takes, maker , taker , and amounts of all payments

const null_address = '0x0000000000000000000000000000000000000000';

async function main() {
    const [owner, addr1, addr2, addr3] = await hre.ethers.getSigners();

    // deployment script
    const rewardDistributor = await hre.ethers.getContractFactory('RewardDistributor');
    const Funnel = await hre.ethers.getContractFactory('Funnel');
    const funnel = await Funnel.deploy();
    const rewards_starts_at = 1651395600;
    const Trader = await hre.ethers.getContractFactory('Molotrader');
    const trader = await Trader.deploy();

    await trader.deployed();
    const Ve = await hre.ethers.getContractFactory('ve');
    const ve = await Ve.deploy(funnel.address);

    console.log('addr', trader.address, funnel.address);
    const rewarddistributor = await rewardDistributor.deploy(rewards_starts_at, trader.address, funnel.address, ve.address);

    console.log(rewarddistributor.address, await rewarddistributor.epoch(), await rewarddistributor.trader());
    await trader.setDistributor(rewarddistributor.address);
    await funnel.setMinter(rewarddistributor.address);
    await sleep(10000);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
