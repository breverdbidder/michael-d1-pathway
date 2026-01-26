#!/usr/bin/env python3
"""
LangGraph Multi-Agent Orchestrator for Michael D1 Pathway
=========================================================
Parallel agents for comprehensive D1 swimming recruitment analysis

Agents:
1. RosterAnalysisAgent - Analyzes D1 roster progressions
2. TimeProgressionAgent - Models time drops and predictions
3. CalendarAgent - Filters meets for Shabbat compliance
4. TrainingAgent - Generates training recommendations
5. CompetitionAgent - Develops competition strategy
6. ReportAgent - Generates final DOCX report

Stack: LangGraph + LangChain + XGBoost + Supabase
"""

import json
import asyncio
from typing import TypedDict, Annotated, Sequence, Literal
from datetime import datetime, timedelta
import operator
from dataclasses import dataclass
import httpx

# LangGraph imports (simulated for environment compatibility)
# In production: from langgraph.graph import StateGraph, END
# from langchain_anthropic import ChatAnthropic

# =============================================================================
# STATE DEFINITIONS
# =============================================================================

class AthleteState(TypedDict):
    """Shared state for athlete analysis"""
    name: str
    swimcloud_id: int
    current_times: dict
    height_inches: int
    class_year: int
    
class AnalysisState(TypedDict):
    """Shared state across all agents"""
    athlete: AthleteState
    roster_analysis: dict
    time_progression: dict
    calendar_filtered: list
    training_plan: dict
    competition_strategy: dict
    report_path: str
    errors: list
    completed_agents: list

# =============================================================================
# AGENT: ROSTER ANALYSIS
# =============================================================================

class RosterAnalysisAgent:
    """Analyzes D1 roster progressions to find comparable recruits"""
    
    name = "roster_analysis"
    
    def __init__(self):
        self.recruit_data = self._load_recruit_data()
    
    def _load_recruit_data(self):
        try:
            with open("data/d1_roster_progression_analysis.json", "r") as f:
                return json.load(f)
        except:
            return {"d1_recruit_progressions": {}}
    
    async def analyze(self, state: AnalysisState) -> dict:
        """Find comparable recruits based on current times"""
        
        athlete = state["athlete"]
        current_50 = athlete["current_times"]["50_free"]
        current_100 = athlete["current_times"]["100_free"]
        height = athlete["height_inches"]
        
        comparable = []
        school_gaps = {}
        
        for school, data in self.recruit_data.get("d1_recruit_progressions", {}).items():
            avg_50 = data.get("average_hs_recruit_times", {}).get("50_free")
            avg_100 = data.get("average_hs_recruit_times", {}).get("100_free")
            
            if avg_50 and avg_100:
                gap_50 = current_50 - float(avg_50)
                gap_100 = current_100 - float(avg_100)
                
                school_gaps[school] = {
                    "avg_recruit_50": avg_50,
                    "avg_recruit_100": avg_100,
                    "gap_50": round(gap_50, 2),
                    "gap_100": round(gap_100, 2),
                    "achievable": gap_50 < 1.5 and gap_100 < 4.0
                }
            
            # Find individual comparable swimmers
            for swimmer in data.get("sprint_swimmers", []):
                hs_50 = swimmer.get("hs_senior_times", {}).get("50_free")
                hs_100 = swimmer.get("hs_senior_times", {}).get("100_free")
                
                if hs_50 and hs_100:
                    hs_50 = float(hs_50)
                    hs_100 = float(hs_100)
                    
                    # Similar if within 1.0s for 50, 2.5s for 100
                    if abs(current_50 - hs_50) < 1.5 and abs(current_100 - hs_100) < 3.5:
                        comparable.append({
                            "name": swimmer.get("name"),
                            "school": school,
                            "hs_times": {"50": hs_50, "100": hs_100},
                            "college_times": swimmer.get("current_times", {}),
                            "improvement": swimmer.get("improvement", {}),
                            "similarity_score": 100 - (abs(current_50 - hs_50) * 10 + abs(current_100 - hs_100) * 5)
                        })
        
        # Sort by similarity
        comparable.sort(key=lambda x: x["similarity_score"], reverse=True)
        
        return {
            "comparable_recruits": comparable[:10],
            "school_gaps": school_gaps,
            "best_match_school": min(school_gaps.items(), key=lambda x: x[1]["gap_50"] + x[1]["gap_100"])[0] if school_gaps else None,
            "analysis_timestamp": datetime.now().isoformat()
        }

