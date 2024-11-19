// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AccessControl.sol";

contract BankRegistryContract {
    AccessControl public accessControl;
    
    struct Bank {
        bytes publicKey;
        uint256 id;
        bool isActive;
    }

    mapping(address => Bank) public banks;
    uint256 public nextBankId = 1;

    event BankRegistered(address indexed bankAddress, uint256 indexed bankId);
    event BankDeactivated(address indexed bankAddress, uint256 indexed bankId);

    constructor(address _accessControl) {
        accessControl = AccessControl(_accessControl);
    }

    function registerBank(bytes memory publicKey) public {
        require(!banks[msg.sender].isActive, "Bank already registered");
        
        uint256 bankId = nextBankId++;
        banks[msg.sender] = Bank(
            publicKey,
            bankId,
            true
        );
        
        accessControl.addBank(msg.sender);
        emit BankRegistered(msg.sender, bankId);
    }

    function deactivateBank(address bankAddress) public {
        require(accessControl.isAdmin(msg.sender), "Only admin can deactivate bank");
        require(banks[bankAddress].isActive, "Bank not active");
        
        banks[bankAddress].isActive = false;
        accessControl.removeBank(bankAddress);
        emit BankDeactivated(bankAddress, banks[bankAddress].id);
    }

    function getBank(address bankAddress) public view returns (Bank memory) {
        require(banks[bankAddress].isActive, "Bank not active");
        return banks[bankAddress];
    }
}
