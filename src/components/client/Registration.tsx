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
    // Load wallet first
    const storedWallet = localStorage.getItem('wallet');
    if (storedWallet) {
      setWallet(JSON.parse(storedWallet));
      // Only load FHE keys if wallet exists
      const storedKeys = localStorage.getItem('fheKeys');
      if (storedKeys) {
        setKeys(JSON.parse(storedKeys));
      }
    } else {
      // If no wallet, ensure FHE keys are cleared
      localStorage.removeItem('fheKeys');
      setKeys(null);
    }
    
    const registrationStatus = localStorage.getItem('isRegistered') === 'true';
    setIsRegistered(registrationStatus);
  }, []);

  const handleGenerateKeys = async () => {
    if (!wallet) {
      messageApi.error('Please create a wallet first!');
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

  // Add wallet listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'wallet') {
        if (!e.newValue) {
          // Wallet was removed, clear FHE keys
          localStorage.removeItem('fheKeys');
          setKeys(null);
          setWallet(null);
          setIsRegistered(false);
        } else {
          setWallet(JSON.parse(e.newValue));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

  // Add this event handler
  const handleWalletChange = () => {
    const storedWallet = localStorage.getItem('wallet');
    if (storedWallet) {
      setWallet(JSON.parse(storedWallet));
    } else {
      // If wallet is removed, clear FHE keys
      localStorage.removeItem('fheKeys');
      setKeys(null);
      setWallet(null);
      setIsRegistered(false);
    }
  };

  // Add a custom event listener for wallet changes
  useEffect(() => {
    window.addEventListener('walletChanged', handleWalletChange);
    return () => window.removeEventListener('walletChanged', handleWalletChange);
  }, []);

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

  // 修改 useEffect 来包含合约检查
  useEffect(() => {
    const storedWallet = localStorage.getItem('wallet');
    if (storedWallet) {
      const parsedWallet = JSON.parse(storedWallet);
      setWallet(parsedWallet);
      checkContractRegistration();
      
      const storedKeys = localStorage.getItem('fheKeys');
      if (storedKeys) {
        setKeys(JSON.parse(storedKeys));
      }
    } else {
      localStorage.removeItem('fheKeys');
      setKeys(null);
    }
  }, [isRegistered, isContractRegistered]);

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