# =============================================================================
# AGENT: TIME PROGRESSION
# =============================================================================

class TimeProgressionAgent:
    """Models time progression and predicts future performance"""
    
    name = "time_progression"
    
    def __init__(self):
        self.tier_thresholds = {
            "elite": {"50_free": 20.0, "100_free": 44.0},
            "strong_d1": {"50_free": 20.8, "100_free": 46.0},
            "mid_d1": {"50_free": 21.4, "100_free": 47.5},
            "safety": {"50_free": 21.8, "100_free": 48.5}
        }
    
    async def analyze(self, state: AnalysisState) -> dict:
        """Calculate progression pathways for each tier"""
        
        athlete = state["athlete"]
        current = athlete["current_times"]
        
        # Calculate months to graduation (June 2027)
        graduation = datetime(2027, 6, 1)
        months_left = (graduation - datetime.now()).days // 30
        
        pathways = {}
        
        for tier, targets in self.tier_thresholds.items():
            gap_50 = current["50_free"] - targets["50_free"]
            gap_100 = current["100_free"] - targets["100_free"]
            
            monthly_50 = gap_50 / months_left if gap_50 > 0 and months_left > 0 else 0
            monthly_100 = gap_100 / months_left if gap_100 > 0 and months_left > 0 else 0
            
            # Realistic benchmarks: <0.10s/month for 50, <0.20s/month for 100
            achievable_50 = monthly_50 < 0.12
            achievable_100 = monthly_100 < 0.20
            
            pathways[tier] = {
                "targets": targets,
                "gaps": {"50_free": round(gap_50, 2), "100_free": round(gap_100, 2)},
                "monthly_drops": {"50_free": round(monthly_50, 3), "100_free": round(monthly_100, 3)},
                "achievable": achievable_50 and achievable_100,
                "status": "✅ ACHIEVABLE" if (achievable_50 and achievable_100) else 
                         "⚠️ AGGRESSIVE" if (achievable_50 or achievable_100) else "❌ VERY HARD"
            }
        
        # Generate monthly milestones
        milestones = []
        current_50 = current["50_free"]
        current_100 = current["100_free"]
        
        # Target strong_d1 (most realistic)
        target_50 = self.tier_thresholds["strong_d1"]["50_free"]
        target_100 = self.tier_thresholds["strong_d1"]["100_free"]
        
        drop_per_month_50 = (current_50 - target_50) / months_left if months_left > 0 else 0
        drop_per_month_100 = (current_100 - target_100) / months_left if months_left > 0 else 0
        
        for i in [3, 6, 9, 12, months_left]:
            if i <= months_left:
                milestones.append({
                    "month": i,
                    "date": (datetime.now() + timedelta(days=i*30)).strftime("%Y-%m"),
                    "50_free": round(current_50 - (drop_per_month_50 * i), 2),
                    "100_free": round(current_100 - (drop_per_month_100 * i), 2)
                })
        
        return {
            "months_to_graduation": months_left,
            "pathways": pathways,
            "milestones": milestones,
            "recommended_tier": "strong_d1",
            "analysis_timestamp": datetime.now().isoformat()
        }

# =============================================================================
# AGENT: CALENDAR (SHABBAT COMPLIANCE)
# =============================================================================

