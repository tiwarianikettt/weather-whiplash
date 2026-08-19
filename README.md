# 🌦️ Weather Whiplash

### AI-Powered Racing Track Condition Monitoring

Weather Whiplash is an AI-powered computer vision system designed to monitor racing-track conditions and detect changes in the track surface.

The system analyzes track images and videos to classify conditions such as **Dry, Damp, Wet, and Drying**, estimate prediction confidence, detect condition trends, and provide recommendations for track/tire management.

---

## 🚨 Problem

Weather conditions can change rapidly during a race or track session.

A track can transition from:

**Dry → Damp → Wet**

within a short period of time.

These changes can affect:

- 🛞 Tire selection
- 🏎️ Vehicle grip
- 🛑 Braking performance
- 🏁 Cornering performance
- 👨‍✈️ Driver safety
- 📊 Race strategy

Traditional weather information does not always represent the actual condition of the racing surface.

Weather Whiplash focuses on the **visual condition of the track itself**.

---

## 💡 Our Solution

Weather Whiplash uses computer vision to analyze visual track data and classify the surface condition.

### Input

The system accepts:

- 📷 Track images
- 🎥 Track videos

### Processing Pipeline

```text
Image / Video
      ↓
Frontend
      ↓
FastAPI Backend
      ↓
CLIP Vision Model
      ↓
Track Condition Classification
      ↓
Confidence Score
      ↓
Trend Detection
      ↓
Recommendation
      ↓
Interactive Dashboard