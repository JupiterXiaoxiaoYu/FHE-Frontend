import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Typography, Space, Row, Col, Statistic } from 'antd';
import { 
  BankOutlined, 
  KeyOutlined, 
  SafetyCertificateOutlined,
  CopyOutlined,
  LogoutOutlined 
} from '@ant-design/icons';
import { ethers } from 'ethers';
import contractConfig from '../../config/contracts';
import { eventBus } from '../../utils/eventBus';

const { Title, Text, Paragraph } = Typography;

interface BankInfo {
  weId: string;
  publicKey: string;
  registrationTime?: number;
  id?: number;
  isActive?: boolean;
}

export const BankRegistration: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);

  useEffect(() => {
    const storedInfo = localStorage.getItem('bankInfo');
    if (storedInfo) {
      setBankInfo(JSON.parse(storedInfo));
    }
  }, []);

  const handleRegister = async (values: { weId: string }) => {
    try {
      const storedKeys = localStorage.getItem('wallet');
      if (!storedKeys) {
        messageApi.error('Please generate bank keys first!');
        return;
      }
  
      const keys = JSON.parse(storedKeys);
      const provider = new ethers.providers.JsonRpcProvider('/api');
      const signer = new ethers.Wallet(keys.privateKey, provider);
      
      const bankRegistry = new ethers.Contract(
        contractConfig.BankRegistry.address,
        contractConfig.BankRegistry.abi,
        signer
      );

      console.log('Bank address:', keys.address);
  
      const tx = await bankRegistry.registerBank(keys.address);
      console.log('Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
  
      const registerEvent = receipt.events?.find(
        (event: any) => event.event === 'BankRegistered'
      );
      const bankId = registerEvent?.args?.bankId.toNumber();
  
      const bankData = await bankRegistry.getBank(keys.address);
  
      const newBankInfo = {
        weId: values.weId,
        publicKey: keys.address,
        registrationTime: Date.now(),
        id: bankId,
        isActive: bankData.isActive
      };
      
      localStorage.setItem('bankInfo', JSON.stringify(newBankInfo));
      setBankInfo(newBankInfo);
      messageApi.success('Bank registration successful!');
      form.resetFields();
    } catch (error) {
      messageApi.error('Registration failed!');
      console.error('Registration failed:', error);
    }
  };

  const handleRevoke = async () => {
    try {
      const storedKeys = localStorage.getItem('wallet');
      // if (!storedKeys) {
      //   messageApi.error('Please generate bank keys first!');
      //   return;
      // }
      // const keys = JSON.parse(storedKeys);
      const provider = new ethers.providers.JsonRpcProvider('/api');
      // const signer = new ethers.Wallet(keys.privateKey, provider);
      
      // const bankRegistry = new ethers.Contract(
      //   contractConfig.BankRegistry.address,
      //   contractConfig.BankRegistry.abi,
      //   signer
      // );

      // const tx = await bankRegistry.deactivateBank(keys.address);
      // await tx.wait();

      // 清除所有相关数据
      localStorage.removeItem('bankInfo');
      localStorage.removeItem('encryptedDataList'); // 清除加密历史
      setBankInfo(null);
      
      // 发出事件通知其他组件
      eventBus.emit('bankRevoked');
      
      messageApi.success('Bank registration and all related data have been revoked successfully!');
    } catch (error) {
      messageApi.error('Failed to revoke registration!');
      console.error('Revoke failed:', error);
    }
  };

  return (
    <>
      {contextHolder}
      {!bankInfo ? (
        <div className="max-w-xl mx-auto">
          <Form
            form={form}
            onFinish={handleRegister}
            layout="vertical"
          >
            <Form.Item
              name="weId"
              label={<Text strong>Bank WeID</Text>}
              rules={[{ required: true, message: 'Please input bank WeID!' }]}
            >
              <Input 
                prefix={<BankOutlined className="text-gray-400" />}
                placeholder="Enter bank WeID"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SafetyCertificateOutlined />}
                size="large"
                block
                className="rounded-lg"
              >
                Register Bank
              </Button>
            </Form.Item>
          </Form>
        </div>
      ) : (
        <div>
          <Row gutter={24} align="middle">
            {/* 左侧：基本信息 */}
            <Col span={16}>
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <Title level={4} className="mb-4">Bank Information</Title>
                  
                  <Space direction="vertical" className="w-full" size="large">
                    <div>
                      <Text type="secondary">Bank WeID</Text>
                      <div className="flex items-center gap-2 mt-1">
                        <Text strong className="font-mono">{bankInfo.weId}</Text>
                        <Button 
                          type="text" 
                          icon={<CopyOutlined />} 
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText(bankInfo.weId);
                            messageApi.success('WeID copied to clipboard!');
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">Public Key</Text>
                      <div className="flex items-center gap-2 mt-1">
                        <Text strong className="font-mono truncate max-w-md">
                          {bankInfo.publicKey}
                        </Text>
                        <Button 
                          type="text" 
                          icon={<CopyOutlined />} 
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText(bankInfo.publicKey);
                            messageApi.success('Public key copied to clipboard!');
                          }}
                        />
                      </div>
                    </div>
                  </Space>
                </div>
              </div>
            </Col>

            {/* 右侧：状态和操作 */}
            <Col span={8}>
              <div className="flex flex-col items-end space-y-4">
                <Statistic 
                  title="Registration Time" 
                  value={new Date(bankInfo.registrationTime || Date.now()).toLocaleDateString()} 
                  prefix={<KeyOutlined />}
                />
                <Button 
                  danger 
                  icon={<LogoutOutlined />}
                  onClick={handleRevoke}
                  className="rounded-lg"
                >
                  Revoke Registration
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      )}
    </>
  );
};