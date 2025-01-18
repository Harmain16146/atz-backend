"use client";

import { useState, useEffect, useRef } from "react";
import {
  Tabs,
  Form,
  Input,
  Button,
  Table,
  Upload,
  message,
  Image,
  Modal,
  Row,
  Col,
  QRCode,
} from "antd";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase.config";

const { TabPane } = Tabs;
const QR_CODE_URL = "https://atz-rosy.vercel.app/";

export default function Home() {
  const [form] = Form.useForm();
  const [members, setMembers] = useState([]);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedMemberData, setSelectedMemberData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchMembers();
  }, []);

  function doDownload(url, fileName) {
    const a = document.createElement("a");
    a.download = fileName;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const downloadCanvasQRCode = () => {
    const canvas = document.getElementById("qrCanvas")?.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      doDownload(url, "QRCode.png");
    }
  };

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
    {
      title: "View Data",
      key: "view_data",
      render: (_, member) => (
        <>
          <Button
            type="primary"
            style={{ marginRight: 10 }}
            onClick={() => {
              setSelectedMemberData(member);
              setIsVisible(true);
            }}
          >
            View
          </Button>
          <Button
            type="primary"
            danger
            onClick={() => handleEditMember(member)}
          >
            Edit
          </Button>
        </>
      ),
    },
  ];

  const handlePreview = (file) => {
    setImageUrl(URL.createObjectURL(file));
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const fileList = values.photo_url?.fileList || [];
      if (fileList.length === 0) {
        throw new Error("No file selected");
      }
      const file = fileList[0].originFileObj;
      const base64String = await convertToBase64(file);

      const existingMemberQuery = query(
        collection(db, "members"),
        where("cnic_number", "==", values.cnic_number)
      );
      const querySnapshot = await getDocs(existingMemberQuery);

      if (!querySnapshot.empty) {
        message.error("This CNIC number already exists.");
        setLoading(false);
        return;
      }

      const qrcodeUrl = `${QR_CODE_URL}${values.cnic_number}`;

      await addDoc(collection(db, "members"), {
        ...values,
        photo_url: base64String,
        qrcode_url: qrcodeUrl,
      });

      message.success("Member added successfully!");
      fetchMembers(); // Refresh the members list
    } catch (error) {
      message.error("Error adding member.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "members"));
      const membersData = [];
      querySnapshot.forEach((doc) => {
        membersData.push({ key: doc.id, ...doc.data() });
      });
      setMembers(membersData);
    } catch (error) {
      message.error("Error fetching members");
    } finally {
      setLoading(false);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const filteredMembers = members.filter((member) =>
    member.member_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditMember = (member) => {
    form.setFieldsValue(member);
    setSelectedMemberData(member);
    setIsVisible(true);
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
          <Input
            placeholder="Search members by name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <Table
            columns={columns}
            dataSource={filteredMembers}
            rowKey="key"
            loading={loading}
          />
        </TabPane>
      </Tabs>
      <Modal
        visible={isVisible}
        title="Personal Information"
        onCancel={() => setIsVisible(false)}
        footer={null}
        width={800}
        centered
      >
        {selectedMemberData && (
          <div
            style={{
              padding: "20px",
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
            }}
          >
            <Row gutter={[16, 16]}>
              <Col span={16}>
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <p>
                    <strong>Member Name:</strong>{" "}
                    {selectedMemberData.member_name}
                  </p>
                  <p>
                    <strong>Business Name:</strong>{" "}
                    {selectedMemberData.business_name}
                  </p>
                  <p>
                    <strong>Phone Number:</strong>{" "}
                    {selectedMemberData.phone_number}
                  </p>
                  <p>
                    <strong>Membership Number:</strong>{" "}
                    {selectedMemberData.membership_number}
                  </p>
                  <p>
                    <strong>CNIC Number:</strong>{" "}
                    {selectedMemberData.cnic_number}
                  </p>
                </div>
              </Col>
              <Col span={8} style={{ textAlign: "center" }}>
                <Image
                  src={selectedMemberData.photo_url}
                  width={120}
                  height={120}
                  alt="Member Photo"
                  style={{ borderRadius: "50%", marginBottom: "16px" }}
                />
                <div
                  id="qrCanvas"
                  style={{
                    display: "flex", // Use flexbox for alignment
                    justifyContent: "center", // Center horizontally
                    alignItems: "center", // Center vertically
                    height: "150px", // Set a specific height to center vertically
                    marginBottom: "16px",
                    textAlign: "center",
                  }}
                >
                  <QRCode value={selectedMemberData.qrcode_url} size={128} />
                </div>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={downloadCanvasQRCode}
                >
                  Download QR Code
                </Button>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
