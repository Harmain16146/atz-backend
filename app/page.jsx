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
  query,
  where,
  getDocs,
  orderBy,
  limit,
  setDoc,
  doc,
  getCountFromServer,
  startAfter,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase.config";

const { TabPane } = Tabs;
const QR_CODE_URL = "https://atzgoldsmith.com/memberinfo/";

const businessCategories = [
  {
    label: "Gold testing laboratory",
    value: "Gold testing laboratory",
  },
  {
    label: "Old Gold purchaser",
    value: "Old Gold purchaser",
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
    label: "Gem Stone Seller",
    value: "Gem Stone Seller",
  },
  {
    label: "Stone Setter",
    value: "Stone Setter",
  },
  {
    label: "Polishing Jewellery",
    value: "Polishing Jewellery",
  },
  {
    label: "Laker & Brite Wala",
    value: "Laker & Brite Wala",
  },
  {
    label: "CAM + CAD",
    value: "CAM + CAD",
  },
  {
    label: "Jewellery Designer",
    value: "Jewellery Designer",
  },
  {
    label: "Patwa (Poroi Wala)",
    value: "Patwa (Poroi Wala)",
  },
  {
    label: "Chailaii wala",
    value: "Chailaii wala",
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
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [totalDocs, setTotalDocs] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [isVisible, setIsVisible] = useState(false);
  const [selectedMemberData, setSelectedMemberData] = useState(null);

  const [isEditable, setIsEditable] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  //request
  const [requests, setRequests] = useState([]);
  const [lastRequestDoc, setLastRequestDoc] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [membershipNumber, setMembershipNumber] = useState("");

  useEffect(() => {
    fetchTotalDocs(); // Fetch total documents for pagination
    fetchMembers();
    fetchRequests();
  }, []);

  const fetchRequests = async (nextPage = false) => {
    setRequestLoading(true);
    let q;

    if (nextPage && lastRequestDoc) {
      q = query(
        collection(db, "requests"),
        where("approved", "==", false),
        orderBy("createdAt"),
        startAfter(lastRequestDoc),
        limit(10)
      );
    } else {
      q = query(
        collection(db, "requests"),
        where("approved", "==", false),
        orderBy("createdAt"),
        limit(10)
      );
    }

    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setRequests(nextPage ? [...requests, ...data] : data);

    if (querySnapshot.docs.length > 0) {
      setLastRequestDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
    }
    setRequestLoading(false);
  };

  const handleView = (record) => {
    setSelectedRequest(record);
    setIsRequestModalOpen(true);
  };

  const handleApprove = async () => {
    if (!membershipNumber.trim()) {
      message.error("Please enter a Membership Number before approving.");
      return;
    }
    setRequestLoading(true);
    try {
      const { approved, id, ...memberData } = selectedRequest; // Exclude `approved` and `id`

      const memberRef = doc(db, "members", selectedRequest.cnic_number);

      // Add to "members" without `approved`
      await setDoc(memberRef, {
        ...memberData,
        membership_number: membershipNumber,
      });

      // Update the request's approved status in Firestore
      const requestRef = doc(db, "requests", selectedRequest.id);
      await updateDoc(requestRef, { approved: true });

      message.success("Request approved and added to members.");
      setIsRequestModalOpen(false);
      setMembershipNumber("");
      setRequestLoading(false);
      fetchRequests();
      setIsRequestModalOpen(false);
    } catch (error) {
      console.error("Error approving request:", error);
      message.error("Failed to approve the request. Please try again.");
      setRequestLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedRequest) return;
    setRequestLoading(true);
    const requestRef = doc(db, "requests", selectedRequest.id);
    try {
      await deleteDoc(requestRef);
      setRequests(requests.filter((item) => item.id !== selectedRequest.id));
      setIsModalOpen(false);
      setRequestLoading(false);
      fetchRequests();
      setIsRequestModalOpen(false);
    } catch (error) {
      console.error("Error declining request:", error);
      setRequestLoading(false);
    }
  };

  const requestColumns = [
    { title: "Name", dataIndex: "member_name", key: "member_name" },
    {
      title: "Busniess Name",
      dataIndex: "business_name",
      key: "business_name",
    },
    { title: "Cnic Number", dataIndex: "cnic_number", key: "cnic_number" },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button type="primary" onClick={() => handleView(record)}>
          View
        </Button>
      ),
    },
  ];

  const handleUpdatePdf = async () => {
    try {
      setDownloading(true);

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
        headers: { "Content-Type": "application/json" },
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

      // Create a temporary anchor link
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.target = "_blank"; // Open in a new tab
      a.download = "modified.pdf"; // Force download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloading(false);
      console.log("✅ PDF opened/downloaded successfully!");
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
              border: "2px dotted red",
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

  const fetchTotalDocs = async () => {
    try {
      const collRef = collection(db, "members");
      const snapshot = await getCountFromServer(collRef);
      console.log("size of the data is", snapshot.data().count);

      setTotalDocs(snapshot.data().count);
    } catch (error) {
      message.error("Error fetching total members count");
    }
  };

  const fetchMembers = async (nextPage = false) => {
    setLoading(true);
    try {
      let q = query(
        collection(db, "members"),
        where("membership_number", ">=", "0"),
        orderBy("membership_number"),
        limit(10)
      );

      if (nextPage && lastDoc) {
        q = query(
          collection(db, "members"),
          orderBy("membership_number"),
          startAfter(lastDoc),
          limit(10)
        );
      }

      const querySnapshot = await getDocs(q);
      const membersData = [];

      querySnapshot.forEach((doc) => {
        membersData.push({ key: doc.id, ...doc.data() });
      });
      console.log("member data is", membersData);

      setMembers(nextPage ? [...members, ...membersData] : membersData);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]); // Set last document for pagination
    } catch (error) {
      message.error("Error fetching members");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (value) => {
    setSearchTerm(value);
    if (!value) {
      fetchMembers();
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, "members"),
        where("member_name", ">=", value),
        where("member_name", "<=", value + "\uf8ff"),
        orderBy("member_name"),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const searchResults = [];
      querySnapshot.forEach((doc) => {
        searchResults.push({ key: doc.id, ...doc.data() });
      });
      setMembers(searchResults);
    } catch (error) {
      message.error("Error searching members");
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
      <h1 className="text-3xl font-bold mb-6 text-center">ATZ Backend</h1>
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
          <div className="flex flex-row justify-between items-center mb-4 w-full">
            <Input
              placeholder="Search members by name"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-3/4"
            />
            <span className="text-gray-500 text-base whitespace-nowrap">
              Total Entries: {totalDocs}
            </span>
          </div>

          <Table
            columns={columns}
            dataSource={members}
            rowKey="key"
            loading={loading}
            pagination={{
              pageSize: 10,
              total: totalDocs,
              onChange: (page) => {
                if (page > members.length / 10) {
                  fetchMembers(true); // Fetch next set of members when a new page is requested
                }
              },
              showSizeChanger: false, // Hide page size dropdown
              itemRender: (page, type, originalElement) => {
                if (type === "page") {
                  return null;
                }
                return originalElement; // Keep arrows functional
              },
            }}
          />
        </TabPane>
        <TabPane tab="New Requests" key="3">
          <Table
            dataSource={requests}
            columns={requestColumns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            loading={requestLoading}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "10px",
            }}
          >
            <Button onClick={() => fetchRequests(true)} disabled={loading}>
              Next
            </Button>
          </div>
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
                  Download PDF
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
      <Modal
        title="Request Details"
        open={isRequestModalOpen}
        onCancel={() => setIsRequestModalOpen(false)}
        footer={[
          <Button
            key="decline"
            type="primary"
            danger
            onClick={handleDecline}
            loading={requestLoading}
          >
            Decline
          </Button>,
          <Button
            key="approve"
            type="primary"
            onClick={handleApprove}
            disabled={!membershipNumber.trim()}
            loading={requestLoading}
          >
            Approve
          </Button>,
        ]}
      >
        {selectedRequest && (
          <div>
            <Row justify="center" gutter={[16, 16]}>
              <Col>
                <Image
                  src={selectedRequest.photo_url}
                  width={200}
                  height={200}
                  alt="Member Photo"
                  style={{ marginBottom: "16px" }}
                />
              </Col>
              <Col>
                <Image
                  src={selectedRequest.payment_screenshot}
                  width={200}
                  height={200}
                  alt="Payment Screenshot"
                  style={{ marginBottom: "16px" }}
                />
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <p>
                  <strong>Name:</strong> {selectedRequest.member_name}
                </p>
                <p>
                  <strong>CNIC Number:</strong> {selectedRequest.cnic_number}
                </p>
                <p>
                  <strong>Father Name:</strong> {selectedRequest.father_name}
                </p>
                <p>
                  <strong>Business Name:</strong>{" "}
                  {selectedRequest.business_name}
                </p>
                <p>
                  <strong>Business Category:</strong>{" "}
                  {selectedRequest.business_category}
                </p>
              </Col>
              <Col span={12}>
                <p>
                  <strong>Phone:</strong> {selectedRequest.phone_number}
                </p>
                <p>
                  <strong>Business Address:</strong>{" "}
                  {selectedRequest.business_address}
                </p>
                <p>
                  <strong>Home Address:</strong> {selectedRequest.home_address}
                </p>
                <p>
                  <strong>Member Since:</strong> {selectedRequest.member_since}
                </p>
              </Col>
            </Row>

            {/* Membership Number Input */}
            <Row justify="center" style={{ marginTop: "16px" }}>
              <Col span={16}>
                <Input
                  placeholder="Enter Membership Number"
                  value={membershipNumber}
                  onChange={(e) => setMembershipNumber(e.target.value)}
                />
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
