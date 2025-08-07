from flask import Flask, request, jsonify
import pdfplumber
import pytesseract
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def format_table_cell(cell):
    if cell is None:
        return ""
    return str(cell).strip().replace("|", "\\|")

def convert_pdf_to_markdown(pdf_path):
    try:
        pytesseract.get_tesseract_version()
    except Exception as e:
        print("Tesseract is not properly installed. OCR functionality will not work.",e)
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

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200

@app.route('/parse-pdf', methods=['POST'])
def parse_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        try:
            markdown_content = convert_pdf_to_markdown(file_path)
            if markdown_content is None:
                return jsonify({'error': 'Failed to process PDF'}), 500
            
            # Clean up uploaded file
            os.remove(file_path)
            
            return jsonify({
                'markdown': markdown_content,
                'filename': filename
            }), 200
            
        except Exception as e:
            # Clean up uploaded file in case of error
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'error': f'Processing failed: {str(e)}'}), 500
    
    return jsonify({'error': 'Invalid file type. Only PDF files are allowed.'}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
