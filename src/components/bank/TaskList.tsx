import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, message, Modal, List, Typography, Spin, Radio, Badge, Space } from 'antd';
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
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'published'>('pending');
  const [pendingTasks, setPendingTasks] = useState<ContractTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<ContractTask[]>([]);
  const [publishedTasks, setPublishedTasks] = useState<ContractTask[]>([]);

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

      // 获取三种类型的任务
      const [pending, completed, published] = await Promise.all([
        taskManagement.getBankPendingTasks(wallet.address),
        taskManagement.getBankCompletedUnpublishedTasks(wallet.address),
        taskManagement.getBankCompletedAndPublishedTasks(wallet.address)
      ]);

      // 转换任务数据格式的函数
      const formatTasks = (tasks: any[]) => tasks.map((task: any) => ({
        taskId: task.taskId.toString(),
        bankAddress: task.bankAddress,
        userAddress: task.userAddress,
        taskType: task.taskType,
        encryptedResult: task.encryptedResult,
        signature: task.signature,
        isCompleted: task.isCompleted,
        isPublished: task.isPublished,
        createdAt: parseInt(task.createdAt._hex, 16)
      }));

      setPendingTasks(formatTasks(pending));
      setCompletedTasks(formatTasks(completed));
      setPublishedTasks(formatTasks(published));
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
      render: (_, record: ContractTask) => (
        <Tag color={
          !record.isCompleted 
            ? 'blue' 
            : record.isPublished 
              ? 'green' 
              : 'orange'
        }>
          {!record.isCompleted 
            ? 'Pending' 
            : record.isPublished 
              ? 'Published' 
              : 'Completed'}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record: ContractTask) => (
        <Space>
          {!record.isCompleted && (
            <Button 
              type="primary"
              onClick={() => handleProcessTask(record)}
            >
              Process
            </Button>
          )}
          {record.isCompleted && !record.isPublished && (
            <Button type="default" disabled>
              Waiting for User
            </Button>
          )}
          {record.isPublished && (
            <Button 
              type="link" 
              onClick={() => {
                setCurrentTask(record);
                setComputationResult(record.encryptedResult);
                setIsResultModalVisible(true);
              }}
            >
              View Result
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <>
      {contextHolder}
      <Card title="Bank Tasks" className="w-full">
        <div className="flex flex-col space-y-6">
          {/* Tabs Container */}
          <div className="flex justify-center">
            <Radio.Group 
              value={activeTab} 
              onChange={e => setActiveTab(e.target.value)}
              size="large"
              className="shadow-sm"
            >
              <Radio.Button value="pending">
                <div className="px-2 py-1">
                  <span>Pending Tasks</span>
                  <Badge count={pendingTasks.length} className="ml-2" />
                </div>
              </Radio.Button>
              <Radio.Button value="completed">
                <div className="px-2 py-1">
                  <span>Completed Unpublished</span>
                  <Badge count={completedTasks.length} className="ml-2" />
                </div>
              </Radio.Button>
              <Radio.Button value="published">
                <div className="px-2 py-1">
                  <span>Published</span>
                  <Badge count={publishedTasks.length} className="ml-2" />
                </div>
              </Radio.Button>
            </Radio.Group>
          </div>

          {/* Table Container */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spin size="large" />
            </div>
          ) : (
            <div className="mt-4">
              <Table
                dataSource={
                  activeTab === 'pending' 
                    ? pendingTasks 
                    : activeTab === 'completed' 
                      ? completedTasks 
                      : publishedTasks
                }
                columns={columns}
                rowKey="taskId"
                pagination={false}
              />
            </div>
          )}
        </div>
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