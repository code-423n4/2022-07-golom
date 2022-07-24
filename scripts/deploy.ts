// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from 'hardhat';

async function main() {
    /**
     *  STEPS for Final Deployment
     *  1. deploy timelock
     */

    const GOVERNANCE = '0x9aB76D1181c7723Ce4ab480Fb9610eFF7C6865Fa';
    const GENESIS_START_TIME = '1653508800'; // 25th May 2022, 00.00 AM GST

    const GolomTrader = await ethers.getContractFactory('GolomTrader');
    const GolomToken = await ethers.getContractFactory('GolomToken');
    const RewardDistributor = await ethers.getContractFactory('RewardDistributor');

    const golomTrader = await GolomTrader.deploy(GOVERNANCE);
    const golomToken = await GolomToken.deploy(GOVERNANCE);

    const rewardDistributor = await RewardDistributor.deploy(
        GENESIS_START_TIME,
        golomTrader.address,
        golomToken.address,
        GOVERNANCE
    );

    // should be called by governance (considering msg.sender == governance)
    await golomToken.setMinter(rewardDistributor.address);
    await golomToken.executeSetMinter();
    await golomTrader.setDistributor(rewardDistributor.address);
    console.log(`🎉🎉🎉 Deployment Successful 🎉🎉🎉 `);
    console.log({
        GolomTrader: golomTrader.address,
        GolomToken: golomToken.address,
        RewardDistributor: rewardDistributor.address,
    });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
