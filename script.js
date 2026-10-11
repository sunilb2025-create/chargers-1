
/* ============================================================
   ECO-AERA — GREEN HOME ANALYZER
   File: script.js
   Purpose:
   1. Read the property profile and building conditions.
   2. Validate user inputs.
   3. Estimate energy performance and green-home score.
   4. Display personalized recommendations.
   5. Draw charts only after form submission.
   ============================================================ */

"use strict";

function conditionToScore(value) {
    const scores = {
        "poor": 25,
        "average": 60,
        "good": 80,
        "excellent": 95,
        "none": 20,
        "basic": 50,
        "low": 30,
        "mixed": 60,
        "high": 90,
        "incandescent": 25,
        "cfl": 60,
        "led": 95,
        "planned": 25,
        "partial": 60,
        "installed": 100
    };

    const normalized = String(value).trim().toLowerCase();

    if (scores[normalized] !== undefined) {
        return scores[normalized];
    }

    const number = Number(value);

    if (Number.isFinite(number) && number >= 0 && number <= 100) {
        return Math.round(number);
    }

    return 60;
}



/* ============================================================
   2. DOM HELPERS
   ============================================================ */

function findElement(selectors, parent = document) {
    for (const selector of selectors) {
        const element = parent.querySelector(selector);
        if (element) return element;
    }

    return null;
}

function findAll(selectors, parent = document) {
    for (const selector of selectors) {
        const elements = parent.querySelectorAll(selector);

        if (elements.length > 0) {
            return Array.from(elements);
        }
    }

    return [];
}

function getMainContainer() {
    return findElement([
        "main",
        ".main-content",
        ".main",
        ".dashboard-content",
        "#mainContent"
    ]) || document.body;
}

function getAnalysisForm() {
    return findElement([
        "#homeForm",
        "#analyzerForm",
        "#greenHomeForm",
        "#propertyForm",
        "form[data-home-form]",
        "form"
    ]);
}

function normalizeText(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function toNumber(value) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : NaN;
    }

    const cleaned = String(value ?? "")
        .replace(/,/g, "")
        .replace(/[₹$€£]/g, "")
        .trim();

    if (cleaned === "") return NaN;

    const number = Number(cleaned);
    return Number.isFinite(number) ? number : NaN;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function round(value, decimalPlaces = 1) {
    const multiplier = 10 ** decimalPlaces;
    return Math.round(value * multiplier) / multiplier;
}

function formatNumber(value, decimals = 0) {
    return Number(value).toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatMoney(value) {
    return "₹" + formatNumber(value, 0);
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined && text !== null) {
        element.textContent = text;
    }

    return element;
}


/* ============================================================
   3. INPUT FIELD DETECTION
   ============================================================ */

const FIELD_ALIASES = {
    propertyType: [
        "propertyType",
        "property_type",
        "homeType",
        "home_type",
        "houseType",
        "house_type",
        "buildingType",
        "building_type"
    ],

    monthlyBill: [
        "monthlyBill",
        "monthly_bill",
        "electricityBill",
        "electricity_bill",
        "bill",
        "energyBill"
    ],

    area: [
        "area",
        "floorArea",
        "floor_area",
        "houseArea",
        "house_area",
        "builtUpArea",
        "built_up_area"
    ],

    buildingAge: [
        "buildingAge",
        "building_age",
        "houseAge",
        "house_age",
        "age"
    ],

    occupants: [
        "occupants",
        "occupantCount",
        "occupant_count",
        "people",
        "residents"
    ],

    daylight: [
        "daylight",
        "naturalDaylight",
        "natural_daylight",
        "daylightLevel"
    ],

    ventilation: [
        "ventilation",
        "naturalVentilation",
        "natural_ventilation",
        "ventilationLevel"
    ],

    roofInsulation: [
        "roofInsulation",
        "roof_insulation",
        "roof",
        "roofCondition"
    ],

    wallInsulation: [
        "wallInsulation",
        "wall_insulation",
        "wall",
        "wallCondition"
    ],

    applianceEfficiency: [
        "applianceEfficiency",
        "appliance_efficiency",
        "appliances",
        "applianceRating"
    ],

    lightingType: [
        "lightingType",
        "lighting_type",
        "lighting",
        "lightType"
    ],

    solarEnergy: [
        "solarEnergy",
        "solar_energy",
        "solar",
        "solarInstalled",
        "solar_installed"
    ]
};

function findInput(fieldName, form) {
    const aliases = FIELD_ALIASES[fieldName] || [fieldName];

    for (const alias of aliases) {
        const escaped = CSS.escape(alias);

        const input = form.querySelector(
            `[name="${escaped}"], #${escaped}`
        );

        if (input) return input;
    }

    return null;
}

function readInput(fieldName, form) {
    const input = findInput(fieldName, form);

    if (!input) return "";

    if (input.type === "checkbox") {
        return input.checked ? "yes" : "no";
    }

    if (input.type === "radio") {
        const checked = form.querySelector(
            `input[name="${CSS.escape(input.name)}"]:checked`
        );

        return checked ? checked.value : "";
    }

    return String(input.value ?? "").trim();
}

function readNumber(fieldName, form) {
    return toNumber(readInput(fieldName, form));
}
function readPropertyProfile(form) {
    return {
        propertyType: readInput("homeType", form),
        monthlyBill: readNumber("electricityBill", form),
        monthlyKwh: readNumber("monthlyKwh", form),
        area: readNumber("homeArea", form),
        buildingAge: readNumber("homeAge", form),
        occupants: readNumber("occupants", form)
    };
}


