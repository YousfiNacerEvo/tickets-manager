"use client";
import React, { useState } from "react";

// To add a new help topic, add an object to the helpTopics array below.
// Each topic has a title and an array of steps.
// Each step can have a 'text' and an optional 'image' (path to image in /public or URL).
const helpTopics = [
  {
    title: "How to Create a Ticket",
    steps: [
      {
        text: ' Step 1 – Go to the " Create Ticket" Section From the main dashboard or menu, click on:  "Create Ticket"  ',
        image: "/createTicket/step1.png" // Example image, replace with your own
      },
      {
        text: "Step 2 – Fill Out the Ticket Form. Complete the form with the necessary details. You may also be able to attach a file or screenshot, if available.",
        image: "/createTicket/step2.png" // Example image, replace with your own
      },
      {
        text: 'Step 3 – Submit the Ticket Once all fields are filled in, click on: "Create Ticket"',
        image: "/createTicket/step3.png" // Example image, replace with your own
      },
      {
        text: 'Step 4 – Track Your Ticket Go to "Tickets Manager" to view the status of your ticket.',
        image: "/createTicket/step4.png" // Example image, replace with your own
      },
      {
        text: "Step 5 – the ticket will be created and you will be redirected to the dashboard page.",
        image: "/createTicket/step5.png" // Example image, replace with your own
      }
    ]
  },
  {
    title: "how to select a client that is not on the list",
    steps: [
      {
        text: "Step 1 – Look for the “ Select Client ” Field  If the client does not appear in the list:  ",
        image: "/userNotInList/step1.png"
      },
      {
        text: "Step 2 – Click “Other”in the bottom of the select client dropdown",
        image: "/userNotInList/step2.png"
      }
    ]
  },
  {
    title: "How to Use Forgot Password",
    steps: [
      {
        text: 'Step 1 – Go to the Login Screen On the login screen, click the link: "Forgot your Password?"',
        image: "/forgetPassword/step1.png"
      },
      {
        text: 'Step 2 – Enter Your Email AddressType in the email address associated with your account and click: Reset Password',
        image: "/forgetPassword/step2.png"
      },
      {
        text: "Step 3 – Check Your Inbox You'll receive an email with a password reset link. Check your spam/junk folder if you don't see it within a few minutes.",
        image: "/forgetPassword/step3.png"
      },
      {
        text: " Step 4 – Set a New Password Click the link in the email. You'll be taken to a page where you can enter a new password.Choose a strong password, then confirm it.",
        image: "/forgetPassword/step4.png"
      },
      {
        text: "Step 5 – Log In Again Return to the login screen and sign in with your new password. You're all set!",
        image: "/forgetPassword/step5.png"
      },
      
    ]
  },
  {
    title: "How to View Reports",
    steps: [
      {
        text: "Step 1 – Go to the “Reports” Section From the dashboard sidebar, click on:'Reporting' ",
        image: "/reporting/step1.png"
      },
      {
        text: "Step 2 – Choose a Report Date range   ",
        image: "/reporting/step2.png"
      },
      {
        text: "Step 3 – Export or DownloadClick  “Export PDF” or “Export Excel” to save the report for sharing or offline use.",
        image: "/reporting/step3.png"
      }
    ]
  },
  {
    title: "How to Add a New Account (Admin Only)",
    steps: [
      {
        text: "Step 1 – Go to the “Add Account” Section From the sidebar",
       
      },
      {
        text: "Step 2 – Fill out the required user information.",
        image: "/addUser/step2.png"
      },
      {
        text: "Step 3 – Click “Add User”",
        image: "/addUser/step3.png"
      },
    ]
  }
];

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState(null); // Track which topic is open
  const filteredTopics = helpTopics.filter(topic =>
    topic.title.toLowerCase().includes(search.toLowerCase()) ||
    topic.steps.some(step => step.text.toLowerCase().includes(search.toLowerCase()))
  );

  const handleToggle = idx => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
        <h1 className="text-3xl font-bold mb-6 text-blue-700">Help &amp; Documentation</h1>
        <input
          type="text"
          placeholder="Search help topics..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full mb-6 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-black"
        />
        <div className="space-y-4">
          {filteredTopics.length === 0 ? (
            <div className="text-gray-500">No topics found.</div>
          ) : (
            filteredTopics.map((topic, idx) => (
              <div key={idx} className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-blue-800">{topic.title}</h2>
                  <button
                    onClick={() => handleToggle(idx)}
                    className="ml-4 px-3 py-1 text-sm rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                  >
                    {openIndex === idx ? 'Hide Steps' : 'Show Steps'}
                  </button>
                </div>
                {openIndex === idx && (
                  <ol className="space-y-6 list-decimal list-inside mt-4">
                    {topic.steps.map((step, sidx) => (
                      <li key={sidx} className="mb-2">
                        <div className="flex flex-col gap-2">
                          <span className="text-gray-700">{step.text}</span>
                          {step.image && (
                            <img src={step.image} alt="step" className="rounded-lg border border-gray-200 max-w-full h-auto mt-2" />
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 