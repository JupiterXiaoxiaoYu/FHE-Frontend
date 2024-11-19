import React from 'react';
import { Typography } from 'antd';
import { Registration } from '../components/client/Registration';
import { TaskResults } from '../components/client/TaskResults';

const { Title } = Typography;

export const ClientPortal: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <Title level={2} className="mb-4">CipherBridge Client Portal</Title>
        <p className="text-gray-600 text-lg">Manage your encrypted financial data and privacy computing tasks</p>
      </div>
      
      <Registration />
      <TaskResults />
    </div>
  );
};