function readBuildingConditions(form) {
    return {
        daylight: conditionToScore(readInput("daylight", form)),
        ventilation: conditionToScore(readInput("ventilation", form)),
        roofInsulation: conditionToScore(readInput("roofInsulation", form)),
        wallInsulation: conditionToScore(readInput("wallInsulation", form)),
        
        windowQuality: conditionToScore(readInput("windowQuality", form)),
      
        
        heatingEfficiency: (() => {
    const cooling = readInput("cooling", form);
    const scores = {
        fans: 90,
        mixed: 60,
        ac: 35
    };
    return scores[cooling] ?? 60;
})(),

        applianceEfficiency: conditionToScore(readInput("appliances", form)),
        lightingType: conditionToScore(readInput("lighting", form)),
        solarEnergy: (() => {
            const solar = readInput("solar", form);
            const renewablePercent = {
                none: 0,
                planned: 0,
                partial: 25,
                installed: 100
            };
            return renewablePercent[solar] ?? 0;
        })(),smartManagement: (() => {
    const level = readInput("smartManagement", form);
    const scores = {
        none: 0,
        basic: 50,
        advanced: 90
    };
    return scores[level] ?? 50;
})()
    };
}




/* ============================================================
   4. VALIDATION
   ============================================================ */

function validateInputs(profile, conditions) {
    const errors = [];

    if (!profile.propertyType) {
        errors.push("Please select a property or building type.");
    }

    if (!Number.isFinite(profile.monthlyBill) ||
        profile.monthlyBill <= 0) {
        errors.push("Enter a monthly electricity bill greater than zero.");
    }

    if (!Number.isFinite(profile.area) || profile.area <= 0) {
        errors.push("Enter a valid property area greater than zero.");
    }

    if (!Number.isFinite(profile.buildingAge) ||
        profile.buildingAge < 0) {
        errors.push("Enter a valid building age.");
    }

    if (!Number.isFinite(profile.occupants) ||
        profile.occupants < 1 ||
        !Number.isInteger(profile.occupants)) {
        errors.push("Enter at least one occupant as a whole number.");
    }

    const requiredConditions = [
        ["daylight", "Select the natural daylight condition."],
        ["ventilation", "Select the natural ventilation condition."],
        ["roofInsulation", "Select the roof insulation condition."],
        ["wallInsulation", "Select the wall insulation condition."],
        ["applianceEfficiency", "Select the appliance efficiency."],
        ["lightingType", "Select the lighting type."],
        ["solarEnergy", "Specify whether solar energy is installed."]
    ];

    for (const [key, message] of requiredConditions) {
        if (!String(conditions[key] ?? "").trim()) {
            errors.push(message);
        }
    }

    return errors;
}

