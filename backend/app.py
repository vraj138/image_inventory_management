from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin SDK
cred = credentials.Certificate('path/to/serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

app = Flask(__name__)

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Save the file locally
    file_path = f"./uploads/{file.filename}"
    file.save(file_path)

    # Recognize item using OpenAI Vision API
    recognized_text = recognize_item(file_path)

    # Update Firestore
    doc_ref = db.collection('inventory_items').document(file.filename)
    doc_ref.set({
        'item_name': recognized_text,
        'quantity': 1  # Adjust quantity logic as needed
    })

    return jsonify({"message": "Item recognized and inventory updated", "item": recognized_text})

if __name__ == '__main__':
    app.run(debug=True)
