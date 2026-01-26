#!/usr/bin/env python3
"""
Jewish Calendar Data Sync Script

Fetches comprehensive Jewish calendar data from Hebcal API and saves
to JSON database for Michael's D1 pathway scheduling.

Includes:
- Shabbat times (candle lighting, havdalah)
- Major holidays (Yom Tov)  
- יום שני של גלויות (Yom Sheni Shel Galuyot) - second day of diaspora holidays
- Fast days
- Rosh Chodesh
- Special Shabbatot
- Omer counting
- Yizkor dates

Usage:
    python sync_calendar.py [--year 2026] [--output data/jewish_calendar.json]
"""

import asyncio
import json
import argparse
from datetime import datetime
from pathlib import Path
import httpx

# Configuration
HEBCAL_BASE_URL = "https://www.hebcal.com/hebcal"

# Satellite Beach, FL location
DEFAULT_LOCATION = {
    "name": "Satellite Beach, FL",
    "latitude": 28.1761,
    "longitude": -80.5900,
    "timezone": "America/New_York",
    "zip": "32937"
}

# Chabad standard times
CANDLE_LIGHTING_MINUTES = 18
HAVDALAH_MINUTES = 50


async def fetch_hebcal_data(year: int, location: dict = None) -> dict:
    """Fetch full calendar data from Hebcal API"""
    
    loc = location or DEFAULT_LOCATION
    
    params = {
        "cfg": "json",
        "v": "1",
        "year": year,
        "zip": loc["zip"],
        "b": CANDLE_LIGHTING_MINUTES,
        "m": HAVDALAH_MINUTES,
        "M": "on",      # Havdalah calculation
        "maj": "on",    # Major holidays
        "min": "on",    # Minor holidays
        "mod": "on",    # Modern holidays
        "nx": "on",     # Rosh Chodesh
        "mf": "on",     # Minor fasts
        "ss": "on",     # Special Shabbatot
        "s": "on",      # Parsha
        "c": "on",      # Candle lighting
        "o": "on",      # Omer
        "d": "on",      # Hebrew dates
        "yzkr": "on",   # Yizkor
        "lg": "h",      # Hebrew titles
        "hdp": "1",     # Hebrew date parts
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(HEBCAL_BASE_URL, params=params)
        response.raise_for_status()
        return response.json()


def categorize_events(hebcal_data: dict) -> dict:
    """Categorize Hebcal events into structured database"""
    
    # Events where melacha is prohibited (English AND Hebrew patterns)
    MELACHA_PATTERNS = [
        # English
        "Rosh Hashana", "Yom Kippur", "Sukkot I", "Sukkot II",
        "Shmini Atzeret", "Simchat Torah", 
        "Pesach I", "Pesach II", "Pesach VII", "Pesach VIII",
        "Shavuot I", "Shavuot II",
        # Hebrew - Major holidays first/last days (NOT chol hamoed)
        "רֹאשׁ הַשָּׁנָה", "ראש השנה",
        "יוֹם כִּפּוּר", "יום כיפור",
        "סוּכּוֹת א", "סוכות א",
        "סוּכּוֹת ב", "סוכות ב",
        "שְׁמִינִי עֲצֶרֶת", "שמיני עצרת",
        "שִׂמְחַת תּוֹרָה", "שמחת תורה",
        "פֶּסַח א", "פסח א",  # First day
        "פֶּסַח ב", "פסח ב",  # Second day (יום שני של גלויות)
        "פֶּסַח ז", "פסח ז",  # Seventh day
        "פֶּסַח ח", "פסח ח",  # Eighth day (יום שני של גלויות)
        "שָׁבוּעוֹת א", "שבועות א",
        "שָׁבוּעוֹת ב", "שבועות ב",  # יום שני של גלויות
    ]
    
    # יום שני של גלויות - Second day of diaspora holidays (Hebrew patterns)
    YOM_SHENI_PATTERNS = [
        # English
        "Rosh Hashana II", "Sukkot II", "Simchat Torah", 
        "Pesach II", "Pesach VIII", "Shavuot II",
        # Hebrew - note the ב (bet) for second day
        "רֹאשׁ הַשָּׁנָה ב", "ראש השנה ב",
        "סוּכּוֹת ב", "סוכות ב",
        "שִׂמְחַת תּוֹרָה", "שמחת תורה",
        "פֶּסַח ב׳", "פסח ב",  # ב' = 2nd day
        "פֶּסַח ח", "פסח ח",  # ח' = 8th day  
        "שָׁבוּעוֹת ב", "שבועות ב",
    ]
    
    # Yizkor days (Hebrew patterns)
    YIZKOR_PATTERNS = [
        "Yom Kippur", "יוֹם כִּפּוּר", "יום כיפור",
        "Shmini Atzeret", "שְׁמִינִי עֲצֶרֶת", "שמיני עצרת",
        "Pesach VII", "פֶּסַח ז", "פסח ז",
        "Pesach VIII", "פֶּסַח ח", "פסח ח",
        "Shavuot", "שָׁבוּעוֹת", "שבועות"
    ]
    
    # Fast days (Hebrew patterns)
    FAST_PATTERNS = {
        "צוֹם גְּדַלְיָה": "Tzom Gedaliah",
        "צום גדליה": "Tzom Gedaliah",
        "יוֹם כִּפּוּר": "Yom Kippur",
        "יום כיפור": "Yom Kippur",
        "עֲשָׂרָה בְּטֵבֵת": "Asara B'Tevet",
        "עשרה בטבת": "Asara B'Tevet",
        "תַּעֲנִית אֶסְתֵּר": "Ta'anit Esther",
        "תענית אסתר": "Ta'anit Esther",
        "תַּעֲנִית בְּכוֹרוֹת": "Ta'anit Bechorot",
        "תענית בכורות": "Ta'anit Bechorot",
        "תִּשְׁעָה בְּאָב": "Tisha B'Av",
        "תשעה באב": "Tisha B'Av",
        "צוֹם תַּמּוּז": "Tzom Tammuz",
        "צום תמוז": "Tzom Tammuz",
        "שִׁבְעָה עָשָׂר בְּתַמּוּז": "Tzom Tammuz"
    }
    
    database = {
        "shabbatot": [],
        "candle_lighting": [],
        "havdalah": [],
        "yom_tov": [],
        "yom_sheni_galuyot": [],  # יום שני של גלויות
        "chol_hamoed": [],
        "fast_days": [],
        "rosh_chodesh": [],
        "special_shabbatot": [],
        "omer": [],
        "minor_holidays": [],
        "modern_holidays": [],
        "yizkor_dates": [],
        "all_melacha_prohibited": []
    }
    
    for item in hebcal_data.get("items", []):
        title = item.get("title", "")
        category = item.get("category", "")
        date = item.get("date", "")
        hebrew = item.get("hebrew", "")
        
        event = {
            "title": title,
            "hebrew": hebrew,
            "date": date,
            "hebrew_date": item.get("hdate", ""),
            "category": category,
            "memo": item.get("memo", ""),
            "link": item.get("link", "")
        }
        
        # Determine if melacha prohibited using patterns
        is_melacha_prohibited = False
        title_lower = title.lower()
        
        # Check for melacha prohibition
        for pattern in MELACHA_PATTERNS:
            if pattern.lower() in title_lower or pattern in title:
                is_melacha_prohibited = True
                break
        
        # Check for יום שני של גלויות
        is_yom_sheni = False
        for pattern in YOM_SHENI_PATTERNS:
            if pattern.lower() in title_lower or pattern in title:
                is_yom_sheni = True
                break
        
        # Check for Yizkor
        is_yizkor = False
        for pattern in YIZKOR_PATTERNS:
            if pattern.lower() in title_lower or pattern in title:
                is_yizkor = True
                break
        
        # Check for fast day
        is_fast = False
        for pattern in FAST_PATTERNS.keys():
            if pattern in title:
                is_fast = True
                event["fast_english"] = FAST_PATTERNS[pattern]
                break
        
        # Shabbat candle lighting
        if category == "candles":
            database["candle_lighting"].append(event)
            if "Shabbat" in title or "Erev Shabbat" in title or "שבת" in title:
                is_melacha_prohibited = True
                event["for_shabbat"] = True
            elif is_melacha_prohibited:
                event["for_yom_tov"] = True
        
        # Havdalah
        elif category == "havdalah":
            database["havdalah"].append(event)
        
        # Parsha (Shabbat)
        elif category == "parashat":
            database["shabbatot"].append(event)
            is_melacha_prohibited = True
        
        # Holidays
        elif category == "holiday":
            # Check if יום שני של גלויות
            if is_yom_sheni:
                event["yom_sheni_galuyot"] = True
                event["hebrew_explanation"] = "יום שני של גלויות"
                database["yom_sheni_galuyot"].append(event)
                is_melacha_prohibited = True
                event["melacha_prohibited"] = True
            
            # Major holiday with melacha prohibition
            elif is_melacha_prohibited:
                event["melacha_prohibited"] = True
                database["yom_tov"].append(event)
            
            # Chol HaMoed
            elif "חוה״מ" in title or "חול המועד" in title or "Chol ha-Moed" in title or "Chol HaMoed" in title:
                database["chol_hamoed"].append(event)
            
            # Special Shabbat
            elif "שַׁבַּת" in title or "Shabbat" in title:
                database["special_shabbatot"].append(event)
            
            # Minor holiday
            else:
                database["minor_holidays"].append(event)
            
            # Check for fast day
            if is_fast:
                database["fast_days"].append(event)
            
            # Check for Yizkor
            if is_yizkor:
                event["yizkor"] = True
                database["yizkor_dates"].append(event)
        
        # Rosh Chodesh
        elif category == "roshchodesh":
            database["rosh_chodesh"].append(event)
        
        # Omer
        elif category == "omer":
            database["omer"].append(event)
        
        # Modern holidays
        elif category == "modern":
            database["modern_holidays"].append(event)
        
        # Track all melacha prohibited dates
        if is_melacha_prohibited:
            database["all_melacha_prohibited"].append({
                "date": date.split("T")[0] if "T" in date else date,
                "title": title,
                "hebrew": hebrew,
                "category": category,
                "yom_sheni_galuyot": event.get("yom_sheni_galuyot", False)
            })
    
    return database


def check_meet_conflicts(database: dict, meet_schedule: list) -> dict:
    """Check swim meet dates against Shabbat/Yom Tov"""
    
    # Build set of prohibited dates
    prohibited_dates = {}
    for item in database["all_melacha_prohibited"]:
        date = item["date"]
        if date not in prohibited_dates:
            prohibited_dates[date] = []
        prohibited_dates[date].append(item)
    
    conflicts = []
    safe_dates = []
    
    for meet in meet_schedule:
        meet_date = meet if isinstance(meet, str) else meet.get("date")
        
        if meet_date in prohibited_dates:
            events = prohibited_dates[meet_date]
            conflicts.append({
                "date": meet_date,
                "conflicts_with": events,
                "can_swim": False,
                "reason": "שבת או יום טוב - Shabbat or Yom Tov"
            })
        else:
            safe_dates.append(meet_date)
    
    return {
        "total_dates": len(meet_schedule),
        "conflicts": conflicts,
        "conflict_count": len(conflicts),
        "safe_dates": safe_dates,
        "safe_count": len(safe_dates)
    }


async def build_calendar_database(years: list, output_path: str):
    """Build complete calendar database for multiple years"""
    
    print(f"🕎 Building Jewish Calendar Database for {years}")
    print(f"📍 Location: {DEFAULT_LOCATION['name']}")
    print()
    
    full_database = {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "location": DEFAULT_LOCATION,
            "candle_lighting_minutes": CANDLE_LIGHTING_MINUTES,
            "havdalah_minutes": HAVDALAH_MINUTES,
            "years": years,
            "diaspora": True,
            "includes_yom_sheni_galuyot": True,
            "description": "Complete Jewish calendar with יום שני של גלויות for diaspora observance"
        },
        "years": {},
        "summary": {
            "total_shabbatot": 0,
            "total_yom_tov": 0,
            "total_yom_sheni_galuyot": 0,
            "total_fast_days": 0,
            "total_melacha_prohibited": 0
        }
    }
    
    for year in years:
        print(f"📅 Fetching {year}...")
        
        hebcal_data = await fetch_hebcal_data(year)
        categorized = categorize_events(hebcal_data)
        
        full_database["years"][str(year)] = {
            "raw_item_count": len(hebcal_data.get("items", [])),
            "events": categorized
        }
        
        # Update summary
        full_database["summary"]["total_shabbatot"] += len(categorized["shabbatot"])
        full_database["summary"]["total_yom_tov"] += len(categorized["yom_tov"])
        full_database["summary"]["total_yom_sheni_galuyot"] += len(categorized["yom_sheni_galuyot"])
        full_database["summary"]["total_fast_days"] += len(categorized["fast_days"])
        full_database["summary"]["total_melacha_prohibited"] += len(categorized["all_melacha_prohibited"])
        
        print(f"   ✅ {len(categorized['shabbatot'])} Shabbatot")
        print(f"   ✅ {len(categorized['yom_tov'])} Yom Tov days")
        print(f"   ✅ {len(categorized['yom_sheni_galuyot'])} יום שני של גלויות days")
        print(f"   ✅ {len(categorized['fast_days'])} Fast days")
    
    # Save to file
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output, "w", encoding="utf-8") as f:
        json.dump(full_database, f, indent=2, ensure_ascii=False)
    
    print()
    print(f"✅ Database saved to: {output_path}")
    print()
    print("📊 Summary:")
    print(f"   Total Shabbatot: {full_database['summary']['total_shabbatot']}")
    print(f"   Total Yom Tov: {full_database['summary']['total_yom_tov']}")
    print(f"   Total יום שני של גלויות: {full_database['summary']['total_yom_sheni_galuyot']}")
    print(f"   Total Fast Days: {full_database['summary']['total_fast_days']}")
    print(f"   Total Melacha Prohibited: {full_database['summary']['total_melacha_prohibited']}")
    
    return full_database


