import pdfplumber
import pytesseract
from PIL import Image

def format_table_cell(cell):
    if cell is None:
        return ""
    return str(cell).strip().replace("|", "\\|")

def convert_pdf_to_markdown(pdf_path):
    try:
        # Test if tesseract is installed
        pytesseract.get_tesseract_version()
    except Exception as e:
        print("Tesseract is not properly installed. OCR functionality will not work.")
        return None

    markdown = ""
    
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            markdown += f"\n## Page {i+1}\n\n"
            
            text = page.extract_text()
            if text:
                markdown += f"{text}\n\n"
            
            tables = page.extract_tables()
            for table in tables:
                if table and len(table) > 0:
                    # Get maximum width for each column
                    col_widths = []
                    for col in range(len(table[0])):
                        col_width = max(len(str(row[col] or "")) for row in table)
                        col_widths.append(col_width)
                    
                    header_cells = [format_table_cell(cell).ljust(width) for cell, width in zip(table[0], col_widths)]
                    markdown += "| " + " | ".join(header_cells) + " |\n"
                    
                    markdown += "|" + "|".join(f" {'-' * width} " for width in col_widths) + "|\n"
                    
                    for row in table[1:]:
                        formatted_cells = [format_table_cell(cell).ljust(width) for cell, width in zip(row, col_widths)]
                        markdown += "| " + " | ".join(formatted_cells) + " |\n"
                    markdown += "\n"
            
            try:
                if not text or len(text.strip()) < 20:
                    img = page.to_image(resolution=300).original
                    ocr_text = pytesseract.image_to_string(img)
                    if ocr_text.strip():
                        markdown += f"### OCR Content\n\n{ocr_text}\n\n"
            except Exception as e:
                markdown += f"### OCR Error\nFailed to perform OCR on page {i+1}: {str(e)}\n\n"
    
    return markdown

def main():
    pdf_path = '../../../Downloads/LIC_Nivesh-Plus_Brochure_9-inch-x-8-inch_Eng_Single-pages-(2).pdf'  # Replace with your PDF file path
    markdown_content = convert_pdf_to_markdown(pdf_path)
    print(markdown_content)

if __name__ == '__main__':
    main()