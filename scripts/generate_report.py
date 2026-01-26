#!/usr/bin/env python3
"""
Michael Shapira D1 Pathway - Weekly Report Generator

Generates comprehensive weekly reports including:
- Time progression analysis
- Qualification status
- Recruiting tracker summary
- Upcoming meets and actions

Usage:
    python generate_report.py [--output-format md|html|json]
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

# Configuration
DATA_DIR = Path(__file__).parent.parent / "data"
OUTPUT_DIR = Path(__file__).parent.parent / "reports"
SWIMMER_NAME = "Michael Shapira"
SWIMCLOUD_ID = "3250085"


def load_json(filename: str) -> Optional[Dict]:
    """Load JSON file from data directory."""
    filepath = DATA_DIR / filename
    if filepath.exists():
        with open(filepath, 'r') as f:
            return json.load(f)
    return None


def format_time(seconds: float) -> str:
    """Format seconds as MM:SS.ss or SS.ss."""
    if seconds >= 60:
        minutes = int(seconds // 60)
        secs = seconds % 60
        return f"{minutes}:{secs:05.2f}"
    return f"{seconds:.2f}"


def calculate_improvement(old_time: float, new_time: float) -> str:
    """Calculate improvement between times."""
    diff = new_time - old_time
    if diff < 0:
        return f"-{abs(diff):.2f}s ⬇️"
    elif diff > 0:
        return f"+{diff:.2f}s ⬆️"
    return "0.00s"


def generate_qualification_section(standards: Dict, times: Dict) -> str:
    """Generate qualification status section."""
    lines = ["## 🎯 Qualification Status\n"]
    
    michael_scy = {
        "50_free": 21.86,
        "100_free": 48.80,
        "200_free": 113.03,
        "100_fly": 55.87,
        "100_back": 61.14,
    }
    
    # Sectionals Spring
    lines.append("### Sectionals Spring (Feb 12-15)\n")
    lines.append("| Event | Michael | Qual | Bonus | Status |")
    lines.append("|-------|---------|------|-------|--------|")
    
    sect_qual = {"50_free": 22.29, "100_free": 48.29, "200_free": 105.79, "100_fly": 52.29, "100_back": 55.09}
    sect_bonus = {"50_free": 22.89, "100_free": 49.49, "200_free": 108.49, "100_fly": 53.59, "100_back": 56.49}
    
    for event, michael_time in michael_scy.items():
        qual = sect_qual.get(event, 999)
        bonus = sect_bonus.get(event, 999)
        
        if michael_time <= qual:
            status = "✅ QUALIFIED"
        elif michael_time <= bonus:
            status = "🟡 BONUS"
        else:
            gap = michael_time - bonus
            status = f"❌ -{gap:.2f}s"
        
        event_name = event.replace("_", " ").title()
        lines.append(f"| {event_name} | {format_time(michael_time)} | {format_time(qual)} | {format_time(bonus)} | {status} |")
    
    return "\n".join(lines)


def generate_upcoming_meets_section(schedule: Dict) -> str:
    """Generate upcoming meets section."""
    lines = ["## 📅 Upcoming Meets\n"]
    
    today = datetime.now()
    upcoming = []
    
    if schedule and "meet_schedule_2026" in schedule:
        for month, meets in schedule["meet_schedule_2026"].items():
            if isinstance(meets, list):
                for meet in meets:
                    if meet.get("dates", {}).get("start"):
                        meet_date = datetime.strptime(meet["dates"]["start"], "%Y-%m-%d")
                        if meet_date > today:
                            upcoming.append({
                                "name": meet.get("name", "Unknown"),
                                "date": meet_date,
                                "location": meet.get("location", "TBD"),
                                "priority": meet.get("priority", "medium"),
                                "shabbat": meet.get("shabbat_conflict", False)
                            })
    
    upcoming.sort(key=lambda x: x["date"])
    
    lines.append("| Meet | Date | Location | Priority | Shabbat |")
    lines.append("|------|------|----------|----------|---------|")
    
    for meet in upcoming[:5]:
        shabbat = "⚠️ Yes" if meet["shabbat"] else "✅ No"
        priority_emoji = "🔴" if meet["priority"] in ["HIGH", "CRITICAL"] else "🟡" if meet["priority"] == "medium" else "⚪"
        lines.append(f"| {meet['name']} | {meet['date'].strftime('%b %d')} | {meet['location']} | {priority_emoji} {meet['priority']} | {shabbat} |")
    
    return "\n".join(lines)


def generate_recruiting_section(tracker: Dict) -> str:
    """Generate recruiting tracker summary."""
    lines = ["## 📧 Recruiting Summary\n"]
    
    if not tracker:
        lines.append("_No recruiting data available_")
        return "\n".join(lines)
    
    schools = tracker.get("schools_contacted", [])
    
    # Summary counts
    questionnaires = sum(1 for s in schools if s.get("questionnaire_submitted"))
    emails_sent = sum(1 for s in schools if s.get("initial_email_sent"))
    responses = sum(1 for s in schools if s.get("response_received"))
    
    lines.append(f"**Schools Tracked:** {len(schools)}")
    lines.append(f"**Questionnaires Submitted:** {questionnaires}/{len(schools)}")
    lines.append(f"**Initial Emails Sent:** {emails_sent}/{len(schools)}")
    lines.append(f"**Responses Received:** {responses}/{emails_sent if emails_sent > 0 else 1}\n")
    
    # Upcoming actions
    actions = tracker.get("upcoming_actions", [])
    if actions:
        lines.append("### Upcoming Actions")
        lines.append("| Action | Due Date | Priority |")
        lines.append("|--------|----------|----------|")
        for action in actions[:5]:
            priority_emoji = "🔴" if action.get("priority") == "high" else "🟡"
            lines.append(f"| {action['action']} | {action['due_date']} | {priority_emoji} |")
    
    return "\n".join(lines)


def generate_full_report() -> str:
    """Generate complete weekly report."""
    report_date = datetime.now().strftime("%Y-%m-%d")
    
    # Load all data
    personal_bests = load_json("personal_bests.json")
    standards = load_json("qualifying_standards.json")
    schedule = load_json("meet_schedule.json")
    tracker = load_json("recruiting_tracker.json")
    history = load_json("meet_history.json")
    
    # Build report
    lines = [
        f"# 🏊 Michael Shapira - D1 Pathway Weekly Report",
        f"**Generated:** {report_date}",
        f"**SwimCloud:** [Profile](https://www.swimcloud.com/swimmer/{SWIMCLOUD_ID}/)\n",
        "---\n",
        "## 📊 Current Personal Bests (SCY)\n",
        "| Event | Time | Meet | Date |",
        "|-------|------|------|------|",
        "| 50 Free | **21.86** | FHSAA Region 2 | Oct 29, 2025 |",
        "| 100 Free | **48.80** | FHSAA Region 2 | Oct 29, 2025 |",
        "| 200 Free | 1:53.03 | GSC Holiday | Dec 5, 2025 |",
        "| 100 Fly | 55.87 | GSC Holiday | Dec 5, 2025 |",
        "| 100 Back | 1:01.14 | Harry Meisel | Dec 14, 2025 |\n",
    ]
    
    # Add qualification section
    lines.append(generate_qualification_section(standards, personal_bests))
    lines.append("\n")
    
    # Add upcoming meets
    lines.append(generate_upcoming_meets_section(schedule))
    lines.append("\n")
    
    # Add recruiting summary
    lines.append(generate_recruiting_section(tracker))
    lines.append("\n")
    
    # Footer
    lines.extend([
        "---",
        f"*Report generated by michael-d1-pathway automation*",
        f"*Last data sync: {report_date}*"
    ])
    
    return "\n".join(lines)


def save_report(content: str, format: str = "md"):
    """Save report to file."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y-%m-%d")
    filename = f"weekly_report_{timestamp}.{format}"
    filepath = OUTPUT_DIR / filename
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"✅ Report saved to: {filepath}")
    return filepath


def main():
    """Main entry point."""
    print("=" * 60)
    print(f"  Michael Shapira D1 Pathway - Report Generator")
    print(f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)
    
    # Generate report
    report = generate_full_report()
    
    # Print to console
    print("\n" + report)
    
    # Save to file
    save_report(report, "md")
    
    print("\n" + "=" * 60)
    print("  Report generation complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
