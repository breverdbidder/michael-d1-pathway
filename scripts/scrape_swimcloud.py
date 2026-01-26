#!/usr/bin/env python3
"""
SwimCloud Data Scraper for Michael Shapira
Scrapes times, meet results, and updates local JSON files.

Usage:
    python scrape_swimcloud.py

Requires:
    pip install requests beautifulsoup4
"""

import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Installing required packages...")
    os.system("pip install requests beautifulsoup4 --quiet")
    import requests
    from bs4 import BeautifulSoup

# Configuration
SWIMCLOUD_ID = "3250085"
SWIMMER_NAME = "Michael Shapira"
BASE_URL = "https://www.swimcloud.com"
PROFILE_URL = f"{BASE_URL}/swimmer/{SWIMCLOUD_ID}/"
TIMES_URL = f"{BASE_URL}/swimmer/{SWIMCLOUD_ID}/times/"

# Data directory
DATA_DIR = Path(__file__).parent.parent / "data"


def parse_time_to_seconds(time_str: str) -> float:
    """Convert time string (MM:SS.ss or SS.ss) to seconds."""
    time_str = time_str.strip()
    if ":" in time_str:
        parts = time_str.split(":")
        minutes = int(parts[0])
        seconds = float(parts[1])
        return minutes * 60 + seconds
    return float(time_str)


def scrape_personal_bests() -> dict:
    """Scrape personal best times from SwimCloud."""
    print(f"Scraping personal bests for {SWIMMER_NAME}...")
    
    results = {
        "swimmer": {
            "name": SWIMMER_NAME,
            "swimcloud_id": SWIMCLOUD_ID,
            "swimcloud_url": PROFILE_URL
        },
        "personal_bests": {
            "SCY": {},
            "LCM": {}
        },
        "scraped_at": datetime.utcnow().isoformat()
    }
    
    try:
        # Scrape SCY times
        response = requests.get(f"{TIMES_URL}?course=Y", timeout=30)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find times table
            tables = soup.find_all('table')
            for table in tables:
                rows = table.find_all('tr')
                for row in rows:
                    cells = row.find_all('td')
                    if len(cells) >= 4:
                        event = cells[0].get_text(strip=True)
                        time_text = cells[1].get_text(strip=True)
                        meet = cells[3].get_text(strip=True) if len(cells) > 3 else ""
                        date = cells[4].get_text(strip=True) if len(cells) > 4 else ""
                        
                        if "SCY" in event and time_text:
                            event_name = event.replace(" SCY", "").replace(" ", "_").lower()
                            results["personal_bests"]["SCY"][event_name] = {
                                "time": time_text,
                                "time_seconds": parse_time_to_seconds(time_text),
                                "meet": meet,
                                "date": date
                            }
        
        # Scrape LCM times
        response = requests.get(f"{TIMES_URL}?course=L", timeout=30)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            tables = soup.find_all('table')
            for table in tables:
                rows = table.find_all('tr')
                for row in rows:
                    cells = row.find_all('td')
                    if len(cells) >= 4:
                        event = cells[0].get_text(strip=True)
                        time_text = cells[1].get_text(strip=True)
                        meet = cells[3].get_text(strip=True) if len(cells) > 3 else ""
                        date = cells[4].get_text(strip=True) if len(cells) > 4 else ""
                        
                        if "LCM" in event and time_text:
                            event_name = event.replace(" LCM", "").replace(" ", "_").lower()
                            results["personal_bests"]["LCM"][event_name] = {
                                "time": time_text,
                                "time_seconds": parse_time_to_seconds(time_text),
                                "meet": meet,
                                "date": date
                            }
    
    except requests.RequestException as e:
        print(f"Error scraping SwimCloud: {e}")
        return None
    
    return results


def scrape_recent_results(limit: int = 10) -> list:
    """Scrape recent meet results."""
    print(f"Scraping recent results for {SWIMMER_NAME}...")
    
    results = []
    
    try:
        response = requests.get(PROFILE_URL, timeout=30)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find recent results section
            # This would need to be adapted based on actual SwimCloud HTML structure
            meet_links = soup.find_all('a', href=re.compile(r'/results/\d+'))
            
            for link in meet_links[:limit]:
                meet_name = link.get_text(strip=True)
                meet_url = link.get('href', '')
                
                results.append({
                    "meet_name": meet_name,
                    "meet_url": f"{BASE_URL}{meet_url}" if not meet_url.startswith('http') else meet_url
                })
    
    except requests.RequestException as e:
        print(f"Error scraping recent results: {e}")
    
    return results


def save_data(data: dict, filename: str):
    """Save data to JSON file."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    filepath = DATA_DIR / filename
    
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Saved data to {filepath}")


def main():
    """Main entry point."""
    print("=" * 60)
    print(f"SwimCloud Scraper for {SWIMMER_NAME}")
    print(f"SwimCloud ID: {SWIMCLOUD_ID}")
    print("=" * 60)
    
    # Scrape personal bests
    pbs = scrape_personal_bests()
    if pbs:
        save_data(pbs, "personal_bests_scraped.json")
        
        # Print summary
        print("\nPersonal Bests (SCY):")
        for event, data in pbs["personal_bests"]["SCY"].items():
            print(f"  {event}: {data['time']}")
        
        print("\nPersonal Bests (LCM):")
        for event, data in pbs["personal_bests"]["LCM"].items():
            print(f"  {event}: {data['time']}")
    
    # Scrape recent results
    results = scrape_recent_results()
    if results:
        save_data({
            "swimmer": SWIMMER_NAME,
            "recent_results": results,
            "scraped_at": datetime.utcnow().isoformat()
        }, "recent_results.json")
    
    print("\n" + "=" * 60)
    print("Scraping complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
