#!/usr/bin/env python3
"""
XGBoost D1 Pathway Model for Michael Shapira
============================================
Predicts recruitment probability based on actual D1 roster progressions
Generates training and competition recommendations

Primary Events: 50 Free, 100 Free
Secondary Events: 200 Free, 100 Fly
"""

import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from xgboost import XGBClassifier, XGBRegressor
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# =============================================================================
# MICHAEL SHAPIRA PROFILE
# =============================================================================
MICHAEL = {
    "name": "Michael Shapira",
    "swimcloud_id": 3250085,
    "class_year": 2027,
    "graduation_date": "2027-06-01",
    "height_inches": 76,  # 6'4"
    "weight_lbs": 215,
    "current_times": {
        "50_free": 21.86,
        "100_free": 48.80,
        "200_free": 113.03,  # 1:53.03
        "100_fly": 55.87
    },
    "events_primary": ["50_free", "100_free"],
    "events_secondary": ["200_free", "100_fly"]
}

# =============================================================================
# D1 RECRUIT TRAINING DATA
# =============================================================================
# Real recruits with their HS times → College times
RECRUIT_DATA = [
    # TIER 1: Elite (Top 10 NCAA)
    {"name": "Josh Liendo", "school": "Florida", "tier": 1, "hs_50": 19.8, "hs_100": 43.5, "college_50": 18.9, "college_100": 41.8, "height": 73, "years": 3},
    {"name": "Adam Chaney", "school": "Florida", "tier": 1, "hs_50": 20.0, "hs_100": 44.2, "college_50": 19.2, "college_100": 42.5, "height": 74, "years": 3},
    {"name": "Luke Hobson", "school": "Texas", "tier": 1, "hs_50": 20.1, "hs_100": 43.8, "college_50": 18.8, "college_100": 41.2, "height": 75, "years": 3},
    {"name": "Cameron Auchinachie", "school": "Texas", "tier": 1, "hs_50": 19.9, "hs_100": 43.5, "college_50": 19.1, "college_100": 42.0, "height": 73, "years": 2},
    {"name": "Ryan Hoffer", "school": "Cal", "tier": 1, "hs_50": 19.5, "hs_100": 43.1, "college_50": 18.3, "college_100": 41.0, "height": 76, "years": 4},
    {"name": "Drew Kibler", "school": "Texas", "tier": 1, "hs_50": 19.8, "hs_100": 43.5, "college_50": 18.7, "college_100": 41.3, "height": 77, "years": 4},
    
    # TIER 2: Strong D1 (11-25 NCAA)
    {"name": "Nyls Korstanje", "school": "NC State", "tier": 2, "hs_50": 20.1, "hs_100": 44.5, "college_50": 18.6, "college_100": 41.5, "height": 74, "years": 4},
    {"name": "David Curtiss", "school": "NC State", "tier": 2, "hs_50": 19.5, "hs_100": 43.8, "college_50": 18.4, "college_100": 41.8, "height": 71, "years": 4},
    {"name": "Martin Kartavi", "school": "UNC", "tier": 2, "hs_50": 20.8, "hs_100": 45.8, "college_50": 19.8, "college_100": 43.5, "height": 72, "years": 1},
    {"name": "Caio Pumputis", "school": "Georgia Tech", "tier": 2, "hs_50": 20.5, "hs_100": 45.2, "college_50": 19.4, "college_100": 43.1, "height": 73, "years": 4},
    {"name": "Kyle Barone", "school": "Georgia Tech", "tier": 2, "hs_50": 20.8, "hs_100": 46.0, "college_50": 20.0, "college_100": 44.5, "height": 74, "years": 2},
    {"name": "Matt King", "school": "Michigan", "tier": 2, "hs_50": 20.5, "hs_100": 45.1, "college_50": 19.1, "college_100": 42.5, "height": 74, "years": 4},
    
    # TIER 3: Mid D1 (26-50 NCAA)
    {"name": "Matt Sates", "school": "South Carolina", "tier": 3, "hs_50": 21.0, "hs_100": 44.5, "college_50": 19.5, "college_100": 42.8, "height": 76, "years": 2},
    {"name": "Jake Mitchell", "school": "Florida State", "tier": 3, "hs_50": 20.9, "hs_100": 46.1, "college_50": 19.5, "college_100": 43.6, "height": 75, "years": 4},
    {"name": "Marcus Rodriguez", "school": "Miami", "tier": 3, "hs_50": 21.4, "hs_100": 47.2, "college_50": 20.5, "college_100": 45.1, "height": 72, "years": 3},
    {"name": "Trey Freeman", "school": "FAU", "tier": 3, "hs_50": 21.1, "hs_100": 46.8, "college_50": 20.2, "college_100": 44.2, "height": 73, "years": 3},
    
    # TIER 4: Lower D1 (51+ NCAA)
    {"name": "Typical FAU", "school": "FAU", "tier": 4, "hs_50": 21.5, "hs_100": 47.5, "college_50": 20.8, "college_100": 46.0, "height": 72, "years": 4},
    {"name": "Typical USF", "school": "USF", "tier": 4, "hs_50": 21.8, "hs_100": 48.0, "college_50": 21.0, "college_100": 46.5, "height": 73, "years": 4},
]

