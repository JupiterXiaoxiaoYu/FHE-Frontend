import React, { useState } from 'react';
import { Form, Input, Button, message, Typography, Row, Col, Card, Badge, Tooltip, Tag } from 'antd';
import { 
  LockOutlined, 
  KeyOutlined, 
  CloudUploadOutlined,
  CheckCircleOutlined,
  LoadingOutlined 
} from '@ant-design/icons';

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

export const DataEncryption: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [encryptedDataList, setEncryptedDataList] = useState<EncryptedData[]>([
    {
      id: 'mock-1',
      userPublicKey: 'user-public-key-7f9c8b3a2d1e',
      fhePublicKey: 'fhe-public-key-4k5j6h7g8f9d',
      dataType: 'credit_score',
      encryptedValue: 'encrypted-data-9d8f7e6a5b4c3d2e1f-credit-score-value-mock',
      timestamp: Date.now() - 3600000, // 1小时前
      onChain: true,
    },
    {
      id: 'mock-2',
      userPublicKey: 'user-public-key-2b3c4d5e6f7g',
      fhePublicKey: 'fhe-public-key-8h9j0k1l2m3n',
      dataType: 'income',
      encryptedValue: 'encrypted-data-5f4e3d2c1b0a9z8y7x-income-value-mock',
      timestamp: Date.now() - 7200000, // 2小时前
      onChain: false,
    }
  ]);

  // 请求FHE公钥
  const handleRequestFHEKey = async () => {
    try {
      const userPublicKey = form.getFieldValue('userPublicKey');
      if (!userPublicKey) {
        messageApi.warning('Please input user public key first!');
        return;
      }

      const mockFHEKey = 'fhe-public-key-' + Math.random().toString(36).substring(7);
      form.setFieldsValue({ fhePublicKey: mockFHEKey });
      messageApi.success('FHE public key retrieved successfully!');
    } catch (error) {
      messageApi.error('Failed to get FHE public key!');
    }
  };

  // 加密数据
  const handleEncrypt = async (values: any) => {
    try {
      if (!values.fhePublicKey) {
        messageApi.warning('Please request FHE public key first!');
        return;
      }

      const newEncryptedData: EncryptedData = {
        id: Math.random().toString(36).substring(7),
        userPublicKey: values.userPublicKey,
        fhePublicKey: values.fhePublicKey,
        dataType: values.dataType,
        encryptedValue: 'encrypted-' + Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        onChain: false,
      };

      setEncryptedDataList(prev => [newEncryptedData, ...prev]);
      messageApi.success('Data encrypted successfully!');
      form.resetFields();
    } catch (error) {
      messageApi.error('Failed to encrypt data!');
    }
  };

  // 上传数据到链上
  const handleUploadToChain = async (dataId: string) => {
    try {
      // 设置上传中状态
      setEncryptedDataList(prev => 
        prev.map(item => 
          item.id === dataId ? { ...item, uploading: true } : item
        )
      );

      // 模拟上链操作
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 更新状态为已上链
      setEncryptedDataList(prev => 
        prev.map(item => 
          item.id === dataId ? { ...item, onChain: true, uploading: false } : item
        )
      );

      messageApi.success('Data uploaded to blockchain successfully!');
    } catch (error) {
      messageApi.error('Failed to upload data to blockchain!');
      // 重置上传中状态
      setEncryptedDataList(prev => 
        prev.map(item => 
          item.id === dataId ? { ...item, uploading: false } : item
        )
      );
    }
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
              rules={[{ required: true, message: 'Please input data type!' }]}
            >
              <Input 
                placeholder="E.g., credit_score" 
                className="h-10"
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
                    Request Key
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
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <LockOutlined className="text-gray-400" />
              <Text strong className="text-lg">
                Encryption History {" "}
              </Text>
              <Badge 
                  count={encryptedDataList.length} 
                  className="ml-10 mb-6"
                  style={{ backgroundColor: '#52c41a' }}
                />
            </div>
          </div>
          <div className="space-y-4">
            {encryptedDataList.map(item => (
              <Card 
                key={item.id} 
                size="small" 
                className="shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                extra={
                  item.onChain ? (
                    <Badge 
                      status="success" 
                      text={
                        <span className="flex items-center gap-10 px-2 ">
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
                  )
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
                    <Tooltip title="Click to copy" placement="top">
                      <Paragraph 
                        copyable={{ 
                          text: item.encryptedValue,
                          tooltips: ['Copy', 'Copied!'],
                        }} 
                        className="mb-0 font-mono text-sm leading-relaxed break-all"
                      >
                        {item.encryptedValue}
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