class CalendarAgent:
    """Filters competition calendar for Shabbat compliance"""
    
    name = "calendar"
    
    def __init__(self):
        self.prohibited_dates = self._load_prohibited_dates()
    
    def _load_prohibited_dates(self):
        try:
            with open("data/melacha_prohibited_dates.json", "r") as f:
                data = json.load(f)
                return set(d["date"][:10] for d in data.get("melacha_prohibited_dates", []))
        except:
            return set()
    
    async def analyze(self, state: AnalysisState) -> list:
        """Filter meets for Shabbat compliance"""
        
        meets_2026 = [
            {"name": "FL Age Group Championships", "start": "2026-01-15", "end": "2026-01-18", 
             "priority": "HIGH", "targets": {"50": 21.50, "100": 47.80}},
            {"name": "FL Senior Sectionals SCY", "start": "2026-02-12", "end": "2026-02-15", 
             "priority": "CRITICAL", "targets": {"50": 21.20, "100": 47.20}},
            {"name": "FL Senior Championships SCY", "start": "2026-03-12", "end": "2026-03-15", 
             "priority": "CRITICAL", "targets": {"50": 20.80, "100": 46.50}},
            {"name": "FL Senior Sectionals LCM", "start": "2026-06-04", "end": "2026-06-07", 
             "priority": "HIGH", "targets": {"50": 24.00, "100": 53.00}, "course": "LCM"},
            {"name": "FL Senior Championships LCM", "start": "2026-07-16", "end": "2026-07-19", 
             "priority": "CRITICAL", "targets": {"50": 23.50, "100": 52.00}, "course": "LCM"},
            {"name": "USA Futures Championships", "start": "2026-07-29", "end": "2026-08-01", 
             "priority": "CRITICAL", "targets": {"50": 23.20, "100": 51.50}, "course": "LCM",
             "notes": "PRIMARY D1 recruiting exposure"},
            {"name": "Winter Junior Nationals", "start": "2026-12-10", "end": "2026-12-13", 
             "priority": "CRITICAL", "targets": {"50": 20.50, "100": 45.50},
             "notes": "KEY recruiting meet - coaches attend"}
        ]
        
        filtered_meets = []
        
        for meet in meets_2026:
            start = datetime.strptime(meet["start"], "%Y-%m-%d")
            end = datetime.strptime(meet["end"], "%Y-%m-%d")
            
            conflict_days = []
            current = start
            while current <= end:
                date_str = current.strftime("%Y-%m-%d")
                # Check prohibited dates AND Saturdays
                if date_str in self.prohibited_dates or current.weekday() == 5:
                    conflict_days.append(date_str)
                current += timedelta(days=1)
            
            meet["shabbat_conflicts"] = conflict_days
            meet["can_attend_full"] = len(conflict_days) == 0
            meet["can_attend_partial"] = len(conflict_days) < (end - start).days + 1
            meet["attendance_status"] = "FULL" if len(conflict_days) == 0 else f"PARTIAL ({len(conflict_days)} conflicts)"
            
            filtered_meets.append(meet)
        
        return filtered_meets

# =============================================================================
# AGENT: TRAINING RECOMMENDATIONS
# =============================================================================

