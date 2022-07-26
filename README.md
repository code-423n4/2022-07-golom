# ✨ So you want to sponsor a contest

This `README.md` contains a set of checklists for our contest collaboration.

Your contest will use two repos: 
- **a _contest_ repo** (this one), which is used for scoping your contest and for providing information to contestants (wardens)
- **a _findings_ repo**, where issues are submitted (shared with you after the contest) 

Ultimately, when we launch the contest, this contest repo will be made public and will contain the smart contracts to be reviewed and all the information needed for contest participants. The findings repo will be made public after the contest report is published and your team has mitigated the identified issues.

Some of the checklists in this doc are for **C4 (🐺)** and some of them are for **you as the contest sponsor (⭐️)**.

---

# Contest setup

## ⭐️ Sponsor: Provide contest details

Under "SPONSORS ADD INFO HERE" heading below, include the following:

- [ ] Create a PR to this repo with the below changes:
- [ ] Name of each contract and:
  - [ ] source lines of code (excluding blank lines and comments) in each
  - [ ] external contracts called in each
  - [ ] libraries used in each
- [ ] Describe any novel or unique curve logic or mathematical models implemented in the contracts
- [ ] Does the token conform to the ERC-20 standard? In what specific ways does it differ?
- [ ] Describe anything else that adds any special logic that makes your approach unique
- [ ] Identify any areas of specific concern in reviewing the code
- [ ] Add all of the code to this repo that you want reviewed


---

# Contest prep

