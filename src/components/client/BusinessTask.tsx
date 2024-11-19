import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Select, Space, Typography } from 'antd';
import { BankOutlined, FileAddOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface BusinessTaskRequest {
  bankWeId: string;
  businessType: string;
}

export const BusinessTask: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const handleSubmit = async (values: BusinessTaskRequest) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      messageApi.success('Business task created successfully!');
      form.resetFields();
    } catch (error) {
      messageApi.error('Failed to create business task!');
      console.error('Task creation failed:', error);
    }
  };

  return (
    <Card 
      className="shadow-md hover:shadow-lg transition-shadow duration-300"
      title={
        <div className="flex items-center space-x-2">
          <FileAddOutlined className="text-blue-500" />
          <Title level={4} className="m-0">New Business Task</Title>
        </div>
      }
    >
      {contextHolder}
      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        className="max-w-lg mx-auto"
      >
        <Form.Item
          name="bankWeId"
          label={<Text strong>Bank WeID</Text>}
          rules={[{ required: true, message: 'Please input bank WeID!' }]}
        >
          <Input 
            prefix={<BankOutlined className="text-gray-400" />} 
            placeholder="Enter bank WeID"
            className="rounded-lg"
          />
        </Form.Item>

        <Form.Item
          name="businessType"
          label={<Text strong>Business Type</Text>}
          rules={[{ required: true, message: 'Please select business type!' }]}
        >
          <Select 
            placeholder="Select business type"
            className="rounded-lg"
          >
            <Option value="loan">Loan Application</Option>
            <Option value="credit">Credit Assessment</Option>
            <Option value="mortgage">Mortgage Application</Option>
          </Select>
        </Form.Item>

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            icon={<FileAddOutlined />}
            size="large"
            block
            className="rounded-lg h-12"
          >
            Submit Business Task
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}; 