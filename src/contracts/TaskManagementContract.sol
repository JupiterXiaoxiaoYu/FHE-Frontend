// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AccessControl.sol";

contract TaskManagementContract {
    AccessControl public accessControl;
    
    struct Task {
        uint256 taskId;
        address bankAddress;
        address userAddress;
        string taskType;
        string encryptedResult;
        bytes signature;
        bool isCompleted;
        bool isPublished;
        uint256 createdAt;
    }

    mapping(uint256 => Task) public tasks;
    uint256 public nextTaskId = 1;

    // 记录银行的任务列表
    mapping(address => uint256[]) public bankTasks;
    // 记录用户的任务列表
    mapping(address => uint256[]) public userTasks;

    event TaskCreated(
        uint256 indexed taskId, 
        address indexed bankAddress, 
        address indexed userAddress, 
        string taskType
    );
    event TaskCompleted(uint256 indexed taskId, string result);
    event TaskPublished(uint256 indexed taskId, bytes signature);

    constructor(address _accessControl) {
        accessControl = AccessControl(_accessControl);
    }

    // 防重入锁
    bool private locked;
    modifier noReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    function createTask(
        address bankAddress,
        string memory taskType
    ) public noReentrant {
        require(accessControl.isRegisteredUser(msg.sender), "User not registered");
        require(accessControl.isBank(bankAddress), "Invalid bank address");
        
        uint256 taskId = nextTaskId++;
        tasks[taskId] = Task(
            taskId,
            bankAddress,
            msg.sender,
            taskType,
            "",
            "",
            false,
            false,
            block.timestamp
        );

        // 将任务ID添加到银行和用户的任务列表中
        bankTasks[bankAddress].push(taskId);
        userTasks[msg.sender].push(taskId);
        
        emit TaskCreated(taskId, bankAddress, msg.sender, taskType);
    }

    function completeTask(
        uint256 taskId, 
        string memory result
    ) public noReentrant {
        require(accessControl.isBank(msg.sender), "Caller is not bank");
        
        Task storage task = tasks[taskId];
        require(!task.isCompleted, "Task already completed");
        require(task.bankAddress == msg.sender, "Not assigned bank");
        
        task.encryptedResult = result;
        task.isCompleted = true;
        emit TaskCompleted(taskId, result);
    }

    function publishTaskResult(
        uint256 taskId, 
        bytes memory signature
    ) public noReentrant {
        require(accessControl.isRegisteredUser(msg.sender), "User not registered");
        
        Task storage task = tasks[taskId];
        require(task.isCompleted, "Task not completed");
        require(!task.isPublished, "Task already published");
        require(task.userAddress == msg.sender, "Not task owner");

        task.signature = signature;
        task.isPublished = true;
        emit TaskPublished(taskId, signature);
    }

    // 获取单个任务详情
    function getTask(uint256 taskId) public view returns (Task memory) {
        return tasks[taskId];
    }

    // 获取银行的所有任务ID
    function getBankTasks(address bankAddress) public view returns (uint256[] memory) {
        require(
            msg.sender == bankAddress || accessControl.isAdmin(msg.sender),
            "Not authorized"
        );
        return bankTasks[bankAddress];
    }

    // 获取用户的所有任务ID
    function getUserTasks(address userAddress) public view returns (uint256[] memory) {
        require(
            msg.sender == userAddress || accessControl.isAdmin(msg.sender),
            "Not authorized"
        );
        return userTasks[userAddress];
    }

    // 获取银行的未完成任务
    function getBankPendingTasks(address bankAddress) public view returns (Task[] memory) {
        require(msg.sender == bankAddress, "Not authorized");
        
        uint256[] memory bankTaskIds = bankTasks[bankAddress];
        uint256 pendingCount = 0;
        
        // 首先计算未完成任务的数量
        for (uint256 i = 0; i < bankTaskIds.length; i++) {
            if (!tasks[bankTaskIds[i]].isCompleted) {
                pendingCount++;
            }
        }
        
        // 创建结果数组并填充
        Task[] memory pendingTasks = new Task[](pendingCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < bankTaskIds.length; i++) {
            if (!tasks[bankTaskIds[i]].isCompleted) {
                pendingTasks[currentIndex] = tasks[bankTaskIds[i]];
                currentIndex++;
            }
        }
        
        return pendingTasks;
    }

    // 获取用户的未完成任务
    function getUserPendingTasks(address userAddress) public view returns (Task[] memory) {
        require(msg.sender == userAddress, "Not authorized");
        
        uint256[] memory userTaskIds = userTasks[userAddress];
        uint256 pendingCount = 0;
        
        // 首先计算未完成任务的数量
        for (uint256 i = 0; i < userTaskIds.length; i++) {
            if (!tasks[userTaskIds[i]].isPublished) {
                pendingCount++;
            }
        }
        
        // 创建结果数组并填充
        Task[] memory pendingTasks = new Task[](pendingCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < userTaskIds.length; i++) {
            if (!tasks[userTaskIds[i]].isPublished) {
                pendingTasks[currentIndex] = tasks[userTaskIds[i]];
                currentIndex++;
            }
        }
        
        return pendingTasks;
    }

    // 获取银行的已完成但未发布的任务
    function getBankCompletedUnpublishedTasks(
        address bankAddress
    ) public view returns (Task[] memory) {
        require(
            msg.sender == bankAddress || 
            accessControl.isAdmin(msg.sender),
            "Not authorized"
        );
        require(accessControl.isBank(bankAddress), "Not a bank address");
        
        uint256[] memory bankTaskIds = bankTasks[bankAddress];
        uint256 count = 0;
        
        // 计算符合条件的任务数量
        for (uint256 i = 0; i < bankTaskIds.length; i++) {
            Task memory task = tasks[bankTaskIds[i]];
            if (task.isCompleted && !task.isPublished) {
                count++;
            }
        }
        
        // 创建结果数组
        Task[] memory resultTasks = new Task[](count);
        uint256 currentIndex = 0;
        
        // 填充结果数组
        for (uint256 i = 0; i < bankTaskIds.length; i++) {
            Task memory task = tasks[bankTaskIds[i]];
            if (task.isCompleted && !task.isPublished) {
                resultTasks[currentIndex] = task;
                currentIndex++;
            }
        }
        
        return resultTasks;
    }

    // 获取银行的已完成且已发布的任务
    function getBankCompletedAndPublishedTasks(
        address bankAddress
    ) public view returns (Task[] memory) {
        require(
            msg.sender == bankAddress || 
            accessControl.isAdmin(msg.sender),
            "Not authorized"
        );
        require(accessControl.isBank(bankAddress), "Not a bank address");
        
        uint256[] memory bankTaskIds = bankTasks[bankAddress];
        uint256 count = 0;
        
        // 计算符合条件的任务数量
        for (uint256 i = 0; i < bankTaskIds.length; i++) {
            Task memory task = tasks[bankTaskIds[i]];
            if (task.isCompleted && task.isPublished) {
                count++;
            }
        }
        
        // 创建结果数组
        Task[] memory resultTasks = new Task[](count);
        uint256 currentIndex = 0;
        
        // 填充结果数组
        for (uint256 i = 0; i < bankTaskIds.length; i++) {
            Task memory task = tasks[bankTaskIds[i]];
            if (task.isCompleted && task.isPublished) {
                resultTasks[currentIndex] = task;
                currentIndex++;
            }
        }
        
        return resultTasks;
    }

    // 获取用户的已完成但未发布的任务
    function getUserCompletedUnpublishedTasks(
        address userAddress
    ) public view returns (Task[] memory) {
        require(
            msg.sender == userAddress || 
            accessControl.isAdmin(msg.sender),
            "Not authorized"
        );
        require(accessControl.isRegisteredUser(userAddress), "Not a registered user");
        
        uint256[] memory userTaskIds = userTasks[userAddress];
        uint256 count = 0;
        
        // 计算符合条件的任务数量
        for (uint256 i = 0; i < userTaskIds.length; i++) {
            Task memory task = tasks[userTaskIds[i]];
            if (task.isCompleted && !task.isPublished) {
                count++;
            }
        }
        
        // 创建结果数组
        Task[] memory resultTasks = new Task[](count);
        uint256 currentIndex = 0;
        
        // 填充结果数组
        for (uint256 i = 0; i < userTaskIds.length; i++) {
            Task memory task = tasks[userTaskIds[i]];
            if (task.isCompleted && !task.isPublished) {
                resultTasks[currentIndex] = task;
                currentIndex++;
            }
        }
        
        return resultTasks;
    }

    // 获取用户的已完成且已发布的任务
    function getUserCompletedAndPublishedTasks(
        address userAddress
    ) public view returns (Task[] memory) {
        require(
            msg.sender == userAddress || 
            accessControl.isAdmin(msg.sender),
            "Not authorized"
        );
        require(accessControl.isRegisteredUser(userAddress), "Not a registered user");
        
        uint256[] memory userTaskIds = userTasks[userAddress];
        uint256 count = 0;
        
        // 计算符合条件的任务数量
        for (uint256 i = 0; i < userTaskIds.length; i++) {
            Task memory task = tasks[userTaskIds[i]];
            if (task.isCompleted && task.isPublished) {
                count++;
            }
        }
        
        // 创建结果数组
        Task[] memory resultTasks = new Task[](count);
        uint256 currentIndex = 0;
        
        // 填充结果数组
        for (uint256 i = 0; i < userTaskIds.length; i++) {
            Task memory task = tasks[userTaskIds[i]];
            if (task.isCompleted && task.isPublished) {
                resultTasks[currentIndex] = task;
                currentIndex++;
            }
        }
        
        return resultTasks;
    }
}