function showValidationErrors(errors) {
    let errorBox = document.querySelector("#ecoValidationErrors");

    if (!errorBox) {
        errorBox = createElement("div", "eco-validation-errors");
        errorBox.id = "ecoValidationErrors";
        errorBox.setAttribute("role", "alert");

        const form = getAnalysisForm();

        if (form) {
            form.prepend(errorBox);
        } else {
            document.body.prepend(errorBox);
        }
    }

    errorBox.replaceChildren();

    if (errors.length === 0) {
        errorBox.hidden = true;
        return;
    }

    errorBox.hidden = false;

    const heading = createElement(
        "strong",
        "",
        "Please correct the following:"
    );

    const list = createElement("ul");

    errors.forEach(message => {
        list.appendChild(createElement("li", "", message));
    });

    errorBox.append(heading, list);
    errorBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


/* ============================================================
   5. CONDITION SCORING
   ============================================================ */

function scoreCondition(value, type) {
    const text = normalizeText(value);

    const ratings = {
        daylight: {
            excellent: 100,
            high: 100,
            good: 85,
            adequate: 70,
            moderate: 60,
            average: 60,
            medium: 60,
            low: 30,
            poor: 20,
            limited: 25
        },

        ventilation: {
            excellent: 100,
            good: 85,
            adequate: 70,
            moderate: 60,
            average: 60,
            medium: 60,
            poor: 25,
            low: 30,
            limited: 25,
            natural: 85,
            "cross ventilation": 100,
            mechanical: 55,
            "no ventilation": 10
        },

        insulation: {
            excellent: 100,
            good: 85,
            adequate: 70,
            moderate: 55,
            average: 55,
            medium: 55,
            poor: 20,
            low: 20,
            none: 10,
            "well insulated": 100,
            insulated: 85,
            "not insulated": 10
        },

        appliance: {
            excellent: 100,
            efficient: 90,
            "high efficiency": 100,
            "5 star": 100,
            "5-star": 100,
            "4 star": 85,
            "4-star": 85,
            "3 star": 65,
            "3-star": 65,
            average: 55,
            moderate: 55,
            "2 star": 35,
            "2-star": 35,
            "1 star": 20,
            "1-star": 20,
            inefficient: 20,
            poor: 20
        },

        lighting: {
            led: 100,
            "led lighting": 100,
            "energy saving": 85,
            "energy-saving": 85,
            cfl: 65,
            fluorescent: 55,
            incandescent: 20,
            halogen: 25,
            mixed: 60
        },

        solar: {
            yes: 100,
            installed: 100,
            true: 100,
            "available": 100,
            no: 0,
            none: 0,
            false: 0,
            "not installed": 0
        }
    };

    const table = ratings[type] || {};

    if (Object.prototype.hasOwnProperty.call(table, text)) {
        return table[text];
    }

    // Handle values such as "Good condition" or "5 Star Rating".
    for (const [keyword, score] of Object.entries(table)) {
        if (text.includes(keyword)) {
            return score;
        }
    }

    // Unknown custom choices receive a neutral score.
    return 50;
}

function calculateConditionScores(conditions) {
    return {
        daylight: scoreCondition(conditions.daylight, "daylight"),
        ventilation: scoreCondition(
            conditions.ventilation,
            "ventilation"
        ),
        roofInsulation: scoreCondition(
            conditions.roofInsulation,
            "insulation"
        ),
        wallInsulation: scoreCondition(
            conditions.wallInsulation,
            "insulation"
        ),
        applianceEfficiency: scoreCondition(
            conditions.applianceEfficiency,
            "appliance"
        ),
        lighting: scoreCondition(conditions.lightingType, "lighting"),
        solar: scoreCondition(conditions.solarEnergy, "solar")
    };
}


/* ============================================================
   6. ENERGY ESTIMATION
   ============================================================ */

function estimateBaselineEnergy(profile) {
    /*
       The baseline is a simplified estimate.

       For a real assessment, replace this formula with the
       applicable regional benchmark or data from your PDF.
    */

    const baseline = profile.area *
        EcoAera.defaults.baselineKwhPerSqm;

    return Math.max(1, baseline);
}

function estimateActualEnergy(profile, conditions, scores) {
    /*
       Estimate electricity from the user's bill and an assumed
       electricity rate. This is an approximation, not a meter
       reading or a building energy audit.
    */

    const estimatedMonthlyKwh =
        profile.monthlyBill / EcoAera.defaults.electricityRate;

    const daylightSavings =
        scores.daylight / 100 *
        EcoAera.defaults.daylightSavings;

    const ventilationSavings =
        scores.ventilation / 100 *
        EcoAera.defaults.ventilationSavings;

    const roofSavings =
        scores.roofInsulation / 100 *
        EcoAera.defaults.insulationSavings;

    const wallSavings =
        scores.wallInsulation / 100 *
        EcoAera.defaults.insulationSavings;

    const applianceSavings =
        scores.applianceEfficiency / 100 *
        EcoAera.defaults.applianceSavings;

    const lightingSavings =
        scores.lighting / 100 *
        EcoAera.defaults.lightingSavings;

    const solarSavings =
        scores.solar > 0
            ? EcoAera.defaults.solarOffset
            : 0;

    const efficiencyFactor = clamp(
        1 -
        daylightSavings -
        ventilationSavings -
        roofSavings -
        wallSavings -
        applianceSavings -
        lightingSavings,
        0.30,
        1
    );

    const estimatedEfficientEnergy =
        estimatedMonthlyKwh * efficiencyFactor;

    const estimatedGridEnergy =
        estimatedEfficientEnergy * (1 - solarSavings);

    return {
        baselineKwh: estimateBaselineEnergy(profile),
        estimatedMonthlyKwh: round(estimatedMonthlyKwh, 1),
        estimatedEfficientEnergy: round(estimatedEfficientEnergy, 1),
        estimatedGridEnergy: round(
            Math.max(0, estimatedGridEnergy),
            1
        ),
        efficiencyFactor: round(efficiencyFactor, 3),
        solarSavingsFactor: solarSavings
    };
}


/* ============================================================
   7. GREEN-HOME SCORE
   ============================================================ */

function calculateGreenScore(profile, conditions, scores) {
    /*
       The score is a project demonstration score, not an
       official certification such as LEED, IGBC or GRIHA.
    */

    const weights = {
        daylight: 10,
        ventilation: 10,
        roofInsulation: 12,
        wallInsulation: 12,
        applianceEfficiency: 20,
        lighting: 12,
        solar: 14,
        areaPerOccupant: 5,
        buildingAge: 5
    };

    const areaPerOccupant =
        profile.area / profile.occupants;

    let occupancyScore = 50;

    if (areaPerOccupant >= 10 && areaPerOccupant <= 40) {
        occupancyScore = 85;
    } else if (areaPerOccupant > 40) {
        occupancyScore = 75;
    } else if (areaPerOccupant >= 5) {
        occupancyScore = 65;
    } else {
        occupancyScore = 40;
    }

    // Building age alone does not determine sustainability.
    // This factor is deliberately given a small weight.
    let ageScore = 70;

    if (profile.buildingAge <= 5) {
        ageScore = 80;
    } else if (profile.buildingAge <= 15) {
        ageScore = 75;
    } else if (profile.buildingAge <= 30) {
        ageScore = 65;
    } else {
        ageScore = 55;
    }

    const components = {
        daylight: scores.daylight,
        ventilation: scores.ventilation,
        roofInsulation: scores.roofInsulation,
        wallInsulation: scores.wallInsulation,
        applianceEfficiency: scores.applianceEfficiency,
        lighting: scores.lighting,
        solar: scores.solar,
        areaPerOccupant: occupancyScore,
        buildingAge: ageScore
    };

    let weightedTotal = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(weights)) {
        weightedTotal += components[key] * weight;
        totalWeight += weight;
    }

    return {
        score: Math.round(weightedTotal / totalWeight),
        components
    };
}

function getScoreLabel(score) {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Moderate";
    if (score >= 30) return "Needs Improvement";
    return "Low";
}


/* ============================================================
   8. COST AND SAVINGS ESTIMATION
   ============================================================ */

