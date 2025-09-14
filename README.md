# Barber Shop Session Monitor

This project is a full-stack web application designed to monitor haircut sessions in a barber shop remotely. It features a React frontend, a Node.js/Express backend, a MongoDB database, and a Python-based AI for real-time video analysis using OpenCV and YOLO.

## Features

-   **Real AI Detection**: Uses a YOLOv3 object detection model to automatically identify people in chair zones.
-   **Automated Session Tracking**: The AI automatically starts and stops sessions by calling the backend API.
-   **ROI Configuration**: Interactively define zones for each barber chair on a camera feed image.
-   **Live Dashboard**: View real-time session counts and status for each chair.
-   **AI Control Panel**: Start and stop the AI monitoring process and view live logs from the AI directly in the UI.
-   **Data Analytics**: Visualize daily, weekly, and monthly session trends with charts.
-   **Persistent Storage**: Session data is stored in a MongoDB database.

## Tech Stack

-   **Frontend**: React, TypeScript, Tailwind CSS, Recharts
-   **Backend**: Node.js, Express.js
-   **Database**: MongoDB
-   **AI / Computer Vision**: Python, OpenCV, YOLOv3-tiny
-   **Concurrency**: `concurrently` to run frontend and backend servers with one command.

## Prerequisites

Before you begin, ensure you have the following installed on your system:
-   [Node.js](https://nodejs.org/) (v16 or later recommended)
-   [npm](https://www.npmjs.com/) (usually comes with Node.js)
-   [Python](https://www.python.org/downloads/) (v3.8 or later recommended) and `pip`.
-   [MongoDB](https://www.mongodb.com/try/download/community): You need a running MongoDB instance.

### Running MongoDB with Docker (Recommended)
If you have Docker installed, you can start a MongoDB instance with this single command:
```bash
docker run --name mongodb -d -p 27017:27017 mongo
```

## Setup & Installation

Follow these steps to get the application running locally:

**1. Clone the repository** (if applicable) or ensure all files are in a single project folder.

**2. Install Node.js Dependencies**:
Install dependencies for the root, and for the backend.
```bash
# From the project root
npm install
cd backend
npm install
cd ..
```

**3. Set up the Python AI Environment**:

   **a. Install Python Dependencies**:
   Navigate to the `ai` directory and install the required packages using `pip`.
   ```bash
   # From the project root
   cd ai
   pip install -r requirements.txt
   cd ..
   ```

   **b. Download YOLOv3-tiny Model Files**:
   The AI requires the YOLOv3-tiny weights, config, and class names files. You must download them and place them inside the `ai/yolo` directory.
   
   -   **Weights File**: Download `yolov3-tiny.weights` from the official YOLO website or via command line:
       ```bash
       # From the project root, run this command:
       curl -L https://pjreddie.com/media/files/yolov3-tiny.weights -o ai/yolo/yolov3-tiny.weights
       ```
   -   **Config File**: Download `yolov3-tiny.cfg`:
       ```bash
       # From the project root, run this command:
       curl -L https://raw.githubusercontent.com/pjreddie/darknet/master/cfg/yolov3-tiny.cfg -o ai/yolo/yolov3-tiny.cfg
       ```
   -   **Names File**: Download `coco.names`:
       ```bash
       # From the project root, run this command:
       curl -L https://raw.githubusercontent.com/pjreddie/darknet/master/data/coco.names -o ai/yolo/coco.names
       ```
   
   After downloading, your `ai/yolo` directory should contain these three files.

**4. Configure Backend Environment**:
Inside the `backend` directory, rename `.env.example` to `.env`. The default values are configured to work with a local MongoDB instance.
```bash
# From the project's root directory:
mv backend/.env.example backend/.env
```

## Application Configuration

Edit the `config.json` file to configure chairs and the camera feed.
- `dvrStreamUrl`: **Set the URL for your camera feed.** See the "Connecting to a Real Camera" section.
- `chairs`: Add or remove chair objects. The `roi` property is populated automatically by the UI.

## Running the Application

Once installation and configuration are complete, start the application with a single command from the **root directory**:

```bash
npm start
```
This command starts both the Node.js backend and the React frontend. Open your browser to the URL provided by the Vite server (usually `http://localhost:5173`).

### Using the AI
1.  On first run, you will be prompted to define the zones for each chair. Draw a rectangle for each one and click "Continue".
2.  You will be taken to the dashboard. The AI is initially **inactive**.
3.  In the **AI Control Panel**, click **"Start AI Monitoring"**.
4.  The backend will launch the Python script. You will see logs appearing in the panel, indicating whether a person is detected in each zone.
5.  When the AI detects a person in a chair for a few seconds, it will automatically start a session. When the person leaves, it will end the session. The dashboard charts and history will update in real-time.

## Connecting to a Real Camera

This application is designed to work with a live video feed from a DVR or IP camera.

1.  **Get your Camera's Stream URL**: Access your DVR's network settings to find its RTSP, MJPEG, or HLS stream URL. The AI backend can handle most formats recognized by OpenCV, but **RTSP or direct HTTP links to video files/streams are most common**.
2.  **Update `config.json`**: Replace the default `dvrStreamUrl` with your camera's actual stream URL.

    ```json
    {
      "dvrStreamUrl": "rtsp://admin:password@192.168.1.108:554/cam/realmonitor?channel=1&subtype=0",
      "chairs": [ ... ]
    }
    ```
The application will now use your live camera feed for both the ROI setup and the AI analysis.
