import React, { useState, useEffect } from 'react';
import { Modal, Button, Typography, Space, message, Input, Popconfirm } from 'antd';
import { BankOutlined, CopyOutlined, EyeOutlined, EyeInvisibleOutlined, ImportOutlined, DeleteOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';

const { Text, Paragraph } = Typography;

interface WalletInfo {
  address: string;
  privateKey: string;
}

export const BankWalletModal: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [importPrivateKey, setImportPrivateKey] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    const loadWallet = () => {
      const storedWallet = localStorage.getItem('bank_wallet');
      if (storedWallet) {
        setWallet(JSON.parse(storedWallet));
      } else {
        setWallet(null);
      }
    };

    loadWallet();
    
    const handleStorageChange = () => {
      loadWallet();
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bankWalletChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bankWalletChanged', handleStorageChange);
    };
  }, []);

  const generateWallet = () => {
    const newWallet = ethers.Wallet.createRandom();
    const walletInfo = {
      address: newWallet.address,
      privateKey: newWallet.privateKey,
    };
    setWallet(walletInfo);
    localStorage.setItem('bank_wallet', JSON.stringify(walletInfo));
    window.dispatchEvent(new Event('bankWalletChanged'));
    messageApi.success('New bank wallet generated successfully!');
  };

  const handleImportPrivateKey = () => {
    try {
      if (!importPrivateKey.startsWith('0x')) {
        throw new Error('Private key must start with 0x');
      }
      
      const wallet = new ethers.Wallet(importPrivateKey);
      const walletInfo = {
        address: wallet.address,
        privateKey: wallet.privateKey,
      };
      
      setWallet(walletInfo);
      localStorage.setItem('bank_wallet', JSON.stringify(walletInfo));
      window.dispatchEvent(new Event('bankWalletChanged'));
      setShowImport(false);
      setImportPrivateKey('');
      messageApi.success('Bank wallet imported successfully!');
    } catch (error) {
      messageApi.error('Invalid private key!');
      console.error('Import failed:', error);
    }
  };

  const handleRevokeWallet = () => {
    localStorage.removeItem('bank_wallet');
    setWallet(null);
    setShowPrivateKey(false);
    window.dispatchEvent(new Event('bankWalletChanged'));
    setForceUpdate(prev => prev + 1);
    window.dispatchEvent(new Event('storage'));
    messageApi.success('Bank wallet revoked successfully!');
    setIsModalOpen(false);
  };

  const handleCopy = (text: string, type: 'address' | 'privateKey') => {
    navigator.clipboard.writeText(text);
    messageApi.success(`${type === 'address' ? 'Address' : 'Private key'} copied to clipboard!`);
  };

  return (
    <>
      {contextHolder}
      <Button 
        icon={<BankOutlined />}
        onClick={() => setIsModalOpen(true)}
        type="primary"
      >
        Bank Account
      </Button>

      <Modal
        title="Bank Account Management"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setShowImport(false);
          setImportPrivateKey('');
        }}
        footer={[
          <Button key="close" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>,
          !wallet && !showImport && (
            <Button 
              key="import"
              icon={<ImportOutlined />}
              onClick={() => setShowImport(true)}
            >
              Import Account
            </Button>
          ),
          !wallet && (
            <Button 
              key="generate" 
              type="primary" 
              onClick={generateWallet}
            >
              Generate New Account
            </Button>
          ),
          wallet && (
            <Popconfirm
              key="revoke"
              title="Revoke Wallet"
              description="Are you sure you want to revoke this wallet? This action cannot be undone."
              onConfirm={handleRevokeWallet}
              okText="Yes"
              cancelText="No"
            >
              <Button danger icon={<DeleteOutlined />}>
                Revoke Account
              </Button>
            </Popconfirm>
          )
        ]}
      >
        {showImport ? (
          <Space direction="vertical" className="w-full">
            <Text>Enter your private key:</Text>
            <Input.Password
              value={importPrivateKey}
              onChange={(e) => setImportPrivateKey(e.target.value)}
              placeholder="0x..."
              className="font-mono"
            />
            <Space>
              <Button onClick={() => setShowImport(false)}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                onClick={handleImportPrivateKey}
                disabled={!importPrivateKey}
              >
                Import
              </Button>
            </Space>
          </Space>
        ) : wallet ? (
          <Space direction="vertical" className="w-full">
            <div>
              <Text type="secondary">Address</Text>
              <div className="flex items-center gap-2 mt-1">
                <Text strong className="font-mono">{wallet.address}</Text>
                <Button 
                  type="text" 
                  icon={<CopyOutlined />} 
                  size="small"
                  onClick={() => handleCopy(wallet.address, 'address')}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Text type="secondary">Private Key</Text>
                <Button
                  type="text"
                  icon={showPrivateKey ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  size="small"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Text strong className="font-mono">
                  {showPrivateKey 
                    ? wallet.privateKey 
                    : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                </Text>
                <Button 
                  type="text" 
                  icon={<CopyOutlined />} 
                  size="small"
                  onClick={() => handleCopy(wallet.privateKey, 'privateKey')}
                />
              </div>
            </div>

            <Text type="danger">
              Warning: Never share your private key with anyone!
            </Text>
          </Space>
        ) : (
          <div className="text-center py-8">
            <Text type="secondary">No wallet generated yet. Generate a new one or import existing.</Text>
          </div>
        )}
      </Modal>
    </>
  );
} 