## ⭐️ Sponsor: Contest prep
- [ ] Provide a self-contained repository with working commands that will build (at least) all in-scope contracts, and commands that will run tests producing gas reports for the relevant contracts.
- [ ] Make sure your code is thoroughly commented using the [NatSpec format](https://docs.soliditylang.org/en/v0.5.10/natspec-format.html#natspec-format).
- [ ] Modify the bottom of this `README.md` file to describe how your code is supposed to work with links to any relevent documentation and any other criteria/details that the C4 Wardens should keep in mind when reviewing. ([Here's a well-constructed example.](https://github.com/code-423n4/2021-06-gro/blob/main/README.md))
- [ ] Please have final versions of contracts and documentation added/updated in this repo **no less than 24 hours prior to contest start time.**
- [ ] Be prepared for a 🚨code freeze🚨 for the duration of the contest — important because it establishes a level playing field. We want to ensure everyone's looking at the same code, no matter when they look during the contest. (Note: this includes your own repo, since a PR can leak alpha to our wardens!)
- [ ] Promote the contest on Twitter (optional: tag in relevant protocols, etc.)
- [ ] Share it with your own communities (blog, Discord, Telegram, email newsletters, etc.)
- [ ] Optional: pre-record a high-level overview of your protocol (not just specific smart contract functions). This saves wardens a lot of time wading through documentation.
- [ ] Delete this checklist and all text above the line below when you're ready.

---

# Golom contest details
- $71,250 USDC main award pot
- $3,750 USDC gas optimization award pot
- Join [C4 Discord](https://discord.gg/code4rena) to register
- Submit findings [using the C4 form](https://code4rena.com/contests/2022-07-golom-contest/submit)
- [Read our guidelines for more details](https://docs.code4rena.com/roles/wardens)
- Starts July 25, 2022 20:00 UTC
- Ends July 31, 2022 20:00 UTC

[ ⭐️ SPONSORS ADD INFO HERE ]

# Compiling 

```shell
yarn install
npx hardhat compile
npx hardhat test
```

·----------------------------------------------|---------------------------|-------------|-------------------------------------·
|             Solc version: 0.8.11             ·  Optimizer enabled: true  ·  Runs: 200  ·  Block limit: 9007199254740991 gas  │
···············································|···························|·············|······································
|  Methods                                                                                                                     │
······················|························|·············|·············|·············|···················|··················
|  Contract           ·  Method                ·  Min        ·  Max        ·  Avg        ·  # calls          ·  eur (avg)      │
······················|························|·············|·············|·············|···················|··················
|  ERC1155Mock        ·  setApprovalForAll     ·      46213  ·      46225  ·      46223  ·               20  ·              -  │
······················|························|·············|·············|·············|···················|··················
|  ERC721Mock         ·  mint                  ·          -  ·          -  ·      90772  ·               20  ·              -  │
······················|························|·············|·············|·············|···················|··················
|  ERC721Mock         ·  setApprovalForAll     ·      46168  ·      46180  ·      46178  ·               20  ·              -  │
······················|························|·············|·············|·············|···················|··················
|  GolomToken         ·  executeSetMinter      ·          -  ·          -  ·      47798  ·                9  ·              -  │
······················|························|·············|·············|·············|···················|··················
|  GolomToken         ·  mint                  ·          -  ·          -  ·     120177  ·                1  ·              -  │
······················|························|·············|·············|·············|···················|··················
|  GolomToken         ·  mintAirdrop           ·          -  ·          -  ·     142282  ·                2  ·              -  │
······················|························|·············|·············|·············|···················|··················
|  GolomToken         ·  mintGenesisReward     ·          -  ·          -  ·     142260  ·                8  ·              -  │
······················|························|·············|·············|·············|···················|··················
|  GolomToken         ·  setMinter             ·      34134  ·      68334  ·      54652  ·               10  ·              -  │
······················|························|·············|·············|·············|···················|··················
|  GolomTrader        ·  fillAsk               ·     238153  ·     241948  ·     241397  ·                7  ·              -  │
······················|························|·············|·············|·············|···················|··················
|  GolomTrader        ·  setDistributor        ·      46281  ·      70449  ·      47432  ·               21  ·              -  │
······················|························|·············|·············|·············|···················|··················
|  RewardDistributor  ·  addVoteEscrow         ·          -  ·          -  ·      28462  ·                6  ·              -  │
······················|························|·············|·············|·············|···················|··················
|  RewardDistributor  ·  executeAddVoteEscrow  ·          -  ·          -  ·      29954  ·                6  ·              -  │
······················|························|·············|·············|·············|···················|··················
|  Deployments                                 ·                                         ·  % of limit       ·                 │
···············································|·············|·············|·············|···················|··················
|  ERC1155Mock                                 ·          -  ·          -  ·    1482781  ·              0 %  ·              -  │
···············································|·············|·············|·············|···················|··················
|  ERC20Mock                                   ·          -  ·          -  ·     496811  ·              0 %  ·              -  │
···············································|·············|·············|·············|···················|··················
|  ERC721Mock                                  ·          -  ·          -  ·    1210377  ·              0 %  ·              -  │
···············································|·············|·············|·············|···················|··················
|  GolomToken                                  ·          -  ·          -  ·    1998674  ·              0 %  ·              -  │
···············································|·············|·············|·············|···················|··················
|  GolomTrader                                 ·          -  ·          -  ·    2013842  ·              0 %  ·              -  │
···············································|·············|·············|·············|···················|··················
|  RewardDistributor                           ·    2379507  ·    2379543  ·    2379537  ·              0 %  ·              -  │
···············································|·············|·············|·············|···················|··················
|  WETH                                        ·          -  ·          -  ·     572761  ·              0 %  ·              -  │
·----------------------------------------------|-------------|-------------|-------------|-------------------|-----------------·

  28 passing (10s)

## Scope
|File|nSLOC|Lines|
|:-|:-:|:-:|
|_Contracts (4)_|
|[contracts/vote-escrow/VoteEscrowDelegation.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/vote-escrow/VoteEscrowDelegation.sol)|138|264|
|[contracts/rewards/RewardDistributor.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/rewards/RewardDistributor.sol)|218|316|
|[contracts/core/GolomTrader.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/core/GolomTrader.sol)|298|462|
|[contracts/vote-escrow/VoteEscrowCore.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/vote-escrow/VoteEscrowCore.sol)|596|1237|
|_Libraries (1)_|
|[contracts/vote-escrow/TokenUriHelper.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/vote-escrow/TokenUriHelper.sol)|116|149|
|Total (over 5 files):| 1366 | 2428 |


### Direct parent contracts of in-scope contracts (not in scope)
None


### Other contracts directly imported by in-scope contracts (not in scope)
None


### All other source contracts (not in scope)
You only mention `Emitter.sol` as not in scope - the presence of these other files is going to lead to questions - best to be specific
|File|nSLOC|Lines|
|:-|:-:|:-:|
|_Contracts (5)_|
|[contracts/governance/GolomToken.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/governance/GolomToken.sol)|42|73|
|[contracts/governance/Timlock.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/governance/Timlock.sol)|103|155|
|[contracts/core/Emitter.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/core/Emitter.sol)|130|150|
|[contracts/rewards/GolomAirdrop.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/rewards/GolomAirdrop.sol)|150|207|
|[contracts/governance/GovernerBravo.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/governance/GovernerBravo.sol)|301|472|
|Total (over 5 files):| 726 | 1057 |


## External imports
* **@openzeppelin/contracts/access/Ownable.sol**
  * [contracts/core/GolomTrader.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/core/GolomTrader.sol)
  * ~~[contracts/governance/GolomToken.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/governance/GolomToken.sol)~~
  * ~~[contracts/rewards/GolomAirdrop.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/rewards/GolomAirdrop.sol)~~
  * [contracts/rewards/RewardDistributor.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/rewards/RewardDistributor.sol)
  * [contracts/vote-escrow/VoteEscrowDelegation.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/vote-escrow/VoteEscrowDelegation.sol)
* **@openzeppelin/contracts/security/Pausable.sol**
  * ~~[contracts/rewards/GolomAirdrop.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/rewards/GolomAirdrop.sol)~~
* **@openzeppelin/contracts/security/ReentrancyGuard.sol**
  * [contracts/core/GolomTrader.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/core/GolomTrader.sol)
  * ~~[contracts/rewards/GolomAirdrop.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/rewards/GolomAirdrop.sol)~~
* **@openzeppelin/contracts/token/ERC1155/IERC1155.sol**
  * ~~[contracts/rewards/GolomAirdrop.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/rewards/GolomAirdrop.sol)~~
* **@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol**
  * ~~[contracts/governance/GolomToken.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/governance/GolomToken.sol)~~
* **@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol**
  * ~~[contracts/rewards/GolomAirdrop.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/rewards/GolomAirdrop.sol)~~
* **@openzeppelin/contracts/token/ERC721/IERC721.sol**
  * ~~[contracts/rewards/GolomAirdrop.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/rewards/GolomAirdrop.sol)~~
* **@openzeppelin/contracts/utils/cryptography/MerkleProof.sol**
  * ~~[contracts/rewards/GolomAirdrop.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/rewards/GolomAirdrop.sol)~~
* **@openzeppelin/contracts/utils/math/SafeMath.sol**
  * ~~[contracts/governance/Timlock.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/governance/Timlock.sol)~~
* **hardhat/console.sol**
  * [contracts/rewards/RewardDistributor.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/rewards/RewardDistributor.sol)
  * [contracts/vote-escrow/VoteEscrowDelegation.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/vote-escrow/VoteEscrowDelegation.sol)



# Summary of contracts in Scope

# Core

GolomTrader.sol

Lines of Code(including comments and blank lines): 461

Library used:
- @openzeppelin/contracts/access/Ownable.sol
- @openzeppelin/contracts/security/ReentrancyGuard.sol

Description:

This contract acts as the Nft trade matcher with 3 different functions for the 3 different ordertypes, ordertype 0 for filling ask for NFT, 1 for filling bid of an NFT, 2 for filling bid of any NFT from a particular collection ensuring that the supplied proof demonstrates inclusion of the tokenId in the associated merkle root, if root is 0 then any token can be used to fill the order.After filling RewardDistributor contract is called for saving fees generated by each address and distributing rewards.




# Rewards

RewardDistributor.sol

Types of reward distribution:

- Golom rewards for Traders selling NFT and exchanges that created the signed orders 
- Inflationary Golom rewards and fees rewards for Vote-escrowed Golom stakers

How rewards are calculated.

- Vote escrowed staked golom (described below) are entitiled to all ether fees stored in ```epochTotalFee``` as well as inflationary golom rewards(calculated as ```uint256 stakerReward = (tokenToEmit * rewardToken.balanceOf(address(ve))) / rewardToken.totalSupply();```) pro-rata to their power
- Sellers of NFT per epoch are entitiled to ```rewardTrader[epoch]``` rewards of each epoch pro-rata to the fees
- Exchange addresses that creates the orders are entitiled to ```rewardExchange[epoch]``` rewards of each epoch pro-rata to the fees
- All ether collected on this contract before ```startTime``` is stored as fees in ```epochTotalFee``` mapping of epoch 0 and given to Vote-escrowed stakers
- Contract also mints daily golom token based on https://docs.golom.io/emissions with ```dailyEmission``` being 600,000 tokens



# Vote escrow

VoteEscrowDelegation.sol

This contract inherits VoteEscrowCore.sol which is a fork of Andre's solidly project (https://github.com/solidlyexchange/solidly/blob/master/contracts/ve.sol) and implements delegation for upgrading other contracts by voting.

Solidly is a fork of curve voting mechanism which makes each lock as an NFT and allows it to be freely transferable.



# Summary of contracts NOT in Scope

# Core

Emitter.sol 

This contract emits any valid signed order as an indexed event for easy querying. this contract will be deployed on polygon.


# Project docs
https://docs.golom.io/ (note that there is typo in https://docs.golom.io/emissions with 500,000 tokens as daily emission instead of actual value of 600,000 in contract)


