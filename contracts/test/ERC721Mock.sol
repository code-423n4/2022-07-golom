// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
// pragma solidity ^0.8.0;

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/utils/Counters.sol';

contract ERC721Mock is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721('ERC721Mock', '721Mock') {}

    function mint(address player) public returns (uint256) {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(player, newItemId);

        return newItemId;
    }

    function current() public view returns (uint256) {
        return _tokenIds.current();
    }
}
