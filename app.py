from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Увеличиваем лимит для загрузки фото (16 МБ)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

BOOKS_FILE = 'books.json'

def load_books():
    try:
        with open(BOOKS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_books(books):
    with open(BOOKS_FILE, 'w', encoding='utf-8') as f:
        json.dump(books, f, ensure_ascii=False, indent=2)

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/books', methods=['GET'])
def get_books():
    return jsonify(load_books()), 200

@app.route('/api/books', methods=['POST'])
def add_book():
    new_book = request.get_json()
    if not new_book or 'title' not in new_book or 'author' not in new_book:
        return jsonify({'error': 'Не хватает полей'}), 400

    books = load_books()
    books.append(new_book)
    save_books(books)
    return jsonify(books), 201

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port, debug=False)