function calculateSavings(profile, energy) {
    const currentMonthlyBill = profile.monthlyBill;

    const currentMonthlyEnergy =
        energy.estimatedMonthlyKwh;

    const projectedMonthlyEnergy =
        energy.estimatedGridEnergy;

    const estimatedMonthlySavings = Math.max(
        0,
        (currentMonthlyEnergy - projectedMonthlyEnergy) *
        EcoAera.defaults.electricityRate
    );

    const estimatedAnnualSavings =
        estimatedMonthlySavings * 12;

    const estimatedProjectedBill = Math.max(
        0,
        currentMonthlyBill - estimatedMonthlySavings
    );

    const savingsPercentage =
        currentMonthlyBill > 0
            ? estimatedMonthlySavings /
              currentMonthlyBill * 100
            : 0;

    return {
        currentMonthlyBill: round(currentMonthlyBill, 0),
        estimatedProjectedBill: round(estimatedProjectedBill, 0),
        estimatedMonthlySavings: round(estimatedMonthlySavings, 0),
        estimatedAnnualSavings: round(estimatedAnnualSavings, 0),
        savingsPercentage: round(
            clamp(savingsPercentage, 0, 100),
            1
        )
    };
}


/* ============================================================
   9. PERSONALIZED RECOMMENDATIONS
   ============================================================ */

function createRecommendations(profile, conditions, scores) {
    const recommendations = [];

    function add(priority, title, description, impact) {
        recommendations.push({
            priority,
            title,
            description,
            impact
        });
    }

    if (scores.daylight < 70) {
        add(
            "High",
            "Improve natural daylight",
            "Keep windows unobstructed, use lighter interior finishes, " +
            "and consider daylight-friendly room layouts.",
            "Lighting demand"
        );
    }

    if (scores.ventilation < 70) {
        add(
            "High",
            "Improve natural ventilation",
            "Where climate, outdoor air quality and security allow, " +
            "use cross-ventilation and operable windows.",
            "Indoor comfort"
        );
    }

    if (scores.roofInsulation < 70) {
        add(
            "High",
            "Review roof insulation",
            "Check roof heat gain and consider suitable insulation, " +
            "reflective roofing or shading for your climate.",
            "Cooling demand"
        );
    }

    if (scores.wallInsulation < 70) {
        add(
            "Medium",
            "Improve wall thermal performance",
            "Assess wall heat transfer and consider suitable insulation " +
            "or external shading before choosing a retrofit.",
            "Thermal comfort"
        );
    }

    if (scores.applianceEfficiency < 70) {
        add(
            "High",
            "Upgrade appliance efficiency",
            "Compare energy labels when replacing refrigerators, " +
            "air conditioners, pumps and other frequently used devices.",
            "Electricity use"
        );
    }

    if (scores.lighting < 80) {
        add(
            "Medium",
            "Use efficient lighting",
            "Replace inefficient lamps with appropriate LED lighting " +
            "and switch off lights in unoccupied rooms.",
            "Lighting energy"
        );
    }

    if (scores.solar === 0) {
        add(
            "Medium",
            "Evaluate rooftop solar",
            "Check roof suitability, shading, local installation rules, " +
            "system cost and expected generation before investing.",
            "Grid electricity"
        );
    }

    if (profile.buildingAge > 20) {
        add(
            "Medium",
            "Consider an energy assessment",
            "For an older building, inspect seals, wiring, appliances, " +
            "roof condition and cooling equipment before renovations.",
            "Long-term efficiency"
        );
    }

    if (profile.occupants > 0 &&
        profile.area / profile.occupants < 10) {
        add(
            "Low",
            "Review room-by-room energy use",
            "Focus on efficient cooling, ventilation and lighting " +
            "in frequently occupied spaces.",
            "Energy management"
        );
    }

    if (recommendations.length === 0) {
        add(
            "Low",
            "Maintain your current practices",
            "Your selected conditions score well in this model. " +
            "Track actual monthly bills and maintain appliances regularly.",
            "Ongoing performance"
        );
    }

    return recommendations;
}


/* ============================================================
   10. COMPLETE ANALYSIS
   ============================================================ */

function analyzeHome(profile, conditions) {
    const conditionScores =
        calculateConditionScores(conditions);

    const energy = estimateActualEnergy(
        profile,
        conditions,
        conditionScores
    );

    const green = calculateGreenScore(
        profile,
        conditions,
        conditionScores
    );

    const savings = calculateSavings(profile, energy);

    const recommendations = createRecommendations(
        profile,
        conditions,
        conditionScores
    );

    return {
        createdAt: new Date().toISOString(),
        profile,
        conditions,
        conditionScores,
        energy,
        green,
        savings,
        recommendations
    };
}


/* ============================================================
   11. RESULTS CONTAINER
   ============================================================ */

function getResultsContainer() {
    let container = findElement([
        "#resultsSection",
        "#results",
        "#analysisResults",
        ".results-section",
        ".analysis-results"
    ]);

    if (!container) {
        container = createElement("section", "results-section");
        container.id = "resultsSection";

        const main = getMainContainer();
        main.appendChild(container);
    }

    return container;
}

function createMetricCard(label, value, detail, id) {
    const card = createElement("article", "result-card");

    if (id) card.id = id;

    card.appendChild(createElement("p", "result-label", label));
    card.appendChild(createElement("h3", "result-value", value));
    card.appendChild(createElement("p", "result-detail", detail));

    return card;
}

function createSectionHeading(title, description) {
    const sectionHeading = createElement("div", "section-heading");

    sectionHeading.appendChild(
        createElement("h2", "", title)
    );

    if (description) {
        sectionHeading.appendChild(
            createElement("p", "", description)
        );
    }

    return sectionHeading;
}


