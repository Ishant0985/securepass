"use client";

import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useUser } from "@clerk/nextjs";
import toast, { Toaster } from "react-hot-toast";
import { Menu, MenuItem, MenuButton } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/index.css";
import Modal from "react-modal";


// Define a TypeScript interface for our password document data.
interface PasswordData {
  id: string;
  website: string;
  username?: string;
  email?: string;
  phone?: string;
  password: string;
  authenticationMethod: "email" | "email_username" | "email_phone" | "email_phone_username";
}

export const YourPasswords = () => {
  const { user } = useUser();
  const [passwords, setPasswords] = useState<PasswordData[]>([]);
  const [selectedAuthMethod, setSelectedAuthMethod] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState<PasswordData | null>(null);

  useEffect(() => {
    if (user) {
      const fetchPasswords = async () => {
        const q = query(collection(db, "passwords"), where("userId", "==", user.id));
        const querySnapshot = await getDocs(q);
        const fetchedPasswords = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PasswordData));
        setPasswords(fetchedPasswords);
      };
      fetchPasswords();
    }
  }, [user]);

  const filteredPasswords = selectedAuthMethod === "all" 
    ? passwords 
    : passwords.filter(p => p.authenticationMethod === selectedAuthMethod);

  const handleCopy = async (passwordDetails: PasswordData) => {
    const detailsText = `Website: ${passwordDetails.website}
Authentication Method: ${passwordDetails.authenticationMethod}
Email: ${passwordDetails.email ?? "N/A"}
Username: ${passwordDetails.username ?? "N/A"}
Phone: ${passwordDetails.phone ?? "N/A"}
Password: ${passwordDetails.password}`;
    try {
      await navigator.clipboard.writeText(detailsText);
      toast.success("Copied details to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy details");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "passwords", id));
      setPasswords(passwords.filter(password => password.id !== id));
      toast.success("Password deleted successfully!");
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Failed to delete password");
    }
  };

  const handleEdit = (password: PasswordData) => {
    setCurrentPassword(password);
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    if (currentPassword) {
      try {
        await updateDoc(doc(db, "passwords", currentPassword.id), {
          website: currentPassword.website,
          authenticationMethod: currentPassword.authenticationMethod,
          email: currentPassword.email,
          username: currentPassword.username,
          phone: currentPassword.phone,
          password: currentPassword.password,
        });
        setPasswords(passwords.map(p => (p.id === currentPassword.id ? currentPassword : p)));
        toast.success("Password updated successfully!");
        setIsModalOpen(false);
      } catch (error) {
        console.error("Failed to update:", error);
        toast.error("Failed to update password");
      }
    }
  };

  return (
    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <Toaster />
      <h2 className="text-xl font-bold mb-4">Your Passwords</h2>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="authMethod">
          Filter by Authentication Method:
        </label>
        <select
          id="authMethod"
          value={selectedAuthMethod}
          onChange={(e) => setSelectedAuthMethod(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="all">All</option>
          <option value="email">Email</option>
          <option value="email_username">Email &amp; Username</option>
          <option value="email_phone">Email &amp; Phone</option>
          <option value="email_phone_username">Email, Phone &amp; Username</option>
        </select>
      </div>

      {filteredPasswords.length > 0 ? (
        filteredPasswords.map((password, index) => (
          <div className="mb-4 border p-4 rounded flex justify-between items-center" key={index}>
            <div>
              <p className="text-gray-700"><strong>Website:</strong> {password.website}</p>
              <p className="text-gray-700"><strong>Authentication Method:</strong> {password.authenticationMethod}</p>
              {password.email && <p className="text-gray-700"><strong>Email:</strong> {password.email}</p>}
              {password.username && <p className="text-gray-700"><strong>Username:</strong> {password.username}</p>}
              {password.phone && <p className="text-gray-700"><strong>Phone:</strong> {password.phone}</p>}
              <p className="text-gray-700"><strong>Password:</strong> {password.password}</p>
              <button 
                className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                onClick={() => handleCopy(password)}
              >
                Copy Details
              </button>
            </div>
            <Menu menuButton={<MenuButton className="text-gray-700">•••</MenuButton>}>
              <MenuItem onClick={() => handleDelete(password.id)}>Delete</MenuItem>
              <MenuItem onClick={() => handleEdit(password)}>Edit</MenuItem>
            </Menu>
          </div>
        ))
      ) : (
        <p className="text-gray-700">No passwords saved.</p>
      )}

      {currentPassword && (
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          style={{
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              width: '400px',
              height: 'auto',
            },
          }}
        >
          <h2>Edit Password</h2>
          <form>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="website">
                Website
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="website"
                type="text"
                value={currentPassword.website}
                onChange={(e) => setCurrentPassword({ ...currentPassword, website: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="authenticationMethod">
                Authentication Method
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="authenticationMethod"
                value={currentPassword.authenticationMethod}
                onChange={(e) => setCurrentPassword({ ...currentPassword, authenticationMethod: e.target.value as PasswordData["authenticationMethod"] })}
              >
                <option value="email">Email</option>
                <option value="email_username">Email &amp; Username</option>
                <option value="email_phone">Email &amp; Phone</option>
                <option value="email_phone_username">Email, Phone &amp; Username</option>
              </select>
            </div>
            {(currentPassword.authenticationMethod === "email" || currentPassword.authenticationMethod === "email_username" || currentPassword.authenticationMethod === "email_phone" || currentPassword.authenticationMethod === "email_phone_username") && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="email"
                  type="email"
                  value={currentPassword.email}
                  onChange={(e) => setCurrentPassword({ ...currentPassword, email: e.target.value })}
                />
              </div>
            )}
            {(currentPassword.authenticationMethod === "email_username" || currentPassword.authenticationMethod === "email_phone_username") && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                  Username
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="username"
                  type="text"
                  value={currentPassword.username}
                  onChange={(e) => setCurrentPassword({ ...currentPassword, username: e.target.value })}
                />
              </div>
            )}
            {(currentPassword.authenticationMethod === "email_phone" || currentPassword.authenticationMethod === "email_phone_username") && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                  Phone
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="phone"
                  type="text"
                  value={currentPassword.phone}
                  onChange={(e) => setCurrentPassword({ ...currentPassword, phone: e.target.value })}
                />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="password"
                type="password"
                value={currentPassword.password}
                onChange={(e) => setCurrentPassword({ ...currentPassword, password: e.target.value })}
              />
            </div>
            <button
              type="button"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={handleUpdate}
            >
              Update
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};
