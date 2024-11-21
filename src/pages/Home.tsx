import React from 'react';
import { Card, Button, Typography, Space } from 'antd';
import { UserOutlined, BankOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Paragraph } = Typography;

export const Home: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center items-center py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center max-w-3xl mx-auto px-4">
          <Title level={1} className="text-5xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
            Welcome to CipherBridge
          </Title>
          <Paragraph className="text-xl text-gray-600 mb-12">
            A secure and innovative multi-party cipher computing system powered by Fully Homomorphic Encryption technology
          </Paragraph>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl px-4">
          <Card 
            hoverable 
            className="transform transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <div className="p-8 text-center">
              <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserOutlined className="text-4xl text-blue-500" />
              </div>
              <Title level={2} className="mb-4">Client Portal</Title>
              <Paragraph className="text-gray-600 mb-8 text-lg">
                Access your secure banking services and manage your encrypted data
              </Paragraph>
              <Link to="/client">
                <Button type="primary" size="large" className="h-12 px-8 text-lg">
                  Enter Client Portal
                </Button>
              </Link>
            </div>
          </Card>

          <Card 
            hoverable 
            className="transform transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <div className="p-8 text-center">
              <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <BankOutlined className="text-4xl text-blue-500" />
              </div>
              <Title level={2} className="mb-4">Bank Portal</Title>
              <Paragraph className="text-gray-600 mb-8 text-lg">
                Manage banking operations and process encrypted transactions
              </Paragraph>
              <Link to="/bank">
                <Button type="primary" size="large" className="h-12 px-8 text-lg">
                  Enter Bank Portal
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}