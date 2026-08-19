from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from PIL import Image
from transformers import pipeline

import io
import cv2
import tempfile
import os


# =====================================================
# FASTAPI
# =====================================================

app = FastAPI(
    title="Weather Whiplash API",
    description="AI-powered track condition analysis",
    version="1.0"
)


# =====================================================
# CORS
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# LOAD AI MODEL
# =====================================================

print("Loading AI model...")

classifier = pipeline(
    "zero-shot-image-classification",
    model="openai/clip-vit-base-patch32"
)

print("AI model loaded successfully!")


# =====================================================
# CONDITION LABELS
# =====================================================

LABELS = [
    "a dry racing track",
    "a damp racing track",
    "a wet racing track",
    "a drying racing track"
]


LABEL_MAP = {
    "a dry racing track": "dry",
    "a damp racing track": "damp",
    "a wet racing track": "wet",
    "a drying racing track": "drying"
}


# =====================================================
# HOME
# =====================================================

@app.get("/")
def home():

    return {
        "status": "online",
        "message": "Weather Whiplash API is running"
    }


# =====================================================
# ANALYZE SINGLE IMAGE
# =====================================================

@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):

    # Read uploaded image
    contents = await file.read()

    image = Image.open(
        io.BytesIO(contents)
    ).convert("RGB")


    # AI prediction
    predictions = classifier(
        image,
        candidate_labels=LABELS
    )


    best = predictions[0]


    condition = LABEL_MAP[
        best["label"]
    ]

    confidence = float(
        best["score"]
    )


    # Recommendation
    recommendation, recommendation_text = (
        get_recommendation(condition)
    )


    return {

        "condition": condition,

        "confidence": confidence,

        "trend": "stable",

        "recommendation": recommendation,

        "recommendationText":
            recommendation_text,

        "frames": [
            [
                "00:00",
                condition,
                confidence
            ]
        ]

    }


# =====================================================
# ANALYZE VIDEO
# =====================================================

@app.post("/analyze-video")
async def analyze_video(
    file: UploadFile = File(...)
):

    # -------------------------------------------------
    # Save uploaded video temporarily
    # -------------------------------------------------

    video_bytes = await file.read()

    temp_file = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".mp4"
    )

    temp_file.write(video_bytes)

    temp_file.close()

    video_path = temp_file.name


    # -------------------------------------------------
    # Open video
    # -------------------------------------------------

    cap = cv2.VideoCapture(
        video_path
    )


    if not cap.isOpened():

        os.remove(video_path)

        return {
            "error": "Could not open video"
        }


    fps = cap.get(
        cv2.CAP_PROP_FPS
    )

    total_frames = int(
        cap.get(
            cv2.CAP_PROP_FRAME_COUNT
        )
    )

    duration = (
        total_frames / fps
        if fps > 0
        else 0
    )


    # -------------------------------------------------
    # Decide frame interval
    #
    # For the hackathon MVP we analyze
    # approximately one frame every 2 seconds.
    # -------------------------------------------------

    interval = 2

    current_time = 0

    analyzed_frames = []


    while current_time < duration:

        cap.set(
            cv2.CAP_PROP_POS_MSEC,
            current_time * 1000
        )


        success, frame = cap.read()


        if not success:
            break


        # OpenCV uses BGR
        # PIL uses RGB

        frame_rgb = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )


        image = Image.fromarray(
            frame_rgb
        )


        # -------------------------------------------------
        # AI prediction
        # -------------------------------------------------

        predictions = classifier(
            image,
            candidate_labels=LABELS
        )


        best = predictions[0]


        condition = LABEL_MAP[
            best["label"]
        ]

        confidence = float(
            best["score"]
        )


        # Convert seconds to MM:SS

        minutes = int(
            current_time // 60
        )

        seconds = int(
            current_time % 60
        )

        timestamp = (
            f"{minutes:02d}:{seconds:02d}"
        )


        analyzed_frames.append(
            [
                timestamp,
                condition,
                confidence
            ]
        )


        current_time += interval


    cap.release()

    os.remove(video_path)


    # -------------------------------------------------
    # Safety check
    # -------------------------------------------------

    if not analyzed_frames:

        return {
            "error":
                "No frames could be analyzed"
        }


    # -------------------------------------------------
    # Calculate trend
    # -------------------------------------------------

    conditions = [

        frame[1]

        for frame in analyzed_frames

    ]


    trend = calculate_trend(
        conditions
    )


    # -------------------------------------------------
    # Current condition
    # -------------------------------------------------

    latest = analyzed_frames[-1]

    final_condition = latest[1]

    final_confidence = latest[2]


    # -------------------------------------------------
    # Recommendation
    # -------------------------------------------------

    recommendation, recommendation_text = (
        get_recommendation(
            final_condition,
            trend
        )
    )


    # -------------------------------------------------
    # Return result
    # -------------------------------------------------

    return {

        "condition":
            final_condition,

        "confidence":
            final_confidence,

        "trend":
            trend,

        "recommendation":
            recommendation,

        "recommendationText":
            recommendation_text,

        "frames":
            analyzed_frames

    }


# =====================================================
# TREND CALCULATION
# =====================================================

def calculate_trend(conditions):

    if len(conditions) < 2:

        return "stable"


    levels = {

        "dry": 0,

        "drying": 1,

        "damp": 2,

        "wet": 3

    }


    values = [

        levels.get(
            condition,
            1
        )

        for condition in conditions

    ]


    first = values[0]

    last = values[-1]


    difference = last - first


    if difference >= 1:

        return "worsening"


    elif difference <= -1:

        return "improving"


    else:

        return "stable"


# =====================================================
# RECOMMENDATION
# =====================================================

def get_recommendation(
    condition,
    trend="stable"
):

    if (
        condition == "wet"
        and trend == "worsening"
    ):

        return (

            "Consider tire change soon",

            "Track conditions are becoming "
            "wetter. Consider changing tires "
            "or preparing for wet conditions."

        )


    if condition == "wet":

        return (

            "Consider tire change soon",

            "The track appears wet. Monitor "
            "the condition closely and "
            "consider a tire change."

        )


    if (
        condition == "damp"
        and trend == "worsening"
    ):

        return (

            "Monitor conditions closely",

            "The track is becoming wetter. "
            "Conditions may change quickly."

        )


    if condition == "damp":

        return (

            "Monitor conditions closely",

            "Moisture is present on the track. "
            "Continue monitoring conditions."

        )


    if condition == "drying":

        return (

            "Track is drying",

            "The track appears to be "
            "transitioning toward dry "
            "conditions."

        )


    return (

        "No tire change recommended",

        "The track appears dry under "
        "the current visual analysis."

    )