/* ============================================================
   12. DISPLAY RESULTS
   ============================================================ */

function renderResults(analysis) {
    const container = getResultsContainer();

    // Results are created only after a valid form submission.
    container.replaceChildren();
    container.hidden = false;

    const heading = createSectionHeading(
        "Your Green Home Report",
        "Estimated performance based on the details you entered."
    );

    container.appendChild(heading);

    const score = analysis.green.score;
    const scoreLabel = getScoreLabel(score);

    const summary = createElement("div", "results-summary");

    summary.appendChild(
        createMetricCard(
            "Green Home Score",
            score + " / 100",
            scoreLabel,
            "greenScoreCard"
        )
    );

    summary.appendChild(
        createMetricCard(
            "Monthly Electricity",
            formatNumber(analysis.energy.estimatedMonthlyKwh, 1) +
                " kWh",
            "Estimated from your entered bill",
            "energyCard"
        )
    );

    summary.appendChild(
        createMetricCard(
            "Estimated Monthly Savings",
            formatMoney(analysis.savings.estimatedMonthlySavings),
            "Illustrative model estimate",
            "savingsCard"
        )
    );

    summary.appendChild(
        createMetricCard(
            "Estimated Annual Savings",
            formatMoney(analysis.savings.estimatedAnnualSavings),
            "Assumes similar use throughout the year",
            "annualSavingsCard"
        )
    );

    container.appendChild(summary);

    renderScoreBar(container, score, scoreLabel);
    renderCharts(container, analysis);
    renderRecommendations(container, analysis.recommendations);
    renderInputSummary(container, analysis);

    container.appendChild(
        createElement(
            "p",
            "report-disclaimer",
            "Important: These figures are illustrative estimates, not " +
            "an official green-building certification, energy audit, " +
            "or guaranteed savings forecast. Replace the model's " +
            "assumptions with validated data for your project."
        )
    );

    container.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function renderScoreBar(container, score, label) {
    const section = createElement("section", "score-section");

    section.appendChild(
        createElement("h3", "", "Overall Sustainability")
    );

    const track = createElement("div", "score-track");
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-label", "Green home score");
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    track.setAttribute("aria-valuenow", String(score));

    const fill = createElement("div", "score-fill");
    fill.style.width = score + "%";

    track.appendChild(fill);

    section.append(
        track,
        createElement("p", "", label + " — " + score + "/100")
    );

    container.appendChild(section);
}


/* ============================================================
   13. CHART DRAWING
   Uses native canvas; no external chart library required.
   ============================================================ */

function createChartCanvas(id, title, parent) {
    const wrapper = createElement("div", "chart-container");
    wrapper.appendChild(createElement("h3", "", title));

    const canvas = document.createElement("canvas");
    canvas.id = id;
    canvas.width = 700;
    canvas.height = 320;
    canvas.style.width = "100%";
    canvas.style.maxWidth = "700px";
    canvas.style.display = "block";

    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", title);

    wrapper.appendChild(canvas);
    parent.appendChild(wrapper);

    return canvas;
}

function prepareCanvas(canvas) {
    const context = canvas.getContext("2d");

    if (!context) return null;

    const ratio = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || 700;
    const cssHeight = 320;

    canvas.width = cssWidth * ratio;
    canvas.height = cssHeight * ratio;

    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    return {
        context,
        width: cssWidth,
        height: cssHeight
    };
}

function drawBarChart(canvas, labels, values, maxValue, unit = "") {
    const prepared = prepareCanvas(canvas);
    if (!prepared) return;

    const { context: ctx, width, height } = prepared;

    ctx.clearRect(0, 0, width, height);

    const left = 55;
    const right = 20;
    const top = 20;
    const bottom = 75;

    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;

    const safeMax = Math.max(1, maxValue);
    const count = Math.max(1, values.length);
    const step = chartWidth / count;
    const barWidth = Math.min(55, step * 0.58);

    ctx.font = "12px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    // Horizontal grid and axis labels.
    for (let i = 0; i <= 4; i++) {
        const fraction = i / 4;
        const y = top + chartHeight * (1 - fraction);
        const tick = safeMax * fraction;

        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(width - right, y);
        ctx.strokeStyle = "#d9e2dc";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = "#52635a";
        ctx.fillText(
            formatNumber(tick, 0) + unit,
            left - 8,
            y
        );
    }

    values.forEach((value, index) => {
        const safeValue = Math.max(0, Number(value) || 0);
        const barHeight = safeValue / safeMax * chartHeight;
        const x = left + index * step + (step - barWidth) / 2;
        const y = top + chartHeight - barHeight;

        ctx.fillStyle = "#3f8760";
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = "#20372b";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        ctx.fillText(
            formatNumber(safeValue, 0) + unit,
            x + barWidth / 2,
            Math.max(top + 12, y - 5)
        );

        ctx.save();
        ctx.translate(x + barWidth / 2, top + chartHeight + 18);
        ctx.rotate(-0.25);
        ctx.fillStyle = "#52635a";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(labels[index], 0, 0);
        ctx.restore();
    });
}

function drawDonutChart(canvas, values, labels) {
    const prepared = prepareCanvas(canvas);
    if (!prepared) return;

    const { context: ctx, width, height } = prepared;

    ctx.clearRect(0, 0, width, height);

    const total = values.reduce(
        (sum, value) => sum + Math.max(0, value),
        0
    );

    const centerX = width * 0.35;
    const centerY = height * 0.48;
    const radius = Math.min(100, height * 0.32);
    const innerRadius = radius * 0.58;

    const chartColors = [
        "#347a52",
        "#65a878",
        "#9acb91",
        "#e6b85c",
        "#8ba5bd",
        "#c4a3ce",
        "#e18d76"
    ];

    let startAngle = -Math.PI / 2;

    if (total === 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "#d9e2dc";
        ctx.lineWidth = radius - innerRadius;
        ctx.stroke();
    } else {
        values.forEach((value, index) => {
            const safeValue = Math.max(0, value);
            const angle = safeValue / total * Math.PI * 2;

            ctx.beginPath();
            ctx.arc(
                centerX,
                centerY,
                radius,
                startAngle,
                startAngle + angle
            );
            ctx.strokeStyle =
                chartColors[index % chartColors.length];
            ctx.lineWidth = radius - innerRadius;
            ctx.lineCap = "butt";
            ctx.stroke();

            startAngle += angle;
        });
    }

    ctx.fillStyle = "#20372b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 20px Arial";
    ctx.fillText(
        total > 0 ? "100%" : "0%",
        centerX,
        centerY
    );

    const legendX = width * 0.63;
    let legendY = 85;

    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    labels.forEach((label, index) => {
        ctx.fillStyle = chartColors[index % chartColors.length];
        ctx.fillRect(legendX, legendY - 6, 12, 12);

        ctx.fillStyle = "#20372b";

        const percentage = total > 0
            ? Math.round(values[index] / total * 100)
            : 0;

        ctx.fillText(
            label + " (" + percentage + "%)",
            legendX + 20,
            legendY
        );

        legendY += 30;
    });
}

function renderCharts(container, analysis) {
    const chartsSection = createElement("section", "charts-section");

    chartsSection.appendChild(
        createSectionHeading(
            "Energy and Sustainability Charts",
            "Explore the results calculated from your property inputs."
        )
    );

    const chartGrid = createElement("div", "charts-grid");

    const conditionLabels = [
        "Daylight",
        "Ventilation",
        "Roof",
        "Walls",
        "Appliances",
        "Lighting",
        "Solar"
    ];

    const conditionValues = [
        analysis.conditionScores.daylight,
        analysis.conditionScores.ventilation,
        analysis.conditionScores.roofInsulation,
        analysis.conditionScores.wallInsulation,
        analysis.conditionScores.applianceEfficiency,
        analysis.conditionScores.lighting,
        analysis.conditionScores.solar
    ];

    const conditionChart = createChartCanvas(
        "conditionChart",
        "Building Condition Scores",
        chartGrid
    );

    drawBarChart(
        conditionChart,
        conditionLabels,
        conditionValues,
        100,
        ""
    );

    const currentEnergy = analysis.energy.estimatedMonthlyKwh;
    const efficientEnergy = analysis.energy.estimatedEfficientEnergy;
    const gridEnergy = analysis.energy.estimatedGridEnergy;

    const energyChart = createChartCanvas(
        "energyChart",
        "Estimated Monthly Energy",
        chartGrid
    );

    drawBarChart(
        energyChart,
        ["Current", "Efficient", "After Solar"],
        [currentEnergy, efficientEnergy, gridEnergy],
        Math.max(currentEnergy, efficientEnergy, gridEnergy) * 1.15,
        " kWh"
    );

    const savingsChart = createChartCanvas(
        "savingsChart",
        "Estimated Electricity Cost",
        chartGrid
    );

    drawBarChart(
        savingsChart,
        ["Current Bill", "Projected Bill", "Savings"],
        [
            analysis.savings.currentMonthlyBill,
            analysis.savings.estimatedProjectedBill,
            analysis.savings.estimatedMonthlySavings
        ],
        Math.max(
            analysis.savings.currentMonthlyBill,
            analysis.savings.estimatedProjectedBill,
            analysis.savings.estimatedMonthlySavings
        ) * 1.15,
        " ₹"
    );

    const breakdownChart = createChartCanvas(
        "conditionBreakdownChart",
        "Condition Score Breakdown",
        chartGrid
    );

    drawDonutChart(
        breakdownChart,
        conditionValues,
        conditionLabels
    );

    chartsSection.appendChild(chartGrid);
    container.appendChild(chartsSection);
}


/* ============================================================
   14. RECOMMENDATION DISPLAY
   ============================================================ */

function renderRecommendations(container, recommendations) {
    const section = createElement(
        "section",
        "recommendations-section"
    );

    section.appendChild(
        createSectionHeading(
            "Recommended Improvements",
            "Prioritize practical changes suited to your home's conditions."
        )
    );

    const list = createElement("div", "recommendations-list");

    recommendations.forEach((recommendation, index) => {
        const card = createElement(
            "article",
            "recommendation-card"
        );

        const top = createElement("div", "recommendation-top");

        top.append(
            createElement(
                "span",
                "recommendation-number",
                String(index + 1)
            ),
            createElement(
                "span",
                "recommendation-priority",
                recommendation.priority + " Priority"
            )
        );

        card.append(
            top,
            createElement("h3", "", recommendation.title),
            createElement("p", "", recommendation.description),
            createElement(
                "p",
                "recommendation-impact",
                "Focus: " + recommendation.impact
            )
        );

        list.appendChild(card);
    });

    section.appendChild(list);
    container.appendChild(section);
}


/* ============================================================
   15. PROPERTY SUMMARY
   ============================================================ */

function renderInputSummary(container, analysis) {
    const section = createElement("section", "property-summary");

    section.appendChild(
        createSectionHeading(
            "Analyzed Property",
            "A summary of the information used in this calculation."
        )
    );

    const details = [
        ["Property type", analysis.profile.propertyType],
        ["Floor area", formatNumber(analysis.profile.area) + " m²"],
        ["Building age", analysis.profile.buildingAge + " years"],
        ["Occupants", String(analysis.profile.occupants)],
        [
            "Monthly electricity bill",
            formatMoney(analysis.profile.monthlyBill)
        ],
        ["Daylight", analysis.conditions.daylight],
        ["Ventilation", analysis.conditions.ventilation],
        ["Roof insulation", analysis.conditions.roofInsulation],
        ["Wall insulation", analysis.conditions.wallInsulation],
        [
            "Appliance efficiency",
            analysis.conditions.applianceEfficiency
        ],
        ["Lighting type", analysis.conditions.lightingType],
        ["Solar energy", analysis.conditions.solarEnergy]
    ];

    const list = createElement("dl", "property-summary-list");

    details.forEach(([label, value]) => {
        list.appendChild(createElement("dt", "", label));
        list.appendChild(createElement("dd", "", value));
    });

    section.appendChild(list);
    container.appendChild(section);
}


/* ============================================================
   16. EXPORT REPORT AS CSV
   ============================================================ */

function downloadCsv(analysis) {
    const rows = [
        ["Eco-Aera Green Home Report"],
        ["Generated", analysis.createdAt],
        [],
        ["Property Profile", "Value"],
        ["Property type", analysis.profile.propertyType],
        ["Monthly bill", analysis.profile.monthlyBill],
        ["Area (m²)", analysis.profile.area],
        ["Building age (years)", analysis.profile.buildingAge],
        ["Occupants", analysis.profile.occupants],
        [],
        ["Result", "Value"],
        ["Green home score", analysis.green.score],
        ["Score label", getScoreLabel(analysis.green.score)],
        [
            "Estimated monthly energy (kWh)",
            analysis.energy.estimatedMonthlyKwh
        ],
        [
            "Estimated energy after improvements (kWh)",
            analysis.energy.estimatedEfficientEnergy
        ],
        [
            "Estimated grid energy after solar (kWh)",
            analysis.energy.estimatedGridEnergy
        ],
        [
            "Estimated monthly savings",
            analysis.savings.estimatedMonthlySavings
        ],
        [
            "Estimated annual savings",
            analysis.savings.estimatedAnnualSavings
        ],
        [],
        ["Recommendations"],
        ...analysis.recommendations.map(item => [
            item.priority,
            item.title,
            item.description
        ]),
        [],
        [
            "Disclaimer",
            "Illustrative model only; not an official energy audit."
        ]
    ];

    const csv = rows.map(row =>
        row.map(value => {
            const safeValue = String(value ?? "")
                .replace(/"/g, '""');

            return '"' + safeValue + '"';
        }).join(",")
    ).join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "eco-aera-green-home-report.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}


/* ============================================================
   17. OPTIONAL REPORT BUTTONS
   ============================================================ */

function setupReportButtons() {
    const downloadButtons = findAll([
        "#downloadReport",
        "#downloadCsv",
        "[data-download-report]"
    ]);

    downloadButtons.forEach(button => {
        button.addEventListener("click", () => {
            if (!EcoAera.lastAnalysis) {
                alert("Please analyze a property before downloading.");
                return;
            }

            downloadCsv(EcoAera.lastAnalysis);
        });
    });

    const printButtons = findAll([
        "#printReport",
        "[data-print-report]"
    ]);

    printButtons.forEach(button => {
        button.addEventListener("click", () => {
            if (!EcoAera.lastAnalysis) {
                alert("Please analyze a property before printing.");
                return;
            }

            window.print();
        });
    });
}


/* ============================================================
   18. FORM SUBMISSION
   ============================================================ */


async function handleFormSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;

    const profile = readPropertyProfile(form);
    const conditions = readBuildingConditions(form);

    const errors = validateInputs(profile, conditions);

    showValidationErrors(errors);

    if (errors.length > 0) {
        const firstInput = findElement([
            "input:invalid",
            "select:invalid",
            "textarea:invalid"
        ], form);

        if (firstInput) {
            firstInput.focus();
        }

        return;
    }

    try {
        // Send the user's inputs to the Python backend.
        const response = await fetch("http://127.0.0.1:8000/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                
home_type: profile.propertyType,
monthly_bill: Number(profile.monthlyBill),
monthly_kwh: Number(profile.monthlyKwh),
area_sq_m: Number(profile.area) * 0.092903,
building_age: Number(profile.buildingAge),
occupants: Number(profile.occupants),


                
daylight: conditions.daylight,
ventilation: conditions.ventilation,
roof_insulation: conditions.roofInsulation,
wall_insulation: conditions.wallInsulation,
heating_efficiency: conditions.heatingEfficiency,

window_quality: conditions.windowQuality,

appliance_efficiency: conditions.applianceEfficiency,
lighting_efficiency: conditions.lightingType,
renewable_percent: conditions.solarEnergy,
smart_management: conditions.smartManagement

            })
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            throw new Error(errorDetails);
        }

       
const backendData = await response.json();
console.log("Backend analysis:", backendData);

const analysis = {
    green: {
        score: backendData.green_home_score
    },
    energy: {
        estimatedMonthlyKwh:
            backendData.annual_energy_kwh / 12,
        annualKwh: backendData.annual_energy_kwh,
        efficiency: backendData.energy_efficiency,
        consumptionScore: backendData.consumption_score
    },
    savings: {
        estimatedMonthlySavings:
            backendData.estimated_monthly_savings,
        estimatedAnnualSavings:
            backendData.estimated_monthly_savings * 12
    },
    recommendations: backendData.recommendations ?? [],
    backend: backendData
};

EcoAera.lastAnalysis = analysis;
renderResults(analysis);

    } catch (error) {
        console.error("Analysis failed:", error);
        alert(
            "Could not analyze your home. Make sure the Python backend is running.\n\n" +
            error.message
        );
    }
}



