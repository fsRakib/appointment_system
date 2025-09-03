"use client";

import { useState } from "react";

export default function DebugPage() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testDebugEndpoint = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/debug-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          role: "patient",
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      const text = await response.text();
      console.log("Raw response text:", text);

      try {
        const json = JSON.parse(text);
        setResult(`✅ Success: ${JSON.stringify(json, null, 2)}`);
      } catch (parseError) {
        setResult(
          `❌ JSON Parse Error: ${
            parseError instanceof Error
              ? parseError.message
              : "Unknown parse error"
          }\nRaw response: ${text}`
        );
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setResult(
        `❌ Fetch Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
    setLoading(false);
  };

  const testActualRegister = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test User Actual",
          email: "testactual@example.com",
          password: "password123",
          role: "patient",
        }),
      });

      console.log("Actual register response status:", response.status);

      const text = await response.text();
      console.log("Actual register raw response:", text);

      try {
        const json = JSON.parse(text);
        setResult(
          `✅ Actual Register Success: ${JSON.stringify(json, null, 2)}`
        );
      } catch (parseError) {
        setResult(
          `❌ Actual Register JSON Parse Error: ${
            parseError instanceof Error
              ? parseError.message
              : "Unknown parse error"
          }\nRaw response: ${text}`
        );
      }
    } catch (error) {
      console.error("Actual register fetch error:", error);
      setResult(
        `❌ Actual Register Fetch Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Registration API</h1>

      <div className="space-y-4">
        <button
          onClick={testDebugEndpoint}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Debug Endpoint"}
        </button>

        <button
          onClick={testActualRegister}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-4"
        >
          {loading ? "Testing..." : "Test Actual Register"}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
}
