// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AccessControl.sol";

contract UserRegistryContract {
    AccessControl public accessControl;

    struct User {
        bytes publicKey;
        string fhePublicKey;
        string serverKey;
        uint256 id;
        bool isActive;
    }

    mapping(address => User) public users;
    uint256 public nextUserId = 1;

    event UserRegistered(address indexed userAddress, uint256 indexed userId);
    event UserDeactivated(address indexed userAddress, uint256 indexed userId);

    constructor(address _accessControl) {
        accessControl = AccessControl(_accessControl);
    }

    function registerUser(
        bytes memory publicKey,
        string memory fhePublicKey,
        string memory serverKey
    ) public {
        require(!users[msg.sender].isActive, "User already registered");
        require(bytes(fhePublicKey).length > 0 && bytes(serverKey).length > 0, "Invalid keys");
        uint256 userId = nextUserId++;
        users[msg.sender] = User(
            publicKey,
            fhePublicKey,
            serverKey,
            userId,
            true
        );

        accessControl.registerUser(msg.sender);
        emit UserRegistered(msg.sender, userId);
    }

    function deactivateUser(address userAddress) public {
        require(
            accessControl.isAdmin(msg.sender) || msg.sender == userAddress,
            "Not authorized"
        );
        require(users[userAddress].isActive, "User not active");

        users[userAddress].isActive = false;
        emit UserDeactivated(userAddress, users[userAddress].id);
    }

    function getUser(address userAddress) public view returns (User memory) {
        require(users[userAddress].isActive, "User not active");
        return users[userAddress];
    }
}
