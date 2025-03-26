# 🧠 Simple RAG Streaming Chat App

A Retrieval-Augmented Generation (RAG) system powered by LLM.  
Users can upload `.txt` documents and ask questions.  
The system uses LangChain and GPT to stream real-time answers based on uploaded content.

- FastAPI backend (file upload + LLM streaming)
- Next.js frontend (question input, file upload, streamed output)
- LangChain + FAISS + OpenAI API

---

## 🚀 Features

- 📄 Upload your own `.txt` file
- 💬 Ask any question and receive streaming GPT responses
- 📚 Relevant source documents displayed after each answer
- ⚙️ Adjustable chunk size and overlap for text splitting

---

## 🧱 Tech Stack

- **Frontend:** Next.js (App Router)
- **Backend:** FastAPI + LangChain + FAISS
- **LLM:** OpenAI GPT-3.5 Turbo (`stream=True`)
- **Embeddings:** OpenAI Embeddings
- **Vector DB:** FAISS similarity search

---

## 🛠️ Environment Variables

### 🔹 FastAPI (.env)

Create a `.env` file inside the `rag-api/` directory:

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Used by the Python backend to authenticate with OpenAI API.

---

### 🔹 Next.js (.env.local)

Create a `.env.local` file inside the `rag-ui/` directory:

```env
NEXT_PUBLIC_API_BASE=http://<your-fastapi-server-ip>:8001
```

Used by the frontend to connect to the FastAPI server.  
Must start with `NEXT_PUBLIC_` to be exposed to the browser.

---

## 🧪 How to Run

### 1. FastAPI Backend

```bash
cd rag-api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### 📂 `rag_engine.py` (Deprecated)

This file was previously used to implement a basic non-streaming RAG pipeline using LangChain chains.

However, the current architecture uses direct streaming with OpenAI (`stream=True`),  
and all logic has been moved into `main.py` for flexibility and performance.

You can still refer to `rag_engine.py` as a reference for traditional LangChain-style pipelines,
but it is no longer required or used in the current system.

### 2. Next.js Frontend

```bash
cd rag-ui
npm install
npm run dev
```

---


## 📸 Screenshot
<img src="https://github.com/user-attachments/assets/4feee82a-76b8-4435-a5bd-4b8318af6c30" alt="Screenshot" width="600"/>

