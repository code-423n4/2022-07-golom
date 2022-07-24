// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

// stores daily trades
// is minter of token, first interaction mints tokens and distributes tokens
// gives prorata tokens to traders and exchange daily

import '@openzeppelin/contracts/access/Ownable.sol';
import 'hardhat/console.sol';

interface ERC20 {
    function transfer(address to, uint256 amount) external returns (bool);

    function balanceOf(address) external returns (uint256);
}

contract DummyRewardDistributor is Ownable {
    address public trader;

    /// _time to start rewards
    constructor(address _trader, address _governance) {
        trader = _trader;
        _transferOwnership(_governance);
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
    function addFee(address[2] memory addr, uint256 fee) public onlyTrader {}

    function withdrawTokens(address _token, address _to) external onlyOwner {
        ERC20(_token).transfer(_to, ERC20(_token).balanceOf(address(this)));
    }

    function withdrawEth(address payable _to) external onlyOwner {
        _to.transfer(address(this).balance);
    }

    fallback() external payable {}

    receive() external payable {}
}
