import { ethers, waffle } from 'hardhat';
import { BigNumber, utils, Signer, constants } from 'ethers';
import chai from 'chai';
const { expect } = chai;

// import artifacts
const GolomTokenArtifacts = ethers.getContractFactory('GolomToken');

// import typings
import { GolomToken as GolomTokenTypes } from '../typechain/GolomToken';

let golomToken: GolomTokenTypes;
let accounts: any;

describe('GolomToken.sol', () => {
    beforeEach(async () => {
        accounts = await ethers.getSigners();
        golomToken = (await (await GolomTokenArtifacts).deploy(await accounts[0].getAddress())) as GolomTokenTypes;
    });

    describe('#constructor', () => {
        it('should set the governance', async () => {
            expect(await golomToken.owner()).to.be.equals(await accounts[0].getAddress());
        });
    });

    describe('#mint', () => {
        it('should mint the tokens', async () => {
            const minter = await accounts[1].getAddress();
            const receiver = await accounts[2].getAddress();
            await golomToken.setMinter(minter);
            await golomToken.executeSetMinter();
            await golomToken.connect(accounts[1]).mint(receiver, 1);
            expect(await golomToken.balanceOf(receiver)).to.equals('1');
        });
    });

    describe('#mintAidrop', () => {
        it('should revert if already minted', async () => {
            await golomToken.mintAirdrop(await accounts[1].getAddress());
            expect(golomToken.mintAirdrop(await accounts[1].getAddress())).to.be.revertedWith('already minted');
        });

        it('should mint the airdrop tokens', async () => {
            await golomToken.mintAirdrop(await accounts[1].getAddress());
            expect(await golomToken.balanceOf(await accounts[1].getAddress())).to.be.equals(
                '150000000000000000000000000'
            );
        });
    });

    describe('#mintGenesisReward', () => {
        it('should revert if already minted', async () => {
            await golomToken.mintGenesisReward(await accounts[1].getAddress());
            expect(golomToken.mintGenesisReward(await accounts[1].getAddress())).to.be.revertedWith('already minted');
        });
        it('should mint the genesis reward tokens', async () => {
            await golomToken.mintGenesisReward(await accounts[1].getAddress());
            expect(await golomToken.balanceOf(await accounts[1].getAddress())).to.be.equals(
                '50000000000000000000000000'
            );
        });
    });

    describe('#setMinter', () => {
        it('should set the minter for first time without timelock', async () => {
            await golomToken.setMinter(await accounts[2].getAddress());
            await golomToken.executeSetMinter();
            expect(await golomToken.minter()).to.be.equals(await accounts[2].getAddress());
        });

        it('should revert if the date is wrong', async () => {
            await golomToken.setMinter(await accounts[2].getAddress());
            await golomToken.executeSetMinter();

            await golomToken.setMinter(await accounts[3].getAddress());

            expect(golomToken.executeSetMinter()).to.be.revertedWith('GolomToken: wait for timelock');
        });
    });
});
