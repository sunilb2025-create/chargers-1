
"""
Eco-Aera Green Home Analyzer
Data preparation and scoring module.

This module:
1. Prepares validated HomeData inputs.
2. Calculates energy intensity.
3. Calculates the seven weighted score components.
4. Classifies the final green-home score.
5. Generates preliminary retrofit recommendations.

The consumption benchmark and savings assumption are provisional.
They must be validated against appropriate building-energy data.
"""

from typing import Any


# ---------------------------------------------------------
# 1. PROBLEM STATEMENT: OFFICIAL COMPONENT WEIGHTS
# ---------------------------------------------------------

SCORE_WEIGHTS = {
    "energy_efficiency": 0.25,
    "consumption_score": 0.20,
    "insulation": 0.15,
    "heating_system": 0.15,
    "windows_glazing": 0.10,
    "renewable_energy": 0.10,
    "smart_energy_management": 0.05,
}

# This is a provisional normalization benchmark, not an
# official or certified building-energy standard.
CONSUMPTION_BENCHMARK_KWH_M2_YEAR = 300.0

# Kept only for compatibility with the current frontend.
# It is an illustrative assumption, not a measured prediction.
ILLUSTRATIVE_SAVINGS_RATE = 0.10


# ---------------------------------------------------------
# 2. HELPER FUNCTIONS
# ---------------------------------------------------------

def clamp(value: float, minimum: float = 0,
          maximum: float = 100) -> float:
    """Keep a score within its permitted range."""
    return max(minimum, min(maximum, float(value)))


def rounded(value: float, digits: int = 2) -> float:
    """Round numeric results consistently."""
    return round(float(value), digits)


def classify_score(score: float) -> str:
    """Classify the final score using the problem statement."""
    if score >= 80:
        return "Highly efficient"
    if score >= 65:
        return "Good"
    if score >= 50:
        return "Moderate"
    if score >= 30:
        return "Poor"
    return "Very poor"


def prepare_input(home: Any) -> dict:
    """
    Convert the validated Pydantic HomeData object into a
    clean dictionary for calculations.
    """
    return {
        "home_type": home.home_type,
        "monthly_bill": max(0.0, float(home.monthly_bill)),
        "monthly_kwh": max(0.0, float(home.monthly_kwh)),
        "area_sq_m": max(0.01, float(home.area_sq_m)),
        "building_age": max(0, int(home.building_age)),
        "occupants": max(1, int(home.occupants)),
        "daylight": clamp(home.daylight),
        "ventilation": clamp(home.ventilation),
        "roof_insulation": clamp(home.roof_insulation),
        "wall_insulation": clamp(home.wall_insulation),
        "heating_efficiency": clamp(home.heating_efficiency),
        "window_quality": clamp(home.window_quality),
        "appliance_efficiency": clamp(home.appliance_efficiency),
        "lighting_efficiency": clamp(home.lighting_efficiency),
        "renewable_percent": clamp(home.renewable_percent),
        "smart_management": clamp(home.smart_management),
    }


# ---------------------------------------------------------
# 3. FEATURE ENGINEERING / DATA PROCESSING
# ---------------------------------------------------------

def calculate_features(data: dict) -> dict:
    """
    Derive features from the submitted home profile.
    All consumption values use the same annual basis.
    """

    annual_energy_kwh = data["monthly_kwh"] * 12

    consumption_intensity = (
        annual_energy_kwh / data["area_sq_m"]
    )

    # Average of roof and wall insulation.
    insulation_score = (
        data["roof_insulation"]
        + data["wall_insulation"]
    ) / 2

    # Provisional feature score for the energy-efficiency
    # component. Its internal weights sum to 1.
    energy_efficiency_score = (
        data["appliance_efficiency"] * 0.35
        + data["lighting_efficiency"] * 0.25
        + data["daylight"] * 0.20
        + data["ventilation"] * 0.20
    )

    # Higher energy intensity produces a lower score.
    # 0 intensity -> 100; benchmark or higher -> 0.
    consumption_score = 100 * (
        1 - consumption_intensity
        / CONSUMPTION_BENCHMARK_KWH_M2_YEAR
    )
    consumption_score = clamp(consumption_score)

    return {
        "annual_energy_kwh": annual_energy_kwh,
        "consumption_kwh_m2_year": consumption_intensity,
        "energy_efficiency": clamp(energy_efficiency_score),
        "consumption_score": consumption_score,
        "insulation": clamp(insulation_score),
        "heating_system": clamp(data["heating_efficiency"]),
        "windows_glazing": clamp(data["window_quality"]),
        "renewable_energy": clamp(data["renewable_percent"]),
        "smart_energy_management": clamp(data["smart_management"]),
    }


