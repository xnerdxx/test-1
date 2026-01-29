from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import random
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============= MODELS =============

class SensorData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sensor_id: str
    moisture: float  # 0-100%
    ph: float  # 0-14
    temperature: float  # Celsius
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    location: str = "Andhra Pradesh"

class WeatherData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    district: str
    temperature: float
    humidity: float
    rainfall: float
    wind_speed: float
    description: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    message: str
    language: str = "en"  # en, te, hi
    response: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    session_id: str
    message: str
    language: str = "en"

class CropRecommendation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    crop_name: str
    crop_name_telugu: str
    crop_name_hindi: str
    suitable_ph_min: float
    suitable_ph_max: float
    moisture_requirement: str
    season: str
    expected_yield: str
    market_price: str

class YieldPrediction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    crop: str
    current_conditions: dict
    predicted_yield: str
    confidence: float
    recommendations: List[str]

class Farmer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    location: str
    farm_size: float  # in acres
    crops: List[str]
    sensors: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ============= SENSOR ENDPOINTS =============

@api_router.get("/sensors/live")
async def get_live_sensor_data():
    """Get simulated live sensor data"""
    sensors = [
        {
            "id": "sensor-001",
            "name": "Field A - North",
            "moisture": round(random.uniform(45, 75), 1),
            "ph": round(random.uniform(6.0, 7.5), 1),
            "temperature": round(random.uniform(25, 35), 1),
            "status": "active",
            "battery": random.randint(70, 100),
            "last_update": datetime.utcnow().isoformat()
        },
        {
            "id": "sensor-002",
            "name": "Field B - South",
            "moisture": round(random.uniform(50, 80), 1),
            "ph": round(random.uniform(5.8, 7.2), 1),
            "temperature": round(random.uniform(26, 34), 1),
            "status": "active",
            "battery": random.randint(60, 95),
            "last_update": datetime.utcnow().isoformat()
        },
        {
            "id": "sensor-003",
            "name": "Field C - East",
            "moisture": round(random.uniform(40, 70), 1),
            "ph": round(random.uniform(6.2, 7.8), 1),
            "temperature": round(random.uniform(24, 33), 1),
            "status": "active",
            "battery": random.randint(75, 100),
            "last_update": datetime.utcnow().isoformat()
        }
    ]
    return {"sensors": sensors, "total": len(sensors)}

@api_router.get("/sensors/{sensor_id}/history")
async def get_sensor_history(sensor_id: str, days: int = 7):
    """Get historical sensor data"""
    history = []
    for i in range(days * 24):  # Hourly data
        timestamp = datetime.utcnow() - timedelta(hours=i)
        history.append({
            "timestamp": timestamp.isoformat(),
            "moisture": round(random.uniform(50, 75), 1),
            "ph": round(random.uniform(6.0, 7.5), 1),
            "temperature": round(random.uniform(25, 35), 1)
        })
    return {"sensor_id": sensor_id, "history": list(reversed(history))}

# ============= WEATHER ENDPOINTS =============

@api_router.get("/weather")
async def get_weather_data(district: str = "Visakhapatnam"):
    """Get weather data for AP districts"""
    weather_conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain"]
    return {
        "district": district,
        "temperature": round(random.uniform(28, 38), 1),
        "humidity": round(random.uniform(60, 85), 1),
        "rainfall": round(random.uniform(0, 10), 1),
        "wind_speed": round(random.uniform(5, 20), 1),
        "description": random.choice(weather_conditions),
        "forecast": [
            {
                "day": (datetime.utcnow() + timedelta(days=i)).strftime("%A"),
                "temp_max": round(random.uniform(30, 38), 1),
                "temp_min": round(random.uniform(22, 28), 1),
                "description": random.choice(weather_conditions),
                "rainfall_chance": random.randint(10, 70)
            }
            for i in range(7)
        ]
    }

# ============= AI CHATBOT ENDPOINTS =============

