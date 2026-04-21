"""knowledge_base/repository.py"""
from datetime import datetime
from pathlib import Path
from loguru import logger
from slugify import slugify
from core.config import settings


class KnowledgeRepository:

    def __init__(self):
        self._chroma_client = None
        self._collection = None
        self._kb_dir = Path(settings.kb_dir)
        self._kb_dir.mkdir(parents=True, exist_ok=True)

    def _get_collection(self):
        if self._collection is not None:
            return self._collection
        import chromadb
        from chromadb.utils import embedding_functions
        chroma_dir = Path(settings.chroma_dir)
        chroma_dir.mkdir(parents=True, exist_ok=True)
        self._chroma_client = chromadb.PersistentClient(path=str(chroma_dir))
        ef = embedding_functions.DefaultEmbeddingFunction()
        self._collection = self._chroma_client.get_or_create_collection(
            name=settings.chroma_collection,
            embedding_function=ef,
            metadata={"hnsw:space": "cosine"},
        )
        return self._collection

    def save(self, query, report, session_id, metadata=None):
        now = datetime.utcnow()
        date_str = now.strftime("%Y-%m-%d")
        slug = slugify(query[:60])
        filename = f"{date_str}_{slug}_{session_id[:8]}.txt"
        filepath = self._kb_dir / filename
        filepath.write_text(
            f"Query     : {query}\nDate      : {now.isoformat()}\nSession   : {session_id}\nWord count: {len(report.split())}\n\n{report}",
            encoding="utf-8",
        )
        logger.info(f"Saved .txt to {filepath}")
        try:
            col = self._get_collection()
            col.upsert(
                ids=[session_id],
                documents=[report],
                metadatas=[{
                    "query": query,
                    "date": date_str,
                    "session_id": session_id,
                    "filename": filename,
                    "word_count": len(report.split()),
                    "sources_count": (metadata or {}).get("sources_count", 0),
                }],
            )
            logger.info("Upserted into ChromaDB")
        except Exception as e:
            logger.error(f"ChromaDB upsert failed: {e}")
        return str(filepath)

    def list_reports(self, limit=50):
        try:
            col = self._get_collection()
            results = col.get(limit=limit, include=["metadatas"])
            return [
                {
                    "session_id": m.get("session_id", ""),
                    "query": m.get("query", ""),
                    "date": m.get("date", ""),
                    "filename": m.get("filename", ""),
                    "word_count": m.get("word_count", 0),
                    "sources_count": m.get("sources_count", 0),
                }
                for m in (results["metadatas"] or [])
            ]
        except Exception as e:
            logger.warning(f"ChromaDB list failed: {e}")
            return self._list_from_txt()

    def stats(self):
        vector_count = 0
        try:
            vector_count = self._get_collection().count()
        except Exception:
            pass
        txt_count = len(list(self._kb_dir.glob("*.txt")))
        return {
            "total_reports_vector": vector_count,
            "total_reports_txt": txt_count,
            "kb_dir": str(self._kb_dir),
            "chroma_dir": str(settings.chroma_dir),
        }

    def semantic_search(self, query, n_results=5):
        try:
            col = self._get_collection()
            count = col.count()
            # Guard: ChromaDB raises if the collection is empty
            if count == 0:
                return []
            results = col.query(
                query_texts=[query],
                n_results=min(n_results, count),
                include=["metadatas", "distances"],
            )
            out = []
            for meta, dist in zip(results["metadatas"][0], results["distances"][0]):
                out.append({**meta, "similarity_score": round(1 - dist, 4)})
            return out
        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
            return []

    def keyword_search(self, query):
        q = query.lower()
        hits = []
        for fp in sorted(self._kb_dir.glob("*.txt"), reverse=True):
            try:
                text = fp.read_text(encoding="utf-8")
                if q in text.lower():
                    idx = text.lower().find(q)
                    hits.append({
                        "filename": fp.name,
                        "snippet": text[max(0, idx - 40): idx + 120].strip(),
                    })
            except Exception:
                pass
        return hits

    def get_report_by_session(self, session_id):
        try:
            col = self._get_collection()
            results = col.get(ids=[session_id], include=["documents"])
            docs = results.get("documents") or []
            return docs[0] if docs else None
        except Exception as e:
            logger.error(f"get_report_by_session failed: {e}")
            return None

    def get_report_file(self, filename):
        safe = Path(filename).name
        fp = self._kb_dir / safe
        if not fp.exists():
            return None
        try:
            return fp.read_text(encoding="utf-8")
        except Exception as e:
            logger.error(f"get_report_file failed: {e}")
            return None

    def _list_from_txt(self):
        out = []
        for fp in sorted(self._kb_dir.glob("*.txt"), reverse=True):
            try:
                lines = fp.read_text(encoding="utf-8", errors="ignore").splitlines()
                query = lines[0].replace("Query     :", "").strip() if lines else fp.stem
                date = lines[1].replace("Date      :", "").strip()[:10] if len(lines) > 1 else ""
                wc_ln = next((line for line in lines if line.startswith("Word count")), "")
                wc = int(wc_ln.split(":")[-1].strip()) if wc_ln else 0
                out.append({"filename": fp.name, "query": query, "date": date, "word_count": wc})
            except Exception:
                out.append({"filename": fp.name, "query": fp.stem, "date": "", "word_count": 0})
        return out
        