/**
 * @fileoverview Admin page for viewing contact form submissions.
 *
 * This file defines a Next.js page component that fetches and displays all
 * messages submitted through the contact form. The messages are retrieved from
 * the `contact-messages` collection in Firestore and displayed in a table,
 * sorted by creation date. This page is intended for administrative use only.
 */
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { format } from "date-fns";

/**
 * Represents a single contact message document from Firestore.
 */
interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

/**
 * Fetches and formats all contact messages from the Firestore database.
 *
 * This function queries the `contact-messages` collection, orders the results
 * in descending order by their creation timestamp, and formats the data for display.
 *
 * @returns {Promise<ContactMessage[]>} A promise that resolves to an array of contact messages.
 */
async function getContactMessages(): Promise<ContactMessage[]> {
  if (!db) {
    console.error("Firestore is not initialized.");
    return [];
  }

  const messagesCollection = collection(db, "contact-messages");
  const q = query(messagesCollection, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      email: data.email,
      message: data.message,
      createdAt: data.createdAt
        ? format(data.createdAt.toDate(), "PPP p")
        : "N/A",
    };
  });
}

/**
 * Renders the admin page for displaying contact form messages.
 *
 * This server component fetches all contact messages by calling `getContactMessages`
 * and then renders them in a structured HTML table for easy review by an administrator.
 *
 * @returns {Promise<JSX.Element>} The rendered contact messages page.
 */
export default async function ContactMessagesPage() {
  const messages = await getContactMessages();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Contact Messages</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Date
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Name
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Message
              </th>
            </tr>
          </thead>
          <tbody>
            {messages.map((msg) => (
              <tr key={msg.id}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">
                    {msg.createdAt}
                  </p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">{msg.name}</p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">
                    {msg.email}
                  </p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">
                    {msg.message}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
