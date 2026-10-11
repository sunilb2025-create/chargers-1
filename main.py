
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal

from data_processing import process_home_data
app = FastAPI(
    title="Eco-Aera Green Home Analyzer",
    description="Analyze home energy efficiency and sustainability.",
    version="1.0.0"
)

# Enable frontend-to-backend requests during development.
# Restrict allowed origins before deploying publicly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# 1. HOME INPUT MODEL
# --------------------------------------------------

class HomeData(BaseModel):
    home_type: Literal[
        "apartment", "independent", "villa", "rowhouse"
    ] = "independent"

    monthly_bill: float = Field(ge=0, le=10000000)
    
    monthly_kwh: float = Field(gt=0, le=10000000)

    area_sq_m: float = Field(gt=0, le=1000000)
    building_age: int = Field(ge=0, le=300)
    occupants: int = Field(ge=1, le=1000)

    daylight: int = Field(ge=0, le=100)
    ventilation: int = Field(ge=0, le=100)

    roof_insulation: int = Field(ge=0, le=100)
    wall_insulation: int = Field(ge=0, le=100)

    heating_efficiency: int = Field(ge=0, le=100)
    window_quality: int = Field(ge=0, le=100)

    appliance_efficiency: int = Field(ge=0, le=100)
    lighting_efficiency: int = Field(ge=0, le=100)

    renewable_percent: int = Field(ge=0, le=100)
    smart_management: int = Field(ge=0, le=100)


# --------------------------------------------------
# 2. API HOME PAGE
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "project": "Eco-Aera Green Home Analyzer",
        "status": "running",
        "message": "Backend is ready to analyze home data."
    }


# --------------------------------------------------
# 3. ANALYSIS ENDPOINT
# --------------------------------------------------

@app.post("/analyze")

def analyze_home(home: HomeData):
    return process_home_data(home)

    