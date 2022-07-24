// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

/// votescrow extended with delegation

import 'hardhat/console.sol';
// import {Math} from '@openzeppelin-contracts/utils/math/SafeCast.sol';

import '@openzeppelin/contracts/access/Ownable.sol';

import {VoteEscrowCore} from './VoteEscrowCore.sol';

interface IVoteEscrow {
    function balanceOf(uint256) external view returns (uint256);

    function balanceOfAtNFT(uint256, uint256) external view returns (uint256);

    function ownerOf(uint256) external view returns (address);
}

contract VoteEscrow is VoteEscrowCore, Ownable {
    /**
     * @dev Emitted when an account changes their delegate.
     */
    event DelegateChanged(uint256 indexed tokenId, uint256 indexed toTokenId, address indexed currentOwner);

    /**
     * @dev Emitted when a token transfer or delegate change results in changes to a delegate's number of votes.
     */
    event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance);

    /// @notice Delegate of the specific token
    mapping(uint256 => uint256) public delegates;

    /// @notice Total delegated tokens to specific token
    mapping(uint256 => uint256[]) public delegatedTokenIds;

    /// @notice A checkpoint for marking number of votes from a given block
    struct Checkpoint {
        uint256 fromBlock;
        uint256[] delegatedTokenIds;
    }

    /// @notice A record of votes checkpoints for each tokenId, by index
    mapping(uint256 => mapping(uint256 => Checkpoint)) public checkpoints;

    /// @notice The number of checkpoints for each delegated tokenId
    mapping(uint256 => uint256) public numCheckpoints;

    /// @notice minimum voting power required for delegation
    uint256 public MIN_VOTING_POWER_REQUIRED = 0;

    constructor(address _token) {
        token = _token;
        voter = msg.sender;
        point_history[0].blk = block.number;
        point_history[0].ts = block.timestamp;

        supportedInterfaces[ERC165_INTERFACE_ID] = true;
        supportedInterfaces[ERC721_INTERFACE_ID] = true;
        supportedInterfaces[ERC721_METADATA_INTERFACE_ID] = true;

        // mint-ish
        emit Transfer(address(0), address(this), tokenId);
        // burn-ish
        emit Transfer(address(this), address(0), tokenId);
    }

    /// @notice Explain to an end user what this does
    /// @param tokenId token ID which is being delegated
    /// @param toTokenId token ID to which the {tokenId} is being delegated
    function delegate(uint256 tokenId, uint256 toTokenId) external {
        require(ownerOf(tokenId) == msg.sender, 'VEDelegation: Not allowed');
        require(this.balanceOfNFT(tokenId) >= MIN_VOTING_POWER_REQUIRED, 'VEDelegation: Need more voting power');

        delegates[tokenId] = toTokenId;
        uint256 nCheckpoints = numCheckpoints[toTokenId];

        if (nCheckpoints > 0) {
            Checkpoint storage checkpoint = checkpoints[toTokenId][nCheckpoints - 1];
            checkpoint.delegatedTokenIds.push(tokenId);
            _writeCheckpoint(toTokenId, nCheckpoints, checkpoint.delegatedTokenIds);
        } else {
            uint256[] memory array = new uint256[](1);
            array[0] = tokenId;
            _writeCheckpoint(toTokenId, nCheckpoints, array);
        }

        emit DelegateChanged(tokenId, toTokenId, msg.sender);
    }

    /**
     * @notice Writes the checkpoint to store current NFTs in the specific block
     */
    function _writeCheckpoint(
        uint256 toTokenId,
        uint256 nCheckpoints,
        uint256[] memory _delegatedTokenIds
    ) internal {
        require(_delegatedTokenIds.length < 500, 'VVDelegation: Cannot stake more');

        Checkpoint memory oldCheckpoint = checkpoints[toTokenId][nCheckpoints - 1];

        if (nCheckpoints > 0 && oldCheckpoint.fromBlock == block.number) {
            oldCheckpoint.delegatedTokenIds = _delegatedTokenIds;
        } else {
            checkpoints[toTokenId][nCheckpoints] = Checkpoint(block.number, _delegatedTokenIds);
            numCheckpoints[toTokenId] = nCheckpoints + 1;
        }
    }

    /**
     * @notice Gets the current delegated nfts array for `nftid`
     * @param tokenId The address to get votes balance
     * @return The current delegated nfts array for `account`
     */
    function _getCurrentDelegated(uint256 tokenId) internal view returns (uint256[] memory) {
        uint256 nCheckpoints = numCheckpoints[tokenId];
        uint256[] memory myArray;
        return nCheckpoints > 0 ? checkpoints[tokenId][nCheckpoints - 1].delegatedTokenIds : myArray;
    }

    /**
     * @notice Determine the prior delegated nfts array for an account as of a block number
     * @dev Block number must be a finalized block or else this function will revert to prevent misinformation.
     * @param nftId The id of the nft to check
     * @param blockNumber The block number to get the delegate nft array at
     * @return The number of delegated nfts the account had as of the given block
     */
    function _getPriorDelegated(uint256 nftId, uint256 blockNumber) internal view returns (uint256[] memory) {
        require(blockNumber < block.number, 'VEDelegation: not yet determined');
        uint256[] memory myArray;
        uint256 nCheckpoints = numCheckpoints[nftId];
        if (nCheckpoints == 0) {
            return myArray;
        }

        // First check most recent balance
        if (checkpoints[nftId][nCheckpoints - 1].fromBlock <= blockNumber) {
            return checkpoints[nftId][nCheckpoints - 1].delegatedTokenIds;
        }

        // Next check implicit zero balance
        if (checkpoints[nftId][0].fromBlock > blockNumber) {
            return myArray;
        }

        uint256 lower = 0;
        uint256 upper = nCheckpoints - 1;
        while (upper > lower) {
            uint256 center = upper - (upper - lower) / 2; // ceil, avoiding overflow
            Checkpoint memory cp = checkpoints[nftId][center];
            if (cp.fromBlock == blockNumber) {
                return cp.delegatedTokenIds;
            } else if (cp.fromBlock < blockNumber) {
                lower = center;
            } else {
                upper = center - 1;
            }
        }
        return checkpoints[nftId][lower].delegatedTokenIds;
    }

    /**
     * @notice Gets the current votes balance for `account`
     * @param tokenId The address to get votes balance
     * @return The number of current votes for `account`
     */
    function getVotes(uint256 tokenId) external view returns (uint256) {
        uint256[] memory delegated = _getCurrentDelegated(tokenId);
        uint256 votes = 0;
        for (uint256 index = 0; index < delegated.length; index++) {
            votes = votes + this.balanceOfNFT(delegated[index]);
        }
        return votes;
    }


    /**
     * @notice Determine the prior number of votes for an account as of a block number
     * @dev Block number must be a finalized block or else this function will revert to prevent misinformation.
     * @param tokenId The address of the account to check
     * @param blockNumber The block number to get the vote balance at
     * @return The number of votes the account had as of the given block
     */
    function getPriorVotes(uint256 tokenId, uint256 blockNumber) public view returns (uint256) {
        require(blockNumber < block.number, 'VEDelegation: not yet determined');
        uint256[] memory delegatednft = _getPriorDelegated(tokenId, blockNumber);
        uint256 votes = 0;
        for (uint256 index = 0; index < delegatednft.length; index++) {
            votes = votes + this.balanceOfAtNFT(delegatednft[index], blockNumber);
        }
        return votes;
    }

    /// @notice Removes specific element from the array
    /// @param _array Whole array
    /// @param _element The element which we need to remove
    function removeElement(uint256[] storage _array, uint256 _element) internal {
        for (uint256 i; i < _array.length; i++) {
            if (_array[i] == _element) {
                _array[i] = _array[_array.length - 1];
                _array.pop();
                break;
            }
        }
    }

    /// @notice Remove delegation
    /// @param tokenId TokenId of which delegation needs to be removed
    function removeDelegation(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, 'VEDelegation: Not allowed');
        uint256 nCheckpoints = numCheckpoints[tokenId];
        Checkpoint storage checkpoint = checkpoints[tokenId][nCheckpoints - 1];
        removeElement(checkpoint.delegatedTokenIds, tokenId);
        _writeCheckpoint(tokenId, nCheckpoints, checkpoint.delegatedTokenIds);
    }

    // /// @notice Remove delegation by user
    // function removeDelegationByOwner(uint256 delegatedTokenId, uint256 ownerTokenId) external {
    //     require(ownerOf(ownerTokenId) == msg.sender, 'VEDelegation: Not allowed');
    //     uint256 nCheckpoints = numCheckpoints[delegatedTokenId];
    //     Checkpoint storage checkpoint = checkpoints[delegatedTokenId][nCheckpoints - 1];
    //     removeElement(checkpoint.delegatedTokenIds, delegatedTokenId);
    //     _writeCheckpoint(ownerTokenId, nCheckpoints, checkpoint.delegatedTokenIds);
    // }

    /// @dev Exeute transfer of a NFT.
    ///      Throws unless `msg.sender` is the current owner, an authorized operator, or the approved
    ///      address for this NFT. (NOTE: `msg.sender` not allowed in internal function so pass `_sender`.)
    ///      Throws if `_to` is the zero address.
    ///      Throws if `_from` is not the current owner.
    ///      Throws if `_tokenId` is not a valid NFT.
    function _transferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        address _sender
    ) internal override {
        require(attachments[_tokenId] == 0 && !voted[_tokenId], 'attached');

        // remove the delegation
        this.removeDelegation(_tokenId);

        // Check requirements
        require(_isApprovedOrOwner(_sender, _tokenId));
        // Clear approval. Throws if `_from` is not the current owner
        _clearApproval(_from, _tokenId);
        // Remove NFT. Throws if `_tokenId` is not a valid NFT
        _removeTokenFrom(_from, _tokenId);
        // Add NFT
        _addTokenTo(_to, _tokenId);
        // Set the block of ownership transfer (for Flash NFT protection)
        ownership_change[_tokenId] = block.number;
        // Log the transfer
        emit Transfer(_from, _to, _tokenId);
    }

    /// @notice Changes minimum voting power required for delegation
    /// @param _newMinVotingPower New minimum voting power required
    function changeMinVotingPower(uint256 _newMinVotingPower) external onlyOwner {
        MIN_VOTING_POWER_REQUIRED = _newMinVotingPower;
    }
}
