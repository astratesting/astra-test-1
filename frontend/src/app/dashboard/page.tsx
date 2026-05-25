"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { TestRun, EncryptedRecord, User } from "@/lib/api";

const statusColors: Record<TestRun["status"], string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  passed: "bg-green-500/10 text-green-400 border-green-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [records, setRecords] = useState<EncryptedRecord[]>([]);
  const [newRunName, setNewRunName] = useState("");
  const [newRunDesc, setNewRunDesc] = useState("");
  const [encLabel, setEncLabel] = useState("");
  const [encPlaintext, setEncPlaintext] = useState("");
  const [decryptedText, setDecryptedText] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"tests" | "encryption">("tests");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.push("/"); return; }
    Promise.all([
      api.get<User>("/auth/me"),
      api.get<TestRun[]>("/api/test-runs"),
      api.get<EncryptedRecord[]>("/api/encrypted-records"),
    ]).then(([u, t, r]) => {
      setUser(u.data);
      setTestRuns(t.data);
      setRecords(r.data);
    }).catch(() => { localStorage.removeItem("access_token"); router.push("/"); });
  }, [router]);

  function logout() {
    localStorage.removeItem("access_token");
    router.push("/");
  }

  async function createRun(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await api.post<TestRun>("/api/test-runs", { name: newRunName, description: newRunDesc || null });
    setTestRuns((p) => [data, ...p]);
    setNewRunName(""); setNewRunDesc("");
  }

  async function executeRun(id: string) {
    const { data } = await api.post<TestRun>(`/api/test-runs/${id}/execute`);
    setTestRuns((p) => p.map((r) => (r.id === id ? data : r)));
  }

  async function deleteRun(id: string) {
    await api.delete(`/api/test-runs/${id}`);
    setTestRuns((p) => p.filter((r) => r.id !== id));
  }

  async function encryptData(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await api.post<EncryptedRecord>("/api/encrypt", { label: encLabel, plaintext: encPlaintext });
    setRecords((p) => [data, ...p]);
    setEncLabel(""); setEncPlaintext("");
  }

  async function decryptRecord(id: string) {
    if (decryptedText[id]) { setDecryptedText((p) => { const n = { ...p }; delete n[id]; return n; }); return; }
    const { data } = await api.post<{ plaintext: string }>("/api/decrypt", { record_id: id });
    setDecryptedText((p) => ({ ...p, [id]: data.plaintext }));
  }

  if (!user) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 bg-gray-900/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="font-semibold text-sm text-white">Astra Test 1</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">{user.email}</span>
            <button onClick={logout} className="text-xs text-gray-400 hover:text-white transition-colors">Sign out</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 w-full flex-1">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white">Welcome, {user.full_name.split(" ")[0]}</h2>
          <p className="text-gray-400 text-sm mt-1">Manage your test runs and encrypted data</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Test Runs", value: testRuns.length },
            { label: "Passed", value: testRuns.filter((r) => r.status === "passed").length },
            { label: "Encrypted Records", value: records.length },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              <p className="text-3xl font-bold text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
          {(["tests", "encryption"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === t ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {t === "tests" ? "Test Runs" : "Encryption"}
            </button>
          ))}
        </div>

        {activeTab === "tests" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="font-semibold text-sm text-white mb-4">New Test Run</h3>
                <form onSubmit={createRun} className="space-y-3">
                  <input
                    required value={newRunName} onChange={(e) => setNewRunName(e.target.value)}
                    placeholder="Run name"
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <textarea
                    value={newRunDesc} onChange={(e) => setNewRunDesc(e.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                  <button type="submit" className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
                    Create Run
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              {testRuns.length === 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500 text-sm">
                  No test runs yet. Create one to get started.
                </div>
              )}
              {testRuns.map((run) => (
                <div key={run.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-white">{run.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColors[run.status]}`}>
                          {run.status}
                        </span>
                      </div>
                      {run.description && <p className="text-xs text-gray-500 mt-1">{run.description}</p>}
                      {run.result_summary && (
                        <pre className="mt-2 text-xs text-gray-400 font-mono bg-gray-800 rounded-lg p-2 whitespace-pre-wrap">{run.result_summary}</pre>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => executeRun(run.id)}
                        disabled={run.status === "running"}
                        className="text-xs px-3 py-1.5 rounded-lg bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 disabled:opacity-40 transition-colors font-medium"
                      >
                        Run
                      </button>
                      <button
                        onClick={() => deleteRun(run.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "encryption" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="font-semibold text-sm text-white mb-4">Encrypt Data</h3>
                <form onSubmit={encryptData} className="space-y-3">
                  <input
                    required value={encLabel} onChange={(e) => setEncLabel(e.target.value)}
                    placeholder="Label"
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <textarea
                    required value={encPlaintext} onChange={(e) => setEncPlaintext(e.target.value)}
                    placeholder="Plaintext to encrypt"
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                  <button type="submit" className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
                    Encrypt &amp; Store
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              {records.length === 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500 text-sm">
                  No encrypted records yet.
                </div>
              )}
              {records.map((rec) => (
                <div key={rec.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-white">{rec.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{new Date(rec.created_at).toLocaleString()}</p>
                      {decryptedText[rec.id] && (
                        <pre className="mt-2 text-xs text-green-400 font-mono bg-gray-800 rounded-lg p-2 whitespace-pre-wrap">{decryptedText[rec.id]}</pre>
                      )}
                    </div>
                    <button
                      onClick={() => decryptRecord(rec.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors font-medium shrink-0"
                    >
                      {decryptedText[rec.id] ? "Hide" : "Decrypt"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