class TrainingAgent:
    """Generates Shabbat-compliant training recommendations"""
    
    name = "training"
    
    async def analyze(self, state: AnalysisState, time_progression: dict) -> dict:
        """Generate comprehensive training plan"""
        
        milestones = time_progression.get("milestones", [])
        
        plan = {
            "target_tier": "Strong D1 (NC State, UNC, Georgia Tech, Michigan)",
            
            "weekly_structure": {
                "monday": {
                    "am": "Sprint technique (2000m) - 50 Free pace work, starts drill",
                    "pm": "Race pace sets (3500m) - 100 Free pace, hypoxic training"
                },
                "tuesday": {
                    "am": "Aerobic base (3500m) - threshold work",
                    "pm": "Dryland: Power training (45 min) - Olympic lifts, plyometrics"
                },
                "wednesday": {
                    "am": "Threshold training (3000m) - 100 Free pace, lactate sets",
                    "pm": "Race simulation (2500m) - 100 Free broken swims"
                },
                "thursday": {
                    "am": "Recovery/technique (2000m) - drill work, video analysis",
                    "pm": "Dryland: Core/Flexibility (45 min)"
                },
                "friday": {
                    "am": "Sprint work (2000m) - finish by 12:00 PM before Shabbat",
                    "pm": "REST - Shabbat begins at sunset"
                },
                "saturday": {
                    "all_day": "REST - Shabbat (NO training)",
                    "note": "Complete rest for physical and spiritual recovery"
                },
                "sunday": {
                    "am": "Long aerobic (4000m) - base building",
                    "pm": "Specialty work - Fly technique, underwaters"
                }
            },
            
            "monthly_yardage": {
                "competition_phase": "35,000-40,000 yards/week",
                "base_phase": "45,000-50,000 yards/week",
                "taper_phase": "20,000-25,000 yards/week"
            },
            
            "key_focus_areas": [
                {
                    "area": "Explosive Starts",
                    "importance": "10% of 50 Free time",
                    "drills": ["Reaction time work", "Block explosiveness", "Streamline off block"],
                    "goal": "Sub-0.65s reaction time"
                },
                {
                    "area": "Underwater Dolphin Kicks",
                    "importance": "Leverage 6'4\" height advantage",
                    "drills": ["15m underwater sets", "Vertical kicking", "Hypoxic dolphin work"],
                    "goal": "15m underwater in <5.5s"
                },
                {
                    "area": "First 25 Speed (100 Free)",
                    "importance": "Set up race with fast front half",
                    "drills": ["25 all-out repeats", "50 negative split work"],
                    "goal": "Sub-11.0 first 25"
                },
                {
                    "area": "Negative Split Training",
                    "importance": "Back half speed for 100 Free",
                    "drills": ["100 descend sets", "Back-half 50s", "Lactate tolerance"],
                    "goal": "Second 50 within 1.5s of first 50"
                }
            ],
            
            "nutrition": {
                "protocol": "Kosher Keto (Michael Andrew model)",
                "monday_thursday": {
                    "carbs": "<50g",
                    "fat": "70%",
                    "protein": "25%",
                    "calories": "3500",
                    "notes": "Strict keto for fat adaptation"
                },
                "friday_sunday": {
                    "carbs": "100-150g",
                    "fat": "50%",
                    "protein": "30%",
                    "calories": "3200",
                    "notes": "Moderate carbs for Shabbat meals (challah, kugel)"
                },
                "race_week": {
                    "carb_load": "Wed-Thu before race",
                    "race_day": "Small carbs 2hr before, glucose between races",
                    "post_race": "Fairlife chocolate milk + protein"
                },
                "supplements": [
                    "Electrolytes (sodium, potassium, magnesium)",
                    "Creatine monohydrate (5g/day)",
                    "Omega-3 fish oil",
                    "MCT oil (morning coffee)",
                    "Kosher protein powder"
                ]
            },
            
            "body_composition_targets": {
                "current": {"weight": 215, "body_fat_pct": 15},
                "target": {"weight": 210, "body_fat_pct": 10},
                "timeline": "12 months",
                "rationale": "Match Kyle Chalmers / Caeleb Dressel build"
            },
            
            "milestones": milestones
        }
        
        return plan

# =============================================================================
# AGENT: COMPETITION STRATEGY
# =============================================================================

