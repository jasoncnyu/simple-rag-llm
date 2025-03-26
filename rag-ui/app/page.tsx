'use client'

import { useState } from 'react'

export default function Page() {
  const [question, setQuestion] = useState('')
  const [chunkSize, setChunkSize] = useState(500)
  const [chunkOverlap, setChunkOverlap] = useState(50)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [sources, setSources] = useState<any[]>([])
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!

  const handleUpload = async () => {
    if (!file) return alert('📄 Choose .txt file to upload.')

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      setUploadStatus('✅ Upload Success!')
    } else {
      setUploadStatus('❌ Upload Fail')
    }
  }

  const handleAsk = async () => {
    setAnswer('')
    setLoading(true)

    const res = await fetch(`${API_BASE}/rag-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap,
      }),
    })

    const reader = res.body?.getReader()
    const decoder = new TextDecoder('utf-8')
    if (!reader) return

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      setAnswer((prev) => prev + chunk)
    }

    setLoading(false)
    await fetchSources()
  }

  const fetchSources = async () => {
    const res = await fetch(`${API_BASE}/rag-sources`)
    const data = await res.json()
    setSources(data.sources)
  }

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">🧠 RAG Streaming Chat</h1>

      <div className="mb-4">
        <label className="block mb-1">📄 Upload a text file</label>
        <input
          type="file"
          accept=".txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-1 rounded ml-2"
          onClick={handleUpload}
        >
          Upload
        </button>
        {uploadStatus && <p className="text-sm mt-1">{uploadStatus}</p>}
      </div>

      <div className="mb-4">
        <label className="block mb-1">💬 Input questions</label>
        <input
          className="w-full border p-2"
          type="text"
          placeholder="Ask anything..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>

      <div className="flex gap-2 mb-4">
        <input
          className="border p-2 w-1/2"
          type="number"
          placeholder="Chunk size"
          value={chunkSize}
          onChange={(e) => setChunkSize(Number(e.target.value))}
        />
        <input
          className="border p-2 w-1/2"
          type="number"
          placeholder="Chunk overlap"
          value={chunkOverlap}
          onChange={(e) => setChunkOverlap(Number(e.target.value))}
        />
      </div>

      <button
        className="bg-black text-white px-4 py-2 rounded"
        onClick={handleAsk}
        disabled={loading}
      >
        {loading ? 'Thinking...' : 'Ask'}
      </button>

      {answer && (
        <div className="mt-6 whitespace-pre-wrap font-mono bg-gray-100 p-4 rounded">
          {answer}
        </div>
      )}

      {sources.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold">📚 Reference Docs</h3>
          {sources.map((src, i) => (
            <div key={i} className="border-l-4 pl-4 mb-3 text-sm text-gray-700">
              <p className="text-xs italic">{src.source}</p>
              <blockquote>{src.text.slice(0, 300)}...</blockquote>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}