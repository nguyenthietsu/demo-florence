# Florence Image Analysis Web App

This is a web application that uses Microsoft's Florence-2 model to analyze images. It supports three main tasks:
- Image Captioning
- Object Detection
- Image Segmentation

## Download Florence-2-base Model from Hugging Face

You can clone the Florence-2-base model repository from Hugging Face using git-lfs:

```bash
git lfs install
git clone https://huggingface.co/microsoft/Florence-2-base
```

Or, if you only want to download the model weights automatically when running the code, you do not need to clone manually. The `transformers` library will handle it for you.

> More info: [Florence-2-base on Hugging Face](https://huggingface.co/microsoft/Florence-2-base)

## Setup

### Backend Setup
1. Create a Python virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install the required packages:
```bash
pip install -r requirements.txt
```

3. Run the Flask backend:
```bash
python app.py
```

### Frontend Setup
1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```



## Usage
1. Open your browser and go to `http://localhost:3000`
2. Upload an image or use the default image
3. Select a task type:
   - Caption: Generates a detailed description of the image
   - Detection: Detects objects based on a text prompt
   - Segmentation: Creates segmentation masks based on a text prompt
4. For detection and segmentation tasks, enter a text prompt
5. Click "Process Image" to see the results

## Features
- Image upload from device
- Default image option
- Three different analysis modes
- Real-time processing
- Error handling
- Responsive design 