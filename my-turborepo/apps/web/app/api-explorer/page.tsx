"use client";

import { useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/config";
import styles from "./page.module.css";

interface Endpoint {
  id: string;
  method: string;
  path: string;
  summary: string;
  description: string;
  parameters?: Parameter[];
  responseExample: any;
  tags: string[];
}

interface Parameter {
  name: string;
  in: "path" | "query";
  required: boolean;
  type: string;
  description: string;
  example?: string | number;
  enum?: string[];
}

const API_ENDPOINTS: Endpoint[] = [
  {
    id: "get-all-funds",
    method: "GET",
    path: "/api/funds",
    summary: "Get All Mutual Fund Schemes",
    description: "Retrieve a paginated list of all mutual fund schemes with basic information.",
    tags: ["Funds"],
    parameters: [
      {
        name: "limit",
        in: "query",
        required: false,
        type: "number",
        description: "Number of funds to return (default: 10, max: 100)",
        example: 10,
      },
      {
        name: "offset",
        in: "query",
        required: false,
        type: "number",
        description: "Number of funds to skip for pagination",
        example: 0,
      },
    ],
    responseExample: {
      success: true,
      count: 2,
      funds: [
        {
          schemeCode: 118834,
          schemeName: "HDFC Flexi Cap Fund",
          fundHouse: "HDFC Mutual Fund",
          schemeType: "Open Ended",
          schemeCategory: "Flexi Cap",
        },
        {
          schemeCode: 120503,
          schemeName: "Mirae Asset Large Cap Fund",
          fundHouse: "Mirae Asset Mutual Fund",
          schemeType: "Open Ended",
          schemeCategory: "Large Cap",
        },
      ],
      disclaimer: "Mutual fund investments are subject to market risks...",
      source: "MFapi.in",
      fetchedAt: "2025-11-23T16:30:00.000Z",
    },
  },
  {
    id: "get-fund-by-code",
    method: "GET",
    path: "/api/funds/:schemeCode",
    summary: "Get Fund Details by Scheme Code",
    description: "Retrieve detailed information about a specific mutual fund scheme using its scheme code.",
    tags: ["Funds"],
    parameters: [
      {
        name: "schemeCode",
        in: "path",
        required: true,
        type: "number",
        description: "Unique scheme code identifier",
        example: 118834,
      },
    ],
    responseExample: {
      success: true,
      fund: {
        schemeCode: 118834,
        schemeName: "HDFC Flexi Cap Fund - Direct Plan - Growth",
        fundHouse: "HDFC Mutual Fund",
        schemeType: "Open Ended",
        schemeCategory: "Flexi Cap",
      },
    },
  },
  {
    id: "get-nav-history",
    method: "GET",
    path: "/api/funds/:schemeCode/nav",
    summary: "Get NAV History for a Fund",
    description: "Retrieve historical NAV (Net Asset Value) data for a specific fund within a date range.",
    tags: ["NAV"],
    parameters: [
      {
        name: "schemeCode",
        in: "path",
        required: true,
        type: "number",
        description: "Unique scheme code identifier",
        example: 118834,
      },
      {
        name: "start",
        in: "query",
        required: false,
        type: "string",
        description: "Start date in YYYY-MM-DD format (defaults to 30 days ago)",
        example: "2025-10-24",
      },
      {
        name: "end",
        in: "query",
        required: false,
        type: "string",
        description: "End date in YYYY-MM-DD format (defaults to today)",
        example: "2025-11-23",
      },
    ],
    responseExample: {
      success: true,
      schemeCode: 118834,
      count: 5,
      navHistory: [
        { date: "2025-11-23", nav: "1234.5600" },
        { date: "2025-11-22", nav: "1230.4500" },
        { date: "2025-11-21", nav: "1228.7800" },
        { date: "2025-11-20", nav: "1225.3400" },
        { date: "2025-11-19", nav: "1220.1200" },
      ],
    },
  },
  {
    id: "health-check",
    method: "GET",
    path: "/api/health",
    summary: "API Health Check",
    description: "Check the health status and connectivity of the API service.",
    tags: ["System"],
    parameters: [],
    responseExample: {
      status: "healthy",
      timestamp: "2025-11-23T16:30:00.000Z",
      uptime: 123456,
      database: "connected",
    },
  },
];

export default function APIExplorerPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(API_ENDPOINTS[0]!);
  const [tryItParams, setTryItParams] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<{ data: any; status: number; time: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTryIt = async () => {
    setLoading(true);
    setResponse(null);

    const startTime = performance.now();

    try {
      // Build URL with parameters
      let url = `${API_BASE_URL}${selectedEndpoint.path}`;

      // Replace path parameters
      Object.keys(tryItParams).forEach((key) => {
        const param = selectedEndpoint.parameters?.find((p) => p.name === key && p.in === "path");
        if (param) {
          url = url.replace(`:${key}`, tryItParams[key] || "");
        }
      });

      // Add query parameters
      const queryParams = new URLSearchParams();
      Object.keys(tryItParams).forEach((key) => {
        const param = selectedEndpoint.parameters?.find((p) => p.name === key && p.in === "query");
        if (param && tryItParams[key]) {
          queryParams.append(key, tryItParams[key]!);
        }
      });

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      const endTime = performance.now();

      setResponse({
        data,
        status: res.status,
        time: Math.round(endTime - startTime),
      });
    } catch (error) {
      const endTime = performance.now();
      setResponse({
        data: { error: error instanceof Error ? error.message : "Unknown error" },
        status: 0,
        time: Math.round(endTime - startTime),
      });
    } finally {
      setLoading(false);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "get";
      case "POST":
        return "post";
      case "PUT":
        return "put";
      case "DELETE":
        return "delete";
      default:
        return "get";
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.backLink}>
            ← Back to Home
          </Link>
          <div className={styles.headerContent}>
            <div className={styles.headerText}>
              <h1 className={styles.title}>API Explorer</h1>
              <p className={styles.subtitle}>
                Interactive documentation and testing interface for the India Mutual Funds Data API
              </p>
            </div>
            <div className={styles.headerBadges}>
              <div className={styles.badge} data-variant="success">
                <span className={styles.badgeDot}></span>
                API Status: Online
              </div>
              <div className={styles.badge} data-variant="info">
                Base URL: {API_BASE_URL}
              </div>
            </div>
          </div>
        </header>

        <div className={styles.layout}>
          {/* Sidebar with endpoints */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h2>Endpoints</h2>
              <span className={styles.endpointCount}>{API_ENDPOINTS.length}</span>
            </div>

            {["Funds", "NAV", "System"].map((tag) => {
              const endpoints = API_ENDPOINTS.filter((e) => e.tags.includes(tag));
              if (endpoints.length === 0) return null;

              return (
                <div key={tag} className={styles.endpointGroup}>
                  <h3 className={styles.groupTitle}>{tag}</h3>
                  {endpoints.map((endpoint) => (
                    <button
                      key={endpoint.id}
                      className={styles.endpointButton}
                      data-active={selectedEndpoint.id === endpoint.id}
                      onClick={() => {
                        setSelectedEndpoint(endpoint);
                        setResponse(null);
                        setTryItParams({});
                      }}
                    >
                      <span className={styles.method} data-method={getMethodColor(endpoint.method)}>
                        {endpoint.method}
                      </span>
                      <span className={styles.endpointPath}>{endpoint.path}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </aside>

          {/* Main content */}
          <main className={styles.main}>
            <div className={styles.endpointDetails}>
              <div className={styles.endpointHeader}>
                <div>
                  <div className={styles.endpointTitle}>
                    <span className={styles.methodBadge} data-method={getMethodColor(selectedEndpoint.method)}>
                      {selectedEndpoint.method}
                    </span>
                    <code className={styles.endpointUrl}>{selectedEndpoint.path}</code>
                  </div>
                  <h2 className={styles.endpointSummary}>{selectedEndpoint.summary}</h2>
                  <p className={styles.endpointDescription}>{selectedEndpoint.description}</p>
                </div>
              </div>

              {/* Parameters */}
              {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>Parameters</h3>
                  <div className={styles.parametersTable}>
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th>In</th>
                          <th>Required</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEndpoint.parameters.map((param) => (
                          <tr key={param.name}>
                            <td>
                              <code>{param.name}</code>
                            </td>
                            <td>
                              <span className={styles.paramType}>{param.type}</span>
                            </td>
                            <td>
                              <span className={styles.paramIn}>{param.in}</span>
                            </td>
                            <td>
                              <span className={styles.paramRequired} data-required={param.required}>
                                {param.required ? "Yes" : "No"}
                              </span>
                            </td>
                            <td>{param.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Try it out */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Try it out</h3>
                <div className={styles.tryItSection}>
                  {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                    <div className={styles.paramInputs}>
                      {selectedEndpoint.parameters.map((param) => (
                        <div key={param.name} className={styles.paramInput}>
                          <label htmlFor={`param-${param.name}`}>
                            {param.name}
                            {param.required && <span className={styles.requiredStar}>*</span>}
                          </label>
                          <input
                            id={`param-${param.name}`}
                            type="text"
                            placeholder={`${param.example || ""}`}
                            value={tryItParams[param.name] || ""}
                            onChange={(e) =>
                              setTryItParams((prev) => ({ ...prev, [param.name]: e.target.value }))
                            }
                          />
                          <span className={styles.paramHint}>{param.description}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button className={styles.executeButton} onClick={handleTryIt} disabled={loading}>
                    {loading ? "Executing..." : "Execute"}
                  </button>

                  {response && (
                    <div className={styles.responseSection}>
                      <div className={styles.responseHeader}>
                        <h4>Response</h4>
                        <div className={styles.responseMeta}>
                          <span
                            className={styles.statusBadge}
                            data-success={response.status >= 200 && response.status < 300}
                          >
                            Status: {response.status}
                          </span>
                          <span className={styles.timeBadge}>Time: {response.time}ms</span>
                        </div>
                      </div>
                      <pre className={styles.responseBody}>
                        <code>{JSON.stringify(response.data, null, 2)}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </section>

              {/* Response Example */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Response Example</h3>
                <div className={styles.exampleSection}>
                  <pre className={styles.exampleCode}>
                    <code>{JSON.stringify(selectedEndpoint.responseExample, null, 2)}</code>
                  </pre>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
