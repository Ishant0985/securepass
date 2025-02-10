import Link from 'next/link'
import { AddCard } from '@/components/AddCard'
import { AddPassword } from '@/components/AddPassword'
import { YourCards } from '@/components/YourCards'
import { YourPasswords } from '@/components/YourPasswords'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'

export default function Home() {
  return (
    <>
      <SignedIn>
        <div className="relative">
          {/* Secure Docs Button */}
          <Link href="/securedocs">
            <button className="absolute top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Try Secure Docs
            </button>
          </Link>
          
          <div className="container mx-auto p-4">
            <div className="flex justify-between mb-8">
              <div className="w-1/2 p-4">
                <h1 className="text-2xl font-bold mb-4">Add a Credit or Debit Card</h1>
                <AddCard />
              </div>
              <div className="w-1/2 p-4">
                <h1 className="text-2xl font-bold mb-4">Add a Password</h1>
                <AddPassword />
              </div>
            </div>

            <div className="flex justify-between">
              <div className="w-1/2 p-4">
                <h1 className="text-2xl font-bold mb-4">Your Cards</h1>
                <YourCards />
              </div>
              <div className="w-1/2 p-4">
                <h1 className="text-2xl font-bold mb-4">Your Passwords</h1>
                <YourPasswords />
              </div>
            </div>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
