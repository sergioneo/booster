// contracts/CryptoEmblems.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "./BoosterEnabledToken.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/math/SafeMath.sol";

contract CryptoEmblems is BoosterEnabledToken {
    using SafeMath for uint256;
    
    uint256 constant BOOSTER_SIZE = 2;
    bool LOCK_MINTING = false;
    
    constructor() BoosterEnabledToken("https://gateway.pinata.cloud/ipfs/QmXW8JHDPrxe3tx2zHoRP3mEJAMNwzwRyk56EYsaAqcqSx/") {
        ALL_STICKERS = 10;
    }
    
    function mintTokens(address store) public {
        require(!LOCK_MINTING, "Minting is locked");
        uint256[] memory ids = new uint256[](10);
        uint256[] memory nItems = new uint256[](10);
        for (uint i = 1; i <= 10; i++) {
            ids[i-1] = i;
        }
        for (uint i = 1; i <= 10; i++) {
            nItems[i-1] = 10000;
        }
        _mintBatch(store, ids, nItems, "0x00");
        LOCK_MINTING = true;
    }
    
    function expandResults(uint256 seed) public pure override returns(uint256[] memory results) {
        results = new uint256[](BOOSTER_SIZE);
        for(uint i = 0; i < BOOSTER_SIZE; i++) {
            results[i] = uint256(keccak256(abi.encode(seed, i))).mod(10).add(1);
        }
        return results;
    }
    
    
}