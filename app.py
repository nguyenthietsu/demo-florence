from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from PIL import Image
import io
import base64
from transformers import AutoProcessor, AutoModelForCausalLM
import copy
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import random
import numpy as np
from PIL import ImageDraw, ImageFont

app = Flask(__name__)
CORS(app)

# Color map for visualization
colormap = ['blue','orange','green','purple','brown','pink','gray','olive','cyan','red',
            'lime','indigo','violet','aqua','magenta','coral','gold','tan','skyblue']

# Initialize model and processor
device = "cuda" if torch.cuda.is_available() else "cpu"
torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

print("Loading Florence model...")
model = AutoModelForCausalLM.from_pretrained("Florence-2-base", torch_dtype=torch_dtype, trust_remote_code=True).to(device)
processor = AutoProcessor.from_pretrained("Florence-2-base", trust_remote_code=True)
print("Model loaded successfully!")

def plot_bbox(image, data):
    fig, ax = plt.subplots()  
    ax.imshow(image)  
    
    for bbox, label in zip(data['bboxes'], data['labels']):  
        x1, y1, x2, y2 = bbox  
        rect = patches.Rectangle((x1, y1), x2-x1, y2-y1, linewidth=1, edgecolor='r', facecolor='none')  
        ax.add_patch(rect)  
        plt.text(x1, y1, label, color='white', fontsize=8, bbox=dict(facecolor='red', alpha=0.5))  
    
    ax.axis('off')  
    
    # Save plot to bytes
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0)
    plt.close()
    buf.seek(0)
    return buf

def draw_polygons(image, prediction, fill_mask=False):  
    draw = ImageDraw.Draw(image)  
    scale = 1  
    
    for polygons, label in zip(prediction['polygons'], prediction['labels']):  
        color = random.choice(colormap)  
        fill_color = random.choice(colormap) if fill_mask else None  
        
        for _polygon in polygons:  
            _polygon = np.array(_polygon).reshape(-1, 2)  
            if len(_polygon) < 3:  
                print('Invalid polygon:', _polygon)  
                continue  
            
            _polygon = (_polygon * scale).reshape(-1).tolist()  
            
            if fill_mask:  
                draw.polygon(_polygon, outline=color, fill=fill_color)  
            else:  
                draw.polygon(_polygon, outline=color)  
            
            draw.text((_polygon[0] + 8, _polygon[1] + 2), label, fill=color)  
    
    # Save image to bytes
    buf = io.BytesIO()
    image.save(buf, format='PNG')
    buf.seek(0)
    return buf

def run_example(image, task_prompt, text_input=None):
    if text_input is None:
        prompt = task_prompt
    else:
        prompt = task_prompt + text_input
    inputs = processor(text=prompt, images=image, return_tensors="pt").to(device, torch_dtype)
    generated_ids = model.generate(
      input_ids=inputs["input_ids"],
      pixel_values=inputs["pixel_values"],
      max_new_tokens=1024,
      num_beams=3
    )
    generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
    parsed_answer = processor.post_process_generation(generated_text, task=task_prompt, image_size=(image.width, image.height))
    return parsed_answer

@app.route('/api/process', methods=['POST'])
def process_image():
    try:
        data = request.json
        task_type = data.get('task_type')
        text_input = data.get('text_input')
        image_data = data.get('image')
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        if task_type == 'caption':
            results = run_example(image, "<DETAILED_CAPTION>")
            return jsonify({
                'success': True,
                'result': results
            })
        
        elif task_type == 'detection':
            if not text_input:
                return jsonify({
                    'success': False,
                    'error': 'Text input required for detection task'
                }), 400
            
            results = run_example(image, '<CAPTION_TO_PHRASE_GROUNDING>', text_input)
            result_image = plot_bbox(image, results['<CAPTION_TO_PHRASE_GROUNDING>'])
            result_base64 = base64.b64encode(result_image.getvalue()).decode('utf-8')
            
            return jsonify({
                'success': True,
                'result': results,
                'image': f'data:image/png;base64,{result_base64}'
            })
        
        elif task_type == 'segmentation':
            if not text_input:
                return jsonify({
                    'success': False,
                    'error': 'Text input required for segmentation task'
                }), 400
            
            results = run_example(image, '<REFERRING_EXPRESSION_SEGMENTATION>', text_input)
            output_image = copy.deepcopy(image)
            result_image = draw_polygons(output_image, results['<REFERRING_EXPRESSION_SEGMENTATION>'], fill_mask=True)
            result_base64 = base64.b64encode(result_image.getvalue()).decode('utf-8')
            
            return jsonify({
                'success': True,
                'result': results,
                'image': f'data:image/png;base64,{result_base64}'
            })
        
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid task type'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 