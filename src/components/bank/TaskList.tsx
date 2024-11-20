import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, message, Modal, List, Typography, Spin } from 'antd';
import { CheckCircleOutlined, SyncOutlined, LockOutlined, CalculatorOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';
import contractConfig from '../../config/contracts';

const { Text } = Typography;

interface ContractTask {
  taskId: string;
  bankAddress: string;
  userAddress: string;
  taskType: string;
  encryptedResult: string;
  signature: string;
  isCompleted: boolean;
  isPublished: boolean;
  createdAt: number;
}

export const TaskList: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<ContractTask | null>(null);
  const [tasks, setTasks] = useState<ContractTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);

  // 获取银行任务列表
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const storedWallet = localStorage.getItem('wallet');
      if (!storedWallet) {
        messageApi.error('Please connect your wallet first!');
        return;
      }

      const wallet = JSON.parse(storedWallet);
      const provider = new ethers.providers.JsonRpcProvider('/api');
      const signer = new ethers.Wallet(wallet.privateKey, provider);
      const taskManagement = new ethers.Contract(
        contractConfig.TaskManagement.address,
        contractConfig.TaskManagement.abi,
        signer
      );

      // 获取银行的待处理任务
      const pendingTasks = await taskManagement.getBankPendingTasks(wallet.address);

      console.log('pendingTasks', pendingTasks);
      
      // 转换任务数据格式
      const formattedTasks = pendingTasks.map((task: any) => {
        // 将 BigNumber 转换为数字
        const timestamp = parseInt(task.createdAt._hex, 16);  // 将 16 进制转换为 10 进制
        
        return {
          taskId: task.taskId.toString(),
          bankAddress: task.bankAddress,
          userAddress: task.userAddress,
          taskType: task.taskType,
          encryptedResult: task.encryptedResult,
          signature: task.signature,
          isCompleted: task.isCompleted,
          isPublished: task.isPublished,
          createdAt: timestamp  // 将秒转换为毫秒
        };
      });

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      messageApi.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleProcessTask = async (task: ContractTask) => {
    setCurrentTask(task);
    setIsModalVisible(true);
  };

  const handleRequestComputation = async () => {
    if (!currentTask) return;

    try {
      setProcessingTaskId(currentTask.taskId);
      const storedWallet = localStorage.getItem('wallet');
      if (!storedWallet) {
        messageApi.error('Please connect your wallet first!');
        return;
      }

      const wallet = JSON.parse(storedWallet);
      const provider = new ethers.providers.JsonRpcProvider('/api');
      const signer = new ethers.Wallet(wallet.privateKey, provider);
      
      const taskManagement = new ethers.Contract(
        contractConfig.TaskManagement.address,
        contractConfig.TaskManagement.abi,
        signer
      );

      // 这里应该是实际的计算结果，现在用模拟数据
      const mockResult = ethers.utils.toUtf8Bytes('encrypted-result-' + Date.now());
      
      const tx = await taskManagement.completeTask(
        currentTask.taskId,
        mockResult
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      messageApi.success('Task completed successfully!');
      setIsModalVisible(false);
      setCurrentTask(null);
      fetchTasks(); // 刷新任务列表

    } catch (error: any) {
      console.error('Failed to complete task:', error);
      if (error.message.includes('Caller is not bank')) {
        messageApi.error('Only registered banks can complete tasks!');
      } else if (error.message.includes('Task already completed')) {
        messageApi.error('This task has already been completed!');
      } else {
        messageApi.error('Failed to complete task: ' + error.message);
      }
    } finally {
      setProcessingTaskId(null);
    }
  };

  const columns = [
    {
      title: 'Task ID',
      dataIndex: 'taskId',
      key: 'taskId',
    },
    {
      title: 'User Address',
      dataIndex: 'userAddress',
      key: 'userAddress',
      render: (text: string) => (
        <div className="flex items-center">
          <Text copyable className="mb-0 leading-none">
            {text.substring(0, 10)}...
          </Text>
        </div>
      ),
    },
    {
      title: 'Business Type',
      dataIndex: 'taskType',
      key: 'taskType',
      render: (text: string) => <Tag color="blue">{text.toUpperCase()}</Tag>,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (timestamp: number) => new Date(timestamp).toLocaleString(),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: ContractTask) => (
        <Tag
          icon={record.isCompleted ? <CheckCircleOutlined /> : <SyncOutlined spin />}
          color={record.isCompleted ? 'success' : 'processing'}
        >
          {record.isCompleted ? 'COMPLETED' : 'PENDING'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: ContractTask) => (
        !record.isCompleted && (
          <Button
            type="primary"
            icon={<LockOutlined />}
            onClick={() => handleProcessTask(record)}
            loading={processingTaskId === record.taskId}
          >
            Process Task
          </Button>
        )
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Card 
        title="Task List"
        extra={
          <Button type="primary" onClick={fetchTasks} loading={loading}>
            Refresh
          </Button>
        }
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            dataSource={tasks}
            columns={columns}
            rowKey="taskId"
            pagination={false}
          />
        )}
      </Card>

      <Modal
        title={`Process Task: ${currentTask?.taskId}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="compute"
            type="primary"
            icon={<CalculatorOutlined />}
            onClick={handleRequestComputation}
            loading={processingTaskId === currentTask?.taskId}
          >
            Complete Task with FHE Computation
          </Button>
        ]}
        width={600}
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Task Details:</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p><strong>User Address:</strong> {currentTask?.userAddress}</p>
              <p><strong>Business Type:</strong> {currentTask?.taskType}</p>
              <p><strong>Created At:</strong> {currentTask?.createdAt && 
                new Date(currentTask.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}; 