async def main():
    parser = argparse.ArgumentParser(description="Sync Jewish Calendar Data")
    parser.add_argument("--years", type=int, nargs="+", default=[2025, 2026, 2027],
                        help="Years to fetch (default: 2025 2026 2027)")
    parser.add_argument("--output", type=str, default="data/jewish_calendar_database.json",
                        help="Output file path")
    parser.add_argument("--check-meets", action="store_true",
                        help="Check Michael's meet schedule against calendar")
    
    args = parser.parse_args()
    
    # Build database
    database = await build_calendar_database(args.years, args.output)
    
    # Optionally check meet schedule
    if args.check_meets:
        print()
        print("🏊 Checking Michael's 2026 Meet Schedule...")
        
        michael_meets_2026 = [
            "2026-02-06", "2026-02-07", "2026-02-08",  # Rats Invite
            "2026-02-12", "2026-02-13", "2026-02-14", "2026-02-15",  # Sectionals
            "2026-02-27", "2026-02-28", "2026-03-01",  # Area 6 Champs
            "2026-03-12", "2026-03-13", "2026-03-14", "2026-03-15",  # Senior Champs
            "2026-06-04", "2026-06-05", "2026-06-06", "2026-06-07",  # Sectionals LCM
            "2026-07-16", "2026-07-17", "2026-07-18", "2026-07-19",  # Senior Champs LCM  
            "2026-07-29", "2026-07-30", "2026-07-31", "2026-08-01"   # Futures
        ]
        
        if "2026" in database["years"]:
            results = check_meet_conflicts(
                database["years"]["2026"]["events"],
                michael_meets_2026
            )
            
            print()
            print(f"📅 Total meet dates: {results['total_dates']}")
            print(f"❌ Conflicts: {results['conflict_count']}")
            print(f"✅ Safe dates: {results['safe_count']}")
            
            if results["conflicts"]:
                print()
                print("⚠️ CONFLICTS:")
                for conflict in results["conflicts"]:
                    for c in conflict["conflicts_with"]:
                        yom_sheni = " (יום שני של גלויות)" if c.get("yom_sheni_galuyot") else ""
                        print(f"   {conflict['date']}: {c['title']}{yom_sheni}")
            
            # Save conflict report
            conflict_path = args.output.replace(".json", "_meet_conflicts.json")
            with open(conflict_path, "w", encoding="utf-8") as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            print()
            print(f"📄 Conflict report saved to: {conflict_path}")


if __name__ == "__main__":
    asyncio.run(main())
