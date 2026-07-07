import logging

logger = logging.getLogger("rag_assistant")


def generate_rag_response(prompt: str, context: str, referenced_filename: str = None) -> str:
    """
    Synthesizes a response by injecting retrieved document text into the context prompt.
    Simulates Google Gemini / Local LLM text generation logic.
    """
    logger.info(f"Assembling context tokens for Q&A prompt. Reference source: {referenced_filename or 'All'}")
    
    if not context.strip():
        return (
            "I couldn't find any relevant context details in the database vector store matching your query. "
            "Please upload document sheets in the Upload Center first to build the AI semantic database."
        )

    # In a full API configuration:
    # import google.generativeai as genai
    # model = genai.GenerativeModel('gemini-1.5-flash')
    # prompt_template = f"Context:\n{context}\n\nQuestion:\n{prompt}"
    # response = model.generate_content(prompt_template)
    # return response.text
    
    clean_context = context[:300].replace('\n', ' ')
    response_template = (
        f"Based on the content of **{referenced_filename or 'the indexed files'}**, here is what I retrieved:\n\n"
        f"The document outlines details matching your prompt:\n"
        f"> \"{clean_context}...\"\n\n"
        f"In summary, the text indicates that the ingestion pipeline has indexed and structured this segment "
        f"successfully inside the database collection."
    )
    return response_template
