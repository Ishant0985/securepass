"use client";

import React from "react";
import toast, { Toaster } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig"; // Import Firestore configuration
import { useUser } from "@clerk/nextjs";

// Define a schema for adding a card
const schema = z.object({
  cardNumber: z.string().nonempty("Card Number is required"),
  expiryDate: z.string().nonempty("Expiry Date is required"),
  cvv: z.string().nonempty("CVV is required"),
  cardType: z.enum(["credit", "debit"], {
    errorMap: () => ({ message: "Card Type is required" }),
  }),
  cardNetwork: z.enum(["visa", "mastercard", "rupay", "amex"], {
    errorMap: () => ({ message: "Card network provider is required" }),
  }),
});

type AddCardFormData = z.infer<typeof schema>;

export const AddCard = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<AddCardFormData>({
    resolver: zodResolver(schema),
  });
  const { user } = useUser();

  const onSubmit = async (data: AddCardFormData) => {
    if (user) {
      try {
        // Save the new card document with userId taken from the logged-in Clerk user.
        await addDoc(collection(db, "cards"), {
          userId: user.id,  // This field ensures that the card is linked to the logged-in user.
          cardNumber: data.cardNumber,
          expiryDate: data.expiryDate,
          cvv: data.cvv,
          cardType: data.cardType,
          cardNetwork: data.cardNetwork,
        });
        toast.success("Card added successfully!");
      } catch (error) {
        console.error("Error adding card: ", error);
        toast.error("Error adding card");
      }
    } else {
      console.error("User is not authenticated.");
      toast.error("User not authenticated!");
    }
  };

  return (
    <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={handleSubmit(onSubmit)}>
      <Toaster />
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cardNumber">
          Card Number
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="cardNumber"
          type="text"
          placeholder="Card Number"
          {...register("cardNumber")}
        />
        {errors.cardNumber && <p className="text-red-500 text-xs italic">{errors.cardNumber.message}</p>}
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="expiryDate">
          Expiry Date
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="expiryDate"
          type="text"
          placeholder="MM/YY"
          {...register("expiryDate")}
        />
        {errors.expiryDate && <p className="text-red-500 text-xs italic">{errors.expiryDate.message}</p>}
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cvv">
          CVV
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="cvv"
          type="text"
          placeholder="CVV"
          {...register("cvv")}
        />
        {errors.cvv && <p className="text-red-500 text-xs italic">{errors.cvv.message}</p>}
      </div>
      
      {/* Select for Card Type */}
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cardType">
          Card Type
        </label>
        <select
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="cardType"
          {...register("cardType")}
        >
          <option value="">Select Card Type</option>
          <option value="credit">Credit Card</option>
          <option value="debit">Debit Card</option>
        </select>
        {errors.cardType && <p className="text-red-500 text-xs italic">{errors.cardType.message}</p>}
      </div>
      
      {/* Select for Card Network Provider */}
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cardNetwork">
          Card Network Provider
        </label>
        <select
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="cardNetwork"
          {...register("cardNetwork")}
        >
          <option value="">Select Card Network</option>
          <option value="visa">Visa</option>
          <option value="mastercard">Mastercard</option>
          <option value="rupay">Rupay</option>
          <option value="amex">American Express</option>
        </select>
        {errors.cardNetwork && <p className="text-red-500 text-xs italic">{errors.cardNetwork.message}</p>}
      </div>
      
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        type="submit"
      >
        Add Card
      </button>
    </form>
  );
};
