// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AccessControl {
    mapping(address => bool) public isAdmin;
    mapping(address => bool) public isBank;
    mapping(address => bool) public isRegisteredUser;
    
    event AdminAdded(address indexed account);
    event AdminRemoved(address indexed account);
    event BankAdded(address indexed account);
    event BankRemoved(address indexed account);
    event UserRegistered(address indexed account);
    event UserRemoved(address indexed account);

    constructor() {
        isAdmin[msg.sender] = true;
    }

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Caller is not admin");
        _;
    }

    modifier onlyBank() {
        require(isBank[msg.sender], "Caller is not bank");
        _;
    }

    modifier onlyRegisteredUser() {
        require(isRegisteredUser[msg.sender], "Caller is not registered user");
        _;
    }

    function addAdmin(address account) public onlyAdmin {
        isAdmin[account] = true;
        emit AdminAdded(account);
    }

    function removeAdmin(address account) public onlyAdmin {
        isAdmin[account] = false;
        emit AdminRemoved(account);
    }

    function addBank(address account) public  { //onlyAdmin
        isBank[account] = true;
        emit BankAdded(account);
    }

    function removeBank(address account) public onlyAdmin {
        isBank[account] = false;
        emit BankRemoved(account);
    }

    function registerUser(address account) public {
        isRegisteredUser[account] = true;
        emit UserRegistered(account);
    }

    function removeUser(address account) public onlyAdmin {
        isRegisteredUser[account] = false;
        emit UserRemoved(account);
    }
} 