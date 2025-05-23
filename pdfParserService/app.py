from docling.document_converter import DocumentConverter

def parsing_pdf(pdf_path):
    converter = DocumentConverter()
    doc = converter.convert(pdf_path).document
    return doc.export_to_markdown(page_break_placeholder="<!-- page break -->")