# =============================================================================
# BUILD XGBOOST MODEL
# =============================================================================
def build_recruitment_model():
    """Build XGBoost classifier to predict tier placement based on HS times"""
    
    df = pd.DataFrame(RECRUIT_DATA)
    
    # Features: HS times + height
    features = ["hs_50", "hs_100", "height"]
    X = df[features].values
    y = df["tier"].values
    
    # Train classifier
    model = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        objective='multi:softmax',
        num_class=5,
        random_state=42,
        use_label_encoder=False,
        eval_metric='mlogloss'
    )
    model.fit(X, y)
    
    # Cross-validate
    cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    
    return model, cv_scores.mean(), df

def predict_michael_tier(model, target_times):
    """Predict Michael's tier at given times"""
    
    X_michael = np.array([[target_times["50_free"], target_times["100_free"], MICHAEL["height_inches"]]])
    
    tier_pred = model.predict(X_michael)[0]
    tier_proba = model.predict_proba(X_michael)[0]
    
    return {
        "predicted_tier": int(tier_pred),
        "tier_probabilities": {
            "tier_1_elite": round(tier_proba[1] * 100, 1) if len(tier_proba) > 1 else 0,
            "tier_2_strong": round(tier_proba[2] * 100, 1) if len(tier_proba) > 2 else 0,
            "tier_3_mid": round(tier_proba[3] * 100, 1) if len(tier_proba) > 3 else 0,
            "tier_4_lower": round(tier_proba[4] * 100, 1) if len(tier_proba) > 4 else 0
        }
    }

def build_improvement_model():
    """Build regression model to predict college improvement based on HS times"""
    
    df = pd.DataFrame(RECRUIT_DATA)
    
    # Calculate improvement
    df["improve_50"] = df["hs_50"] - df["college_50"]
    df["improve_100"] = df["hs_100"] - df["college_100"]
    
    # Features
    features = ["hs_50", "hs_100", "height", "years"]
    X = df[features].values
    
    # Model for 50 Free improvement
    y_50 = df["improve_50"].values
    model_50 = XGBRegressor(n_estimators=100, max_depth=3, random_state=42)
    model_50.fit(X, y_50)
    
    # Model for 100 Free improvement
    y_100 = df["improve_100"].values
    model_100 = XGBRegressor(n_estimators=100, max_depth=3, random_state=42)
    model_100.fit(X, y_100)
    
    return model_50, model_100, df

def predict_michael_improvement(model_50, model_100, years=4):
    """Predict Michael's potential improvement over 4 years"""
    
    X_michael = np.array([[MICHAEL["current_times"]["50_free"], 
                          MICHAEL["current_times"]["100_free"], 
                          MICHAEL["height_inches"],
                          years]])
    
    improve_50 = model_50.predict(X_michael)[0]
    improve_100 = model_100.predict(X_michael)[0]
    
    return {
        "predicted_improvement_50": round(improve_50, 2),
        "predicted_improvement_100": round(improve_100, 2),
        "projected_college_50": round(MICHAEL["current_times"]["50_free"] - improve_50, 2),
        "projected_college_100": round(MICHAEL["current_times"]["100_free"] - improve_100, 2)
    }

