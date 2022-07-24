// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat');
import { ethers } from 'hardhat';

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


// fill bid function that takes, maker , taker , and amounts of all payments

const null_address = '0x0000000000000000000000000000000000000000';

async function main() {

    // await ethers.provider.send("evm_setNextBlockTimestamp", [1659201200])
    // await ethers.provider.send("evm_mine", [])
    const [owner, addr1, addr2, addr3] = await hre.ethers.getSigners();

    const trader = await ethers.getContractAt('GolomTrader', "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
    const ve = await ethers.getContractAt('VoteEscrowCore', "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9");

    const ve_underlying = await ethers.getContractAt('GolomToken', "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");

    const rewardDistributor = await ethers.getContractAt('RewardDistributor', "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9");

    const ve_underlying_amount = 10000
    const lockDuration = 7 * 24 * 3600; // 1 week
    await ve_underlying.approve(ve.address, ve_underlying_amount);
    
    await ve.create_lock(ve_underlying_amount, lockDuration);

    console.log(await ve.tokenURI(1))
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