/* ============================================================
   19. FORM RESET
   ============================================================ */

function setupResetBehavior(form) {
    form.addEventListener("reset", () => {
        // Wait for the browser to reset the fields.
        window.setTimeout(() => {
            showValidationErrors([]);

            const results = findElement([
                "#resultsSection",
                "#results",
                "#analysisResults",
                ".results-section",
                ".analysis-results"
            ]);

            if (results) {
                results.replaceChildren();
                results.hidden = true;
            }

            EcoAera.lastAnalysis = null;
        }, 0);
    });
}


/* ============================================================
   20. RESPONSIVE CHART REDRAW
   ============================================================ */

let chartResizeFrame = null;

function setupChartResize() {
    window.addEventListener("resize", () => {
        if (!EcoAera.lastAnalysis) return;

        if (chartResizeFrame) {
            cancelAnimationFrame(chartResizeFrame);
        }

        chartResizeFrame = requestAnimationFrame(() => {
            const analysis = EcoAera.lastAnalysis;

            const conditionChart =
                document.querySelector("#conditionChart");

            if (conditionChart) {
                drawBarChart(
                    conditionChart,
                    [
                        "Daylight",
                        "Ventilation",
                        "Roof",
                        "Walls",
                        "Appliances",
                        "Lighting",
                        "Solar"
                    ],
                    [
                        analysis.conditionScores.daylight,
                        analysis.conditionScores.ventilation,
                        analysis.conditionScores.roofInsulation,
                        analysis.conditionScores.wallInsulation,
                        analysis.conditionScores.applianceEfficiency,
                        analysis.conditionScores.lighting,
                        analysis.conditionScores.solar
                    ],
                    100
                );
            }

            const energyChart =
                document.querySelector("#energyChart");

            if (energyChart) {
                drawBarChart(
                    energyChart,
                    ["Current", "Efficient", "After Solar"],
                    [
                        analysis.energy.estimatedMonthlyKwh,
                        analysis.energy.estimatedEfficientEnergy,
                        analysis.energy.estimatedGridEnergy
                    ],
                    Math.max(
                        analysis.energy.estimatedMonthlyKwh,
                        analysis.energy.estimatedEfficientEnergy,
                        analysis.energy.estimatedGridEnergy
                    ) * 1.15,
                    " kWh"
                );
            }

            const savingsChart =
                document.querySelector("#savingsChart");

            if (savingsChart) {
                drawBarChart(
                    savingsChart,
                    ["Current Bill", "Projected Bill", "Savings"],
                    [
                        analysis.savings.currentMonthlyBill,
                        analysis.savings.estimatedProjectedBill,
                        analysis.savings.estimatedMonthlySavings
                    ],
                    Math.max(
                        analysis.savings.currentMonthlyBill,
                        analysis.savings.estimatedProjectedBill,
                        analysis.savings.estimatedMonthlySavings
                    ) * 1.15,
                    " ₹"
                );
            }

            const breakdownChart =
                document.querySelector("#conditionBreakdownChart");

            if (breakdownChart) {
                drawDonutChart(
                    breakdownChart,
                    [
                        analysis.conditionScores.daylight,
                        analysis.conditionScores.ventilation,
                        analysis.conditionScores.roofInsulation,
                        analysis.conditionScores.wallInsulation,
                        analysis.conditionScores.applianceEfficiency,
                        analysis.conditionScores.lighting,
                        analysis.conditionScores.solar
                    ],
                    [
                        "Daylight",
                        "Ventilation",
                        "Roof",
                        "Walls",
                        "Appliances",
                        "Lighting",
                        "Solar"
                    ]
                );
            }
        });
    });
}


