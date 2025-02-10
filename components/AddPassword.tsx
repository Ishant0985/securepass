"use client";

import React from "react";
import toast, { Toaster } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig"; // Import Firestore configuration
import { useUser } from "@clerk/nextjs";

// Define a discriminated union schema for different authentication methods
const addPasswordSchema = z.discriminatedUnion("authenticationMethod", [
  z.object({
    authenticationMethod: z.literal("email"),
    website: z.string().url().nonempty("Website is required"),
    email: z.string().email("Invalid email").nonempty("Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
  }),
  z.object({
    authenticationMethod: z.literal("email_username"),
    website: z.string().url().nonempty("Website is required"),
    email: z.string().email("Invalid email").nonempty("Email is required"),
    username: z.string().nonempty("Username is required"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
  }),
  z.object({
    authenticationMethod: z.literal("email_phone"),
    website: z.string().url().nonempty("Website is required"),
    email: z.string().email("Invalid email").nonempty("Email is required"),
    phone: z.string().nonempty("Phone is required"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
  }),
  z.object({
    authenticationMethod: z.literal("email_phone_username"),
    website: z.string().url().nonempty("Website is required"),
    email: z.string().email("Invalid email").nonempty("Email is required"),
    phone: z.string().nonempty("Phone is required"),
    username: z.string().nonempty("Username is required"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
  }),
]);

type AddPasswordFormData = z.infer<typeof addPasswordSchema>;

export const AddPassword = () => {
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AddPasswordFormData>({
    resolver: zodResolver(addPasswordSchema),
    defaultValues: {
      authenticationMethod: "email",
    },
  });

  // Watch the authentication method to conditionally render fields
  const authMethod = watch("authenticationMethod");

  const onSubmit = async (data: AddPasswordFormData) => {
    if (!user) {
      console.error("No user found. User must be logged in.");
      toast.error("User not authenticated!");
      return;
    }
    try {
      await addDoc(collection(db, "passwords"), {
        userId: user.id,
        website: data.website,
        authenticationMethod: data.authenticationMethod,
        email: data.email, // defined for all authentication methods
        username: "username" in data ? data.username : "",
        phone: "phone" in data ? data.phone : "",
        password: data.password,
      });
      toast.success("Password added successfully!");
    } catch (error) {
      console.error("Error adding password:", error);
      toast.error("Error adding password");
    }
  };

  return (
    <form
      className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Toaster />
      {/* Website Field */}
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="website"
        >
          Website
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="website"
          type="text"
          placeholder="Website"
          {...register("website")}
        />
        {errors.website && (
          <p className="text-red-500 text-xs italic">
            {errors.website.message}
          </p>
        )}
      </div>

      {/* Authentication Method Selection */}
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="authenticationMethod"
        >
          Authentication Method
        </label>
        <select
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="authenticationMethod"
          {...register("authenticationMethod")}
        >
          <option value="email">Email</option>
          <option value="email_username">Email &amp; Username</option>
          <option value="email_phone">Email &amp; Phone</option>
          <option value="email_phone_username">
            Email, Phone &amp; Username
          </option>
        </select>
        {errors.authenticationMethod && (
          <p className="text-red-500 text-xs italic">
            {errors.authenticationMethod.message}
          </p>
        )}
      </div>

      {/* Conditionally render Email field (required in all options) */}
      {(authMethod === "email" ||
        authMethod === "email_username" ||
        authMethod === "email_phone" ||
        authMethod === "email_phone_username") && (
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              placeholder="Email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-red-500 text-xs italic">
                {errors.email.message}
              </p>
            )}
          </div>
        )}

      {/* Conditionally render Username field */}
      {(authMethod === "email_username" ||
        authMethod === "email_phone_username") && (
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="username"
            >
              Username
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="username"
              type="text"
              placeholder="Username"
              {...register("username")}
            />
            {(authMethod === "email_username" || authMethod === "email_phone_username") &&
              ((errors as Record<"username", { message: string }>).username?.message && (
                <p className="text-red-500 text-xs italic">
                  {(errors as Record<"username", { message: string }>).username.message}
                </p>
              ))}
          </div>
        )}

      {/* Conditionally render Phone field */}
      {(authMethod === "email_phone" ||
        authMethod === "email_phone_username") && (
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="phone"
            >
              Phone
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="phone"
              type="text"
              placeholder="Phone"
              {...register("phone")}
            />
            {(authMethod === "email_phone" || authMethod === "email_phone_username") &&
              ((errors as Record<"phone", { message: string }>).phone?.message && (
                <p className="text-red-500 text-xs italic">
                  {(errors as Record<"phone", { message: string }>).phone.message}
                </p>
              ))}
          </div>
        )}

      {/* Password Field */}
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="password"
        >
          Password
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="password"
          type="password"
          placeholder="Password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-red-500 text-xs italic">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        type="submit"
      >
        Add Password
      </button>
    </form>
  );
};
