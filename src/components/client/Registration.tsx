import React, { useState, useEffect } from 'react';
import { Card, Button, message, Typography, Space, Row, Col } from 'antd';
import { UserAddOutlined, EyeOutlined, EyeInvisibleOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { fheApi } from "../../services/fheApi"
import { createWalletClient, custom, publicActions } from 'viem';
import { fiscobcos } from '../../Web3Provider';
import contractConfig from '../../config/contracts';
// import { useAccount } from 'wagmi';
import { toBytes, stringToHex } from 'viem';
import { ethers } from 'ethers';

const { Paragraph } = Typography;

// 添加工具函数
const truncateString = (str: string, showFull: boolean) => {
  if (showFull) return str;
  if (str.length <= 20) return str;
  return `${str.slice(0, 10)}...${str.slice(-10)}`;
};

interface KeyPair {
  publicKey: string;
  clientKey: string;
}

export const Registration: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [keys, setKeys] = useState<KeyPair | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showFullPublicKey, setShowFullPublicKey] = useState(false);
  const [showFullPrivateKey, setShowFullPrivateKey] = useState(false);

  useEffect(() => {
    const storedKeys = localStorage.getItem('fheKeys');
    if (storedKeys) {
      setKeys(JSON.parse(storedKeys));
    }
    // 模拟从合约获取注册状态
    const registrationStatus = localStorage.getItem('isRegistered') === 'true';
    setIsRegistered(registrationStatus);
  }, []);

  const handleGenerateKeys = async () => {
    try {
      const keys = await fheApi.generateKeys();
      const newKeys = {
        publicKey: keys.publicKey,
        clientKey: keys.clientKey
      };
      
      localStorage.setItem('fheKeys', JSON.stringify(newKeys));
      setKeys(newKeys);
      messageApi.success('FHE Keys generated successfully!');
    } catch (error) {
      messageApi.error('Key generation failed!');
      console.error('Key generation failed:', error);
    }
  };

  const handleRegister = async () => {
    const storedWallet = localStorage.getItem('wallet');
    if (!storedWallet || !keys) {
      messageApi.error('Please generate keys and create wallet first!');
      return;
    }

    try {
      const wallet = JSON.parse(storedWallet);
      // 使用正确的 Provider 创建方式
      const provider = new ethers.providers.JsonRpcProvider('/api');
      
      const signer = new ethers.Wallet(wallet.privateKey, provider);

      // 创建合约实例
      const userRegistry = new ethers.Contract(
        contractConfig.UserRegistry.address,
        contractConfig.UserRegistry.abi,
        signer
      );

      console.log('Registering user...');
      const tx = await userRegistry.registerUser(
        wallet.address,
        keys.publicKey,
        "serverKey"
      );

      console.log('Transaction hash:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      localStorage.setItem('isRegistered', 'true');
      setIsRegistered(true);
      messageApi.success('Registration successful!');
    } catch (error) {
      messageApi.error('Registration failed!');
      console.error('Registration failed:', error);
    }
  };

  const handleRevoke = () => {
    localStorage.removeItem('fheKeys');
    localStorage.removeItem('isRegistered');
    setKeys(null);
    setIsRegistered(false);
    setShowPrivateKey(false);
    messageApi.success('Keys and registration revoked successfully!');
  };

  return (
    <Card title="Client Registration">
      {contextHolder}
      <Row gutter={24}>
        <Col span={12}>
          <Space direction="vertical" size="middle" className="w-full">
            <Button
              type="primary"
              icon={<KeyOutlined />}
              onClick={handleGenerateKeys}
              size="large"
              disabled={keys !== null}
              block
            >
              Generate FHE Keys
            </Button>

            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={handleRegister}
              size="large"
              disabled={!keys || isRegistered}
              block
            >
              Register Client
            </Button>

            {(keys || isRegistered) && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleRevoke}
                size="large"
                block
              >
                Revoke Keys and Registration
              </Button>
            )}
          </Space>
        </Col>
        
        {keys && (
          <Col span={12}>
            <Space direction="vertical" className="w-full">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Public Key:</span>
                    <Button
                      type="text"
                      size="small"
                      onClick={() => setShowFullPublicKey(!showFullPublicKey)}
                    >
                      {showFullPublicKey ? 'Show Less' : 'Show More'}
                    </Button>
                  </div>
                  <Paragraph copyable className="mb-0 mt-1 font-mono">
                    {truncateString(keys.publicKey, showFullPublicKey)}
                  </Paragraph>
                </div>
                
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Private Key:</span>
                    <Space>
                      <Button
                        type="text"
                        icon={showPrivateKey ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                        size="small"
                      />
                      {showPrivateKey && (
                        <Button
                          type="text"
                          size="small"
                          onClick={() => setShowFullPrivateKey(!showFullPrivateKey)}
                        >
                          {showFullPrivateKey ? 'Show Less' : 'Show More'}
                        </Button>
                      )}
                    </Space>
                  </div>
                  <Paragraph 
                    copyable={{ text: keys.clientKey }} 
                    className="mb-0 mt-1 font-mono"
                  >
                    {showPrivateKey 
                      ? truncateString(keys.clientKey, showFullPrivateKey)
                      : '••••••••••••••••'}
                  </Paragraph>
                </div>
              </div>
              <div className="text-red-500 text-sm">
                Warning: Never share your private key with anyone!
              </div>
            </Space>
          </Col>
        )}
      </Row>
    </Card>
  );
};