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
  setDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase.config";
import { values } from "pdf-lib";

const { TabPane } = Tabs;
const QR_CODE_URL = "https://atzgoldsmith.com/memberinfo/";

const businessCategories = [
  {
    label: "Gold testing laboratory",
    value: "Gold testing laboratory",
  },
  {
    label: "Old Gold jewellery purchaser",
    value: "Old Gold jewellery purchaser",
  },
  {
    label: "Gold Smith Jewellers",
    value: "Gold Smith Jewellers",
  },
  {
    label: "Jewellery Wholesellers",
    value: "Jewellery Wholesellers",
  },
  {
    label: "Diamond Jewellery Maker",
    value: "Diamond Jewellery Maker",
  },
  {
    label: "Silver Jewellery Maker",
    value: "Silver Jewellery Maker",
  },
  {
    label: "Artificial Jewellery Maker",
    value: "Artificial Jewellery Maker",
  },
  {
    label: "Kundan Jewellery Maker",
    value: "Kundan Jewellery Maker",
  },
  {
    label: "Bangle Maker",
    value: "Bangle Maker",
  },
  {
    label: "Plain Jewellery Maker",
    value: "Plain Jewellery Maker",
  },
  {
    label: "Sadekar Jewellery Maker",
    value: "Sadekar Jewellery Maker",
  },
  {
    label: "Casting Jewellery Maker",
    value: "Casting Jewellery Maker",
  },
  {
    label: "Dai Jewellery Maker",
    value: "Dai Jewellery Maker",
  },
  {
    label: "Chain Maker",
    value: "Chain Maker",
  },
  {
    label: "Bol Maker",
    value: "Bol Maker",
  },
  {
    label: "Diamond Seller",
    value: "Diamond Seller",
  },
  {
    label: "Zerkon and Coloured Stone Seller",
    value: "Zerkon and Coloured Stone Seller",
  },
  {
    label: "Stone Setter (Jaraiya)",
    value: "Stone Setter (Jaraiya)",
  },
  {
    label: "Polish Wala (Polishing Jewellery)",
    value: "Polish Wala (Polishing Jewellery)",
  },
  {
    label: "Laker & Brite Wala",
    value: "Laker & Brite Wala",
  },
  {
    label: "CAM + CAD + R.P Wala",
    value: "CAM + CAD + R.P Wala",
  },
  {
    label: "Naksha Navis (Jewellery Designer)",
    value: "Natsha Navis (Jewellery Designer)",
  },
  {
    label: "Patwa (Poroi Wala)",
    value: "Patwa (Poroi Wala)",
  },
];

const memberCategories = [
  {
    label: "Goldsmith Associate Class",
    value: "Goldsmith Associate Class",
  },
  {
    label: "Goldsmith Worker Class",
    value: "Goldsmith Worker Class",
  },
];

