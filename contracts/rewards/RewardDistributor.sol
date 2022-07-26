// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

// stores daily trades
// is minter of token, first interaction mints tokens and distributes tokens
// gives prorata tokens to traders and exchange daily

import '@openzeppelin/contracts/access/Ownable.sol';
import 'hardhat/console.sol';

interface ERC20 {
    function totalSupply() external returns (uint256);

    function balanceOf(address account) external returns (uint256);

    function transferFrom(
        address src,
        address dst,
        uint256 wad
    ) external returns (bool);

    function transfer(address to, uint256 amount) external returns (bool);

    function mint(address account, uint256 amount) external;

    function balanceOfNFTAt(uint256 _tokenId, uint256 _t) external view returns (uint256);

    function deposit() external payable;
}

interface VE {
    function ownerOf(uint256 tokenId) external view returns (address owner);

    function totalSupplyAtT(uint256 t) external view returns (uint256);

    function balanceOfNFTAt(uint256 _tokenId, uint256 _t) external view returns (uint256);

    function totalSupplyAt(uint256 _block) external view returns (uint256);

    function balanceOfAtNFT(uint256 _tokenId, uint256 _block) external view returns (uint256);
}

contract RewardDistributor is Ownable {
    address public trader;
    uint256 public epoch = 0;
    uint256 public startTime; // timestamp at which the contracts need to be activated

    uint256 constant dailyEmission = 600000 * 10**18;

    address public pendingTrader;
    uint256 public traderEnableDate;

    address public pendingVoteEscrow;
    uint256 public voteEscrowEnableDate;
    VE public ve;

    uint256 constant secsInDay = 24 * 60 * 60;
    mapping(address => mapping(uint256 => uint256)) public feesTrader; // fees accumulated by address of trader per epoch
    mapping(address => mapping(uint256 => uint256)) public feesExchange; // fees accumulated by exchange of trader per epoch
    mapping(uint256 => uint256) public epochTotalFee; // total fee of epoch
    mapping(uint256 => uint256) public rewardTrader; // reward minted each epoc for trader
    mapping(uint256 => uint256) public rewardExchange; // reward minted each epoc for exhange
    mapping(uint256 => uint256) public rewardLP; // reward minted each epoc for LP
    mapping(uint256 => uint256) public rewardStaker; // reward minted each epoc for stakers
    mapping(uint256 => uint256) public epochBeginTime; // what time previous epoch ended
    mapping(uint256 => uint256) public claimedUpto; // epoch upto which tokenid has claimed
    mapping(uint256 => mapping(uint256 => uint256)) public claimed; // epoch upto which tokenid has claimed
    ERC20 public rewardToken;
    ERC20 public weth;
    event NewEpoch(uint256 indexed epochNo, uint256 tokenMinted, uint256 rewardStaker, uint256 previousEpochFee);

    // epochs,trader, token

    constructor(
        address _weth,
        address _trader,
        address _token,
        address _governance
    ) {
        weth = ERC20(_weth);
        trader = _trader;
        rewardToken = ERC20(_token);
        _transferOwnership(_governance); // set the new owner
        startTime = 1659211200;
    }

    modifier onlyTrader() {
        require(msg.sender == trader);
        _;
    }

    // at starttime epoch 1 starts , first trade changes epoch from 0 to 1 , emits tokens stores the rewards for epoch 1 ,
    // after 1 day , first trade changes epoch from 1 to 2, changes eth in contract to weth and stores rewardstakedeth , emits tokens stores the rewards for epoch 2

    /// @dev Add fees contributed by the Seller of nft and the exchange/frontend that facilated the trade
    /// @param addr the address that contributed in fees
    /// @param fee the fee contributed by these addresses
    function addFee(address[2] memory addr, uint256 fee) public onlyTrader {
        //console.log(block.timestamp,epoch,fee);
        if (rewardToken.totalSupply() > 1000000000 * 10**18) {
            // if supply is greater then a billion dont mint anything, dont add trades
            return;
        }

        // if 24 hours have passed since last epoch change
        if (block.timestamp > startTime + (epoch) * secsInDay) {
            // this assumes atleast 1 trade is done daily??????
            // logic to decide how much token to emit
            // emission = daily * (1 - (balance of locker/ total supply))  full if 0 locked and 0 if all locked
            // uint256 tokenToEmit = dailyEmission * rewardToken.balanceOf()/
            // emissions is decided by epoch begiining locked/circulating , and amount each nft gets also decided at epoch begining
            uint256 tokenToEmit = (dailyEmission * (rewardToken.totalSupply() - rewardToken.balanceOf(address(ve)))) /
                rewardToken.totalSupply();
            uint256 stakerReward = (tokenToEmit * rewardToken.balanceOf(address(ve))) / rewardToken.totalSupply();
            // deposit previous epoch fee to weth for distribution to stakers

            uint256 previousEpochFee = epochTotalFee[epoch];
            epoch = epoch + 1;
            rewardStaker[epoch] = stakerReward;
            rewardTrader[epoch] = ((tokenToEmit - stakerReward) * 67) / 100;
            rewardExchange[epoch] = ((tokenToEmit - stakerReward) * 33) / 100;
            rewardToken.mint(address(this), tokenToEmit);
            epochBeginTime[epoch] = block.number;
            if (previousEpochFee > 0) {
                if (epoch == 1){
                    epochTotalFee[0] =  address(this).balance; // staking and trading rewards start at epoch 1, for epoch 0 all contract ETH balance is converted to staker rewards rewards.
                    weth.deposit{value: address(this).balance}();  
                }else{
                    weth.deposit{value: previousEpochFee}();
                }
            }
            emit NewEpoch(epoch, tokenToEmit, stakerReward, previousEpochFee);
        }
        feesTrader[addr[0]][epoch] = feesTrader[addr[0]][epoch] + fee;
        feesExchange[addr[1]][epoch] = feesExchange[addr[1]][epoch] + fee;
        epochTotalFee[epoch] = epochTotalFee[epoch] + fee;
        return;
    }

    // allows sellers of nft to claim there previous epoch rewards
    function traderClaim(address addr, uint256[] memory epochs) public {
        uint256 reward = 0;
        for (uint256 index = 0; index < epochs.length; index++) {
            require(epochs[index] < epoch);
            reward =
                reward +
                (rewardTrader[epochs[index]] * feesTrader[addr][epochs[index]]) /
                epochTotalFee[epochs[index]];
            feesTrader[addr][epochs[index]] = 0;
        }
        rewardToken.transfer(addr, reward);
    }

    // allows exchange that facilated the nft trades to claim there previous epoch rewards
    function exchangeClaim(address addr, uint256[] memory epochs) public {
        uint256 reward = 0;
        for (uint256 index = 0; index < epochs.length; index++) {
            require(epochs[index] < epoch);
            reward =
                reward +
                (rewardExchange[epochs[index]] * feesExchange[addr][epochs[index]]) /
                epochTotalFee[epochs[index]];
            feesExchange[addr][epochs[index]] = 0;
        }
        rewardToken.transfer(addr, reward);
    }

    /// @dev allows VeNFT holders to claim there token and eth rewards
    ///      all tokenids must have a common owner
    /// @param tokenids the nft ids to claim rewards for all ids in the list must belong to 1 address
    /// @param epochs the list of epochs to claim rewards
    function multiStakerClaim(uint256[] memory tokenids, uint256[] memory epochs) public {
        require(address(ve) != address(0), ' VE not added yet');

        uint256 reward = 0;
        uint256 rewardEth = 0;
        address tokenowner = ve.ownerOf(tokenids[0]);

        // for each tokenid
        for (uint256 tindex = 0; tindex < tokenids.length; tindex++) {
            require(tokenowner == ve.ownerOf(tokenids[tindex]), 'Can only claim for a single Address together');
            // for each epoch
            for (uint256 index = 0; index < epochs.length; index++) {
                require(epochs[index] < epoch, 'cant claim for future epochs');
                require(claimed[tokenids[tindex]][epochs[index]] == 0, 'cant claim if already claimed');
                claimed[tokenids[tindex]][epochs[index]] = 1;
                if (epochs[index] == 0){
                    rewardEth =
                        rewardEth +
                        (epochTotalFee[0] *
                            ve.balanceOfAtNFT(tokenids[tindex], epochBeginTime[1])) /
                        ve.totalSupplyAt(epochBeginTime[1]);

                }else{
                    reward =
                        reward +
                        (rewardStaker[epochs[index]] * ve.balanceOfAtNFT(tokenids[tindex], epochBeginTime[epochs[index]])) /
                        ve.totalSupplyAt(epochBeginTime[epochs[index]]);
                    rewardEth =
                        rewardEth +
                        (epochTotalFee[epochs[index]] *
                            ve.balanceOfAtNFT(tokenids[tindex], epochBeginTime[epochs[index]])) /
                        ve.totalSupplyAt(epochBeginTime[epochs[index]]);
                }

            }
        }
        rewardToken.transfer(tokenowner, reward);
        weth.transfer(tokenowner, rewardEth);
    }


    /// @dev returns unclaimed rewards of an NFT, returns (unclaimed golom rewards, unclaimed eth rewards, unclaimed epochs)
    /// @param tokenid the nft id to claim rewards for all ids in the list must belong to 1 address
    function stakerRewards(uint256 tokenid) public view returns (
            uint256,
            uint256,
            uint256[] memory
        ){
        require(address(ve) != address(0), ' VE not added yet');

        uint256 reward = 0;
        uint256 rewardEth = 0;
        uint256[] memory unclaimedepochs = new uint256[](epoch);
        // for each epoch
        for (uint256 index = 0; index < epoch; index++) {
            unclaimedepochs[index]=claimed[tokenid][index];
            if (claimed[tokenid][index] == 0){
                if (index == 0){
                    rewardEth =
                        rewardEth +
                        (epochTotalFee[0] *
                            ve.balanceOfAtNFT(tokenid, epochBeginTime[1])) /
                        ve.totalSupplyAt(epochBeginTime[1]);

                }else{
                    reward =
                        reward +
                        (rewardStaker[index] * ve.balanceOfAtNFT(tokenid, epochBeginTime[index])) /
                        ve.totalSupplyAt(epochBeginTime[index]);
                    rewardEth =
                        rewardEth +
                        (epochTotalFee[index] *
                            ve.balanceOfAtNFT(tokenid, epochBeginTime[index])) /
                        ve.totalSupplyAt(epochBeginTime[index]);
                }
            }
        }
        return (reward, rewardEth, unclaimedepochs);
    }

    /// @dev returns unclaimed rewards of an NFT, returns (unclaimed golom rewards, unclaimed eth rewards, unclaimed epochs)
    /// @param addr the nft id to claim rewards for all ids in the list must belong to 1 address
    function traderRewards(address addr) public view returns (
            uint256        
            ){
        uint256 reward = 0;
        for (uint256 index = 0; index < epoch; index++) {
            reward =
                reward +
                (rewardTrader[index] * feesTrader[addr][index]) /
                epochTotalFee[index];
        }
        return (reward);
    }

    /// @dev returns unclaimed golom rewards of a trader
    /// @param addr the nft id to claim rewards for all ids in the list must belong to 1 address
    function exchangeRewards(address addr) public view returns (
            uint256
        ){
        uint256 reward = 0;
        for (uint256 index = 0; index < epoch; index++) {
            reward =
                reward +
                (rewardExchange[index] * feesExchange[addr][index]) /
                epochTotalFee[index];
        }
        return (reward);
    }

    /// @notice Changes the trader address with timelock
    /// @dev executeChangeTrader needs to be called after 1 days
    /// @param _trader New trader address
    function changeTrader(address _trader) external onlyOwner {
        traderEnableDate = block.timestamp + 1 days;
        pendingTrader = _trader;
    }

    /// @notice Execute's the change trader function
    function executeChangeTrader() external onlyOwner {
        require(traderEnableDate <= block.timestamp, 'RewardDistributor: time not over yet');
        trader = pendingTrader;
    }

    /// @notice Adds vote escrow contract for multi staker claim
    /// @param _voteEscrow Address of the voteEscrow contract
    function addVoteEscrow(address _voteEscrow) external onlyOwner {
        if (address(ve) == address(0)) {
            ve = VE(pendingVoteEscrow);
        } else {
            voteEscrowEnableDate = block.timestamp + 1 days;
            pendingVoteEscrow = _voteEscrow;
        }
    }

    /// @notice Adds vote escrow contract for multi staker claim
    function executeAddVoteEscrow() external onlyOwner {
        require(voteEscrowEnableDate <= block.timestamp, 'RewardDistributor: time not over yet');
        ve = VE(pendingVoteEscrow);
    }

    fallback() external payable {}

    receive() external payable {}
}
