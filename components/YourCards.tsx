"use client";

import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useUser } from "@clerk/nextjs";
import toast, { Toaster } from "react-hot-toast";
import { Menu, MenuItem, MenuButton } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/index.css";
import Modal from "react-modal";

interface CardData {
  id: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardType: "credit" | "debit";
  cardNetwork: "visa" | "mastercard" | "rupay" | "amex";
}

export const YourCards = () => {
  const { user } = useUser();
  const [cards, setCards] = useState<CardData[]>([]);
  const [selectedCardType, setSelectedCardType] = useState<string>("all");
  const [selectedCardNetwork, setSelectedCardNetwork] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);

  useEffect(() => {
    if (user) {
      const fetchCards = async () => {
        try {
          // Fetch cards where userId equals the logged in user's id.
          const q = query(collection(db, "cards"), where("userId", "==", user.id));
          const querySnapshot = await getDocs(q);
          const fetchedCards = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CardData));
          setCards(fetchedCards);
        } catch (error) {
          console.error("Error fetching cards:", error);
          toast.error("Error fetching cards");
        }
      };
      fetchCards();
    }
  }, [user]);

  const filteredCards = cards.filter(card => {
    const typeMatches = selectedCardType === "all" || card.cardType === selectedCardType;
    const networkMatches = selectedCardNetwork === "all" || card.cardNetwork === selectedCardNetwork;
    return typeMatches && networkMatches;
  });

  const handleCopy = async (card: CardData) => {
    const detailsText = `Card Details:
Type: ${card.cardType === "credit" ? "Credit Card" : "Debit Card"}
Network: ${card.cardNetwork.toUpperCase()}
Card Number: ${card.cardNumber}
Expiry Date: ${card.expiryDate}`;
    try {
      await navigator.clipboard.writeText(detailsText);
      toast.success("Copied card details!");
    } catch (error) {
      console.error("Error copying:", error);
      toast.error("Failed to copy card details");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "cards", id));
      setCards(cards.filter(card => card.id !== id));
      toast.success("Card deleted successfully!");
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Failed to delete card");
    }
  };

  const handleEdit = (card: CardData) => {
    setCurrentCard(card);
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    if (currentCard) {
      try {
        await updateDoc(doc(db, "cards", currentCard.id), {
          cardNumber: currentCard.cardNumber,
          expiryDate: currentCard.expiryDate,
          cvv: currentCard.cvv,
          cardType: currentCard.cardType,
          cardNetwork: currentCard.cardNetwork,
        });
        setCards(cards.map(c => (c.id === currentCard.id ? currentCard : c)));
        toast.success("Card updated successfully!");
        setIsModalOpen(false);
      } catch (error) {
        console.error("Failed to update:", error);
        toast.error("Failed to update card");
      }
    }
  };

  return (
    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <Toaster />
      <h2 className="text-xl font-bold mb-4">Your Cards</h2>

      <div className="mb-4 flex space-x-4">
        <div>
          <label htmlFor="cardType" className="block text-gray-700 text-sm font-bold mb-2">
            Filter by Card Type:
          </label>
          <select
            id="cardType"
            value={selectedCardType}
            onChange={(e) => setSelectedCardType(e.target.value)}
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="all">All</option>
            <option value="credit">Credit Card</option>
            <option value="debit">Debit Card</option>
          </select>
        </div>
        <div>
          <label htmlFor="cardNetwork" className="block text-gray-700 text-sm font-bold mb-2">
            Filter by Card Network:
          </label>
          <select
            id="cardNetwork"
            value={selectedCardNetwork}
            onChange={(e) => setSelectedCardNetwork(e.target.value)}
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="all">All</option>
            <option value="visa">Visa</option>
            <option value="mastercard">Mastercard</option>
            <option value="rupay">Rupay</option>
            <option value="amex">American Express</option>
          </select>
        </div>
      </div>

      {filteredCards.length > 0 ? (
        filteredCards.map((card, index) => (
          <div key={index} className="mb-4 border p-4 rounded flex items-center justify-between">
            <div>
              <p className="text-gray-700">
                <strong>Card Type:</strong> {card.cardType === "credit" ? "Credit Card" : "Debit Card"}
              </p>
              <p className="text-gray-700">
                <strong>Network:</strong> {card.cardNetwork.toUpperCase()}
              </p>
              <p className="text-gray-700">
                <strong>Card Number:</strong> **** **** **** {card.cardNumber.slice(-4)}
              </p>
              <p className="text-gray-700">
                <strong>Expiry Date:</strong> {card.expiryDate}
              </p>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => handleCopy(card)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                title="Copy card details"
              >
                Copy
              </button>
              <Menu menuButton={<MenuButton className="text-gray-700 ml-2">•••</MenuButton>}>
                <MenuItem onClick={() => handleDelete(card.id)}>Delete</MenuItem>
                <MenuItem onClick={() => handleEdit(card)}>Edit</MenuItem>
              </Menu>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-700">No cards saved.</p>
      )}

      {currentCard && (
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
              width: '50%',
              height: '50%',
            },
          }}
        >
          <h2>Edit Card</h2>
          <form>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cardNumber">
                Card Number
              </label>
              <input
                type="text"
                id="cardNumber"
                value={currentCard.cardNumber}
                onChange={(e) => setCurrentCard({ ...currentCard, cardNumber: e.target.value })}
                className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="expiryDate">
                Expiry Date
              </label>
              <input
                type="text"
                id="expiryDate"
                value={currentCard.expiryDate}
                onChange={(e) => setCurrentCard({ ...currentCard, expiryDate: e.target.value })}
                className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cvv">
                CVV
              </label>
              <input
                type="text"
                id="cvv"
                value={currentCard.cvv}
                onChange={(e) => setCurrentCard({ ...currentCard, cvv: e.target.value })}
                className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cardType">
                Card Type
              </label>
              <select
                id="cardType"
                value={currentCard.cardType}
                onChange={(e) => setCurrentCard({ ...currentCard, cardType: e.target.value as "credit" | "debit" })}
                className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="credit">Credit Card</option>
                <option value="debit">Debit Card</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cardNetwork">
                Card Network
              </label>
              <select
                id="cardNetwork"
                value={currentCard.cardNetwork}
                onChange={(e) => setCurrentCard({ ...currentCard, cardNetwork: e.target.value as "visa" | "mastercard" | "rupay" | "amex" })}
                className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="rupay">Rupay</option>
                <option value="amex">American Express</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleUpdate}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Update
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
