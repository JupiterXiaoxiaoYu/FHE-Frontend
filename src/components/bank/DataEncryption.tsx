import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Typography, Row, Col, Card, Badge, Tooltip, Tag, Select, Modal } from 'antd';
import { 
  LockOutlined, 
  KeyOutlined, 
  CloudUploadOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { fheApi } from '../../services/fheApi';
import { DataType } from '../../services/fheApi';
import * as ethers from 'ethers';
import { contractConfig } from '../../config/contracts';

const { Text, Paragraph } = Typography;

interface EncryptedData {
  id: string;
  userPublicKey: string;
  fhePublicKey: string;
  dataType: string;
  encryptedValue: string;
  timestamp: number;
  onChain: boolean;
  uploading?: boolean;
}

// 添加数据类型枚举
const DATA_TYPES: Array<{
  value: DataType;
  label: string;
  task: string;
}> = [
  { value: 'monthly_income', label: 'Monthly Income', task: 'Credit Card Application' },
  { value: 'credit_score', label: 'Credit Score', task: 'Credit Assessment' },
  { value: 'property_value', label: 'Property Value', task: 'Mortgage Application' }
] as const;

export const DataEncryption: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [encryptedDataList, setEncryptedDataList] = useState<EncryptedData[]>([
    // {
    //   id: 'mock-1',
    //   userPublicKey: 'user-public-key-7f9c8b3a2d1e',
    //   fhePublicKey: 'fhe-public-key-4k5j6h7g8f9d',
    //   dataType: 'credit_score',
    //   encryptedValue: 'encrypted-data-9d8f7e6a5b4c3d2e1f-credit-score-value-mock',
    //   timestamp: Date.now() - 3600000, // 1小时前
    //   onChain: true,
    // },
    // {
    //   id: 'mock-2',
    //   userPublicKey: 'user-public-key-2b3c4d5e6f7g',
    //   fhePublicKey: 'fhe-public-key-8h9j0k1l2m3n',
    //   dataType: 'income',
    //   encryptedValue: 'encrypted-data-5f4e3d2c1b0a9z8y7x-income-value-mock',
    //   timestamp: Date.now() - 7200000, // 2小时前
    //   onChain: false,
    // }
  ]);

  // 添加状态来跟踪每个加密数据的展开状态
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // 添加切换展开/收起的处理函数
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // 请求FHE公钥
  const handleRequestFHEKey = async () => {
    try {
      const userPublicKey = form.getFieldValue('userPublicKey');
      if (!userPublicKey) {
        messageApi.warning('Please input user public key first!');
        return;
      }

      const fhePublicKey = await fheApi.getPublicKey(userPublicKey);
      form.setFieldsValue({ fhePublicKey });
      messageApi.success('FHE public key retrieved successfully!');
    } catch (error) {
      messageApi.error('Failed to get FHE public key!');
      console.error('Failed to get FHE public key:', error);
    }
  };

  // 加密数据
  const handleEncrypt = async (values: any) => {
    try {
      if (!values.fhePublicKey) {
        messageApi.warning('Please request FHE public key first!');
        return;
      }

      // 调用加密 API
      const encryptResponse = await fheApi.encrypt(
        values.userPublicKey,
        values.dataType,
        parseInt(values.data)
      );

      const newEncryptedData: EncryptedData = {
        id: Math.random().toString(36).substring(7),
        userPublicKey: values.userPublicKey,
        fhePublicKey: values.fhePublicKey,
        dataType: values.dataType,
        encryptedValue: encryptResponse.encrypted_value,
        timestamp: Date.now(),
        onChain: false,
      };

      setEncryptedDataList(prev => [newEncryptedData, ...prev]);
      messageApi.success('Data encrypted successfully!');
      form.resetFields();
    } catch (error) {
      messageApi.error('Failed to encrypt data!');
      console.error('Failed to encrypt data:', error);
    }
  };

  // 上传数据到链上
  const handleUploadToChain = async (dataId: string) => {
    try {
      const dataToUpload = encryptedDataList.find(item => item.id === dataId);
      if (!dataToUpload) {
        messageApi.error('Data not found!');
        return;
      }

      const storedKeys = localStorage.getItem('wallet');
      if (!storedKeys) {
        messageApi.error('Bank wallet not found!');
        return;
      }

      // 设置上传中状态
      setEncryptedDataList(prev => 
        prev.map(item => 
          item.id === dataId ? { ...item, uploading: true } : item
        )
      );

      const keys = JSON.parse(storedKeys);
      const provider = new ethers.providers.JsonRpcProvider('/api');
      const signer = new ethers.Wallet(keys.privateKey, provider);
      
      const dataStorage = new ethers.Contract(
        contractConfig.DataStorage.address,
        contractConfig.DataStorage.abi,
        signer
      );

      // 获取当前区块时间戳
      const currentBlock = await provider.getBlock('latest');
      const currentBlockTimestamp = currentBlock.timestamp;
      
      // 设置过期时间为当前区块时间戳 + 30天（以秒为单位）
      const expiryDate = currentBlockTimestamp + (30 * 24 * 60 * 60);

      console.log('Current block timestamp:', currentBlockTimestamp);
      console.log('Expiry date:', expiryDate);

      // 调用合约存储数据
      const tx = await dataStorage.storeUserData(
        dataToUpload.userPublicKey,  // 用户地址
        dataToUpload.dataType,       // 数据类型
        expiryDate,                  // 过期时间（以秒为单位）
        dataToUpload.encryptedValue  // 加密数据
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      const dataStoredEvent = receipt.events?.find(
        (event: any) => event.event === 'DataStored'
      );

      if (dataStoredEvent) {
        setEncryptedDataList(prev => 
          prev.map(item => 
            item.id === dataId ? { ...item, onChain: true, uploading: false } : item
          )
        );
        messageApi.success('Data uploaded to blockchain successfully!');
      } else {
        throw new Error('Data storage event not found in transaction receipt');
      }

    } catch (error: any) {
      console.error('Failed to upload data:', error);
      
      // 错误处理
      if (error.message.includes('Invalid expiry date')) {
        messageApi.error('Invalid expiry date!');
      } else if (error.message.includes('Only bank can store data')) {
        messageApi.error('Only registered banks can store data!');
      } else if (error.message.includes('Invalid user')) {
        messageApi.error('User is not registered!');
      } else {
        messageApi.error('Failed to upload data to blockchain!');
      }

      // 重置上传中状态
      setEncryptedDataList(prev => 
        prev.map(item => 
          item.id === dataId ? { ...item, uploading: false } : item
        )
      );
    }
  };

  // 在组件顶部添加 useEffect 来加载存储的历史记录
  useEffect(() => {
    const storedHistory = localStorage.getItem('encryptionHistory');
    if (storedHistory) {
      setEncryptedDataList(JSON.parse(storedHistory));
    }
  }, []);

  // 添加一个 useEffect 来监听和保存历史记录的变化
  useEffect(() => {
    if (encryptedDataList.length > 0) {
      localStorage.setItem('encryptionHistory', JSON.stringify(encryptedDataList));
    }
  }, [encryptedDataList]);

  // 添加删除单条记录的函数
  const handleDeleteRecord = (id: string) => {
    Modal.confirm({
      title: 'Delete Record',
      content: 'Are you sure you want to delete this record?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        setEncryptedDataList(prev => {
          const newList = prev.filter(item => item.id !== id);
          // 如果列表为空，清除localStorage
          if (newList.length === 0) {
            localStorage.removeItem('encryptionHistory');
          } else {
            localStorage.setItem('encryptionHistory', JSON.stringify(newList));
          }
          return newList;
        });
        messageApi.success('Record deleted');
      },
    });
  };

  return (
    <>
      {contextHolder}
      <Form
        form={form}
        onFinish={handleEncrypt}
        layout="vertical"
        className="mb-8"
      >
        {/* 密钥输入区域 */}
        <Row gutter={16} className="mb-2">
          <Col span={16}>
            <Form.Item
              name="userPublicKey"
              label={<Text strong>User Public Key</Text>}
              rules={[{ required: true, message: 'Please input user public key!' }]}
            >
              <Input
                placeholder="Enter user public key"
                className="font-mono h-10"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="dataType"
              label={<Text strong>Data Type</Text>}
              rules={[{ required: true, message: 'Please select data type!' }]}
            >
              <Select
                placeholder="Select data type"
                className="h-10"
                options={DATA_TYPES.map(type => ({
                  value: type.value,
                  label: (
                    <div>
                      <div>{type.label} For {type.task}</div>
                      {/* <div className="text-xs text-gray-400"></div> */}
                    </div>
                  )
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              name="fhePublicKey"
              label={<Text strong>FHE Public Key</Text>}
              rules={[{ required: true, message: 'Please request FHE public key!' }]}
            >
              <Input
                placeholder="FHE public key will appear here"
                readOnly
                className="font-mono h-10 bg-gray-50"
                suffix={
                  <Button
                    type="primary"
                    icon={<KeyOutlined />}
                    onClick={handleRequestFHEKey}
                    size="small"
                    className="ml-2"
                  >
                    Request FHE Public Key
                  </Button>
                }
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="data"
              label={<Text strong>Raw Data</Text>}
              rules={[{ required: true, message: 'Please input data!' }]}
            >
              <Input 
                placeholder="Enter data to encrypt" 
                className="h-10"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* 加密按钮 */}
        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            icon={<LockOutlined />}
            className="h-10"
            block
          >
            Encrypt Data
          </Button>
        </Form.Item>
      </Form>

      {/* 加密历史记录 */}
      {encryptedDataList.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-2">
              <LockOutlined className="text-gray-400" />
              <Text strong className="text-lg">
                Encryption History {" "}
              </Text>
              <Badge 
                  count={encryptedDataList.length} 
                  className="ml-2"
                  style={{ backgroundColor: '#52c41a' }}
                />
            </div>
          </div>
          <div className="space-y-4 mt-4">
            {encryptedDataList.map(item => (
              <Card 
                key={item.id} 
                size="small" 
                className="shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                extra={
                  <div className="flex items-center gap-2">
                    {item.onChain ? (
                      <Badge 
                        status="success" 
                        text={
                          <span className="flex items-center gap-10 px-2">
                            <CheckCircleOutlined className="text-green-500" />
                            <Text type="success" className="font-medium"> On Chain</Text>
                          </span>
                        }
                      />
                    ) : (
                      <Button
                        type="primary"
                        icon={item.uploading ? <LoadingOutlined /> : <CloudUploadOutlined />}
                        onClick={() => handleUploadToChain(item.id)}
                        loading={item.uploading}
                        size="small"
                        className="flex items-center gap-1.5"
                      >
                        <span>Upload to Chain</span>
                      </Button>
                    )}
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteRecord(item.id)}
                      size="small"
                    />
                  </div>
                }
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Tag color="blue" className="m-0">
                        {item.dataType}
                      </Tag>
                    </div>
                    <Text type="secondary" className="text-sm">
                      {new Date(item.timestamp).toLocaleString()}
                    </Text>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <Text type="secondary" className="text-sm">Encrypted Value:</Text>
                      <Button 
                        type="link" 
                        size="small"
                        onClick={() => toggleExpand(item.id)}
                      >
                        {expandedItems[item.id] ? 'Show Less' : 'Show More'}
                      </Button>
                    </div>
                    <Tooltip title="Click to copy" placement="top">
                      <Paragraph 
                        copyable={{ 
                          text: item.encryptedValue,
                          tooltips: ['Copy', 'Copied!'],
                        }} 
                        className="mb-0 font-mono text-sm leading-relaxed break-all"
                      >
                        {expandedItems[item.id] 
                          ? item.encryptedValue
                          : `${item.encryptedValue.substring(0, 50)}...`
                        }
                      </Paragraph>
                    </Tooltip>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <Text type="secondary" className="block mb-1">User Public Key</Text>
                      <div className="font-mono bg-gray-50 p-2 rounded truncate">
                        {item.userPublicKey.substring(0, 20)}...
                      </div>
                    </div>
                    <div>
                      <Text type="secondary" className="block mb-1">FHE Public Key</Text>
                      <div className="font-mono bg-gray-50 p-2 rounded truncate">
                        {item.fhePublicKey.substring(0, 20)}...
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}; 