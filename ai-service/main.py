import json
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import cv2
import numpy as np
import io

app = FastAPI(title="Face Recognition Attendance API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize InsightFace model
from insightface.app import FaceAnalysis
from numpy.linalg import norm

app_model = FaceAnalysis(name='buffalo_l')
app_model.prepare(ctx_id=0, det_size=(640, 640))

@app.get("/")
def read_root():
    return {"status": "AI Microservice is running"}

@app.post("/register-face")
async def register_face(file: UploadFile = File(...)):
    """
    Accepts an image file and returns a face embedding vector.
    """
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Pass image to RetinaFace/InsightFace for embedding
    faces = app_model.get(img)
    if len(faces) == 0:
        raise HTTPException(status_code=400, detail="No face detected in the image")
    
    if len(faces) > 1:
        raise HTTPException(status_code=400, detail="Multiple faces detected. Please upload an image with only one face.")

    embedding = faces[0].embedding.tolist()

    return {"message": "Face registered successfully", "embedding": embedding}

class ProcessRequest(BaseModel):
    registered_embeddings: dict # dict of student_id: embedding_vector

@app.post("/process-attendance")
async def process_attendance(
    file: UploadFile = File(...),
    embeddings: str = Form(...) # JSON string of dict {student_id: [embedding]}
):
    """
    Takes a classroom photo, detects all faces, and matches against registered embeddings.
    """
    try:
        registered_embeddings = json.loads(embeddings)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid embeddings JSON format")

    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Detect faces in the image
    faces = app_model.get(img)
    
    recognized_student_ids = []
    SIMILARITY_THRESHOLD = 0.5  # Adjust this threshold based on accuracy needs
    
    for face in faces:
        face_emb = np.array(face.embedding)
        best_match_id = None
        best_similarity = -1.0
        
        for student_id, student_emb_list in registered_embeddings.items():
            student_emb = np.array(student_emb_list)
            
            # Compute cosine similarity
            similarity = np.dot(face_emb, student_emb) / (norm(face_emb) * norm(student_emb))
            
            if similarity > best_similarity:
                best_similarity = similarity
                best_match_id = student_id
                
        if best_match_id is not None and best_similarity >= SIMILARITY_THRESHOLD:
            if best_match_id not in recognized_student_ids:
                recognized_student_ids.append(best_match_id)

    return {
        "message": "Processed successfully",
        "detected_faces_count": len(faces),
        "recognized_student_ids": recognized_student_ids
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