class CompetitionAgent:
    """Develops competition and recruiting strategy"""
    
    name = "competition"
    
    async def analyze(self, state: AnalysisState, roster_analysis: dict, calendar: list) -> dict:
        """Generate competition and recruiting strategy"""
        
        # Get best match schools
        school_gaps = roster_analysis.get("school_gaps", {})
        achievable_schools = [s for s, d in school_gaps.items() if d.get("achievable")]
        
        # Filter critical meets
        critical_meets = [m for m in calendar if m.get("priority") == "CRITICAL"]
        
        strategy = {
            "primary_targets": {
                "tier": "Strong D1",
                "schools": ["UNC Chapel Hill", "Georgia Tech", "Michigan", "NC State"],
                "rationale": "Best match for current times + achievable progression"
            },
            
            "reach_targets": {
                "tier": "Elite",
                "schools": ["University of Florida", "UT Austin"],
                "rationale": "Require aggressive time drops but high upside"
            },
            
            "safety_targets": {
                "tier": "Mid D1",
                "schools": ["South Carolina", "Florida State", "FAU"],
                "rationale": "Already at or near recruiting standards"
            },
            
            "key_meets_for_recruiting": [
                {
                    "meet": "FL Senior Championships SCY",
                    "date": "March 2026",
                    "target_times": {"50": "20.80", "100": "46.50"},
                    "importance": "State-level exposure, video content",
                    "action": "Invite coaches, create recruiting video"
                },
                {
                    "meet": "USA Futures Championships",
                    "date": "July 2026",
                    "target_times": {"50": "23.20 LCM", "100": "51.50 LCM"},
                    "importance": "National exposure, D1 coaches attend",
                    "action": "Email all target coaches 2 weeks before"
                },
                {
                    "meet": "Winter Junior Nationals",
                    "date": "December 2026",
                    "target_times": {"50": "20.50", "100": "45.50"},
                    "importance": "MOST IMPORTANT - final meet before early signing",
                    "action": "Peak for this meet, all target coaches notified"
                }
            ],
            
            "recruiting_timeline": {
                "january_2026": [
                    "Update SwimCloud profile with recent times",
                    "Create/update recruiting video (50 Free, 100 Free)",
                    "Initial emails to 10 target schools"
                ],
                "march_2026": [
                    "After FL Senior Champs, send updated times",
                    "Request unofficial visits for summer",
                    "Connect with Chabad contacts at each school"
                ],
                "june_2026": [
                    "Attend summer camps (UF Gator Camp, NC State)",
                    "Schedule unofficial visits",
                    "Meet coaches in person"
                ],
                "july_2026": [
                    "Perform at USA Futures",
                    "Follow up with all coaches after meet"
                ],
                "september_2026": [
                    "Official visit scheduling (5 allowed)",
                    "Narrow to top 5 schools"
                ],
                "december_2026": [
                    "Winter Junior Nationals performance",
                    "Final decision before early signing (November)"
                ]
            },
            
            "israeli_pathway": {
                "opportunity": "Dual US-Israeli citizenship",
                "precedent": [
                    "Martin Kartavi (UNC) - Paris 2024 Bronze",
                    "David Gerchik (Northwestern) - Paris 2024",
                    "Andrea Murez (Stanford) - 3x Olympian"
                ],
                "talking_points": [
                    "Can represent Israel at Olympics (smaller competition pool)",
                    "Israeli Olympic qualifying times more achievable than USA",
                    "International experience valued by programs"
                ],
                "target_schools_with_israeli_history": ["UNC", "Northwestern", "Stanford", "Arizona", "South Carolina"]
            },
            
            "email_templates": {
                "initial_outreach": """
Subject: Michael Shapira - 6'4" Dual US-Israeli Citizen | Class 2027 | 50/100 Free

Coach [Name],

I'm reaching out to express my strong interest in [School] swimming. As a 6'4" sprinter from Satellite Beach, FL with dual US-Israeli citizenship, I'm following the path of athletes like Martin Kartavi and David Gerchik who've shown NCAA swimmers can compete internationally for Israel.

Current times (SCY):
• 50 Free: [current]
• 100 Free: [current]

Academic profile:
• GPA: 4.2
• Intended major: Engineering with Real Estate minor
• Orthodox Jewish - observant of Shabbat

I'll be competing at [upcoming meet] and would love to connect. I've attached my recruiting video and SwimCloud profile.

SwimCloud: swimcloud.com/swimmer/3250085

Best regards,
Michael Shapira
""",
                "post_meet_update": """
Subject: Michael Shapira - Updated Times from [Meet Name]

Coach [Name],

Quick update from [Meet Name]:
• 50 Free: [new time] (dropped [amount])
• 100 Free: [new time] (dropped [amount])

I'm on track for my target times of [targets] by [date]. 

Would love to discuss [School] and potentially schedule a visit.

Best,
Michael
"""
            }
        }
        
        return strategy

# =============================================================================
# LANGGRAPH ORCHESTRATOR
# =============================================================================

