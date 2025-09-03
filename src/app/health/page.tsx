"use client";

import { useState } from "react";

interface HealthResult {
  status?: string;
  timestamp?: string;
  environment?: string;
  mongoUri?: boolean;
  userCount?: number;
  error?: string;
  details?: string;
}

interface TestResults {
  health?: HealthResult;
  database?: HealthResult;
  register?: HealthResult;
  error?: string;
}

export default function HealthCheckPage() {
  const [results, setResults] = useState<TestResults>({});
  const [loading, setLoading] = useState(false);

  const runHealthCheck = async () => {
    setLoading(true);
    setResults({});

    try {
      // Test basic health
      const healthResponse = await fetch("/api/health");
      const healthData = await healthResponse.json();
      setResults((prev: TestResults) => ({ ...prev, health: healthData }));

      // Test database connection
      const dbResponse = await fetch("/api/test-db");
      const dbData = await dbResponse.json();
      setResults((prev: TestResults) => ({ ...prev, database: dbData }));

      // Test registration endpoint with invalid data
      const regResponse = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invalid: "test" }),
      });
      const regData = await regResponse.json();
      setResults((prev: TestResults) => ({ ...prev, register: regData }));
    } catch (error) {
      setResults((prev: TestResults) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Health Check Dashboard</h1>

      <button
        onClick={runHealthCheck}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mb-6"
      >
        {loading ? "Running Tests..." : "Run Health Check"}
      </button>

      {Object.keys(results).length > 0 && (
        <div className="space-y-4">
          {Object.entries(results).map(([key, value]) => (
            <div key={key} className="border p-4 rounded">
              <h3 className="font-bold text-lg mb-2 capitalize">{key} Test</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
