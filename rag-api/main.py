from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.vectorstores import FAISS
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_openai import ChatOpenAI
from langchain.schema import Document
from typing import List
from openai import OpenAI
from dotenv import load_dotenv
import os
import shutil

# Load Environmental Properties (retrieve OPENAI_API_KEY from .env)
load_dotenv()

# temporary array to remember the sources
last_matches: List[Document] = []

app = FastAPI()
client = OpenAI()

# CORS configuration (Next.js accept)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO - change this to your server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Config upoload
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# File Upload API
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, "user.txt")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"message": "File uploaded successfully."}

# Streaming RAG API
@app.post("/rag-stream")
async def rag_stream(request: Request):
    global last_matches  

    body = await request.json()
    question = body.get("question", "")
    chunk_size = body.get("chunk_size", 500)
    chunk_overlap = body.get("chunk_overlap", 50)

    doc_path = os.path.join(UPLOAD_DIR, "user.txt")
    if not os.path.exists(doc_path):
        doc_path = "sample.txt"

    loader = TextLoader(doc_path)
    docs = loader.load()

    splitter = CharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    split_docs = splitter.split_documents(docs)

    embeddings = OpenAIEmbeddings()
    db = FAISS.from_documents(split_docs, embeddings)

    matches = db.similarity_search(question, k=2)
    last_matches = matches  # store temporarily in memory

    context = "\n\n".join([doc.page_content for doc in matches])
    prompt = f"""You are an assistant answering questions based on the following context:\n\n{context}\n\nQuestion: {question}\nAnswer:"""

    def generate():
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant using the given context."},
                {"role": "user", "content": prompt},
            ],
            stream=True,
        )
        for chunk in response:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    return StreamingResponse(generate(), media_type="text/plain")

@app.get("/rag-sources")
async def get_sources():
    if not last_matches:
        return JSONResponse({"sources": []})

    return {
        "sources": [
            {
                "source": doc.metadata.get("source", "문서"),
                "text": doc.page_content
            }
            for doc in last_matches
        ]
    }