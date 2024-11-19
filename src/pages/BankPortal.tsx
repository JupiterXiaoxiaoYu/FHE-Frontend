import React from 'react';
import { Typography, Card, Tabs } from 'antd';
import { BankRegistration } from '../components/bank/BankRegistration';
import { TaskList } from '../components/bank/TaskList';
import { DataEncryption } from '../components/bank/DataEncryption';
import { DatabaseOutlined, LockOutlined } from '@ant-design/icons';

const { Title } = Typography;

export const BankPortal: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <Title level={2} className="mb-4">CipherBridge Bank Portal</Title>
        <p className="text-gray-600 text-lg">Manage privacy computing tasks and encrypted data processing</p>
      </div>

      {/* 身份认证区域 */}
      <Card className="mb-8 shadow-md">
        <BankRegistration />
      </Card>

      {/* 主功能区域 */}
      <Card className="shadow-md">
        <Tabs
          defaultActiveKey="tasks"
          items={[
            {
              key: 'tasks',
              label: (
                <span className="flex items-center gap-2">
                  <DatabaseOutlined />
                  Business Tasks
                </span>
              ),
              children: (
                <div className="h-[600px] overflow-auto">
                  <TaskList />
                </div>
              ),
            },
            {
              key: 'encryption',
              label: (
                <span className="flex items-center gap-2">
                  <LockOutlined />
                  Data Encryption
                </span>
              ),
              children: (
                <div className="flex flex-col h-[600px]">
                  <div className="mb-4">
                    <DataEncryption />
                  </div>
                  <div className="flex-1 overflow-auto">
                    {/* Encryption History will be rendered here */}
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};