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
  BankOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { Task } from '../../types';
import { ethers } from 'ethers';
import contractConfig from '../../config/contracts';
import { DataType } from '../../services/fheApi';
import {fheApi} from '../../services/fheApi';
import  messageApi from '../../App';
import jsPDF from 'jspdf';

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
  signature?: string;
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

// 添加用于存储和获取解密结果的工具函数
const storeDecryptedResult = (taskId: string, decryptedResult: string) => {
  try {
    const storedResults = localStorage.getItem('decryptedResults');
    const results = storedResults ? JSON.parse(storedResults) : {};
    results[taskId] = decryptedResult;
    localStorage.setItem('decryptedResults', JSON.stringify(results));
  } catch (error) {
    console.error('Failed to store decrypted result:', error);
  }
};

const getDecryptedResult = (taskId: string): string | null => {
  try {
    const storedResults = localStorage.getItem('decryptedResults');
    if (!storedResults) return null;
    const results = JSON.parse(storedResults);
    return results[taskId] || null;
  } catch (error) {
    console.error('Failed to get decrypted result:', error);
    return null;
  }
};

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
  const [expandedResult, setExpandedResult] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);

  useEffect(() => {
    refreshTasks();
  }, [isModalVisible]);

  // 将 handleViewDecryptedResult 移到组件内部
  const handleViewDecryptedResult = async (task: Task) => {
    try {
      const storedWallet = localStorage.getItem('wallet');
      if (!storedWallet) {
        messageApi.error('Please connect your account first!');
        return;
      }

      const wallet = JSON.parse(storedWallet);
      
      // 解密结果
      const decryptResponse = await fheApi.decrypt(
        wallet.address,
        task.businessType as DataType,
        task.encryptedResult || ''
      );

      // 更新当前任务的解密结果
      setCurrentTask(prev => ({
        ...prev!,
        decryptedResult: decryptResponse.value.toString()
      }));

    } catch (error: any) {
      console.error('Failed to decrypt result:', error);
      if (error.response?.data?.message) {
        messageApi.error('Failed to decrypt: ' + error.response.data.message);
      } else {
        messageApi.error('Failed to decrypt: ' + error.message);
      }
    }
  };

  // 修改 handleProcessTask 函数
  const handleProcessTask = async (task: Task) => {
    console.log('Processing task:', task);
    setCurrentTask(task);
    setTaskResult(null);
    setIsDecrypted(false);
    
    if (task.status === 'published') {
      await handleViewDecryptedResult(task);
      setIsViewModalVisible(true);
    } else {
      setIsModalVisible(true);
    }
  };

  const handleRequestResult = async () => {
    if (!currentTask) return;
    try {
      setTaskResult({
        taskId: currentTask.id,
        encryptedResult: currentTask.encryptedResult || ''
      });
      messageApi.success('Encrypted result retrieved successfully!');
    } catch (error) {
      messageApi.error('Failed to retrieve result!');
      console.error('Result retrieval failed:', error);
    }
  };

  const handleDecryptAndSign = async () => {
    if (!currentTask || !taskResult) return;
    try {
      const storedWallet = localStorage.getItem('wallet');
      if (!storedWallet) {
        messageApi.error('Please connect your account first!');
        return;
      }

      const wallet = JSON.parse(storedWallet);
      
      const decryptResponse = await fheApi.decrypt(
        wallet.address,
        currentTask.businessType as DataType,
        taskResult.encryptedResult
      );

      const decryptedResult = decryptResponse.value.toString();
      
      // 存储解密结果
      storeDecryptedResult(currentTask.id, decryptedResult);
      
      const messageHash = ethers.utils.id(decryptedResult);
      const signature = await new ethers.Wallet(wallet.privateKey).signMessage(
        ethers.utils.arrayify(messageHash)
      );

      setTaskResult(prev => ({
        ...prev!,
        decryptedResult,
        signature
      }));
      setIsDecrypted(true);
      messageApi.success('Result decrypted and signed successfully!');
    } catch (error: any) {
      console.error('Decrypt and sign failed:', error);
      if (error.response?.data?.message) {
        messageApi.error('Failed to decrypt: ' + error.response.data.message);
      } else {
        messageApi.error('Failed to decrypt and sign: ' + error.message);
      }
    }
  };

  const handlePublishAndFinish = async () => {
    if (!currentTask || !taskResult || !taskResult.signature) return;
    try {
      const storedWallet = localStorage.getItem('wallet');
      if (!storedWallet) {
        messageApi.error('Please connect your account first!');
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

      const tx = await taskManagement.publishTaskResult(
        currentTask.id,
        taskResult.signature
      );

      await tx.wait();
      messageApi.success('Result published and task completed!');
      setIsModalVisible(false);
      setCurrentTask(null);
      setTaskResult(null);
      setIsDecrypted(false);
      refreshTasks();
    } catch (error: any) {
      messageApi.error('Failed to publish result: ' + error.message);
      console.error('Result publishing failed:', error);
    }
  };

  const handleNewTask = async (values: BusinessTaskRequest) => {
    try {
      const storedWallet = localStorage.getItem('wallet');
      if (!storedWallet) {
        messageApi.error('Please connect your account first!');
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
        createdAt: parseInt(task.createdAt._hex, 16),
        encryptedResult: task.encryptedResult || '',
        decryptedResult: task.decryptedResult || '',
        signature: task.signature || ''
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

  const generateCertificate = () => {
    try {
      if (!currentTask) return;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxLineWidth = pageWidth - 2 * margin;
      
      // 添加标题
      doc.setFontSize(20);
      doc.text('Business Qualification Certificate', pageWidth/2, 20, { align: 'center' });
      
      // 添加分隔线
      doc.setLineWidth(0.5);
      doc.line(margin, 25, pageWidth-margin, 25);
      
      // 设置正文字体大小
      doc.setFontSize(12);
      
      // 准备内容（除签名外）
      const basicContent = [
        `Certificate ID: ${currentTask.id}`,
        `Bank Address: ${currentTask.bankId}`,
        `Business Type: ${currentTask.businessType}`,
        `Qualification Result: ${currentTask.decryptedResult}`,
        `Issue Date: ${new Date().toLocaleDateString()}`
      ];

      // 先添加基本内容
      let yPosition = 40;
      basicContent.forEach((text) => {
        doc.text(text, margin, yPosition);
        yPosition += 10;
      });

      // 处理签名的自动换行
      if (currentTask.signature) {
        doc.text('Verification Signature:', margin, yPosition);
        yPosition += 7; // 稍微缩小签名行间距

        // 将签名分成多行
        const signatureLines = doc.splitTextToSize(
          currentTask.signature,
          maxLineWidth
        );
        
        // 添加签名文本
        signatureLines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += 7; // 签名行使用更小的行间距
        });
      }

      // 添加页脚
      doc.setFontSize(10);
      doc.text(
        'This certificate is digitally signed and verified on blockchain.',
        pageWidth/2,
        250,
        { align: 'center' }
      );
      
      // 保存PDF
      doc.save(`business-certificate-${currentTask.id}.pdf`);
      messageApi.success('Certificate generated successfully!');
    } catch (error) {
      console.error('Failed to generate certificate:', error);
      messageApi.error('Failed to generate certificate');
    }
  };

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
                <Badge 
                  count={publishedTasks.length} 
                  className="ml-2"
                  style={{ backgroundColor: '#52c41a' }}  // 使用 Ant Design 的标准绿色
                />
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
        onCancel={() => {
          setIsModalVisible(false);
          setTaskResult(null);
          setIsDecrypted(false);
        }}
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
              <div className="mb-4">
                <Text strong className="text-lg mb-2 block">Encrypted Result:</Text>
                <div className="bg-white p-3 rounded border border-gray-200">
                  <div className="font-mono break-all">
                    {expandedResult 
                      ? taskResult.encryptedResult
                      : taskResult.encryptedResult.substring(0, 50) + '...'
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
                  <Button
                    type="link"
                    size="small"
                    className="mt-1 p-0 ml-4"
                    onClick={() => {
                      navigator.clipboard.writeText(taskResult.encryptedResult);
                      messageApi.success('Copied to clipboard!');
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              
              {isDecrypted && taskResult.decryptedResult && (
                <div className="space-y-4">
                  <div>
                    <Text strong className="text-lg mb-2 block">Decrypted Result:</Text>
                    <Paragraph copyable className="mb-0 bg-white p-3 rounded border border-gray-200">
                      {taskResult.decryptedResult}
                    </Paragraph>
                  </div>

                  <div>
                    <Text strong className="text-lg mb-2 block">Signature:</Text>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <div className="font-mono break-all">
                        {taskResult.signature}
                      </div>
                      <Button
                        type="link"
                        size="small"
                        className="mt-1 p-0"
                        onClick={() => {
                          if (taskResult.signature) {
                            navigator.clipboard.writeText(taskResult.signature);
                            messageApi.success('Signature copied to clipboard!');
                          }
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              )}

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

      <Modal
        title={
          <div className="flex items-center space-x-2">
            <CheckCircleOutlined className="text-green-500" />
            <span>View Published Task: {currentTask?.id}</span>
          </div>
        }
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setCurrentTask(null);
        }}
        footer={
          <div className="flex justify-end">
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={generateCertificate}
              className="rounded-lg"
            >
              Generate Certificate
            </Button>
          </div>
        }
        width={700}
        className="custom-modal"
      >
        <div className="space-y-4">
          <Card size="small" className="shadow-sm">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Text strong>Task Details {" "}</Text>
                <Tag color="success">Published</Tag>
              </div>
              
              <div className="grid grid-cols-1 gap-4 mt-4">
                <div>
                  <Text type="secondary">Bank Address:</Text>
                  <div className="font-mono bg-gray-50 p-2 rounded text-sm mt-1">
                    {currentTask?.bankId}
                  </div>
                </div>

                <div>
                  <Text type="secondary">Business Type:</Text>
                  <div className="text-sm mt-1">
                    {currentTask?.businessType}
                  </div>
                </div>

                <div>
                  <Text type="secondary">Decrypted Result:</Text>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    {currentTask?.decryptedResult || 'Decrypting...'}
                  </div>
                </div>

                <div>
                  <Text type="secondary">Signature:</Text>
                  <div className="font-mono bg-gray-50 p-2 rounded text-sm mt-1">
                    <div className="break-all">
                      {currentTask?.signature}
                    </div>
                    <Button
                      type="link"
                      size="small"
                      className="mt-1 p-0"
                      onClick={() => {
                        if (currentTask?.signature) {
                          navigator.clipboard.writeText(currentTask.signature);
                          messageApi.success('Signature copied to clipboard!');
                        }
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div>
                  <Text type="secondary">Created At:</Text>
                  <div className="text-sm mt-1">
                    {new Date(currentTask?.createdAt || 0).toLocaleString()}
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