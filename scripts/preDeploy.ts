import { ethers } from 'hardhat';

async function main() {
    const GOVERNANCE = ''; // external EOA

    const GOLOM_TOKEN = ''; // address of the GOLOM_TOKEN
    const WETH = '';
    const GOLOM_TRADER = ''; // address of the trader

    const VoteEscrow = await ethers.getContractFactory('VoteEscrow');
    const golomToken = await ethers.getContractAt('GolomToken', GOLOM_TOKEN);
    const golomTrader = await ethers.getContractAt('GolomTrader', GOLOM_TOKEN);

    const RewardDistributor = await ethers.getContractFactory('RewardDistributor');

    // Deploy VoteEscrow.sol
    const voteEscrow = await VoteEscrow.deploy(GOLOM_TOKEN);

    // Deploy RewardDistributor.sol
    const rewardDistributor = await RewardDistributor.deploy(WETH, GOLOM_TRADER, GOLOM_TOKEN, GOVERNANCE);

    // add voteEscrow in reward distributor
    console.log('⏳ Adding VoteEscrow to RewardDistributor');
    await rewardDistributor.addVoteEscrow(voteEscrow.address);
    console.log('✅ Added VoteEscrow to RewardDistributor Succcessfully!');

    console.log('⏳ Adding RewardDistributor to GolomToken');
    await golomToken.setMinter(rewardDistributor.address);
    console.log('✅ Added RewardDistributor to GolomToken Succcessfully!');

    console.log('⏳ Adding RewardDistributor to GolomTrader');
    await golomTrader.setDistributor(rewardDistributor.address);
    console.log('✅ Added RewardDistributor to GolomTrader Succcessfully!');

    console.log(`🎉🎉🎉 Deployment Successful 🎉🎉🎉 `);
    console.log({
        voteEscrow: voteEscrow.address,
        rewardDistributor: rewardDistributor.address,
    });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