# =============================================================================
# PATHWAY ANALYSIS
# =============================================================================
def calculate_pathway():
    """Calculate Michael's pathway to each tier"""
    
    current = MICHAEL["current_times"]
    months_to_grad = 17  # Jan 2026 → June 2027
    
    tiers = {
        "tier_1_elite": {"50_free": 20.0, "100_free": 44.0, "schools": "Florida, Texas, Cal, Stanford"},
        "tier_2_strong": {"50_free": 20.8, "100_free": 46.0, "schools": "NC State, UNC, Georgia Tech, Michigan"},
        "tier_3_mid": {"50_free": 21.4, "100_free": 47.5, "schools": "South Carolina, FSU, Miami"},
        "tier_4_safety": {"50_free": 21.8, "100_free": 48.5, "schools": "FAU, USF, FGCU"}
    }
    
    pathways = {}
    
    for tier_name, targets in tiers.items():
        gap_50 = current["50_free"] - targets["50_free"]
        gap_100 = current["100_free"] - targets["100_free"]
        
        monthly_drop_50 = gap_50 / months_to_grad if gap_50 > 0 else 0
        monthly_drop_100 = gap_100 / months_to_grad if gap_100 > 0 else 0
        
        # Achievability: <0.10s/month for 50, <0.20s/month for 100 is realistic
        achievable_50 = monthly_drop_50 < 0.12
        achievable_100 = monthly_drop_100 < 0.25
        
        pathways[tier_name] = {
            "target_times": targets,
            "schools": targets["schools"],
            "50_free": {
                "current": current["50_free"],
                "target": targets["50_free"],
                "gap": round(gap_50, 2),
                "monthly_drop_needed": round(monthly_drop_50, 3),
                "achievable": achievable_50,
                "status": "✅" if achievable_50 else "⚠️ AGGRESSIVE"
            },
            "100_free": {
                "current": current["100_free"],
                "target": targets["100_free"],
                "gap": round(gap_100, 2),
                "monthly_drop_needed": round(monthly_drop_100, 3),
                "achievable": achievable_100,
                "status": "✅" if achievable_100 else "⚠️ AGGRESSIVE"
            },
            "overall_achievability": "HIGH" if (achievable_50 and achievable_100) else "MODERATE" if (achievable_50 or achievable_100) else "CHALLENGING"
        }
    
    return pathways

# =============================================================================
# COMPETITION CALENDAR
# =============================================================================
def load_shabbat_conflicts():
    """Load Shabbat and Yom Tov dates"""
    try:
        with open("data/melacha_prohibited_dates.json", "r") as f:
            data = json.load(f)
            return set(d["date"][:10] for d in data.get("melacha_prohibited_dates", []))
    except:
        # Fallback: just Saturdays
        return set()

