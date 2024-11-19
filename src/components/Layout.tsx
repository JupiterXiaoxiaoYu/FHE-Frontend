import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout as AntLayout, Menu } from 'antd';
import { Link } from 'react-router-dom';
import { HomeOutlined, UserOutlined, BankOutlined, ExperimentOutlined } from '@ant-design/icons';
import { ConnectKitButton } from "connectkit";

const { Header, Content } = AntLayout;

export const Layout: React.FC = () => {
  return (
    <AntLayout className="min-h-screen">
      <Header 
        className="bg-white shadow-sm p-0" 
        style={{ 
          height: 'auto',
          lineHeight: 'normal',
          padding: '12px 50px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Menu 
          mode="horizontal" 
          className="border-0 flex-1"
          style={{
            minWidth: 0,
            flex: 'auto',
            fontSize: '16px',
            fontWeight: 500
          }}
        >
          <Menu.Item 
            key="home" 
            icon={<HomeOutlined style={{ fontSize: '24px' }} />}
            style={{ padding: '0 24px' }}
          >
            <Link to="/" className="text-gray-800 hover:text-blue-600 transition-colors">Home</Link>
          </Menu.Item>
          <Menu.Item 
            key="client" 
            icon={<UserOutlined style={{ fontSize: '24px' }} />}
            style={{ padding: '0 24px' }}
          >
            <Link to="/client" className="text-gray-800 hover:text-blue-600 transition-colors">Client Portal</Link>
          </Menu.Item>
          <Menu.Item 
            key="bank" 
            icon={<BankOutlined style={{ fontSize: '24px' }} />}
            style={{ padding: '0 24px' }}
          >
            <Link to="/bank" className="text-gray-800 hover:text-blue-600 transition-colors">Bank Portal</Link>
          </Menu.Item>
          <Menu.Item 
            key="test" 
            icon={<ExperimentOutlined style={{ fontSize: '24px' }} />}
            style={{ padding: '0 24px' }}
          >
            <Link to="/test" className="text-gray-800 hover:text-blue-600 transition-colors">Test</Link>
          </Menu.Item>
        </Menu>
        <div style={{ marginLeft: 'auto' }}>
          <ConnectKitButton />
        </div>
      </Header>
      
      <Content>
        <Outlet />
      </Content>
    </AntLayout>
  );
};