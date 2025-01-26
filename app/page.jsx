"use client";

import { useState, useEffect, useRef } from "react";
import {
  Tabs,
  Form,
  Input,
  Button,
  Table,
  Upload,
  Image,
  Modal,
  Row,
  Col,
  QRCode,
  message,
  Select,
} from "antd";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase.config";

const { TabPane } = Tabs;
const QR_CODE_URL = "https://atzgoldsmith.com/memberinfo/";

const businessCategories = [
  {
    label: "Business Owner",
    value: "Business Owner",
  },
  {
    label: "Polishing",
    value: "Polishing",
  },
  {
    label: "Stone Setting",
    value: "Stone Setting",
  },
  {
    label: "Plain Jewelry",
    value: "Plain Jewelry",
  },
  {
    label: "Simple Jewelry Work",
    value: "Simple Jewelry Work",
  },
  {
    label: "Artificial Stone Setting",
    value: "Artificial Stone Setting",
  },
  {
    label: "Artificial Jewelry",
    value: "Artificial Jewelry",
  },
];

const memberCategories = [
  {
    label: "Associate Class",
    value: "Associate Class",
  },
  {
    label: "Worker Class",
    value: "Worker Class",
  },
];

export default function Home() {
  const [form] = Form.useForm();
  const [members, setMembers] = useState([]);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedMemberData, setSelectedMemberData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFirstMember, setIsFirstMember] = useState(false);

  useEffect(() => {
    fetchMembers();
    checkFirstMember();
  }, []);

  const checkFirstMember = async () => {
    try {
      const membersRef = collection(db, "members");
      const q = query(membersRef);
      const querySnapshot = await getDocs(q);
      setIsFirstMember(querySnapshot.empty);

      if (querySnapshot.empty) {
        form.setFieldsValue({
          membership_number: "",
        });
      } else {
        getNextMembershipNumber();
      }
    } catch (error) {
      console.error("Error checking first member:", error);
      message.error("Error checking database");
    }
  };

  const getNextMembershipNumber = async () => {
    try {
      const membersRef = collection(db, "members");
      const q = query(
        membersRef,
        orderBy("membership_number", "desc"),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      let nextNumber = "1001"; // Default starting number

      if (!querySnapshot.empty) {
        const lastDoc = querySnapshot.docs[0];
        const lastNumber = parseInt(lastDoc.data().membership_number);
        nextNumber = (lastNumber + 1).toString();
      }

      form.setFieldsValue({
        membership_number: nextNumber,
      });
    } catch (error) {
      console.error("Error getting next membership number:", error);
      message.error("Error generating membership number");
    }
  };

  const handleUpdatePdf = async () => {
    try {
      // Sending selectedMemberData to the API route
      const response = await fetch("/api/modify-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Indicating that we're sending JSON data
        },
        body: JSON.stringify({
          memberName: selectedMemberData.member_name,
          businessName: selectedMemberData.business_name,
          phoneNumber: selectedMemberData.phone_number,
          membershipNumber: selectedMemberData.membership_number,
          cnicNumber: selectedMemberData.cnic_number,
          qrCodeUrl: selectedMemberData.qrcode_url,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("PDF modified successfully! Check the output file.");
      } else {
        console.log("Error: " + data.message);
      }
    } catch (error) {
      console.log("Error: " + error.message);
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
      form.resetFields();
      fetchMembers(); // Refresh the members list
      getNextMembershipNumber(); // Get next membership number after adding new member
    } catch (error) {
      message.error("Error adding member.", error);
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
              name="cnic_number"
              label="CNIC Number"
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
              name="business_category"
              label="Business Category"
              rules={[
                {
                  required: true,
                  message: "Please select the business category",
                },
              ]}
            >
              <Select
                placeholder="Select business category"
                options={businessCategories}
              />
            </Form.Item>

            <Form.Item
              name="member_category"
              label="Member Category"
              rules={[
                {
                  required: true,
                  message: "Please select the member category",
                },
              ]}
            >
              <Select
                placeholder="Select member category"
                options={memberCategories}
              />
            </Form.Item>

            <Form.Item
              name="business_name"
              label="Business Name"
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
              <Input disabled={!isFirstMember} />
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
                    <strong>Business Address:</strong>{" "}
                    {selectedMemberData.business_address}
                  </p>
                  <p>
                    <strong>Home Address:</strong>{" "}
                    {selectedMemberData.home_address}
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
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "150px",
                    marginBottom: "16px",
                    textAlign: "center",
                  }}
                >
                  <QRCode value={selectedMemberData.qrcode_url} size={128} />
                </div>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleUpdatePdf}
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
