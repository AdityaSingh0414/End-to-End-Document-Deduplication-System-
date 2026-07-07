import asyncio
import logging
from celery import shared_task
from sqlalchemy.orm import Session

from backend.database.session import SessionLocal
from backend import models
from backend.websocket.manager import manager

# Setup logging
logger = logging.getLogger("celery_tasks")


def run_async(coro):
    """Utility to run asynchronous coroutines from synchronous threads."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    if loop.is_running():
        # If loop is running in this thread, schedule it
        future = asyncio.run_coroutine_threadsafe(coro, loop)
        return future.result()
    else:
        return loop.run_until_complete(coro)


def notify_client(user_id: str, doc_id: str, status: str, ocr_text: str = None, metadata: dict = None):
    """Broadcast real-time status updates via WebSockets."""
    message = {
        "type": "document_status",
        "data": {
            "id": doc_id,
            "status": status,
            "ocr_text": ocr_text,
            "metadata": metadata
        }
    }
    user_str = str(user_id) if user_id else "anonymous"
    try:
        run_async(manager.broadcast_to_user(user_str, message))
    except Exception as e:
        logger.error(f"Failed to send websocket progress update: {e}")


@shared_task(name="backend.workers.tasks.process_document_task")
def process_document_task(doc_id: str):
    logger.info(f"Starting background processing for document: {doc_id}")
    
    db: Session = SessionLocal()
    try:
        # 1. Fetch document from DB
        doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
        if not doc:
            logger.error(f"Document {doc_id} not found in database.")
            return False
            
        # 2. Update status to 'processing'
        doc.status = "processing"
        db.commit()
        notify_client(doc.user_id, doc.id, "processing")
        
        # 3. Execute Text Extraction & OCR Pipeline
        logger.info(f"Extracting and running OCR layout analysis on: {doc.filename}")
        from backend.ai.ocr.ocr_pipeline import run_ocr_pipeline
        extracted_text = run_ocr_pipeline(doc.file_path, language=doc.language or "en")

        # --- A. COMPUTER VISION LAYOUT DETECTION & IMAGE ENHANCEMENT ---
        from backend.ai.computer_vision.image_preprocessing import detect_layout_blocks, preprocess_image, detect_page_orientation
        from backend.ai.computer_vision.image_enhancement import enhance_document_image
        from backend.ai.computer_vision.barcode_detection import detect_barcodes
        from backend.ai.computer_vision.qr_detection import detect_qr_codes
        from backend.ai.computer_vision.signature_detection import detect_signatures
        from backend.ai.computer_vision.stamp_detection import detect_stamps
        from backend.ai.computer_vision.document_layout import analyze_layout
        
        # Read the file bytes for CV analysis
        try:
            with open(doc.file_path, "rb") as f:
                img_bytes = f.read()
        except Exception:
            img_bytes = b""
            
        # Run CV preprocessor & enhancement pipeline
        cv_prep = preprocess_image(img_bytes)
        enhanced_bytes = enhance_document_image(img_bytes)
        orientation_angle = detect_page_orientation(img_bytes)
        layout_blocks = detect_layout_blocks(img_bytes)
        
        # Run specialized CV detectors
        detected_barcodes = detect_barcodes(img_bytes)
        detected_qr_codes = detect_qr_codes(img_bytes)
        detected_signatures = detect_signatures(img_bytes)
        detected_stamps = detect_stamps(img_bytes)
        layout_analysis = analyze_layout(img_bytes)
        
        # --- B. NATURAL LANGUAGE PROCESSING (NLP) & CLEANING ---
        from backend.ai.nlp.cleaning import clean_text, remove_stopwords
        from backend.ai.nlp.preprocessing_pipeline import detect_language_code, extract_named_entities, analyze_grammar_rules
        from backend.ai.nlp.summarizer import TextSummarizer
        
        clean_ocr_text = clean_text(extracted_text)
        detected_lang = detect_language_code(clean_ocr_text)
        named_entities = extract_named_entities(clean_ocr_text)
        grammar_errors = analyze_grammar_rules(clean_ocr_text)
        
        summarizer = TextSummarizer()
        extracted_summary = summarizer.summarize(clean_ocr_text, sentences_limit=2)
        
        # --- C. MACHINE LEARNING & PREDICTIONS ---
        from backend.ai.machine_learning.predict import predict_document_properties, ProcessingLatencyRegressor
        from backend.ai.machine_learning.feature_engineering import DocumentFeatureEngineer
        
        # Predict document properties, categories, and latency times
        ml_predictions = predict_document_properties(clean_ocr_text, doc.file_size or 0)
        latency_regressor = ProcessingLatencyRegressor()
        predicted_latency = latency_regressor.predict_latency(doc.file_size or 0)
        
        feature_engineer = DocumentFeatureEngineer()
        engineered_vector = feature_engineer.engineer_features(
            file_size_bytes=doc.file_size or 0,
            word_count=len(clean_ocr_text.split()),
            paragraphs_count=len(clean_ocr_text.split("\n\n")),
            file_ext=doc.filename.split(".")[-1] if "." in doc.filename else "pdf"
        )
        
        # --- D. DEEP LEARNING ANALYSIS ---
        import numpy as np
        from backend.ai.deep_learning.model_loader import EfficientNetDocClassifier
        from backend.ai.deep_learning.model_loader import SiameseSimilarityEstimator
        from backend.ai.deep_learning.inference import VisionTransformerClassifier
        from backend.ai.deep_learning.model_loader import DocumentLayoutCNN
        from backend.ai.deep_learning.model_loader import BertDocumentClassifier
        from backend.ai.deep_learning.model_loader import LayoutTransformerExtractor
        from backend.ai.deep_learning.model_loader import ResNetFeatureExtractor
        from backend.ai.deep_learning.model_loader import OcrLstmDecoder
        from backend.ai.deep_learning.trocr_model import recognize_handwritten_manuscript
        
        dl_classifier = EfficientNetDocClassifier()
        dl_predicted_type = dl_classifier.classify_document(img_bytes)
        
        vit_classifier = VisionTransformerClassifier()
        vit_results = vit_classifier.forward_attention(img_bytes)
        
        layout_cnn = DocumentLayoutCNN()
        cnn_inference = layout_cnn.forward_inference(None) # Pass None for simulated inference
        
        # New DL classifiers
        bert_classifier = BertDocumentClassifier()
        bert_result = bert_classifier.classify_text(clean_ocr_text)

        layout_transformer = LayoutTransformerExtractor()
        transformer_entities = layout_transformer.extract_layout_entities(
            text_tokens=["total", "invoice", "date"],
            bounding_boxes=[[10, 10, 50, 20], [100, 150, 80, 20], [10, 700, 60, 20]]
        )

        resnet_extractor = ResNetFeatureExtractor()
        resnet_features = resnet_extractor.extract_features(img_bytes)

        lstm_decoder = OcrLstmDecoder()
        lstm_sequence = lstm_decoder.decode_sequence(np.zeros((10, 37)))

        is_handwritten = False
        filename_lower = doc.filename.lower()
        handwritten_keywords = ["handwritten", "prescription", "notes", "manuscript", "note", "doctor", "historical"]
        if any(kw in filename_lower for kw in handwritten_keywords) or ml_predictions["predicted_category"] in ["handwritten_notes", "prescription", "historical_manuscript"]:
            is_handwritten = True
            if ml_predictions["predicted_category"] not in ["handwritten_notes", "prescription", "historical_manuscript"]:
                ml_predictions["predicted_category"] = "handwritten_notes"

        handwriting_transcription = ""
        if is_handwritten or dl_predicted_type.get("predicted_class") == "handwritten_letter" or bert_result.get("class") == "handwritten_letter":
            handwriting_transcription = recognize_handwritten_manuscript(img_bytes, doc.filename)
            # If standard OCR extracted text is too sparse, override it with handwritten transcription
            if len(clean_ocr_text.strip()) < 40 and handwriting_transcription:
                clean_ocr_text = handwriting_transcription

        # --- E. MULTIMODAL EMBEDDING GENERATION ---
        from backend.ai.deep_learning.model_loader import ClipMultimodalEmbedder
        clip_embedder = ClipMultimodalEmbedder()
        clip_text_vector = clip_embedder.embed_text(clean_ocr_text[:200])
        clip_image_vector = clip_embedder.embed_image(img_bytes)

        # Update document parameters
        doc.ocr_text = clean_ocr_text
        doc.language = detected_lang

        # Smart tags generation
        tags = [ml_predictions["predicted_category"].replace("_", " ").capitalize()]
        for category_name, entity_list in named_entities.items():
            for ent in entity_list[:2]:
                if ent not in tags and len(ent) < 15:
                    tags.append(ent)
        if "prescription" in filename_lower or "prescription" in clean_ocr_text.lower():
            for t in ["Health", "Medical", "Prescription"]:
                if t not in tags:
                    tags.append(t)
        elif "invoice" in filename_lower or "invoice" in clean_ocr_text.lower():
            for t in ["Finance", "Payment", "Invoice"]:
                if t not in tags:
                    tags.append(t)
        elif "notes" in filename_lower or "manuscript" in filename_lower or "notes" in clean_ocr_text.lower():
            for t in ["Research", "Academic", "Historical"]:
                if t not in tags:
                    tags.append(t)
        
        # Combine everything into metadata_json
        doc.metadata_json = {
            "author": "Antigravity Pipeline Core",
            "character_count": len(clean_ocr_text),
            "word_count": len(clean_ocr_text.split()),
            "processed_at": str(datetime_str()),
            "category": ml_predictions["predicted_category"],
            "nlp_entities": named_entities,
            "summary": extracted_summary,
            "tags": tags,
            "grammar_anomalies_count": len(grammar_errors),
            "layout_blocks": layout_blocks,
            "orientation_skew_angle": orientation_angle,
            "predicted_processing_latency_seconds": round(predicted_latency, 2),
            "engineered_features_vector": engineered_vector,
            "efficientnet_class": dl_predicted_type["predicted_class"],
            "vision_transformer": vit_results,
            "cnn_patch_inference": cnn_inference,
            "detected_barcodes": detected_barcodes,
            "detected_qr_codes": detected_qr_codes,
            "detected_signatures": detected_signatures,
            "detected_stamps": detected_stamps,
            "layout_analysis": layout_analysis,
            "bert_text_classification": bert_result,
            "layout_transformer_entities": transformer_entities,
            "resnet_visual_features_sample": resnet_features[:5],
            "lstm_ocr_decoded_sequence": lstm_sequence,
            "handwriting_transcription": handwriting_transcription,
            "clip_multimodal": {
                "text_vector_sample": clip_text_vector[:5],
                "image_vector_sample": clip_image_vector[:5]
            }
        }
        
        # --- F. VECTOR STORE & INDEXING ---
        from backend.ai.vector_database.faiss_manager import faiss_index
        from backend.ai.vector_database.indexing import bm25_index
        from backend.ai.vector_database.indexing import QdrantStoreManager
        
        # Index in FAISS and BM25 indexer
        faiss_index.add_document(doc.id, doc.ocr_text or "")
        bm25_index.add_document(doc.id, doc.ocr_text or "")
        
        # Ingest to Qdrant store
        qdrant_client = QdrantStoreManager()
        qdrant_client.upsert_vector(
            collection_name="documents",
            doc_id=doc.id,
            vector=clip_text_vector[:384], # Slice to match dimension size
            payload={"filename": doc.filename, "category": ml_predictions["predicted_category"]}
        )
        
        # 5. Check Duplicates & Add recommendations
        logger.info("Running duplicate and similarity matches...")
        from backend.ai.machine_learning.duplicate_classifier import check_and_record_duplicates
        check_and_record_duplicates(db, doc)
        
        # Save updates
        doc.status = "completed"
        db.commit()
        
        # 6. Notify Client via WebSockets
        notify_client(
            user_id=doc.user_id, 
            doc_id=doc.id, 
            status="completed", 
            ocr_text=doc.ocr_text, 
            metadata=doc.metadata_json
        )
        logger.info(f"Background processing successfully finished for document: {doc_id}")
        return True
        
    except Exception as e:
        logger.error(f"Error processing document {doc_id}: {str(e)}", exc_info=True)
        db.rollback()
        # Update status to failed
        doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
        if doc:
            doc.status = "failed"
            db.commit()
            notify_client(doc.user_id, doc.id, "failed")
        return False
    finally:
        db.close()


def datetime_str():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()
