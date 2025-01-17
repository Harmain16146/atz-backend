"use client";

import { useState } from "react";
import { Tabs, Form, Input, Button, Table, Upload, message, Image } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db, storage } from "../firebase.config";

const { TabPane } = Tabs;

export default function Home() {
  const [form] = Form.useForm();
  const [members, setMembers] = useState([]);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false); // Loading state

  const columns = [
    { title: "Member Name", dataIndex: "member_name", key: "member_name" },
    {
      title: "Business Name",
      dataIndex: "business_name",
      key: "business_name",
    },
    { title: "Phone Number", dataIndex: "phone_number", key: "phone_number" },
    {
      title: "Membership Number",
      dataIndex: "membership_number",
      key: "membership_number",
    },
    { title: "CNIC Number", dataIndex: "cnic_number", key: "cnic_number" },
    { title: "View Data", dataIndex: "view_data", key: "view_data" },
  ];
  const data = members.map((member) => ({
    key: member.id, // Use the Firestore document ID as the key
    member_name: member.member_name,
    business_name: member.business_name,
    phone_number: member.phone_number,
    membership_number: member.membership_number,
    cnic_number: member.cnic_number,
    view_data: (
      <Button
        type="primary"
        onClick={() => handleViewData(member)} // Function to handle view action
      >
        View
      </Button>
    ),
  }));

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file); // file should be of type Blob
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const onFinish = async (values) => {
    setLoading(true); // Set loading to true when submitting the form

    try {
      // Extract the file object from Upload component
      const fileList = values.photo_url?.fileList || [];
      if (fileList.length === 0) {
        throw new Error("No file selected");
      }

      // Use the first file in the list
      const file = fileList[0].originFileObj;

      // Convert to Base64
      const base64String = await convertToBase64(file);

      // Check if the CNIC number already exists in Firestore
      const q = query(
        collection(db, "members"),
        where("cnic_number", "==", values.cnic_number)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // CNIC already exists
        message.error("This CNIC number already exists.");
        setLoading(false); // Set loading to false if CNIC exists
        return; // Exit the function if CNIC exists
      }

      // Add document to Firestore if CNIC doesn't exist
      const docRef = await addDoc(collection(db, "members"), {
        ...values,
        photo_url: base64String, // Storing the Base64 string
      });
      message.success("Member added successfully!");
      setLoading(false); // Set loading to false after submission
    } catch (error) {
      console.error("Error adding document: ", error);
      message.error("Error adding member.");
      setLoading(false); // Set loading to false if there's an error
    }
  };

  const fetchMembers = async () => {
    setLoading(true); // Set loading state to true
    try {
      // Fetch data from Firestore
      const querySnapshot = await getDocs(collection(db, "members"));
      const membersData = [];

      querySnapshot.forEach((doc) => {
        // Get data from each document and add to membersData array
        membersData.push({
          key: doc.id, // You can use the Firestore document ID as the key
          ...doc.data(),
        });
      });

      setMembers(membersData); // Set the fetched data to the state
    } catch (error) {
      message.error("Error fetching members");
    } finally {
      setLoading(false); // Set loading state back to false after fetch is complete
    }
  };

  const handlePreview = (file) => {
    setImageUrl(URL.createObjectURL(file));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Business Directory
      </h1>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Registration Form" key="1">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            className="max-w-3xl mx-auto"
          >
            <Form.Item
              name="photo_url"
              label="Photo"
              rules={[{ required: true, message: "Please upload a photo" }]}
            >
              <Upload
                name="photo"
                listType="picture"
                maxCount={1}
                beforeUpload={() => false}
                onPreview={handlePreview}
              >
                <Button icon={<UploadOutlined />}>Upload Photo</Button>
              </Upload>
            </Form.Item>

            {imageUrl && (
              <div style={{ marginBottom: "16px" }}>
                <Image src={imageUrl} width={200} preview={false} />
              </div>
            )}

            <Form.Item
              name="business_category"
              label="Business Category"
              rules={[
                {
                  required: true,
                  message: "Please enter the business category",
                },
              ]}
            >
              <Input placeholder="Enter business category" />
            </Form.Item>

            <Form.Item
              name="member_name"
              label="Member Name"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="father_name"
              label="Father Name"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="business_name"
              label="Business Name"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="phone_number"
              label="Phone Number"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="business_address"
              label="Business Address"
              rules={[{ required: true }]}
            >
              <Input.TextArea />
            </Form.Item>

            <Form.Item
              name="membership_number"
              label="Membership Number"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="cnic_number"
              label="CNIC Number"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="home_address"
              label="Home Address"
              rules={[{ required: true }]}
            >
              <Input.TextArea />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full"
                loading={loading}
              >
                Submit
              </Button>
            </Form.Item>
          </Form>
        </TabPane>

        <TabPane tab="Members List" key="2">
          <Button
            type="primary"
            onClick={fetchMembers}
            className="mb-4"
            loading={loading}
          >
            Refresh Data
          </Button>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            scroll={{ x: true }}
          />
        </TabPane>
      </Tabs>
    </div>
  );
}
