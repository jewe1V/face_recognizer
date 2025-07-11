FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p static

ENV PYTHONPATH=/app
ENV MODEL_PATH=/app/models/resnet18_best.pth

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]