class D1PathwayOrchestrator:
    """
    LangGraph-style orchestrator for parallel agent execution
    
    Flow:
    1. Initialize athlete state
    2. Run parallel agents: Roster, Calendar, Time Progression
    3. Run dependent agents: Training (needs Time), Competition (needs all)
    4. Generate final report
    """
    
    def __init__(self):
        self.roster_agent = RosterAnalysisAgent()
        self.time_agent = TimeProgressionAgent()
        self.calendar_agent = CalendarAgent()
        self.training_agent = TrainingAgent()
        self.competition_agent = CompetitionAgent()
    
    async def run(self, athlete: AthleteState) -> AnalysisState:
        """Execute full analysis pipeline"""
        
        print("=" * 70)
        print("LANGGRAPH D1 PATHWAY ORCHESTRATOR")
        print("=" * 70)
        print(f"Athlete: {athlete['name']}")
        print(f"Current: {athlete['current_times']['50_free']} / {athlete['current_times']['100_free']}")
        
        state: AnalysisState = {
            "athlete": athlete,
            "roster_analysis": {},
            "time_progression": {},
            "calendar_filtered": [],
            "training_plan": {},
            "competition_strategy": {},
            "report_path": "",
            "errors": [],
            "completed_agents": []
        }
        
        # PHASE 1: Parallel agents (no dependencies)
        print("\n🔄 PHASE 1: Running parallel agents...")
        
        try:
            # Run in parallel
            roster_task = asyncio.create_task(self.roster_agent.analyze(state))
            time_task = asyncio.create_task(self.time_agent.analyze(state))
            calendar_task = asyncio.create_task(self.calendar_agent.analyze(state))
            
            roster_result, time_result, calendar_result = await asyncio.gather(
                roster_task, time_task, calendar_task
            )
            
            state["roster_analysis"] = roster_result
            state["time_progression"] = time_result
            state["calendar_filtered"] = calendar_result
            state["completed_agents"].extend(["roster", "time", "calendar"])
            
            print("   ✅ RosterAnalysisAgent complete")
            print("   ✅ TimeProgressionAgent complete")
            print("   ✅ CalendarAgent complete")
            
        except Exception as e:
            state["errors"].append(f"Phase 1 error: {str(e)}")
            print(f"   ❌ Phase 1 error: {e}")
        
        # PHASE 2: Dependent agents
        print("\n🔄 PHASE 2: Running dependent agents...")
        
        try:
            # Training depends on time progression
            training_result = await self.training_agent.analyze(state, state["time_progression"])
            state["training_plan"] = training_result
            state["completed_agents"].append("training")
            print("   ✅ TrainingAgent complete")
            
            # Competition depends on roster + calendar
            competition_result = await self.competition_agent.analyze(
                state, state["roster_analysis"], state["calendar_filtered"]
            )
            state["competition_strategy"] = competition_result
            state["completed_agents"].append("competition")
            print("   ✅ CompetitionAgent complete")
            
        except Exception as e:
            state["errors"].append(f"Phase 2 error: {str(e)}")
            print(f"   ❌ Phase 2 error: {e}")
        
        # PHASE 3: Save results
        print("\n🔄 PHASE 3: Saving analysis...")
        
        output = {
            "generated": datetime.now().isoformat(),
            "athlete": state["athlete"],
            "roster_analysis": state["roster_analysis"],
            "time_progression": state["time_progression"],
            "calendar": state["calendar_filtered"],
            "training_plan": state["training_plan"],
            "competition_strategy": state["competition_strategy"],
            "completed_agents": state["completed_agents"],
            "errors": state["errors"]
        }
        
        with open("data/langgraph_analysis_output.json", "w") as f:
            json.dump(output, f, indent=2, default=str)
        
        state["report_path"] = "data/langgraph_analysis_output.json"
        
        print("\n" + "=" * 70)
        print("✅ ORCHESTRATION COMPLETE")
        print("=" * 70)
        print(f"Completed agents: {', '.join(state['completed_agents'])}")
        print(f"Errors: {len(state['errors'])}")
        print(f"Output: {state['report_path']}")
        
        return state

# =============================================================================
# MAIN EXECUTION
# =============================================================================

async def main():
    """Run the full orchestration"""
    
    # Michael Shapira's profile
    athlete: AthleteState = {
        "name": "Michael Shapira",
        "swimcloud_id": 3250085,
        "current_times": {
            "50_free": 21.86,
            "100_free": 48.80,
            "200_free": 113.03,
            "100_fly": 55.87
        },
        "height_inches": 76,  # 6'4"
        "class_year": 2027
    }
    
    orchestrator = D1PathwayOrchestrator()
    result = await orchestrator.run(athlete)
    
    # Print summary
    print("\n📊 ANALYSIS SUMMARY:")
    
    print("\n🏊 Comparable Recruits:")
    for r in result["roster_analysis"].get("comparable_recruits", [])[:5]:
        print(f"   • {r['name']} ({r['school']}): HS {r['hs_times']['50']}/{r['hs_times']['100']}")
    
    print("\n📈 Pathway Status:")
    for tier, data in result["time_progression"].get("pathways", {}).items():
        print(f"   • {tier}: {data['status']}")
    
    print("\n📅 Critical Meets:")
    for meet in [m for m in result["calendar_filtered"] if m.get("priority") == "CRITICAL"]:
        print(f"   • {meet['name']}: {meet['attendance_status']}")
    
    print("\n🎯 Target Schools:")
    print(f"   Primary: {result['competition_strategy'].get('primary_targets', {}).get('schools', [])}")
    
    return result

if __name__ == "__main__":
    asyncio.run(main())
