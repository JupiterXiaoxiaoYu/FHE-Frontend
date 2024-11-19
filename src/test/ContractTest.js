const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Deployed Contracts Test", function () {
  let owner;
  let accessControl;
  let userRegistry;
  let bankRegistry;
  let dataStorage;
  let taskManagement;

  before(async function () {
    [owner] = await ethers.getSigners();
    
    // 连接到已部署的合约
    accessControl = await ethers.getContractAt(
      "AccessControl",
      "0xc987d2edd07cef2bb02008f14373308383e7176f"
    );

    userRegistry = await ethers.getContractAt(
      "UserRegistryContract",
      "0x4035a74c5f0daead4ae48a9be0415cfaa8a69d34"
    );

    bankRegistry = await ethers.getContractAt(
      "BankRegistryContract",
      "0x7a4d7f6e62abb187ce7996587100ff290b3b82c6"
    );

    dataStorage = await ethers.getContractAt(
      "DataStorageContract",
      "0x6c57328b86c9826a3780160a3d0a5ff7680abac4"
    );

    taskManagement = await ethers.getContractAt(
      "TaskManagementContract",
      "0x74d6307a016c7ed2ee8733cb07dfc4533c46c5ab"
    );
  });

  describe("Access Control", function () {
    it("Should confirm owner is admin", async function () {
      expect(await accessControl.isAdmin(owner.address)).to.be.true;
    });
  });

  describe("User Registry", function () {
    it("Should register a new user", async function () {
      const publicKey = ethers.randomBytes(32);
      const fhePublicKey = ethers.randomBytes(32);
      const serverKey = ethers.randomBytes(32);

      await expect(userRegistry.registerUser(publicKey, fhePublicKey, serverKey))
        .to.emit(userRegistry, "UserRegistered")
        .withArgs(owner.address, 1);

      const user = await userRegistry.users(owner.address);
      expect(user.isActive).to.be.true;
    });
  });

  describe("Bank Registry", function () {
    it("Should register a new bank", async function () {
      // 创建一个新的钱包作为银行
      const bankWallet = ethers.Wallet.createRandom().connect(ethers.provider);
      
      // 添加银行权限
      await accessControl.addBank(bankWallet.address);
      
      const publicKey = ethers.randomBytes(32);
      await expect(bankRegistry.connect(bankWallet).registerBank(publicKey))
        .to.emit(bankRegistry, "BankRegistered")
        .withArgs(bankWallet.address, 1);

      const bank = await bankRegistry.banks(bankWallet.address);
      expect(bank.isActive).to.be.true;
    });
  });

  describe("Task Management", function () {
    it("Should create and complete a task", async function () {
      // 创建银行和用户钱包
      const bankWallet = ethers.Wallet.createRandom().connect(ethers.provider);
      const userWallet = ethers.Wallet.createRandom().connect(ethers.provider);

      // 设置权限
      await accessControl.addBank(bankWallet.address);
      await accessControl.registerUser(userWallet.address);

      // 创建任务
      await expect(taskManagement.connect(userWallet).createTask(
        bankWallet.address,
        "test_task"
      )).to.emit(taskManagement, "TaskCreated")
        .withArgs(1, bankWallet.address, userWallet.address, "test_task");

      // 完成任务
      const result = ethers.randomBytes(32);
      await expect(taskManagement.connect(bankWallet).completeTask(1, result))
        .to.emit(taskManagement, "TaskCompleted")
        .withArgs(1, result);

      const task = await taskManagement.getTask(1);
      expect(task.isCompleted).to.be.true;
    });
  });
}); 