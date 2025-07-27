from flask import Flask, request, jsonify
import os
from werkzeug.utils import secure_filename
from app import convert_pdf_to_markdown

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/parse-pdfs', methods=['POST'])
def parse_pdfs():
    if 'files' not in request.files:
        return jsonify({'error': 'No files provided'}), 400

    files = request.files.getlist('files')

    if not files or files[0].filename == '':
        return jsonify({'error': 'No selected files'}), 400

    results = []
    for file in files:
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            try:
                file.save(filepath)
                print (f"File saved to {filepath}     "    )
                markdown_content = convert_pdf_to_markdown(filepath)
                results.append({
                    'filename': filename,
                    'content': markdown_content,
                    'status': 'success'
                })
            except Exception as e:
                results.append({
                    'filename': filename,
                    'error': str(e),
                    'status': 'error'
                })
            finally:
                if os.path.exists(filepath):
                    os.remove(filepath)
        else:
            results.append({
                'filename': file.filename if file and file.filename else 'unknown',
                'error': 'Invalid file type. Only PDF files are allowed.',
                'status': 'error'
            })

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
