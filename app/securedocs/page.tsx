"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  Timestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
// Removed Cloudinary imports
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@clerk/nextjs";
import toast, { Toaster } from "react-hot-toast";
import { MoreVertical, Download, Trash2, Eye } from "lucide-react";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// Types
interface Document {
  id: string;
  userId: string;
  type: string;
  name: string;
  fileUrl: string;
  timestamp: Timestamp;
}

const DocumentsPage = () => {
  const [documentTypes, setDocumentTypes] = useState<string[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [customType, setCustomType] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [filterType, setFilterType] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { user } = useUser();

  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "documentTypes"));
        const types = querySnapshot.docs.map((doc) => doc.data().name);
        setDocumentTypes(types);
      } catch (error) {
        console.error("Error fetching document types:", error);
        toast.error("Failed to fetch document types");
      }
    };
    fetchDocumentTypes();
  }, []);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user?.id) return;
      try {
        const q = query(
          collection(db, "documents"),
          where("userId", "==", user.id)
        );
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Document[];
        setDocuments(docs);
      } catch (error) {
        console.error("Error fetching documents:", error);
        toast.error("Failed to fetch documents");
      }
    };
    fetchDocuments();
  }, [user?.id]);

  // Updated file upload handler using Firebase Storage with metadata
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast.error("You must be signed in to upload files.");
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;
    const storage = getStorage();
    // Create a unique path for the file upload.
    const storageRef = ref(storage, `documents/${file.name}-${uuidv4()}`);
    // Include metadata with the authenticated user's ID so storage rules can verify access.
    const metadata = {
      customMetadata: {
        userId: user.id,
      },
    };
    // Start a loading toast and capture its ID.
    const toastId = toast.loading("Uploading file...");
    try {
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Calculate progress percentage.
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          // Update the existing toast with the new progress.
          toast.loading(`Uploading: ${Math.round(progress)}%`, { id: toastId });
        },
        (error) => {
          console.error("Error uploading file:", error);
          // Update the toast with an error message.
          toast.error("Failed to upload file", { id: toastId });
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setFileUrl(downloadUrl);
          // Update the toast to show success and auto-dismiss.
          toast.success("File uploaded successfully", { id: toastId });
        }
      );
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    }
  };

  // New function to view the document in a new tab.
  const handleView = (fileUrl: string) => {
    window.open(fileUrl, "_blank");
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be signed in to add a document.");
      return;
    }
    if (!documentName || (!selectedType && !customType) || !fileUrl) {
      toast.error("Please fill all fields and upload a document.");
      return;
    }
    try {
      const newDoc = {
        id: uuidv4(),
        userId: user.id,
        type: selectedType === "other" ? customType : selectedType,
        name: documentName,
        fileUrl,
        timestamp: Timestamp.now(),
      };
      const docRef = await addDoc(collection(db, "documents"), newDoc);
      setDocuments((prev) => [...prev, { ...newDoc, id: docRef.id }]);
      // Reset form
      setDocumentName("");
      setSelectedType("");
      setCustomType("");
      setFileUrl("");
      setIsOpen(false);
      toast.success("Document added successfully.");
    } catch (error) {
      console.error("Error adding document:", error);
      toast.error("Failed to add document");
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "documents", documentId));
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      toast.success("Document deleted successfully");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("File downloaded successfully");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const filteredDocuments =
    filterType === "all"
      ? documents
      : filterType
      ? documents.filter((doc) => doc.type === filterType)
      : documents;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster />
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Documents</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                + Add Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogTitle>Upload Document</DialogTitle>
              <div className="grid gap-4 py-4">
                <h2 className="text-xl font-bold">Upload Document</h2>
                <Input
                  placeholder="Enter document name"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                />
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {selectedType === "other" && (
                  <Input
                    placeholder="Enter custom document type"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                  />
                )}
                <div className="w-full">
                  {/* File input using Firebase Storage */}
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    className="mb-2"
                  />
                  {fileUrl && (
                    <div className="mt-2 text-sm text-green-600">
                      Uploaded file URL: {fileUrl}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleSubmit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Submit
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="mb-4">
            <SelectValue placeholder="All Documents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Documents</SelectItem>
            {documentTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="bg-white shadow-md rounded-md p-4">
          {filteredDocuments.length === 0 ? (
            <p className="text-gray-500">No documents available.</p>
          ) : (
            <ul className="space-y-4">
              {filteredDocuments.map((doc) => (
                <li
                  key={doc.id}
                  className="flex justify-between items-center border-b pb-3"
                >
                  <div>
                    <p className="font-bold">{doc.name}</p>
                    <p className="text-sm text-gray-500">{doc.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(doc.fileUrl)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDownload(doc.fileUrl, doc.name)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(doc.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
