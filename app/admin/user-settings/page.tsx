"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

export default function UserSettings() {

  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submitRequest() {

    setLoading(true);
    setError("");
    setMessage("");

    const res = await fetch(" ", {
      method: "POST",
      body: JSON.stringify({ reason })
    });

    const data = await res.json();

    if (!res.ok) setError(data.message);
    else {
      setMessage("Request sent to admin");
      setReason("");
    }

    setLoading(false);
  }

  return (

    <div className="px-8 py-6">

      {/* This wrapper fixes sidebar spacing */}
      <div className="max-w-2xl">

        <h1 className="text-2xl text-slate-900 font-semibold mb-6">
          User Settings
        </h1>

        <div className="bg-white p-6 rounded-lg shadow">

          <h2 className="font-medium mb-2 text-slate-600">
            Request Password Change
          </h2>

          <p className="text-sm text-slate-500 mb-4">
            Send a request to admin to change your password.
          </p>

          <textarea
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e)=>setReason(e.target.value)}
            className="w-full bg-slate-100 border border-slate-200 rounded px-3 py-2 mb-4 text-slate-600"
          />

          <button
            onClick={submitRequest}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >

            {loading
              ? <Loader2 className="animate-spin" size={18}/>
              : <Send size={18}/>
            }

            Send Request

          </button>

          {message &&
            <p className="text-green-600 mt-4">
              {message}
            </p>
          }

          {error &&
            <p className="text-red-600 mt-4">
              {error}
            </p>
          }

        </div>

      </div>

    </div>

  );

}