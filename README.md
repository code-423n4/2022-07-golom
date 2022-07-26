
# Golom contest details
- $71,250 USDC main award pot
- $3,750 USDC gas optimization award pot
- Join [C4 Discord](https://discord.gg/code4rena) to register
- Submit findings [using the C4 form](https://code4rena.com/contests/2022-07-golom-contest/submit)
- [Read our guidelines for more details](https://docs.code4rena.com/roles/wardens)
- Starts July 26, 2022 20:00 UTC
- Ends August 01, 2022 20:00 UTC

# Compiling 

```shell
yarn install
npx hardhat compile
npx hardhat test
```

## Gas reports
```
-----------------------------------------------|---------------------------|-------------|--------------------------------------

|             Solc version: 0.8.11             -  Optimizer enabled: true  -  Runs: 200  -  Block limit: 9007199254740991 gas  │

-----------------------------------------------|---------------------------|-------------|--------------------------------------

|  Methods                                                                                                                     │

----------------------|------------------------|-------------|-------------|-------------|-------------------|------------------

|  Contract           -  Method                -  Min        -  Max        -  Avg        -  # calls          -  eur (avg)      │

----------------------|------------------------|-------------|-------------|-------------|-------------------|------------------

|  ERC1155Mock        -  setApprovalForAll     -      46213  -      46225  -      46223  -               20  -              -  │

----------------------|------------------------|-------------|-------------|-------------|-------------------|------------------

|  ERC721Mock         -  mint                  -          -  -          -  -      90772  -               20  -              -  │

----------------------|------------------------|-------------|-------------|-------------|-------------------|------------------

|  ERC721Mock         -  setApprovalForAll     -      46168  -      46180  -      46178  -               20  -              -  │

----------------------|------------------------|-------------|-------------|-------------|-------------------|------------------

|  GolomToken         -  executeSetMinter      -          -  -          -  -      47798  -                9  -              -  │

----------------------|------------------------|-------------|-------------|-------------|-------------------|------------------

|  GolomToken         -  mint                  -          -  -          -  -     120177  -                1  -              -  │

----------------------|------------------------|-------------|-------------|-------------|-------------------|------------------

|  GolomToken         -  mintAirdrop           -          -  -          -  -     142282  -                2  -              -  │

----------------------|------------------------|-------------|-------------|-------------|-------------------|------------------

|  GolomToken         -  mintGenesisReward     -          -  -          -  -     142260  -                8  -              -  │

----------------------|------------------------|-------------|-------------|-------------|-------------------|------------------

|  GolomToken         -  setMinter             -      34134  -      68334  -      54652  -               10  -              -  │

----------------------|------------------------|-------------|-------------|-------------|-------------------|------------------

|  GolomTrader        -  fillAsk               -     238153  -     241948  -     241397  -                7  -              -  │

----------------------|------------------------|-------------|-------------|-------------|-------------------|------------------

|  GolomTrader        -  setDistributor        -      46281  -      70449  -      47432  -               21  -              -  │

----------------------|------------------------|-------------|-------------|-------------|-------------------|------------------

|  RewardDistributor  -  addVoteEscrow         -          -  -          -  -      28462  -                6  -              -  │

----------------------|------------------------|-------------|-------------|-------------|-------------------|------------------

|  RewardDistributor  -  executeAddVoteEscrow  -          -  -          -  -      29954  -                6  -              -  │

----------------------|------------------------|-------------|-------------|-------------|-------------------|------------------

|  Deployments                                 -                                         -  % of limit       -                 │

-----------------------------------------------|-------------|-------------|-------------|-------------------|------------------

|  ERC1155Mock                                 -          -  -          -  -    1482781  -              0 %  -              -  │

-----------------------------------------------|-------------|-------------|-------------|-------------------|------------------

|  ERC20Mock                                   -          -  -          -  -     496811  -              0 %  -              -  │

-----------------------------------------------|-------------|-------------|-------------|-------------------|------------------

|  ERC721Mock                                  -          -  -          -  -    1210377  -              0 %  -              -  │

-----------------------------------------------|-------------|-------------|-------------|-------------------|------------------

|  GolomToken                                  -          -  -          -  -    1998674  -              0 %  -              -  │

-----------------------------------------------|-------------|-------------|-------------|-------------------|------------------

|  GolomTrader                                 -          -  -          -  -    2013842  -              0 %  -              -  │

-----------------------------------------------|-------------|-------------|-------------|-------------------|------------------

|  RewardDistributor                           -    2379507  -    2379543  -    2379537  -              0 %  -              -  │

-----------------------------------------------|-------------|-------------|-------------|-------------------|------------------

|  WETH                                        -          -  -          -  -     572761  -              0 %  -              -  │

-----------------------------------------------|-------------|-------------|-------------|-------------------|------------------
```




  28 passing (10s)

## Scope
### Files in scope
|File|nSLOC|Lines|
|:-|:-:|:-:|
|_Contracts (5)_|
|[contracts/governance/GolomToken.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/governance/GolomToken.sol)|42|73|
|[contracts/vote-escrow/VoteEscrowDelegation.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/vote-escrow/VoteEscrowDelegation.sol)|138|264|
|[contracts/rewards/RewardDistributor.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/rewards/RewardDistributor.sol)|218|316|
|[contracts/core/GolomTrader.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/core/GolomTrader.sol)|298|462|
|[contracts/vote-escrow/VoteEscrowCore.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/vote-escrow/VoteEscrowCore.sol)|596|1237|
|_Libraries (1)_|
|[contracts/vote-escrow/TokenUriHelper.sol](https://github.com/code-423n4/2022-07-golom/blob/f6711139d1430316ec7faddcf8e47aa3098762d9/contracts/vote-escrow/TokenUriHelper.sol)|116|149|
|Total (over 5 files):| 1366 | 2428 |


### All other source contracts (not in scope)
|File|nSLOC|Lines|
|:-|:-:|:-:|
|_Contracts (4)_|
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



## Summary of contracts in Scope

# Core

GolomTrader.sol

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




## Summary of contracts NOT in Scope

# Core

Emitter.sol 

This contract emits any valid signed order as an indexed event for easy querying. this contract will be deployed on polygon.


# Project docs
https://docs.golom.io/ 

## Scoping details answers

```
Contracts in scope: 6
SLOC: 1407
Libraries: -
External calls: -
Oracle: No
Oracle description: 
Token is ERC20? Yes
Novel/unique curve logic or math: curve locking, staking logic forked from curve
Timelock: Yes
NFT: Yes
AMM: No
Fork of another project? Yes
Customizations to forked project: Staking forked
Use rollups: No
Is multichain: No
Uses sidechain: No
Sidechain is EVM compatible: No
Will participants need to understand other portions of the code/project? no
```
