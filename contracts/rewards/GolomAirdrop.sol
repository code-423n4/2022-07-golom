// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {Pausable} from '@openzeppelin/contracts/security/Pausable.sol';
import {ReentrancyGuard} from '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import {MerkleProof} from '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';

import {IERC20, SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {IERC721} from '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import {IERC1155} from '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';

interface IVe {
    function create_lock_for(
        uint256 value,
        uint256 lock_duration,
        address to
    ) external returns (uint256);
}

interface IGolomTrader {
    struct Payment {
        uint256 paymentAmt;
        address paymentAddress;
    }

    struct Order {
        address collection; // // collection address
        uint256 tokenId; // order for which tokenid of the collection
        address signer; // maker of order address
        uint256 orderType; // 0 if selling nft for eth , 1 if offering weth for nft,2 if offering weth for collection with special criteria root
        uint256 totalAmt; // price value of the trade // total amt maker is willing to give up per unit of amount
        Payment exchange; // payment agreed by maker of the order to pay on succesful filling of trade this amt is subtracted from totalamt
        Payment prePayment; // another payment , can be used for royalty, facilating trades
        bool isERC721; // standard of the collection , if 721 then true , if 1155 then false
        uint256 tokenAmt; // token amt useful if standard is 1155 if >1 means whole order can be filled tokenAmt times
        uint256 refererrAmt; // amt to pay to the address that helps in filling your order
        bytes32 root; // A merkle root derived from each valid tokenId — set to 0 to indicate a collection-level or tokenId-specific order.
        address reservedAddress; // if not address(0) , only this address can fill the order
        uint256 nonce; // nonce of order usefull for cancelling in bulk
        uint256 deadline; // timestamp till order is valid epoch timestamp in secs
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    function eip712DomainHash() external view returns (bytes32);
}

contract GolomAidrop is Pausable, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;

    bytes32 public immutable DOMAIN_SEPARATOR_EXCHANGE;

    uint256 public immutable MAXIMUM_AMOUNT_TO_CLAIM;

    address public immutable WETH;

    bool public isMerkleRootSet;

    bytes32 public merkleRoot;

    uint256 public endTimestamp;

    IGolomTrader public trader;

    IVe public ve;

    mapping(address => bool) public hasClaimed;

    uint256 public minLockDuration = 365 days;
    uint256 public maxLockDuration = 4 * 365 days;

    event AirdropRewardsClaim(address indexed user, uint256 amount, bool lockTokens);
    event MerkleRootSet(bytes32 merkleRoot);
    event NewEndTimestamp(uint256 endTimestamp);
    event TokensWithdrawn(uint256 amount);

    constructor(
        uint256 _endTimestamp,
        uint256 _maximumAmountToClaim,
        address _token,
        address _trader,
        address _weth,
        address _ve
    ) {
        trader = IGolomTrader(_trader);
        DOMAIN_SEPARATOR_EXCHANGE = trader.eip712DomainHash();
        endTimestamp = _endTimestamp;
        token = IERC20(_token);
        WETH = _weth;
        ve = IVe(_ve);
        token.safeApprove(_ve, type(uint256).max);
        MAXIMUM_AMOUNT_TO_CLAIM = _maximumAmountToClaim;
    }

    function hashPayment(IGolomTrader.Payment memory p) private pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    keccak256('payment(uint256 paymentAmt,address paymentAddress)'),
                    p.paymentAmt,
                    p.paymentAddress
                )
            );
    }

    function _hashOrder(IGolomTrader.Order memory o, uint256[2] memory extra) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    keccak256(
                        'order(address collection,uint256 tokenId,address signer,uint256 orderType,uint256 totalAmt,payment exchange,payment prePayment,bool isERC721,uint256 tokenAmt,uint256 refererrAmt,bytes32 root,address reservedAddress,uint256 nonce,uint256 deadline)payment(uint256 paymentAmt,address paymentAddress)'
                    ),
                    o.collection,
                    o.tokenId,
                    o.signer,
                    o.orderType,
                    o.totalAmt,
                    hashPayment(o.exchange),
                    hashPayment(o.prePayment),
                    o.isERC721,
                    o.tokenAmt,
                    o.refererrAmt,
                    o.root,
                    o.reservedAddress,
                    extra
                )
            );
    }

    // function validateOrder(IGolomTrader.Order memory o) internal view {
    //     require(msg.sender == o.signer, 'invalid signature');
    //     bytes32 hashStruct = _hashOrder(o, [o.nonce, o.deadline]);
    //     bytes32 hash = keccak256(abi.encodePacked('\x19\x01', DOMAIN_SEPARATOR_EXCHANGE, hashStruct));
    //     address signaturesigner = ecrecover(hash, o.v, o.r, o.s);
    //     require(signaturesigner == o.signer, 'invalid signature');
    // }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        require(!isMerkleRootSet, 'Owner: Merkle root already set');

        isMerkleRootSet = true;
        merkleRoot = _merkleRoot;

        emit MerkleRootSet(_merkleRoot);
    }

    function pauseAirdrop() external onlyOwner whenNotPaused {
        _pause();
    }

    function unpauseAirdrop() external onlyOwner whenPaused {
        _unpause();
    }

    function updateEndTimestamp(uint256 newEndTimestamp) external onlyOwner {
        require(block.timestamp + 30 days > newEndTimestamp, 'Owner: New timestamp too far');
        endTimestamp = newEndTimestamp;

        emit NewEndTimestamp(newEndTimestamp);
    }

    function canClaim(
        address user,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external view returns (bool) {
        if (block.timestamp <= endTimestamp) {
            // Compute the node and verify the merkle proof
            bytes32 node = keccak256(abi.encodePacked(user, amount));
            return MerkleProof.verify(merkleProof, merkleRoot, node);
        } else {
            return false;
        }
    }

    function changeLockDuration(uint256 min, uint256 max) external onlyOwner {
        minLockDuration = min;
        maxLockDuration = max;
    }

    function claim(
        uint256 amount,
        bytes32[] calldata merkleProof,
        bool lockTokens
    ) external {
        require(isMerkleRootSet, 'Airdrop: Merkle root not set');
        require(amount <= MAXIMUM_AMOUNT_TO_CLAIM, 'Airdrop: Amount too high');
        require(block.timestamp <= endTimestamp, 'Airdrop: Too late to claim');

        require(!hasClaimed[msg.sender], 'Airdrop: Already claimed');

        bytes32 node = keccak256(abi.encodePacked(msg.sender, amount));
        require(MerkleProof.verify(merkleProof, merkleRoot, node), 'Airdrop: Invalid proof');
        hasClaimed[msg.sender] = true;

        if (lockTokens) {
            ve.create_lock_for(amount, maxLockDuration, msg.sender);
        } else {
            token.safeTransfer(msg.sender, amount / 10);
        }
        emit AirdropRewardsClaim(msg.sender, amount, lockTokens);
    }
}
