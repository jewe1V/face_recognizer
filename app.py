from fastapi import FastAPI, File, UploadFile, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import torch
from torchvision import models, transforms
from PIL import Image
import io
import os

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

model = models.resnet18()
model.fc = torch.nn.Linear(model.fc.in_features, 7) 
model.load_state_dict(torch.load("models/resnet18_best.pth"))  
model.eval()
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

class_names = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]

transform = transforms.Compose([
    transforms.Resize((64, 64)),
    transforms.CenterCrop(64),  
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

@app.get("/", response_class=HTMLResponse)
async def get_index():
    with open("static/index.html", "r") as f:
        return HTMLResponse(content=f.read())

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        image_tensor = transform(image).unsqueeze(0).to(device)
        
        with torch.no_grad():
            outputs = model(image_tensor)
            probs = torch.softmax(outputs, dim=1)
            pred_class = torch.argmax(probs, dim=1).item()
            pred_prob = probs[0][pred_class].item()
        
        return JSONResponse({
            "emotion": class_names[pred_class],
            "confidence": f"{pred_prob:.4f}"
        })
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)