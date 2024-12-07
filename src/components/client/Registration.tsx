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
  const [wallet, setWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [isContractRegistered, setIsContractRegistered] = useState(false);

  useEffect(() => {
    
    const loadClientData = () => {
      // Load wallet first
      const storedWallet = localStorage.getItem('client_wallet');
      if (storedWallet) {
        setWallet(JSON.parse(storedWallet));
        checkContractRegistration();
      } else {
        setWallet(null);
        // If wallet is removed, clear FHE keys
        localStorage.removeItem('fheKeys');
        setKeys(null);
        setIsRegistered(false);
      }

      // Then load FHE keys
      const storedKeys = localStorage.getItem('fheKeys');
      if (storedKeys) {
        setKeys(JSON.parse(storedKeys));
      }

      // Check registration status
      const isReg = localStorage.getItem('isRegistered');
      setIsRegistered(isReg === 'true');
    };

    loadClientData();

    const handleStorageChange = () => {
      loadClientData();
    };

    const handleClientWalletChange = () => {
      loadClientData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('clientWalletChanged', handleClientWalletChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('clientWalletChanged', handleClientWalletChange);
    };

    //调用合约检查用户是否注册
    
  }, []);


  useEffect(() => {
    checkContractRegistration();
  }, [wallet]);


  const handleGenerateKeys = async () => {
    if (!wallet) {
      messageApi.error('Please create an account first!');
      return;
    }

    try {
      const keys = await fheApi.generateKeys(wallet.address);
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
    const storedWallet = localStorage.getItem('client_wallet');
    if (!storedWallet || !keys) {
      messageApi.error('Please generate keys and create client account first!');
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

      // console.log('keys.publicKey:', keys.publicKey);

      const tx = await userRegistry.registerUser(
        wallet.address,
        keys.publicKey,
        "serverKey"
      );

      console.log('Transaction hash:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      localStorage.setItem('isRegistered', 'true');
      setIsContractRegistered(true);
      messageApi.success('Registration successful!');
    } catch (error) {
      messageApi.error('Registration failed!');
      console.error('Registration failed:', error);
    }
  };

  const handleRevoke = () => {
    // 清除所有相关数据
    const keysToRemove = [
      'client_wallet',
      'fheKeys',
      'isRegistered',
      'userInfo',
      'taskHistory'
    ];

    // 批量删除本地存储
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // 重置状态
    setKeys(null);
    setIsRegistered(false);
    setShowPrivateKey(false);
    
    // 触发事件通知其他组件
    window.dispatchEvent(new Event('clientWalletChanged'));
    window.dispatchEvent(new Event('storage'));
    
    messageApi.success('Keys and registration revoked successfully!');
  };

  const checkContractRegistration = async () => {
    if (!wallet) return;
    
    try {
      const provider = new ethers.providers.JsonRpcProvider('/api');
      const userRegistry = new ethers.Contract(
        contractConfig.UserRegistry.address,
        contractConfig.UserRegistry.abi,
        provider
      );

      const user = await userRegistry.users(wallet.address);
      setIsContractRegistered(user.isActive);
      console.log(user.isActive);
    } catch (error) {
      console.error('Failed to check registration:', error);
    }
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
              disabled={keys !== null || !wallet}
              block
            >
              Generate FHE Keys
            </Button>

            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={handleRegister}
              size="large"
              disabled={!keys || isContractRegistered}
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