export default function Home() {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [members, setMembers] = useState([]);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedMemberData, setSelectedMemberData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditable, setIsEditable] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleUpdatePdf = async () => {
    try {
      setDownloading(true);

      // Get QR Code from canvas
      const canvas = document
        .getElementById("qrCanvas")
        ?.querySelector("canvas");

      if (!canvas) {
        console.error("QR Code not found!");
        setDownloading(false);
        return;
      }

      const qrBase64 = canvas.toDataURL("image/png");

      const response = await fetch("/api/modify-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberName: selectedMemberData.member_name,
          businessName: selectedMemberData.business_name,
          phoneNumber: selectedMemberData.phone_number,
          membershipNumber: selectedMemberData.membership_number,
          cnicNumber: selectedMemberData.cnic_number,
          qrCodeBase64: qrBase64,
          businessCategory: selectedMemberData.business_category,
          memberPic: selectedMemberData.photo_url,
          memberSince: selectedMemberData.member_since,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to modify PDF");
      }

      // Convert response to Blob
      const blob = await response.blob();
      const pdfUrl = URL.createObjectURL(blob);

      window.open(pdfUrl, "_blank");

      setDownloading(false);
      console.log("✅ PDF modified successfully!");
    } catch (error) {
      console.error("❌ Error:", error.message);
      setDownloading(false);
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
            type="secondary"
            style={{
              marginRight: 10,
              border: "2px dotted red", // Dotted red border
            }}
            onClick={() => {
              handleEditMember(member);
            }}
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

      // Check if CNIC or Membership Number already exists
      const existingMemberQuery = query(
        collection(db, "members"),
        where("cnic_number", "==", values.cnic_number)
      );
      const querySnapshot = await getDocs(existingMemberQuery);

      const existingMembershipNumberQuery = query(
        collection(db, "members"),
        where("membership_number", "==", values.membership_number)
      );
      const membershipNumberSnapShot = await getDocs(
        existingMembershipNumberQuery
      );

      if (!querySnapshot.empty) {
        message.error("This CNIC number already exists.");
        setLoading(false);
        return;
      }

      if (!membershipNumberSnapShot.empty) {
        message.error("This Membership number already exists.");
        setLoading(false);
        return;
      }

      const qrcodeUrl = `${QR_CODE_URL}${values.cnic_number}`;

      await setDoc(doc(db, "members", values.cnic_number), {
        ...values,
        photo_url: base64String,
        qrcode_url: qrcodeUrl,
      });

      message.success("Member added successfully!");
      form.resetFields();
      fetchMembers();
    } catch (error) {
      message.error("Error adding member: " + error.message);
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
    editForm.setFieldsValue(member);
    setSelectedMemberData(member);
    setIsEditable(true);
  };

  const onEditFormFinish = async (values) => {
    setEditLoading(true);
    try {
      const docRef = doc(db, "members", values.cnic_number);
      let updatedPhotoUrl = values.photo_url;

      if (values.photo_url?.fileList) {
        const fileList = values.photo_url.fileList;
        if (fileList.length > 0) {
          const file = fileList[0].originFileObj;
          updatedPhotoUrl = await convertToBase64(file);
        }
      }

      const qrcodeUrl = `${QR_CODE_URL}${values.cnic_number}`;

      // Update the existing member data
      await setDoc(
        docRef,
        {
          ...values,
          photo_url: updatedPhotoUrl,
          qrcode_url: qrcodeUrl,
        },
        { merge: true }
      );

      message.success("Member details updated successfully!");
      form.resetFields();
      fetchMembers();
      setEditLoading(false);
    } catch (error) {
      message.error("Error updating member: " + error.message);
    } finally {
      setEditLoading(false);
    }
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
              rules={[
                { required: true, message: "CNIC number is required" },
                {
                  pattern: /^\d{13}$/,
                  message: "CNIC number must be exactly 13 digits",
                },
              ]}
            >
              <Input maxLength={13} placeholder="Enter 13-digit CNIC" />
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
              <Input />
            </Form.Item>

            <Form.Item
              name="member_since"
              label="Member Since"
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
            dataSource={[...filteredMembers].sort(
              (a, b) => a.membership_number - b.membership_number
            )}
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
                  <p>
                    <strong>Member Since:</strong>{" "}
                    {selectedMemberData.member_since || "No data"}
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
                  loading={downloading}
                >
                  Download QR Code
                </Button>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
      <Modal
        visible={isEditable}
        title="Edit Information"
        onCancel={() => setIsEditable(false)}
        footer={null}
        width={600}
        centered
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={onEditFormFinish}
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
            rules={[
              { required: true, message: "CNIC number is required" },
              {
                pattern: /^\d{13}$/,
                message: "CNIC number must be exactly 13 digits",
              },
            ]}
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
            <Input />
          </Form.Item>

          <Form.Item
            name="member_since"
            label="Member Since"
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
              loading={editLoading}
            >
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
