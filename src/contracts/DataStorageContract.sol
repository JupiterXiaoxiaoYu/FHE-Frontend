// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AccessControl.sol";

contract DataStorageContract {
    AccessControl public accessControl;
    
    struct DataEntry {
        address userAddress;
        address bankAddress;
        bytes publicKey;
        string dataType;
        uint256 expiryDate;
        bytes encryptedData;
    }

    DataEntry[] public dataEntries;
    
    event DataStored(
        address indexed userAddress,
        address indexed bankAddress,
        string dataType,
        uint256 indexed expiryDate
    );

    constructor(address _accessControl) {
        accessControl = AccessControl(_accessControl);
    }

    function storeUserData(
        address userAddress,
        bytes memory publicKey,
        string memory dataType,
        uint256 expiryDate,
        bytes memory encryptedData
    ) public {
        require(accessControl.isBank(msg.sender), "Only bank can store data");
        require(accessControl.isRegisteredUser(userAddress), "Invalid user");
        require(expiryDate > block.timestamp, "Invalid expiry date");
        
        dataEntries.push(DataEntry(
            userAddress,
            msg.sender,
            publicKey,
            dataType,
            expiryDate,
            encryptedData
        ));
        
        emit DataStored(userAddress, msg.sender, dataType, expiryDate);
    }

    function getDataByUserAndType(
        address userAddress,
        string memory dataType
    ) public view returns (DataEntry[] memory) {
        require(
            accessControl.isBank(msg.sender) || 
            msg.sender == userAddress, 
            "Not authorized"
        );

        uint256 count = 0;
        for (uint i = 0; i < dataEntries.length; i++) {
            if (dataEntries[i].userAddress == userAddress &&
                keccak256(abi.encodePacked(dataEntries[i].dataType)) == keccak256(abi.encodePacked(dataType)) &&
                dataEntries[i].expiryDate > block.timestamp) {
                count++;
            }
        }

        DataEntry[] memory results = new DataEntry[](count);
        uint256 index = 0;
        for (uint i = 0; i < dataEntries.length; i++) {
            if (dataEntries[i].userAddress == userAddress &&
                keccak256(abi.encodePacked(dataEntries[i].dataType)) == keccak256(abi.encodePacked(dataType)) &&
                dataEntries[i].expiryDate > block.timestamp) {
                results[index] = dataEntries[i];
                index++;
            }
        }
        
        return results;
    }
}
