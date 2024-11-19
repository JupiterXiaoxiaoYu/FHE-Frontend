import React, { useState } from 'react';
import { Card, Table, Tag, Button, message, Modal, List, Typography } from 'antd';
import { CheckCircleOutlined, SyncOutlined, LockOutlined, CalculatorOutlined } from '@ant-design/icons';
import { Task } from '../../types';

const { Paragraph } = Typography;

interface EncryptedUserData {
  id: string;
  dataType: string;
  encryptedData: string;
  timestamp: number;
}

const mockTasks: Task[] = [
  {
    id: 'task-001',
    bankId: 'bank-001',
    businessType: 'loan',
    status: 'pending'
  },
  {
    id: 'task-002',
    bankId: 'bank-001',
    businessType: 'credit',
    status: 'completed',
    result: 'encrypted-result-xyz'
  }
];

export const TaskList: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [encryptedData, setEncryptedData] = useState<EncryptedUserData[]>([]);

  const handleProcessTask = async (task: Task) => {
    try {
      // 模拟从链上获取用户加密数据
      const mockEncryptedData: EncryptedUserData[] = [
        {
          id: 'data-001',
          dataType: 'income',
          encryptedData: 'encrypted-income-' + Math.random().toString(36).substring(7),
          timestamp: Date.now()
        },
        {
          id: 'data-002',
          dataType: 'credit_score',
          encryptedData: 'encrypted-credit-' + Math.random().toString(36).substring(7),
          timestamp: Date.now()
        }
      ];
      
      setCurrentTask(task);
      setEncryptedData(mockEncryptedData);
      setIsModalVisible(true);
    } catch (error) {
      messageApi.error('Failed to fetch encrypted data!');
      console.error('Data fetching failed:', error);
    }
  };

  const handleRequestComputation = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      messageApi.success('FHE computation requested successfully!');
      setIsModalVisible(false);
      setCurrentTask(null);
      setEncryptedData([]);
    } catch (error) {
      messageApi.error('Failed to request computation!');
      console.error('Computation request failed:', error);
    }
  };

  const columns = [
    {
      title: 'Task ID',
      dataIndex: 'id',
      key: 'id',
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
        record.status === 'pending' && (
          <Button
            type="primary"
            icon={<LockOutlined />}
            onClick={() => handleProcessTask(record)}
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
      <Card title="Task List">
        <Table
          dataSource={mockTasks}
          columns={columns}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title={`Process Task: ${currentTask?.id}`}
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
          >
            Request FHE Computation
          </Button>
        ]}
        width={600}
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Available Encrypted Data:</h3>
          <List
            dataSource={encryptedData}
            renderItem={item => (
              <List.Item>
                <div className="w-full">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{item.dataType.toUpperCase()}</span>
                    <span className="text-gray-500 text-sm">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <Paragraph copyable className="mb-0">
                    {item.encryptedData}
                  </Paragraph>
                </div>
              </List.Item>
            )}
          />
        </div>
      </Modal>
    </>
  );
}; 