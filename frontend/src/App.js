import React, { useRef, useState } from 'react';
import { FaRegImage, FaSearch, FaDrawPolygon, FaUpload, FaRegFileImage, FaTimes } from 'react-icons/fa';
import './App.css';

const TASKS = [
  { key: 'caption', label: 'Caption', icon: <FaRegImage size={22} /> },
  { key: 'detection', label: 'Detection', icon: <FaSearch size={22} /> },
  // { key: 'segmentation', label: 'Segmentation', icon: <FaDrawPolygon size={22} /> },
];

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [taskType, setTaskType] = useState('caption');
  const [textInput, setTextInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDefaultImage = () => {
    setSelectedImage('/default.jpg');
    setResult(null);
    setError(null);
  };

  const handleTaskChange = (type) => {
    setTaskType(type);
    setTextInput('');
    setResult(null);
    setError(null);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
  };

  const handleProcess = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }
    if ((taskType === 'detection' || taskType === 'segmentation') && !textInput) {
      setError('Please provide a text prompt for detection or segmentation');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('http://localhost:5000/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: taskType,
          text_input: textInput,
          image: selectedImage,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Always show uploaded image or result image in main canvas
  const mainImage = selectedImage
    ? (taskType === 'caption' || !result || !result.image ? selectedImage : result.image)
    : null;

  return (
    <div className="DesignApp">
      {/* Sidebar (branding only) */}
      <aside className="sidebar">
        <div className="sidebar-title">Tools</div>
      </aside>

      {/* Main area */}
      <div className="main-area">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-title">Florence Image Analysis</div>
          <div className="topbar-actions">
            <button
              className="icon-btn"
              title="Upload Image"
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <FaUpload size={18} />
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            <button className="icon-btn" title="Use Default Image" onClick={handleDefaultImage}>
              <FaRegFileImage size={18} />
            </button>
          </div>
        </header>

        {/* Canvas area */}
        <div className="canvas-area">
          <div className="canvas">
            {!selectedImage ? (
              <button
                className="canvas-upload-btn"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <FaUpload size={32} style={{ marginBottom: 10 }} />
                <div>Tải ảnh lên</div>
              </button>
            ) : (
              <div className="canvas-img-wrapper">
                <img
                  src={mainImage}
                  alt="Canvas"
                  className="canvas-img fixed-canvas-img"
                />
                <button className="canvas-remove-btn" title="Xóa ảnh" onClick={handleRemoveImage}>
                  <FaTimes size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Floating right panel */}
        <div className="right-panel">
          {/* Task selection toolbar */}
          <div className="panel-task-toolbar">
            {TASKS.map((task) => (
              <button
                key={task.key}
                className={`panel-task-btn${taskType === task.key ? ' active' : ''}`}
                onClick={() => handleTaskChange(task.key)}
                title={task.label}
              >
                {task.icon}
                <span className="panel-task-label">{task.label}</span>
              </button>
            ))}
          </div>
          <div className="panel-section">
            {(taskType === 'detection' || taskType === 'segmentation') && (
              <input
                className="panel-input"
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Prompt (e.g. 'face', 'steering wheel')"
              />
            )}
            <button className="panel-process-btn" onClick={handleProcess} disabled={loading}>
              {loading ? <span className="spinner"></span> : 'Process'}
            </button>
          </div>
          <div className="panel-section panel-result">
            <div className="panel-title">Result</div>
            {error && <div className="panel-error">{error}</div>}
            {loading && <div className="panel-loading">Processing...</div>}
            {result && taskType === 'caption' && (
              <div className="panel-result-content">
                <div className="panel-caption">
                  <strong>Caption:</strong>
                  <p>{result.result['<DETAILED_CAPTION>']}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="design-footer">Florence-2 Demo &copy; 2025</footer>
    </div>
  );
}

export default App;
