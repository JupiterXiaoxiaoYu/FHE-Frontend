import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, message, Modal, List, Typography, Spin } from 'antd';
import { CheckCircleOutlined, SyncOutlined, LockOutlined, CalculatorOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';
import contractConfig from '../../config/contracts';
import { DataType, fheApi } from '../../services/fheApi';

const { Text } = Typography;

//maps DataType to taskType
const taskTypeMap: Record<string, DataType> = {
  loan: 'monthly_income',
  credit: 'credit_score',
  mortgage: 'property_value'
};

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
  const [userDataLoading, setUserDataLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [computationLoading, setComputationLoading] = useState(false);
  const [computationResult, setComputationResult] = useState<string | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [isDataModalVisible, setIsDataModalVisible] = useState(false);
  const [expandedData, setExpandedData] = useState<Record<number, boolean>>({});
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [expandedResult, setExpandedResult] = useState(false);

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

  const handleRequestUserData = async () => {
    if (!currentTask) return;
    try {
      setUserDataLoading(true);
      const storedWallet = localStorage.getItem('wallet');
      if (!storedWallet) {
        messageApi.error('Please connect your wallet first!');
        return;
      }

      const wallet = JSON.parse(storedWallet);
      const provider = new ethers.providers.JsonRpcProvider('/api');
      const signer = new ethers.Wallet(wallet.privateKey, provider);
      
      const dataStorage = new ethers.Contract(
        contractConfig.DataStorage.address,
        contractConfig.DataStorage.abi,
        signer
      );

      // 获取用户数据
      console.log('currentTask.taskType', currentTask.taskType);
      console.log('taskTypeMap[currentTask.taskType as DataType]', taskTypeMap[currentTask.taskType as DataType]);
      console.log('currentTask.userAddress', currentTask.userAddress);
      const data = await dataStorage.getDataByUserAndType(
        currentTask.userAddress,
        taskTypeMap[currentTask.taskType as DataType]
      );

      console.log('data', data);

      setUserData(data);
      messageApi.success('User data retrieved successfully!');
    } catch (error: any) {
      console.error('Failed to get user data:', error);
      messageApi.error('Failed to get user data: ' + error.message);
    } finally {
      setUserDataLoading(false);
    }
  };

  const handleRequestComputation = async () => {
    if (!currentTask || !userData) return;
    try {
      setComputationLoading(true);
      const storedWallet = localStorage.getItem('wallet');
      if (!storedWallet) {
        messageApi.error('Please connect your wallet first!');
        return;
      }
      
      // 从用户数据中提取加密值
      const encryptedValues = userData.map((entry: any) => entry.encryptedData);
      
      // 调用 FHE 计算接口
      const computationResponse = await fheApi.compute(
        currentTask.userAddress,
        currentTask.taskId,
        taskTypeMap[currentTask.taskType as DataType],
        encryptedValues
      );

      console.log('Computation response:', computationResponse);
      
      // 保存计算结果
      setComputationResult(computationResponse.result);
      messageApi.success('FHE computation completed successfully!');
    } catch (error: any) {
      console.error('Failed to compute result:', error);
      if (error.response?.data?.message) {
        messageApi.error('Computation failed: ' + error.response.data.message);
      } else {
        messageApi.error('Failed to compute result: ' + error.message);
      }
    } finally {
      setComputationLoading(false);
    }
  };

  const handlePublishResult = async () => {
    if (!currentTask || !computationResult) return;
    try {
      setPublishLoading(true);
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

      console.log('computationResult', computationResult);

      const tx = await taskManagement.completeTask(
        currentTask.taskId,
        computationResult
      );


      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      messageApi.success('Task completed successfully!');
      setIsModalVisible(false);
      setCurrentTask(null);
      setUserData(null);
      setComputationResult(null);
      fetchTasks();
    } catch (error: any) {
      console.error('Failed to publish result:', error);
      messageApi.error('Failed to publish result: ' + error.message);
    } finally {
      setPublishLoading(false);
    }
  };

  const toggleExpand = (index: number) => {
    setExpandedData(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
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
        onCancel={() => {
          setIsModalVisible(false);
          setUserData(null);
          setComputationResult(null);
        }}
        footer={null}
        width={600}
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Task Details:</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p><strong>User Address:</strong> {currentTask?.userAddress}</p>
              <p><strong>Business Type:</strong> {currentTask?.taskType}</p>
              <p><strong>Created At:</strong> {currentTask?.createdAt && 
                new Date(currentTask.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Button
                type="primary"
                icon={<LockOutlined />}
                onClick={handleRequestUserData}
                loading={userDataLoading}
                disabled={!!userData}
                block
              >
                Request User Data According to Business Type
              </Button>
              {userData && (
                <div className="mt-2 space-y-2">
                  <div className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <Text type="success">User data retrieved successfully!</Text>
                    <Button 
                      type="link" 
                      onClick={() => setIsDataModalVisible(true)}
                      className="ml-2"
                    >
                      View Data
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Button
                type="primary"
                icon={<CalculatorOutlined />}
                onClick={handleRequestComputation}
                loading={computationLoading}
                disabled={!userData || !!computationResult}
                block
              >
                Request FHE Computation
              </Button>
              {computationResult && (
                <div className="mt-2 space-y-2">
                  <div className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <Text type="success">Computation completed successfully!</Text>
                    <Button 
                      type="link" 
                      onClick={() => setIsResultModalVisible(true)}
                      className="ml-2"
                    >
                      View Result
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handlePublishResult}
                loading={publishLoading}
                disabled={!computationResult}
                block
              >
                Publish Result and Complete Task
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title="User Data Details"
        open={isDataModalVisible}
        onCancel={() => {
          setIsDataModalVisible(false);
          setExpandedData({});
        }}
        footer={null}
        width={500}
      >
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {userData && userData.map((entry: any, index: number) => (
              <Card key={index} size="small" className="shadow-sm">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Text strong>Data Entry {index + 1} {" "} </Text>
                    <Tag color="blue">{entry.dataType}</Tag>
                  </div>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    <div>
                      <Text type="secondary">Bank Address:</Text>
                      <div className="font-mono bg-gray-50 p-2 rounded text-sm mt-1">
                        {entry.bankAddress}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">Encrypted Data:</Text>
                      <div className="font-mono bg-gray-50 p-2 rounded text-sm mt-1">
                        <div className="break-all">
                          {expandedData[index] 
                            ? entry.encryptedData
                            : entry.encryptedData.substring(0, 50) + '...'
                          }
                        </div>
                        <Button 
                          type="link" 
                          onClick={() => toggleExpand(index)}
                          size="small"
                          className="mt-1 p-0"
                        >
                          {expandedData[index] ? 'Show Less' : 'Show More'}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">Expiry Date:</Text>
                      <div className="text-sm mt-1">
                        {new Date(entry.expiryDate * 1000).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        title="Computation Result"
        open={isResultModalVisible}
        onCancel={() => {
          setIsResultModalVisible(false);
          setExpandedResult(false);
        }}
        footer={null}
        width={500}
      >
        <div className="space-y-4">
          <Card size="small" className="shadow-sm">
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-2">
                <Text strong>Task ID: {currentTask?.taskId} {" "} </Text>
                <Tag color="green"> Completed</Tag>
              </div>
              <div className="grid grid-cols-1 gap-2 mt-2">
                <div>
                  <Text type="secondary">Business Type:</Text>
                  <div className="text-sm mt-1">
                    {currentTask?.taskType}
                  </div>
                </div>
                <div>
                  <Text type="secondary">Encrypted Result:</Text>
                  <div className="font-mono bg-gray-50 p-2 rounded text-sm mt-1">
                    <div className="break-all">
                      {expandedResult 
                        ? computationResult
                        : computationResult?.substring(0, 50) + '...'
                      }
                    </div>
                    <Button 
                      type="link" 
                      onClick={() => setExpandedResult(!expandedResult)}
                      size="small"
                      className="mt-1 p-0"
                    >
                      {expandedResult ? 'Show Less' : 'Show More'}
                    </Button>
                  </div>
                </div>
                <div>
                  <Text type="secondary">Computation Time:</Text>
                  <div className="text-sm mt-1">
                    {new Date().toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Modal>
    </>
  );
}; 