@api_router.post("/chat")
async def chat_with_ai(request: ChatRequest):
    """AI Chatbot for agricultural advice"""
    try:
        # System message based on language
        system_messages = {
            "en": "You are KrishiMitra, an AI agricultural advisor helping farmers in Andhra Pradesh. Provide practical farming advice about soil health, crop selection, weather impacts, and yield optimization. Keep responses concise and actionable.",
            "te": "మీరు కృషి మిత్ర, ఆంధ్ర ప్రదేశ్ రైతులకు సహాయం చేస్తున్న AI వ్యవసాయ సలహాదారు. నేల ఆరోగ్యం, పంట ఎంపిక, వాతావరణ ప్రభావాలు మరియు దిగుబడి ఆప్టిమైజేషన్ గురించి ఆచరణాత్మక వ్యవసాయ సలహా అందించండి. సమాధానాలను సంక్షిప్తంగా మరియు చర్య తీసుకోగలిగేలా ఉంచండి.",
            "hi": "आप कृषि मित्र हैं, आंध्र प्रदेश में किसानों की मदद करने वाले AI कृषि सलाहकार। मिट्टी के स्वास्थ्य, फसल चयन, मौसम के प्रभाव और उपज अनुकूलन के बारे में व्यावहारिक कृषि सलाह प्रदान करें। जवाब संक्षिप्त और कार्रवाई योग्य रखें।"
        }
        
        system_message = system_messages.get(request.language, system_messages["en"])
        
        # Initialize chat
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=request.session_id,
            system_message=system_message
        ).with_model("openai", "gpt-5.2")
        
        # Send message
        user_message = UserMessage(text=request.message)
        response_text = await chat.send_message(user_message)
        
        # Try to store in database (non-critical)
        try:
            chat_record = ChatMessage(
                session_id=request.session_id,
                message=request.message,
                language=request.language,
                response=response_text
            )
            await db.chat_messages.insert_one(chat_record.dict())
        except Exception as db_error:
            logger.warning(f"Failed to save chat to DB (non-critical): {str(db_error)}")
        
        return {
            "success": True,
            "response": response_text,
            "session_id": request.session_id
        }
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    messages = await db.chat_messages.find({"session_id": session_id}).sort("timestamp", 1).to_list(100)
    return {"session_id": session_id, "messages": messages}

# ============= CROP RECOMMENDATIONS =============

@api_router.get("/crops/recommendations")
async def get_crop_recommendations(ph: float = 6.5, moisture: float = 65):
    """Get crop recommendations based on soil conditions"""
    crops = [
        {
            "crop_name": "Rice",
            "crop_name_telugu": "వరి",
            "crop_name_hindi": "चावल",
            "suitable_ph_min": 5.5,
            "suitable_ph_max": 7.0,
            "moisture_requirement": "High (70-80%)",
            "season": "Kharif (June-Oct)",
            "expected_yield": "2.5-3.5 tons/acre",
            "market_price": "₹2,000-2,500/quintal",
            "suitability_score": 0
        },
        {
            "crop_name": "Cotton",
            "crop_name_telugu": "పత్తి",
            "crop_name_hindi": "कपास",
            "suitable_ph_min": 6.0,
            "suitable_ph_max": 7.5,
            "moisture_requirement": "Medium (50-65%)",
            "season": "Kharif (May-Sep)",
            "expected_yield": "1.5-2.5 tons/acre",
            "market_price": "₹5,500-6,500/quintal",
            "suitability_score": 0
        },
        {
            "crop_name": "Chili",
            "crop_name_telugu": "మిరపకాయ",
            "crop_name_hindi": "मिर्च",
            "suitable_ph_min": 6.0,
            "suitable_ph_max": 7.0,
            "moisture_requirement": "Medium (55-70%)",
            "season": "Rabi (Oct-Mar)",
            "expected_yield": "1-1.5 tons/acre",
            "market_price": "₹8,000-12,000/quintal",
            "suitability_score": 0
        },
        {
            "crop_name": "Turmeric",
            "crop_name_telugu": "పసుపు",
            "crop_name_hindi": "हल्दी",
            "suitable_ph_min": 5.5,
            "suitable_ph_max": 7.5,
            "moisture_requirement": "High (65-75%)",
            "season": "Kharif (Jun-Sep)",
            "expected_yield": "2-3 tons/acre",
            "market_price": "₹7,000-9,000/quintal",
            "suitability_score": 0
        },
        {
            "crop_name": "Groundnut",
            "crop_name_telugu": "వేరుశెనగ",
            "crop_name_hindi": "मूंगफली",
            "suitable_ph_min": 6.0,
            "suitable_ph_max": 7.0,
            "moisture_requirement": "Low-Medium (45-60%)",
            "season": "Kharif/Rabi",
            "expected_yield": "1-1.5 tons/acre",
            "market_price": "₹5,000-6,000/quintal",
            "suitability_score": 0
        }
    ]
    
    # Calculate suitability scores
    for crop in crops:
        ph_score = 100 if crop["suitable_ph_min"] <= ph <= crop["suitable_ph_max"] else 50
        
        # Parse moisture requirement
        if "High" in crop["moisture_requirement"]:
            ideal_moisture = 70
        elif "Low" in crop["moisture_requirement"]:
            ideal_moisture = 50
        else:
            ideal_moisture = 60
        
        moisture_score = max(0, 100 - abs(moisture - ideal_moisture) * 2)
        
        crop["suitability_score"] = round((ph_score + moisture_score) / 2, 1)
    
    # Sort by suitability
    crops.sort(key=lambda x: x["suitability_score"], reverse=True)
    
    return {
        "current_conditions": {"ph": ph, "moisture": moisture},
        "recommendations": crops[:3],
        "all_crops": crops
    }

