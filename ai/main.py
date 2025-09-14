import sys
import json
import time
import cv2
import numpy as np
import requests

# --- CONFIGURATION ---
# These can be adjusted for sensitivity
CONF_THRESHOLD = 0.5  # Confidence threshold for detecting an object
NMS_THRESHOLD = 0.4   # Non-maximum suppression threshold to remove overlapping boxes
DETECTION_THRESHOLD_S = 3 # Seconds a person must be present/absent to trigger an event

API_BASE_URL = 'http://localhost:3001/api/sessions'
YOLO_PATH = 'ai/yolo/'

# --- HELPER FUNCTIONS ---

def log(message):
    """Prints a message to stdout and flushes the buffer."""
    print(message, flush=True)

def start_session(chair_id):
    """Sends an API request to start a session for a given chair."""
    try:
        response = requests.post(f"{API_BASE_URL}/{chair_id}/start")
        if response.status_code == 201:
            log(f"API: Started session for Chair {chair_id}")
            return True
        elif response.status_code == 400: # Already active
            # This is not an error, just means state is already correct
            return True 
        else:
            log(f"API ERROR: Failed to start session for Chair {chair_id}. Status: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        log(f"API ERROR: Connection failed for start_session: {e}")
        return False

def end_session(chair_id):
    """Sends an API request to end a session for a given chair."""
    try:
        response = requests.post(f"{API_BASE_URL}/{chair_id}/end")
        if response.status_code == 200:
            log(f"API: Ended session for Chair {chair_id}")
            return True
        elif response.status_code == 404: # No active session
             # This is not an error, just means state is already correct
            return True
        else:
            log(f"API ERROR: Failed to end session for Chair {chair_id}. Status: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        log(f"API ERROR: Connection failed for end_session: {e}")
        return False

def check_overlap(box, roi):
    """Checks if a detected box overlaps with a region of interest."""
    x, y, w, h = box
    roi_x, roi_y, roi_w, roi_h = roi['x'], roi['y'], roi['width'], roi['height']

    # Check for non-overlapping cases
    if (x + w < roi_x or x > roi_x + roi_w or y + h < roi_y or y > roi_y + roi_h):
        return False
    return True

# --- MAIN AI SCRIPT ---

if __name__ == "__main__":
    if len(sys.argv) != 3:
        log("Usage: python main.py <stream_url> <rois_json_string>")
        sys.exit(1)

    stream_url = sys.argv[1]
    rois_json = sys.argv[2]
    
    try:
        rois = json.loads(rois_json)
        if not rois:
            log("Error: No ROIs provided. Exiting.")
            sys.exit(1)
    except json.JSONDecodeError:
        log("Error: Invalid JSON format for ROIs. Exiting.")
        sys.exit(1)

    log("AI script started.")
    log(f"Monitoring stream: {stream_url}")
    log(f"Monitoring {len(rois)} ROI(s).")
    
    # Load YOLO model
    try:
        with open(YOLO_PATH + 'coco.names', 'rt') as f:
            classes = f.read().rstrip('\n').split('\n')
        
        net = cv2.dnn.readNetFromDarknet(YOLO_PATH + 'yolov3-tiny.cfg', YOLO_PATH + 'yolov3-tiny.weights')
        net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
        output_layers = [net.getLayerNames()[i - 1] for i in net.getUnconnectedOutLayers()]
        log("YOLO model loaded successfully.")
    except cv2.error as e:
        log(f"FATAL: Could not load YOLO model files. Make sure they are in {YOLO_PATH}. Error: {e}")
        sys.exit(1)

    # Initialize state for each chair
    chair_states = {
        roi['id']: {
            'person_detected': False, 
            'session_active': False,
            'first_seen': None, # Timestamp when a person first appears
            'last_seen': None,  # Timestamp when a person first disappears
        } for roi in rois
    }
    
    cap = cv2.VideoCapture(stream_url)
    if not cap.isOpened():
        log(f"FATAL: Could not open video stream at {stream_url}")
        sys.exit(1)

    while True:
        has_frame, frame = cap.read()
        if not has_frame:
            log("Stream ended or frame could not be read. Retrying in 5s...")
            time.sleep(5)
            cap.release()
            cap = cv2.VideoCapture(stream_url) # Attempt to reconnect
            continue

        h, w = frame.shape[:2]
        blob = cv2.dnn.blobFromImage(frame, 1/255.0, (416, 416), swapRB=True, crop=False)
        net.setInput(blob)
        layer_outputs = net.forward(output_layers)

        boxes, confidences, class_ids = [], [], []
        for output in layer_outputs:
            for detection in output:
                scores = detection[5:]
                class_id = np.argmax(scores)
                confidence = scores[class_id]
                if confidence > CONF_THRESHOLD and classes[class_id] == 'person':
                    center_x, center_y, box_w, box_h = (detection[0:4] * np.array([w, h, w, h])).astype('int')
                    x = int(center_x - (box_w / 2))
                    y = int(center_y - (box_h / 2))
                    boxes.append([x, y, int(box_w), int(box_h)])
                    confidences.append(float(confidence))
                    class_ids.append(class_id)
        
        indices = cv2.dnn.NMSBoxes(boxes, confidences, CONF_THRESHOLD, NMS_THRESHOLD)
        
        # Reset current frame detection status
        detected_in_chair = {roi['id']: False for roi in rois}

        if len(indices) > 0:
            for i in indices.flatten():
                box = boxes[i]
                for roi in rois:
                    if check_overlap(box, roi):
                        detected_in_chair[roi['id']] = True
                        break # A person can only be in one chair at a time

        # Update state machine for each chair
        for chair_id, state in chair_states.items():
            person_present_now = detected_in_chair[chair_id]

            if person_present_now and not state['person_detected']: # Person just appeared
                state['first_seen'] = time.time()
                state['last_seen'] = None
            elif not person_present_now and state['person_detected']: # Person just disappeared
                state['last_seen'] = time.time()
                state['first_seen'] = None

            state['person_detected'] = person_present_now
            
            # Trigger session start if person is present long enough
            if state['first_seen'] and not state['session_active']:
                if time.time() - state['first_seen'] > DETECTION_THRESHOLD_S:
                    if start_session(chair_id):
                        state['session_active'] = True

            # Trigger session end if person is absent long enough
            if state['last_seen'] and state['session_active']:
                 if time.time() - state['last_seen'] > DETECTION_THRESHOLD_S:
                    if end_session(chair_id):
                        state['session_active'] = False
        
        time.sleep(0.5) # Process ~2 frames per second to reduce CPU load

    cap.release()
    log("AI script finished.")