/* ============================================================
   21. ACCESSIBILITY AND INITIAL PAGE STATE
   ============================================================ */

function initializeResultsVisibility() {
    const results = findElement([
        "#resultsSection",
        "#results",
        "#analysisResults",
        ".results-section",
        ".analysis-results"
    ]);

    if (results && !EcoAera.lastAnalysis) {
        results.hidden = true;
    }
}

function setupAccessibleFormFeedback(form) {
    form.querySelectorAll("input, select, textarea").forEach(input => {
        input.addEventListener("input", () => {
            const errors = document.querySelector("#ecoValidationErrors");

            if (errors && !errors.hidden) {
                errors.hidden = true;
            }
        });

        input.addEventListener("change", () => {
            const errors = document.querySelector("#ecoValidationErrors");

            if (errors && !errors.hidden) {
                errors.hidden = true;
            }
        });
    });
}


/* ============================================================
   22. APPLICATION STARTUP
   ============================================================ */

function initializeEcoAera() {
    const form = getAnalysisForm();

    if (!form) {
        console.error(
            "Eco-Aera: No form found. Add a form element to index.html."
        );
        return;
    }

    initializeResultsVisibility();

    form.addEventListener("submit", handleFormSubmit);

    setupResetBehavior(form);
    setupAccessibleFormFeedback(form);
    setupReportButtons();
    setupChartResize();

    console.info(
        "Eco-Aera Green Home Analyzer initialized successfully."
    );
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeEcoAera
    );
} else {
    initializeEcoAera();
}
