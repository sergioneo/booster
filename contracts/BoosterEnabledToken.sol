// contracts/BoosterEnabledToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/ERC1155.sol";

abstract contract BoosterEnabledToken is ERC1155 {
    
    constructor(string memory _baseUri) ERC1155(_baseUri) {
        projectManager = msg.sender;
    }
    
    uint256 public ALL_STICKERS;
    address public projectManager;
    
    function expandResults(uint256 seed) external virtual returns(uint256[] memory);
    
    //function cycle(uint256 id) external virtual pure returns (uint256);
    
    function getAllIds() internal view returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](ALL_STICKERS);
        for (uint i = 0; i < ALL_STICKERS; i++) {
            ids[i] = i+1;
        }
        return ids;
    }
    
    function getRepeatedAddress(address _addr) internal view returns(address[] memory) {
        address[] memory addresses = new address[](ALL_STICKERS);
        for (uint i = 0; i < ALL_STICKERS; i++) {
            addresses[i] = _addr;
        }
        return addresses;
    }
    
    function getMyStickers(address user) public view returns(uint256[] memory) {
        return balanceOfBatch(getRepeatedAddress(user), getAllIds());
    }
    
}