# ---------------------------------------------------------
# 4. GREEN HOME SCORE
# ---------------------------------------------------------

def calculate_green_home_score(features: dict) -> float:
    """
    Weighted sum of seven component scores.

    Final score = sum(component score * component weight).
    All seven component weights sum to 1.00.
    """

    total = sum(
        features[component] * weight
        for component, weight in SCORE_WEIGHTS.items()
    )

    return rounded(clamp(total), 1)


# ---------------------------------------------------------
# 5. RETROFIT RECOMMENDATIONS
# ---------------------------------------------------------

def generate_recommendations(data: dict,
                             features: dict) -> list[str]:
    """Create initial rule-based recommendations."""

    recommendations = []

    if data["roof_insulation"] < 60:
        recommendations.append(
            "Roof insulation: assess suitable insulation "
            "options to reduce heat transfer through the roof."
        )

    if data["wall_insulation"] < 60:
        recommendations.append(
            "Wall insulation: assess wall insulation or "
            "other suitable measures for the local climate."
        )

    if data["window_quality"] < 60:
        recommendations.append(
            "Windows and glazing: check air leaks and consider "
            "suitable glazing improvements."
        )

    if data["heating_efficiency"] < 60:
        recommendations.append(
            "Heating system: review the existing system and "
            "compare efficient alternatives suitable for the home."
        )

    if data["appliance_efficiency"] < 60:
        recommendations.append(
            "Appliances: consider efficient replacements when "
            "existing appliances need replacement."
        )

    if data["lighting_efficiency"] < 60:
        recommendations.append(
            "Lighting: consider replacing inefficient bulbs "
            "with suitable LED lighting."
        )

    if data["renewable_percent"] < 20:
        recommendations.append(
            "Renewable energy: assess rooftop solar suitability, "
            "available roof area and installation costs."
        )

    if data["smart_management"] < 50:
        recommendations.append(
            "Smart energy management: consider energy monitoring "
            "and scheduling to understand and manage consumption."
        )

    if not recommendations:
        recommendations.append(
            "The entered feature ratings are relatively strong. "
            "Use actual bills and measured energy data to identify "
            "additional improvement opportunities."
        )

    return recommendations


# ---------------------------------------------------------
# 6. MAIN DATA-PROCESSING FUNCTION
# ---------------------------------------------------------

def process_home_data(home: Any) -> dict:
    """
    Main function imported and called by main.py.
    Returns the analysis fields consumed by the frontend.
    """

    data = prepare_input(home)
    features = calculate_features(data)

    green_home_score = calculate_green_home_score(features)
    score_classification = classify_score(green_home_score)

    recommendations = generate_recommendations(data, features)

    # This value preserves the existing frontend contract.
    # It is NOT a validated estimate of retrofit savings.
    illustrative_monthly_savings = (
        data["monthly_bill"] * ILLUSTRATIVE_SAVINGS_RATE
    )

    # A transparent warning when the submitted consumption
    # baseline is zero or unavailable.
    data_quality_warnings = []

    if data["monthly_kwh"] <= 0:
        data_quality_warnings.append(
            "Monthly energy consumption is zero or unavailable; "
            "consumption-based scoring needs review."
        )

    if data["monthly_bill"] == 0 and data["monthly_kwh"] > 0:
        data_quality_warnings.append(
            "A positive energy use with a zero bill should be "
            "checked against the actual tariff or billing arrangement."
        )

    return {
        # Existing frontend fields
        "green_home_score": green_home_score,
        "energy_efficiency": rounded(features["energy_efficiency"], 1),
        "consumption_kwh_m2_year": rounded(
            features["consumption_kwh_m2_year"], 2
        ),
        "consumption_score": rounded(features["consumption_score"], 1),
        "insulation": rounded(features["insulation"], 1),
        "heating_system": rounded(features["heating_system"], 1),
        "windows_glazing": rounded(features["windows_glazing"], 1),
        "renewable_energy": rounded(features["renewable_energy"], 1),
        "smart_energy_management": rounded(
            features["smart_energy_management"], 1
        ),
        "monthly_bill": rounded(data["monthly_bill"], 2),
        "estimated_monthly_savings": rounded(
            illustrative_monthly_savings, 2
        ),
        "recommendations": recommendations,

        # Additional processed data for future features
        "score_classification": score_classification,
        "annual_energy_kwh": rounded(features["annual_energy_kwh"], 2),
        "score_weights": SCORE_WEIGHTS,
        "data_quality_warnings": data_quality_warnings,

        "notice": (
            "Green Home Score uses the seven specified component "
            "weights. Energy-intensity normalization is provisional. "
            "The savings figure is an illustrative 10% bill assumption, "
            "not a validated retrofit prediction. Validate scores and "
            "retrofit estimates against appropriate building-energy data."
        ),
    }