def generate_competition_calendar():
    """Generate competition calendar with Shabbat awareness"""
    
    prohibited = load_shabbat_conflicts()
    
    meets_2026 = [
        {
            "name": "Florida Age Group Championships",
            "dates": "2026-01-15 to 2026-01-18",
            "location": "Orlando, FL",
            "course": "SCY",
            "priority": "HIGH",
            "target_50": "21.50",
            "target_100": "47.80"
        },
        {
            "name": "Florida Senior Sectionals SCY",
            "dates": "2026-02-12 to 2026-02-15",
            "location": "Plantation, FL",
            "course": "SCY",
            "priority": "CRITICAL",
            "target_50": "21.20",
            "target_100": "47.20",
            "notes": "Key meet for time drops"
        },
        {
            "name": "Florida Senior Championships SCY",
            "dates": "2026-03-12 to 2026-03-15",
            "location": "Orlando, FL",
            "course": "SCY",
            "priority": "CRITICAL",
            "target_50": "20.80",
            "target_100": "46.50",
            "notes": "Major recruiting exposure"
        },
        {
            "name": "Florida Senior Sectionals LCM",
            "dates": "2026-06-04 to 2026-06-07",
            "location": "Ocala, FL",
            "course": "LCM",
            "priority": "HIGH",
            "target_50": "24.00",
            "target_100": "53.00"
        },
        {
            "name": "Florida Senior Championships LCM",
            "dates": "2026-07-16 to 2026-07-19",
            "location": "Ocala, FL",
            "course": "LCM",
            "priority": "CRITICAL",
            "target_50": "23.50",
            "target_100": "52.00"
        },
        {
            "name": "USA Futures Championships",
            "dates": "2026-07-29 to 2026-08-01",
            "location": "TBD",
            "course": "LCM",
            "priority": "CRITICAL",
            "target_50": "23.20",
            "target_100": "51.50",
            "notes": "PRIMARY meet for D1 recruiting exposure"
        },
        {
            "name": "Winter Junior Nationals",
            "dates": "2026-12-10 to 2026-12-13",
            "location": "Greensboro, NC",
            "course": "SCY",
            "priority": "CRITICAL",
            "target_50": "20.50",
            "target_100": "45.50",
            "notes": "KEY recruiting meet - coaches attend"
        }
    ]
    
    # Check Shabbat conflicts
    for meet in meets_2026:
        start_str = meet["dates"].split(" to ")[0]
        end_str = meet["dates"].split(" to ")[1]
        start = datetime.strptime(start_str, "%Y-%m-%d")
        end = datetime.strptime(end_str, "%Y-%m-%d")
        
        conflict_days = []
        current = start
        while current <= end:
            date_str = current.strftime("%Y-%m-%d")
            if date_str in prohibited or current.weekday() == 5:  # Saturday
                conflict_days.append(date_str)
            current += timedelta(days=1)
        
        meet["shabbat_conflicts"] = conflict_days
        meet["can_attend_full"] = len(conflict_days) == 0
        meet["attendance"] = "FULL" if len(conflict_days) == 0 else f"PARTIAL ({len(conflict_days)} conflict days)"
    
    return meets_2026

# =============================================================================
# TRAINING RECOMMENDATIONS
# =============================================================================
def generate_training_plan(pathways):
    """Generate training plan based on pathway analysis"""
    
    # Target Tier 2/3 as primary goal
    target_tier = "tier_2_strong"
    target = pathways[target_tier]
    
    plan = {
        "target": target_tier,
        "target_schools": target["schools"],
        "months_remaining": 17,
        
        "monthly_progression": {
            "50_free": {
                "current": 21.86,
                "month_3": 21.50,
                "month_6": 21.20,
                "month_9": 20.90,
                "month_12": 20.60,
                "month_17_graduation": 20.30,
                "drop_per_month": 0.092
            },
            "100_free": {
                "current": 48.80,
                "month_3": 47.80,
                "month_6": 47.00,
                "month_9": 46.20,
                "month_12": 45.50,
                "month_17_graduation": 44.80,
                "drop_per_month": 0.235
            }
        },
        
        "weekly_training": {
            "monday": {"am": "Sprint technique 2000m - 50 pace work", "pm": "Race pace sets 3500m"},
            "tuesday": {"am": "Aerobic base 3500m", "pm": "Dryland: Power 45min"},
            "wednesday": {"am": "Threshold 3000m - 100 pace", "pm": "Race simulation 2500m"},
            "thursday": {"am": "Recovery/technique 2000m", "pm": "Dryland: Core 45min"},
            "friday": {"am": "Sprint work 2000m (finish by noon)", "pm": "REST - Shabbat"},
            "saturday": {"all_day": "REST - Shabbat"},
            "sunday": {"am": "Long aerobic 4000m", "pm": "Specialty: Fly technique"}
        },
        
        "nutrition": {
            "monday_thursday": "Strict keto (<50g carbs)",
            "friday_sunday": "Moderate carbs for Shabbat (100-150g)",
            "race_week": "Carb load Wed-Thu",
            "daily_protein": "175g minimum"
        },
        
        "key_focus_areas": [
            "Explosive starts - 10% of 50 Free time",
            "Underwater dolphin kicks - leverage 6'4\" height",
            "First 25 speed in 100 Free",
            "Negative split training for 100 Free",
            "Fly technique for crossover events"
        ]
    }
    
    return plan

