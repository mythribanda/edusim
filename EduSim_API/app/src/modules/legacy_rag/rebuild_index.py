import logging
logger = logging.getLogger("EduSim.modules.legacy_rag.rebuild_index")

import os
from .loader import load_all_pdfs
from .splitter import split_docs
from .embedder import get_embeddings
from .vector_store import create_vector_store

def rebuild():
    logger.info("=========================================")
    logger.info("Rebuilding RAG Index")
    logger.info("=========================================")
    
    # Path relative to project root
    data_dir = "data"
    
    logger.info(f"\n1. Loading all PDFs from {data_dir}...")
    docs = load_all_pdfs(data_dir)
    logger.info(f"Total documents loaded: {len(docs)}")
    
    if not docs:
        logger.info("No documents found. Exiting.")
        return
        
    logger.info("\n2. Splitting documents into chunks...")
    chunks = split_docs(docs)
    logger.info(f"Total chunks created: {len(chunks)}")
    
    logger.info("\n3. Loading embedding model...")
    embeddings_model = get_embeddings()
    
    logger.info("\n4. Rebuilding vector store (Force Rebuild)...")
    index, metadata = create_vector_store(chunks, embeddings_model, force_rebuild=True)
    
    logger.info("\n[REBUILD] Rebuild complete!")

if __name__ == "__main__":
    rebuild()