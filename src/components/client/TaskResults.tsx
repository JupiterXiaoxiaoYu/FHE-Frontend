import React, { useState } from 'react';
import { Card, Table, Button, Tag, message, Modal, Space, Typography, Form, Input, Select } from 'antd';
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

const { Paragraph, Title, Text } = Typography;
const { Option } = Select;

interface BusinessTaskRequest {
  bankWeId: string;
  businessType: string;
}

interface TaskResult {
  taskId: string;
  encryptedResult: string;
  decryptedResult?: string;
}

const mockTasks: Task[] = [
  {
    id: '1',
    bankId: 'bank1',
    businessType: 'Loan Application',
    status: 'pending'
  },
  {
    id: '2',
    bankId: 'bank2',
    businessType: 'Credit Assessment',
    status: 'pending'
  }
];

export const TaskResults: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isNewTaskModalVisible, setIsNewTaskModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null);
  const [isDecrypted, setIsDecrypted] = useState(false);

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
      await new Promise(resolve => setTimeout(resolve, 1000));
      messageApi.success('Business task created successfully!');
      setIsNewTaskModalVisible(false);
      form.resetFields();
    } catch (error) {
      messageApi.error('Failed to create business task!');
      console.error('Task creation failed:', error);
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
      render: (record: Task) => (
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => handleProcessTask(record)}
        >
          Process Task
        </Button>
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
        <Table
          dataSource={mockTasks}
          columns={columns}
          rowKey="id"
          pagination={false}
          className="custom-table"
        />
      </Card>

      <Modal
        title={
          <div className="flex items-center space-x-2">
            <PlayCircleOutlined className="text-blue-500" />
            <span>Process Task: {currentTask?.id}</span>
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
            name="bankWeId"
            label={<Text strong>Bank WeID</Text>}
            rules={[{ required: true, message: 'Please input bank WeID!' }]}
          >
            <Input 
              prefix={<BankOutlined className="text-gray-400" />} 
              placeholder="Enter bank WeID"
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
            >
              Create Business Task
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};