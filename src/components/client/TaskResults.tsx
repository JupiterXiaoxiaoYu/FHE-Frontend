import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, message, Modal, Space, Typography, Form, Input, Select, Radio, Badge } from 'antd';
import { 
  CheckCircleOutlined, 
  SyncOutlined, 
  PlayCircleOutlined, 
  LockOutlined, 
  UnlockOutlined, 
  CloudUploadOutlined,
  PlusOutlined,
  BankOutlined 
} from '@ant-design/icons';
import { Task } from '../../types';
import { ethers } from 'ethers';
import contractConfig from '../../config/contracts';

const { Paragraph, Title, Text } = Typography;
const { Option } = Select;

interface BusinessTaskRequest {
  bankAddress: string;
  businessType: string;
}

interface TaskResult {
  taskId: string;
  encryptedResult: string;
  decryptedResult?: string;
}

// const mockTasks: Task[] = [
//   {
//     id: '1',
//     bankId: 'bank1',
//     businessType: 'Loan Application',
//     status: 'pending'
//   },
//   {
//     id: '2',
//     bankId: 'bank2',
//     businessType: 'Credit Assessment',
//     status: 'pending'
//   }
// ];

export const TaskResults: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isNewTaskModalVisible, setIsNewTaskModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null);
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [tasks, setTasks] = useState<Task[]>();
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'published'>('pending');
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [publishedTasks, setPublishedTasks] = useState<Task[]>([]);

  useEffect(() => {
    refreshTasks();
  }, [isModalVisible]);

  const handleProcessTask = (task: Task) => {
    setCurrentTask(task);
    setTaskResult(null);
    setIsDecrypted(false);
    setIsModalVisible(true);
  };

  const handleRequestResult = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockResult: TaskResult = {
        taskId: currentTask!.id,
        encryptedResult: 'encrypted-result-' + Math.random().toString(36).substring(7)
      };
      setTaskResult(mockResult);
      messageApi.success('Encrypted result retrieved successfully!');
    } catch (error) {
      messageApi.error('Failed to retrieve result!');
      console.error('Result retrieval failed:', error);
    }
  };

  const handleDecryptAndSign = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTaskResult(prev => ({
        ...prev!,
        decryptedResult: 'decrypted-result-' + Math.random().toString(36).substring(7)
      }));
      setIsDecrypted(true);
      messageApi.success('Result decrypted and signed successfully!');
    } catch (error) {
      messageApi.error('Failed to decrypt and sign!');
      console.error('Decrypt and sign failed:', error);
    }
  };

  const handlePublishAndFinish = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      messageApi.success('Result published and task completed!');
      setIsModalVisible(false);
      setCurrentTask(null);
      setTaskResult(null);
      setIsDecrypted(false);
    } catch (error) {
      messageApi.error('Failed to publish result!');
      console.error('Result publishing failed:', error);
    }
  };

  const handleNewTask = async (values: BusinessTaskRequest) => {
    try {
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

      const tx = await taskManagement.createTask(
        values.bankAddress,
        values.businessType
      );

      console.log('Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      const taskCreatedEvent = receipt.events?.find(
        (event: any) => event.event === 'TaskCreated'
      );

      if (taskCreatedEvent) {
        const taskId = taskCreatedEvent.args.taskId.toString();
        messageApi.success(`Business task created successfully! Task ID: ${taskId}`);
        
        setIsNewTaskModalVisible(false);
        form.resetFields();

        // await refreshTasks();
      } else {
        throw new Error('Task creation event not found in transaction receipt');
      }

    } catch (error: any) {
      console.error('Failed to create task:', error);
      
      if (error.message.includes('User not registered')) {
        messageApi.error('You must be a registered user to create tasks!');
      } else if (error.message.includes('Invalid bank address')) {
        messageApi.error('The provided bank address is not valid!');
      } else {
        messageApi.error('Failed to create business task: ' + error.message);
      }
    }
  };

  const refreshTasks = async () => {
    try {
      const storedWallet = localStorage.getItem('wallet');
      if (!storedWallet) return;

      const wallet = JSON.parse(storedWallet);
      const provider = new ethers.providers.JsonRpcProvider('/api');
      const signer = new ethers.Wallet(wallet.privateKey, provider);

      const taskManagement = new ethers.Contract(
        contractConfig.TaskManagement.address,
        contractConfig.TaskManagement.abi,
        signer
      );

      const [pending, completed, published] = await Promise.all([
        taskManagement.getUserPendingTasks(wallet.address),
        taskManagement.getUserCompletedUnpublishedTasks(wallet.address),
        taskManagement.getUserCompletedAndPublishedTasks(wallet.address)
      ]);

      const formatTasks = (tasks: any[]): Task[] => tasks.map((task: any) => ({
        id: task.taskId.toString(),
        bankId: task.bankAddress,
        businessType: task.taskType,
        status: task.isCompleted 
          ? (task.isPublished ? 'published' : 'completed') 
          : 'pending',
        createdAt: parseInt(task.createdAt._hex, 16)
        // Ensure all required fields are included and correctly typed
      }));

      setPendingTasks(formatTasks(pending));
      setCompletedTasks(formatTasks(completed));
      setPublishedTasks(formatTasks(published));
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      messageApi.error('Failed to load tasks');
    }
  };

  const columns = [
    {
      title: 'Task ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Bank ID',
      dataIndex: 'bankId',
      key: 'bankId',
    },
    {
      title: 'Business Type',
      dataIndex: 'businessType',
      key: 'businessType',
      render: (text: string) => <Tag color="blue">{text.toUpperCase()}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag
          icon={status === 'completed' ? <CheckCircleOutlined /> : <SyncOutlined spin />}
          color={status === 'completed' ? 'success' : 'processing'}
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Task) => (
        <Space>
          {record.status === 'pending' && (
            <Button
              type="default"
              icon={<SyncOutlined spin />}
            >
              Waiting for Bank
            </Button>
          )}
          {record.status === 'completed' && (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => handleProcessTask(record)}
            >
              Process Result
            </Button>
          )}
          {record.status === 'published' && (
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => handleProcessTask(record)}
            >
              View Result
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Card 
        className="shadow-md hover:shadow-lg transition-shadow duration-300"
        title="Task Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsNewTaskModalVisible(true)}
          >
            New Business Task
          </Button>
        }
      >
        <div className="flex flex-col space-y-6">
          <div className="flex justify-center">
            <Radio.Group 
              value={activeTab} 
              onChange={e => setActiveTab(e.target.value)}
              size="large"
              className="shadow-sm"
            >
              <Radio.Button value="pending">
                <div className="px-2 py-1">
                  <span>Pending Tasks {" "}</span>
                  <Badge count={pendingTasks.length} className="ml-2" />
                </div>
              </Radio.Button>
              <Radio.Button value="completed">
                <div className="px-2 py-1">
                  <span>Completed Unpublished {" "}</span>
                  <Badge count={completedTasks.length} className="ml-2" />
                </div>
              </Radio.Button>
              <Radio.Button value="published">
                <div className="px-2 py-1">
                  <span>Published {" "}</span>
                  <Badge count={publishedTasks.length} className="ml-2" />
                </div>
              </Radio.Button>
            </Radio.Group>
          </div>

          <Table
            dataSource={
              activeTab === 'pending' 
                ? pendingTasks 
                : activeTab === 'completed' 
                  ? completedTasks 
                  : publishedTasks
            }
            columns={columns}
            rowKey="id"
            pagination={false}
            className="custom-table"
          />
        </div>
      </Card>

      <Modal
        title={
          <div className="flex items-center space-x-2">
            <PlayCircleOutlined className="text-blue-500" />
            <span> Process Task: {currentTask?.id}</span>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
        className="custom-modal"
      >
        <div className="space-y-6">
          {!taskResult ? (
            <Button
              type="primary"
              icon={<LockOutlined />}
              onClick={handleRequestResult}
              block
              size="large"
              className="rounded-lg h-12"
            >
              Request Encrypted Result
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="mb-4">
                  <Text strong className="text-lg mb-2 block">Encrypted Result:</Text>
                  <Paragraph copyable className="mb-0 bg-white p-3 rounded border border-gray-200">
                    {taskResult.encryptedResult}
                  </Paragraph>
                </div>
                
                {isDecrypted && taskResult.decryptedResult && (
                  <div>
                    <Text strong className="text-lg mb-2 block">Decrypted Result:</Text>
                    <Paragraph copyable className="mb-0 bg-white p-3 rounded border border-gray-200">
                      {taskResult.decryptedResult}
                    </Paragraph>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                {!isDecrypted ? (
                  <Button
                    type="primary"
                    icon={<UnlockOutlined />}
                    onClick={handleDecryptAndSign}
                    size="large"
                    className="rounded-lg"
                  >
                    Decrypt and Sign Result
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={<CloudUploadOutlined />}
                    onClick={handlePublishAndFinish}
                    size="large"
                    className="rounded-lg"
                  >
                    Publish Result and Finish Task
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        title={
          <div className="flex items-center space-x-2">
            <PlusOutlined className="text-blue-500" />
            <span>New Business Task</span>
          </div>
        }
        open={isNewTaskModalVisible}
        onCancel={() => setIsNewTaskModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          onFinish={handleNewTask}
          layout="vertical"
          className="mt-4"
        >
          <Form.Item
            name="bankAddress"
            label={<Text strong>Bank Address</Text>}
            rules={[{ required: true, message: 'Please input bank address!' }]}
          >
            <Input 
              prefix={<BankOutlined className="text-gray-400" />} 
              placeholder="Enter Bank Address"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item
            name="businessType"
            label={<Text strong>Business Type</Text>}
            rules={[{ required: true, message: 'Please select business type!' }]}
          >
            <Select 
              placeholder="Select business type"
              className="rounded-lg"
            >
              <Option value="loan">Loan Application</Option>
              <Option value="credit">Credit Assessment</Option>
              <Option value="mortgage">Mortgage Application</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end">
            <Button
              type="primary"
              htmlType="submit"
              className="rounded-lg"
              onClick={() => setIsNewTaskModalVisible(false)}
            >
              Create Business Task
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};