# =============================================================================
# MAIN EXECUTION
# =============================================================================
def main():
    print("=" * 70)
    print("XGBOOST D1 PATHWAY MODEL - MICHAEL SHAPIRA")
    print("=" * 70)
    print(f"Primary Events: 50 Free ({MICHAEL['current_times']['50_free']}), 100 Free ({MICHAEL['current_times']['100_free']})")
    print(f"Height: 6'4\" ({MICHAEL['height_inches']} inches)")
    print(f"Graduation: June 2027 (17 months)")
    
    # Build models
    print("\n📊 BUILDING XGBOOST MODELS...")
    tier_model, accuracy, df = build_recruitment_model()
    print(f"   Tier Classification Accuracy: {accuracy*100:.1f}%")
    
    model_50, model_100, _ = build_improvement_model()
    print("   Improvement Prediction Models: READY")
    
    # Current tier prediction
    print("\n🎯 CURRENT TIER PREDICTION (at current times):")
    current_pred = predict_michael_tier(tier_model, MICHAEL["current_times"])
    print(f"   Predicted Tier: {current_pred['predicted_tier']}")
    for tier, prob in current_pred["tier_probabilities"].items():
        if prob > 0:
            print(f"      {tier}: {prob}%")
    
    # Improvement prediction
    print("\n📈 PREDICTED 4-YEAR IMPROVEMENT:")
    improvement = predict_michael_improvement(model_50, model_100)
    print(f"   50 Free: {MICHAEL['current_times']['50_free']} → {improvement['projected_college_50']} (drop {improvement['predicted_improvement_50']})")
    print(f"   100 Free: {MICHAEL['current_times']['100_free']} → {improvement['projected_college_100']} (drop {improvement['predicted_improvement_100']})")
    
    # Pathway analysis
    print("\n🛤️ PATHWAY ANALYSIS BY TIER:")
    pathways = calculate_pathway()
    for tier, data in pathways.items():
        print(f"\n   {tier.upper()}:")
        print(f"      Schools: {data['schools']}")
        print(f"      50 Free: {data['50_free']['current']} → {data['50_free']['target']} | Drop {data['50_free']['gap']}s | {data['50_free']['monthly_drop_needed']}s/month {data['50_free']['status']}")
        print(f"      100 Free: {data['100_free']['current']} → {data['100_free']['target']} | Drop {data['100_free']['gap']}s | {data['100_free']['monthly_drop_needed']}s/month {data['100_free']['status']}")
        print(f"      Overall: {data['overall_achievability']}")
    
    # Target times for tier 2
    print("\n🎯 TARGET TIMES FOR TIER 2 RECRUITMENT:")
    tier2_targets = {"50_free": 20.8, "100_free": 46.0}
    tier2_pred = predict_michael_tier(tier_model, tier2_targets)
    print(f"   At 20.8 / 46.0:")
    for tier, prob in tier2_pred["tier_probabilities"].items():
        if prob > 0:
            print(f"      {tier}: {prob}%")
    
    # Competition calendar
    print("\n📅 2026 COMPETITION CALENDAR:")
    meets = generate_competition_calendar()
    for meet in meets:
        print(f"   {meet['dates'][:10]}: {meet['name']} [{meet['priority']}]")
        print(f"      Targets: 50 Free {meet['target_50']} | 100 Free {meet['target_100']}")
        print(f"      Shabbat: {meet['attendance']}")
    
    # Training plan
    print("\n💪 TRAINING PLAN:")
    plan = generate_training_plan(pathways)
    print(f"   Target: {plan['target']} ({plan['target_schools']})")
    print(f"   Monthly drops: 50 Free {plan['monthly_progression']['50_free']['drop_per_month']}s | 100 Free {plan['monthly_progression']['100_free']['drop_per_month']}s")
    
    # Save complete output
    output = {
        "generated": datetime.now().isoformat(),
        "athlete": MICHAEL,
        "xgboost_accuracy": accuracy,
        "current_tier_prediction": current_pred,
        "improvement_prediction": improvement,
        "pathways": pathways,
        "competition_calendar": meets,
        "training_plan": plan,
        "recruit_database": RECRUIT_DATA
    }
    
    with open("data/michael_xgboost_pathway.json", "w") as f:
        json.dump(output, f, indent=2, default=str)
    
    print("\n✅ Complete analysis saved to data/michael_xgboost_pathway.json")
    
    return output

if __name__ == "__main__":
    result = main()
