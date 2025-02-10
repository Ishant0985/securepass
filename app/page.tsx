"use client"; 

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { db } from "@/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function LandingPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [textIndex, setTextIndex] = useState(0);
  const texts = ["Welcome to No Pass", "Secure Your Credentials Easily"];

  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [texts.length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "contacts"), form);
      toast.success("Message sent successfully!");
      setForm({ name: "", email: "", message: "" });
    } catch (error) {
      console.error("Error submitting contact form: ", error);
      toast.error("Error sending message");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
      <Toaster />
      {/* Hero Section */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">
          <motion.span
            key={textIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            {texts[textIndex]}
          </motion.span>
        </h1>
        <p className="text-lg mb-6">Store your passwords, cards, and important documents securely.</p>
        <SignInButton>
          <Button className="bg-white text-blue-600 font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-gray-200">
            Get Started
          </Button>
        </SignInButton>
      </div>

      {/* About Us Section */}
      <Card className="max-w-3xl bg-white text-black mb-10">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-4">About Us</h2>
          <p>
            No Pass is your secure vault for storing passwords, card details, and important documents.
            Our advanced encryption ensures your data remains safe and accessible only to you.
          </p>
        </CardContent>
      </Card>

      {/* Services Section */}
      <h2 className="text-3xl font-semibold mb-6">Our Services</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="bg-white text-black">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-2">Password Manager</h3>
            <p>Store and retrieve your passwords securely with end-to-end encryption.</p>
          </CardContent>
        </Card>
        <Card className="bg-white text-black">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-2">Card Storage</h3>
            <p>Save your debit/credit card details securely and access them anytime.</p>
          </CardContent>
        </Card>
        <Card className="bg-white text-black">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-2">Secure Documents</h3>
            <p>Upload and store important documents securely in our encrypted vault.</p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Section */}
      <h2 className="text-3xl font-semibold mb-6">Contact Us</h2>
      <form className="bg-white text-black p-6 rounded-lg shadow-lg max-w-lg w-full" onSubmit={handleSubmit}>
        <Input
          type="text"
          name="name"
          placeholder="Your Name"
          value={form.name}
          onChange={handleChange}
          className="mb-4 p-3 w-full border border-gray-300 rounded-lg"
          required
        />
        <Input
          type="email"
          name="email"
          placeholder="Your Email"
          value={form.email}
          onChange={handleChange}
          className="mb-4 p-3 w-full border border-gray-300 rounded-lg"
          required
        />
        <textarea
          name="message"
          placeholder="Your Message"
          value={form.message}
          onChange={handleChange}
          className="mb-4 p-3 w-full border border-gray-300 rounded-lg h-32"
          required
        ></textarea>
        <Button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full">Send Message</Button>
      </form>
    </div>
  );
}
