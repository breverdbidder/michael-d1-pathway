#!/usr/bin/env python3
"""
Qualification Standards Checker for Michael Shapira
Checks current times against various meet qualifying standards.

Usage:
    python check_qualifications.py

Outputs:
    - Console summary of qualification status
    - JSON file with detailed analysis
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

# Data directory
DATA_DIR = Path(__file__).parent.parent / "data"

# Michael's verified personal bests (SCY) - January 2026
MICHAEL_TIMES_SCY = {
    "50_free": 21.86,      # FHSAA 2A Region 2, Oct 29, 2025
    "100_free": 48.80,     # FHSAA 2A Region 2, Oct 29, 2025
    "200_free": 113.03,    # GSC Holiday Classic, Dec 5, 2025 (1:53.03)
    "100_fly": 55.87,      # GSC Holiday Classic, Dec 5, 2025
    "100_back": 61.14,     # Harry Meisel East, Dec 14, 2025
    "50_fly": 25.39,       # GSC Holiday Classic, Dec 5, 2025 (Exhibition)
    "200_back": 138.79,    # Rats Craigie Memorial, Feb 4, 2024 (2:18.79)
    "100_im": 62.21,       # TCSC Fall Invitational, Oct 13, 2024
    "200_im": 139.60,      # NPB Turkey Invite, Nov 19, 2023 (2:19.60)
}

# Michael's verified personal bests (LCM) - January 2026
MICHAEL_TIMES_LCM = {
    "50_free": 26.59,      # FL Age Group Champs, Jul 14, 2024
    "100_free": 58.28,     # FL Senior Champs, Jul 20, 2025
    "200_free": 132.57,    # FL Age Group Champs, Jul 14, 2023 (2:12.57)
    "100_fly": 67.82,      # FL Age Group Champs, Jul 14, 2023 (1:07.82)
    "100_back": 69.36,     # FL Age Group Champs, Jul 14, 2024 (1:09.36)
    "50_back": 31.00,      # FL Senior Champs, Jul 20, 2025
    "50_fly": 29.49,       # FL Senior Champs, Jul 18, 2025 (Exhibition)
}

# 2026 Sectionals Spring (SCY) - Feb 12-15, Plantation FL
SECTIONALS_SPRING_SCY = {
    "qualifying": {
        "50_free": 22.29,
        "100_free": 48.29,
        "200_free": 105.79,
        "100_fly": 52.29,
        "100_back": 55.09,
        "200_back": 122.29,
        "200_im": 119.39,
    },
    "bonus": {
        "50_free": 22.89,
        "100_free": 49.49,
        "200_free": 108.49,
        "100_fly": 53.59,
        "100_back": 56.49,
        "200_back": 125.39,
        "200_im": 122.39,
    }
}

# 2026 Sectionals Summer (LCM) - Jun 4-7, Ocala FL
SECTIONALS_SUMMER_LCM = {
    "qualifying": {
        "50_free": 25.59,
        "100_free": 55.29,
        "200_free": 120.89,
        "100_fly": 59.59,
        "100_back": 64.49,
    },
    "bonus": {
        "50_free": 26.29,
        "100_free": 56.69,
        "200_free": 123.99,
        "100_fly": 61.09,
        "100_back": 66.19,
    }
}

# 2026 Futures (LCM) - Jul 29 - Aug 1, Ocala FL
FUTURES_LCM = {
    "qualifying": {
        "50_free": 24.09,
        "100_free": 53.09,
        "200_free": 115.09,
        "100_fly": 56.79,
        "100_back": 61.59,
    }
}


def format_time(seconds: float) -> str:
    """Format seconds as MM:SS.ss or SS.ss."""
    if seconds >= 60:
        minutes = int(seconds // 60)
        secs = seconds % 60
        return f"{minutes}:{secs:05.2f}"
    return f"{seconds:.2f}"


def check_qualification(
    michael_time: float,
    qualifying_time: float,
    bonus_time: float = None
) -> Tuple[str, float]:
    """
    Check qualification status and gap.
    Returns: (status, gap_seconds)
    """
    if michael_time <= qualifying_time:
        return "QUALIFIED", qualifying_time - michael_time
    elif bonus_time and michael_time <= bonus_time:
        return "BONUS", bonus_time - michael_time
    else:
        target = bonus_time if bonus_time else qualifying_time
        return "NOT_QUALIFIED", michael_time - target


def analyze_meet(
    meet_name: str,
    standards: Dict,
    michael_times: Dict,
    course: str
) -> List[Dict]:
    """Analyze qualification status for a meet."""
    results = []
    
    qualifying = standards.get("qualifying", {})
    bonus = standards.get("bonus", {})
    
    for event, qual_time in qualifying.items():
        if event in michael_times:
            michael_time = michael_times[event]
            bonus_time = bonus.get(event)
            
            status, gap = check_qualification(michael_time, qual_time, bonus_time)
            
            results.append({
                "event": event.replace("_", " ").title(),
                "michael_time": format_time(michael_time),
                "michael_seconds": michael_time,
                "qualifying_cut": format_time(qual_time),
                "bonus_cut": format_time(bonus_time) if bonus_time else "N/A",
                "status": status,
                "gap_seconds": round(gap, 2),
                "gap_display": f"+{gap:.2f}" if status == "NOT_QUALIFIED" else f"-{abs(gap):.2f}"
            })
    
    return results


def print_meet_analysis(meet_name: str, results: List[Dict]):
    """Print formatted meet analysis."""
    print(f"\n{'='*60}")
    print(f"  {meet_name}")
    print(f"{'='*60}")
    
    # Count statuses
    qualified = sum(1 for r in results if r["status"] == "QUALIFIED")
    bonus = sum(1 for r in results if r["status"] == "BONUS")
    not_qual = sum(1 for r in results if r["status"] == "NOT_QUALIFIED")
    
    print(f"\n  Summary: {qualified} Qualified | {bonus} Bonus | {not_qual} Not Qualified")
    print(f"\n  {'Event':<15} {'Michael':<10} {'Qual Cut':<10} {'Bonus':<10} {'Status':<15} {'Gap':<10}")
    print(f"  {'-'*70}")
    
    for r in results:
        status_emoji = "✅" if r["status"] == "QUALIFIED" else "🟡" if r["status"] == "BONUS" else "❌"
        print(f"  {r['event']:<15} {r['michael_time']:<10} {r['qualifying_cut']:<10} {r['bonus_cut']:<10} {status_emoji} {r['status']:<12} {r['gap_display']:<10}")


def main():
    """Main entry point."""
    print("\n" + "="*60)
    print("  MICHAEL SHAPIRA - QUALIFICATION STATUS CHECKER")
    print("  SwimCloud ID: 3250085")
    print(f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("="*60)
    
    all_results = {}
    
    # Sectionals Spring (SCY)
    results = analyze_meet(
        "2026 Sectionals Spring (SCY) - Feb 12-15",
        SECTIONALS_SPRING_SCY,
        MICHAEL_TIMES_SCY,
        "SCY"
    )
    print_meet_analysis("2026 Sectionals Spring (SCY) - Feb 12-15, Plantation FL", results)
    all_results["sectionals_spring_scy"] = results
    
    # Sectionals Summer (LCM)
    results = analyze_meet(
        "2026 Sectionals Summer (LCM) - Jun 4-7",
        SECTIONALS_SUMMER_LCM,
        MICHAEL_TIMES_LCM,
        "LCM"
    )
    print_meet_analysis("2026 Sectionals Summer (LCM) - Jun 4-7, Ocala FL", results)
    all_results["sectionals_summer_lcm"] = results
    
    # Futures (LCM)
    results = analyze_meet(
        "2026 Futures (LCM) - Jul 29 - Aug 1",
        FUTURES_LCM,
        MICHAEL_TIMES_LCM,
        "LCM"
    )
    print_meet_analysis("2026 USA Swimming Futures (LCM) - Jul 29 - Aug 1, Ocala FL", results)
    all_results["futures_lcm"] = results
    
    # Key Takeaways
    print("\n" + "="*60)
    print("  KEY TAKEAWAYS")
    print("="*60)
    
    print("""
  SECTIONALS SPRING (FEB):
  ✅ 50 Free: QUALIFIED (21.86 < 22.29) - BUT SATURDAY = SHABBAT CONFLICT
  🟡 100 Free: BONUS (48.80 < 49.49) - SUNDAY = CAN SWIM
  ❌ 200 Free: Need -4.54s (1:53.03 → 1:48.49)
  ❌ 100 Fly: Need -2.28s (55.87 → 53.59)

  SECTIONALS SUMMER (JUN):
  ❌ 50 Free: Need -0.30s (26.59 → 26.29 bonus)
  ❌ 100 Free: Need -1.59s (58.28 → 56.69 bonus)
  
  FUTURES (JUL) - PRIMARY RECRUITING MEET:
  ❌ 50 Free: Need -2.50s (26.59 → 24.09)
  ❌ 100 Free: Need -5.19s (58.28 → 53.09)
  
  RECOMMENDATION:
  - Focus on SCY times for Spring Sectionals
  - Build LCM base in May-June for Summer meets
  - Futures qualifying is stretch goal for 2026
    """)
    
    # Save results
    output = {
        "swimmer": "Michael Shapira",
        "swimcloud_id": "3250085",
        "generated_at": datetime.utcnow().isoformat(),
        "michael_times": {
            "SCY": {k: format_time(v) for k, v in MICHAEL_TIMES_SCY.items()},
            "LCM": {k: format_time(v) for k, v in MICHAEL_TIMES_LCM.items()}
        },
        "qualification_analysis": all_results
    }
    
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    output_path = DATA_DIR / "qualification_analysis.json"
    
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\n  Full analysis saved to: {output_path}")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
