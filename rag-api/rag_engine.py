# rag_engine.py
import os
from dotenv import load_dotenv
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.vectorstores import FAISS
from langchain.embeddings import OpenAIEmbeddings
from langchain.chains.question_answering import load_qa_chain
from langchain_openai import ChatOpenAI

load_dotenv()

def run_rag_pipeline(question: str, chunk_size: int, chunk_overlap: int):
    loader = TextLoader("sample.txt")
    docs = loader.load()

    splitter = CharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    split_docs = splitter.split_documents(docs)

    embeddings = OpenAIEmbeddings()
    db = FAISS.from_documents(split_docs, embeddings)

    matched_docs = db.similarity_search(question, k=2)

    llm = ChatOpenAI(model_name="gpt-3.5-turbo")
    chain = load_qa_chain(llm, chain_type="stuff")
    result = chain.invoke({"input_documents": matched_docs, "question": question})

    return {
        "answer": result["output_text"],
        "sources": [
            {
                "text": doc.page_content,
                "source": doc.metadata.get("source", "sample.txt"),
            }
            for doc in matched_docs
        ],
    }