# ============= YIELD PREDICTIONS =============

@api_router.get("/yield/predict")
async def predict_yield(crop: str, moisture: float = 65, ph: float = 6.5, temperature: float = 30):
    """Predict crop yield based on conditions"""
    
    # Simplified prediction logic
    base_yields = {
        "Rice": 3.0,
        "Cotton": 2.0,
        "Chili": 1.25,
        "Turmeric": 2.5,
        "Groundnut": 1.25
    }
    
    base_yield = base_yields.get(crop, 2.0)
    
    # Adjust based on conditions
    moisture_factor = 1.0 if 60 <= moisture <= 75 else 0.85
    ph_factor = 1.0 if 6.0 <= ph <= 7.0 else 0.9
    temp_factor = 1.0 if 25 <= temperature <= 32 else 0.88
    
    predicted = base_yield * moisture_factor * ph_factor * temp_factor
    confidence = round(random.uniform(75, 92), 1)
    
    recommendations = []
    if moisture < 60:
        recommendations.append("Increase irrigation frequency")
    if ph < 6.0:
        recommendations.append("Add lime to increase pH")
    elif ph > 7.5:
        recommendations.append("Add organic matter to reduce pH")
    if temperature > 32:
        recommendations.append("Consider shade netting or mulching")
    
    if not recommendations:
        recommendations.append("Conditions are optimal, maintain current practices")
    
    return {
        "crop": crop,
        "predicted_yield": f"{predicted:.2f} tons/acre",
        "confidence": confidence,
        "current_conditions": {
            "moisture": moisture,
            "ph": ph,
            "temperature": temperature
        },
        "recommendations": recommendations
    }

# ============= DASHBOARD STATS =============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    return {
        "total_farmers": random.randint(450, 550),
        "active_sensors": 3,
        "average_yield_increase": "22%",
        "cost_savings": "₹16,500",
        "alerts": [
            {
                "type": "moisture",
                "message": "Field B moisture below optimal",
                "severity": "medium"
            },
            {
                "type": "weather",
                "message": "Rain expected in 2 days",
                "severity": "info"
            }
        ]
    }

# ============= ROOT ENDPOINT =============

@api_router.get("/")
async def root():
    return {
        "message": "KrishiMitra API",
        "version": "1.0",
        "endpoints": [
            "/api/sensors/live",
            "/api/weather",
            "/api/chat",
            "/api/crops/recommendations",
            "/api/yield/predict",
            "/api/dashboard/stats"
        ]
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
