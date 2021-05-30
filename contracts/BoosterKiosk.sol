// contracts/BoosterKiosk.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "./BoosterEnabledToken.sol";
import "@chainlink/contracts/src/v0.8/dev/VRFConsumerBase.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/IERC1155Receiver.sol";

contract BoosterKiosk is VRFConsumerBase, IERC1155Receiver {
    
    // Chainlink Parameters
    uint256 s_fee;
    bytes32 s_keyHash;
    
    mapping(bytes32 => Request) requests;
    
    /**
    * @notice Handle the receipt of a single ERC1155 token type.
    * @return `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`
    */
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    )
    external override
    returns(bytes4) {
        return this.onERC1155Received.selector;
    }
    
    /**
    * @notice Handle the receipt of multiple ERC1155 token types.
    * @return `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`
    */
    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    )
    external override
    returns(bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
    
    function supportsInterface(bytes4 _id) external view override returns(bool) {
        return true;
    }
    
    constructor() 
        VRFConsumerBase(
            0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9, // VRF Coordinator
            0xa36085F69e2889c224210F603D836748e7dC0088  // LINK Token
        )
    {
        s_keyHash = 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4;
        s_fee = 0.1 * 10 ** 18; // 0.1 LINK (Varies by network)
    }
    
    struct Collection {
        BoosterEnabledToken token;
        string metadataURI;
        string code;
        uint8 boosterSize;
        uint256 boosterPrice;
        uint256 boosterPriceIncrease;
        uint256 sold;
        mapping(address => uint256) unopened;
        mapping(uint256 => uint256) results;
        mapping(uint256 => address) owner;
        bool healthy;
        bool created;
        address projectManager;
        uint256 vault;
    }
    
    struct Request {
        string code;
        uint256 boosterId;
    }
    
    // Percentage fee per booster sold (in 1/10000ths)
    uint256 constant public BOOSTER_FEE = 50; // 0.5%
    uint256 public vault = 0;
    
    mapping(string => Collection) public listedCollections;
    
    function buyBooster(string memory code) public payable collectionExists(code) returns(uint256 boosterId) {
        require(LINK.balanceOf(address(this)) >= s_fee, "Not enough LINK to pay fee");
        Collection storage collection = listedCollections[code];
        require(msg.value >= collection.boosterPrice, "Value sent is not enough to purchase");
        require(collection.unopened[msg.sender] == 0, "No purchases can be made while there are unopened booster packs");
        collection.sold++;
        boosterId = collection.sold;
        collection.unopened[msg.sender] = boosterId;
        collection.owner[boosterId] = msg.sender;
        bytes32 requestId = requestRandomness(s_keyHash, s_fee, 1234);
        Request memory request = Request(code, boosterId);
        requests[requestId] = request;
        if (msg.value > collection.boosterPrice) {
            payable(msg.sender).transfer(msg.value - collection.boosterPrice);
        }
        uint256 moneyToDistribute = collection.boosterPrice;
        uint256 fee = moneyToDistribute * BOOSTER_FEE / 10000;
        vault += fee;
        moneyToDistribute -= fee;
        collection.vault += moneyToDistribute;
        collection.boosterPrice += collection.boosterPrice*collection.boosterPriceIncrease / 10000;
    }
    
    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        Request memory req = requests[requestId];
        Collection storage collection = listedCollections[req.code];
        collection.results[req.boosterId] = randomness;
    }
    
    function openBooster(string memory code) external collectionExists(code) {
        Collection storage collection = listedCollections[code];
        uint256 boosterId = collection.unopened[msg.sender];
        require(boosterId != 0, "No available boosters!");
        require(collection.results[boosterId] != 0, "Booster isn't ready yet");
        uint256[] memory ids = collection.token.expandResults(collection.results[boosterId]);
        uint256[] memory nItems = new uint256[](collection.boosterSize);
        for (uint i = 1; i <= collection.boosterSize; i++) {
            nItems[i-1] = 1;
        }
        collection.token.safeBatchTransferFrom(address(this), collection.owner[boosterId], ids, nItems, "0x00");
        collection.unopened[msg.sender] = 0;
    }
    
    modifier collectionExists(string memory code) {
        require(listedCollections[code].created, "We don't recognize that Collection");
        _;
    }
    
    function listCollection(
        BoosterEnabledToken token,
        string memory metadataURI,
        string memory code,
        uint8 boosterSize,
        uint256 boosterPrice,
        uint256 boosterPriceIncrease) public {
        require(!listedCollections[code].created, "Collection already exists");
        Collection storage collection = listedCollections[code]; 
        collection.token = token;
        collection.metadataURI = metadataURI;
        collection.code = code;
        collection.boosterSize = boosterSize;
        collection.boosterPrice = boosterPrice;
        collection.boosterPriceIncrease = boosterPriceIncrease;
        collection.created = true;
        collection.healthy = true;
        collection.projectManager = token.projectManager();
    }
    
    function withdrawLink() public {
      require(LINK.transfer(msg.sender, LINK.balanceOf(address(this))), "Unable to transfer");
    }
    
    function linkBalance() public view returns (uint256) {
        return LINK.balanceOf(address(this));
    }
    
    function availableBooster(string memory code, address adr) public view collectionExists(code) returns (uint256) {
        return listedCollections[code].unopened[adr];
    }
    
    function boosterStatus(string memory code, uint256 booster) public view collectionExists(code) returns (bool) {
        return listedCollections[code].results[booster] != 0;
    }
    
    
}




