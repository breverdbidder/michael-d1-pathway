#!/usr/bin/env python3
"""
Supabase Data Push Script for Michael D1 Pathway

Pushes ALL data to Supabase:
- 25 Repository files (base64 encoded)
- 192 Melacha prohibited dates
- 18 יום שני של גלויות dates
- 29 D1 target schools
- 9 Meet schedule entries

PREREQUISITE: Run supabase_create_tables_only.sql first!

Usage:
    python scripts/push_to_supabase.py
"""

import json
import base64
import httpx
import asyncio
from datetime import datetime
from typing import List, Dict, Any

# ============================================================
# CONFIGURATION
# ============================================================
import os

# Get from environment variables or use defaults for local testing
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://mocerqjnksmhcjzxrewo.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")  # Required - set in environment
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")  # Required - set in environment
REPO = "breverdbidder/michael-d1-pathway"

# Validate required environment variables
if not SUPABASE_KEY:
    print("❌ SUPABASE_SERVICE_KEY environment variable not set")
    print("   Set it with: export SUPABASE_SERVICE_KEY='your-service-role-key'")
    exit(1)

if not GITHUB_TOKEN:
    print("❌ GITHUB_TOKEN environment variable not set")
    print("   Set it with: export GITHUB_TOKEN='your-github-token'")
    exit(1)

# ============================================================
# SUPABASE CLIENT
# ============================================================

class SupabaseClient:
    def __init__(self, url: str, key: str):
        self.url = url
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
    
    async def upsert(self, table: str, data: List[Dict], on_conflict: str = None) -> bool:
        """Insert or update records"""
        headers = {**self.headers}
        if on_conflict:
            headers["Prefer"] = "return=minimal,resolution=merge-duplicates"
        
        batch_size = 50
        success = True
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            for i in range(0, len(data), batch_size):
                batch = data[i:i+batch_size]
                try:
                    resp = await client.post(
                        f"{self.url}/rest/v1/{table}",
                        headers=headers,
                        json=batch
                    )
                    
                    if resp.status_code not in [200, 201]:
                        print(f"  ❌ Batch {i//batch_size + 1}: {resp.status_code} - {resp.text[:100]}")
                        success = False
                    else:
                        print(f"  ✅ Batch {i//batch_size + 1}: {len(batch)} records")
                except Exception as e:
                    print(f"  ❌ Batch {i//batch_size + 1}: {e}")
                    success = False
        
        return success
    
    async def check_table(self, table: str) -> bool:
        """Check if table exists"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{self.url}/rest/v1/{table}?limit=1",
                headers=self.headers
            )
            return resp.status_code == 200

# ============================================================
# DATA LOADERS
# ============================================================

async def fetch_github_files() -> List[Dict]:
    """Fetch all files from GitHub and encode as base64"""
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    async def get_contents(path: str = "") -> List[Dict]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = f"https://api.github.com/repos/{REPO}/contents/{path}"
            resp = await client.get(url, headers=headers)
            
            if resp.status_code != 200:
                return []
            
            files = []
            for item in resp.json():
                if item["type"] == "file":
                    files.append(item)
                elif item["type"] == "dir":
                    files.extend(await get_contents(item["path"]))
            return files
    
    print("📥 Fetching files from GitHub...")
    file_list = await get_contents()
    
    records = []
    async with httpx.AsyncClient(timeout=30.0) as client:
        for file_info in file_list:
            try:
                resp = await client.get(file_info["download_url"])
                if resp.status_code == 200:
                    content_b64 = base64.b64encode(resp.content).decode('utf-8')
                    
                    ext = file_info["name"].split(".")[-1] if "." in file_info["name"] else "unknown"
                    mime_types = {
                        "json": "application/json",
                        "md": "text/markdown",
                        "py": "text/x-python",
                        "yml": "text/yaml",
                        "txt": "text/plain",
                        "sql": "application/sql"
                    }
                    
                    records.append({
                        "repo_name": "michael-d1-pathway",
                        "file_path": file_info["path"],
                        "file_name": file_info["name"],
                        "file_type": ext,
                        "mime_type": mime_types.get(ext, "application/octet-stream"),
                        "size_bytes": file_info["size"],
                        "sha": file_info["sha"],
                        "content_base64": content_b64,
                        "source": "github"
                    })
                    print(f"  ✓ {file_info['path']}")
            except Exception as e:
                print(f"  ✗ {file_info['path']}: {e}")
    
    return records


def load_melacha_dates(filepath: str = "data/melacha_prohibited_dates.json") -> List[Dict]:
    """Load melacha prohibited dates"""
    with open(filepath, "r") as f:
        data = json.load(f)
    
    records = []
    for item in data["melacha_prohibited_dates"]:
        date = item["date"][:10] if "T" in item["date"] else item["date"]
        records.append({
            "date": date,
            "title": item["title"],
            "hebrew": item.get("hebrew", ""),
            "category": "shabbat" if "פָּרָשַׁת" in item["title"] else "yomtov",
            "yom_sheni_galuyot": item.get("yom_sheni", False),
            "year": int(date[:4])
        })
    
    return records


def load_yom_sheni_galuyot(filepath: str = "data/yom_sheni_galuyot.json") -> List[Dict]:
    """Load יום שני של גלויות dates"""
    with open(filepath, "r") as f:
        data = json.load(f)
    
    hebrew_to_english = {
        "פֶּסַח ב׳": "Pesach II",
        "פֶּסַח ח׳": "Pesach VIII",
        "שָׁבוּעוֹת ב׳": "Shavuot II",
        "רֹאשׁ הַשָּׁנָה ב׳": "Rosh Hashana II",
        "סוּכּוֹת ב׳": "Sukkot II",
        "שִׂמְחַת תּוֹרָה": "Simchat Torah"
    }
    
    first_day_map = {
        "פֶּסַח ב׳": "Pesach I",
        "פֶּסַח ח׳": "Pesach VII",
        "שָׁבוּעוֹת ב׳": "Shavuot I",
        "רֹאשׁ הַשָּׁנָה ב׳": "Rosh Hashana I",
        "סוּכּוֹת ב׳": "Sukkot I",
        "שִׂמְחַת תּוֹרָה": "Shmini Atzeret"
    }
    
    records = []
    for item in data["dates"]:
        records.append({
            "date": item["date"],
            "title": item["title"],
            "hebrew": item.get("hebrew", ""),
            "english_name": hebrew_to_english.get(item["title"], item["title"]),
            "first_day_name": first_day_map.get(item["title"], ""),
            "year": int(item["year"])
        })
    
    return records


def load_d1_schools(filepath: str = "data/d1_schools_27_complete.json") -> List[Dict]:
    """Load D1 target schools"""
    with open(filepath, "r") as f:
        data = json.load(f)
    
    records = []
    
    def process_school(school: Dict, tier: str) -> Dict:
        swim = school.get("swimming", {}) if isinstance(school.get("swimming"), dict) else {}
        eng = school.get("engineering", {}) if isinstance(school.get("engineering"), dict) else {}
        chabad = school.get("chabad", {}) if isinstance(school.get("chabad"), dict) else {}
        
        return {
            "rank": school.get("rank"),
            "tier": tier,
            "name": school["name"],
            "abbreviation": school.get("abbreviation", ""),
            "city": school.get("city", ""),
            "state": school.get("state", ""),
            "conference": school.get("conference", ""),
            "swimming_rank": swim.get("program_rank", ""),
            "head_coach": swim.get("head_coach", ""),
            "coach_email": swim.get("email", ""),
            "coach_phone": swim.get("phone", ""),
            "coach_website": swim.get("website", ""),
            "engineering_college": eng.get("college", ""),
            "engineering_ranking": eng.get("ranking", ""),
            "chabad_rabbi": chabad.get("rabbi", ""),
            "chabad_phone": chabad.get("phone", ""),
            "chabad_email": chabad.get("email", ""),
            "chabad_address": chabad.get("address", ""),
            "chabad_website": chabad.get("website", ""),
            "jewish_students": chabad.get("jewish_students", ""),
            "israeli_connection": school.get("israeli_connection", ""),
            "weather": school.get("weather", ""),
            "michael_fit": school.get("michael_fit", "")
        }
    
    tier_mapping = [
        ("tier_1_top_targets", "TIER 1 - TOP TARGETS"),
        ("tier_2_strong_alternatives", "TIER 2 - STRONG ALTERNATIVES"),
        ("tier_3_florida_southeast_backups", "TIER 3 - FLORIDA/SOUTHEAST"),
        ("tier_4_cold_but_excellent", "TIER 4 - COLD BUT EXCELLENT"),
        ("additional_schools_on_tour_routes", "TOUR ROUTE")
    ]
    
    for tier_key, tier_name in tier_mapping:
        for school in data["schools"].get(tier_key, []):
            records.append(process_school(school, tier_name))
    
    return records


def get_meet_schedule() -> List[Dict]:
    """Return 2026 meet schedule"""
    return [
        {"meet_name": "Rats Invite", "start_date": "2026-02-06", "end_date": "2026-02-08", 
         "location": "Fort Pierce, FL", "course": "SCY", "priority": "MEDIUM",
         "shabbat_conflict": True, "conflict_details": "Saturday Feb 7 is Shabbat"},
        {"meet_name": "Sectionals SCY", "start_date": "2026-02-12", "end_date": "2026-02-15",
         "location": "Plantation, FL", "course": "SCY", "priority": "HIGH",
         "shabbat_conflict": True, "conflict_details": "Saturday Feb 14 is Shabbat"},
        {"meet_name": "Area 6 Champs", "start_date": "2026-02-27", "end_date": "2026-03-01",
         "location": "Stuart, FL", "course": "SCY", "priority": "MEDIUM",
         "shabbat_conflict": True, "conflict_details": "Saturday Feb 28 is Shabbat"},
        {"meet_name": "FL Senior Champs SCY", "start_date": "2026-03-12", "end_date": "2026-03-15",
         "location": "Orlando, FL", "course": "SCY", "priority": "CRITICAL",
         "shabbat_conflict": True, "conflict_details": "Saturday Mar 14 is Shabbat"},
        {"meet_name": "SAT Test", "start_date": "2026-03-14", "end_date": "2026-03-14",
         "location": "Satellite Beach, FL", "course": "N/A", "priority": "CRITICAL",
         "shabbat_conflict": True, "conflict_details": "Shabbat - may need alternate date"},
        {"meet_name": "Sectionals LCM", "start_date": "2026-06-04", "end_date": "2026-06-07",
         "location": "Ocala, FL", "course": "LCM", "priority": "HIGH",
         "shabbat_conflict": True, "conflict_details": "Saturday Jun 6 is Shabbat"},
        {"meet_name": "FL Senior Champs LCM", "start_date": "2026-07-16", "end_date": "2026-07-19",
         "location": "Ocala, FL", "course": "LCM", "priority": "CRITICAL",
         "shabbat_conflict": True, "conflict_details": "Saturday Jul 18 is Shabbat"},
        {"meet_name": "USA Futures", "start_date": "2026-07-29", "end_date": "2026-08-01",
         "location": "TBD", "course": "LCM", "priority": "CRITICAL",
         "shabbat_conflict": True, "conflict_details": "Saturday Aug 1 is Shabbat"},
        {"meet_name": "Winter Juniors", "start_date": "2026-12-10", "end_date": "2026-12-13",
         "location": "Greensboro, NC", "course": "SCY", "priority": "CRITICAL",
         "shabbat_conflict": False, "conflict_details": "No Shabbat conflict - PRIMARY TARGET"}
    ]

# ============================================================
# MAIN
# ============================================================

async def main():
    print("=" * 60)
    print("MICHAEL D1 PATHWAY - SUPABASE DATA PUSH")
    print("=" * 60)
    print(f"Target: {SUPABASE_URL}")
    print(f"Time: {datetime.now().isoformat()}")
    print()
    
    client = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)
    
    # Check if tables exist
    print("🔍 Checking tables...")
    tables = [
        "michael_d1_repo_files",
        "melacha_prohibited_dates",
        "yom_sheni_galuyot",
        "d1_target_schools",
        "michael_meet_schedule"
    ]
    
    missing = []
    for table in tables:
        exists = await client.check_table(table)
        status = "✅" if exists else "❌"
        print(f"  {status} {table}")
        if not exists:
            missing.append(table)
    
    if missing:
        print(f"\n⚠️  Missing tables: {', '.join(missing)}")
        print("Please run supabase_create_tables_only.sql first!")
        print("URL: https://supabase.com/dashboard/project/mocerqjnksmhcjzxrewo/sql/new")
        return
    
    print("\n✅ All tables exist. Pushing data...\n")
    
    results = {}
    
    # 1. Repository Files
    print("📁 [1/5] Repository Files...")
    repo_files = await fetch_github_files()
    results["repo_files"] = await client.upsert("michael_d1_repo_files", repo_files)
    print(f"   Total: {len(repo_files)} files\n")
    
    # 2. Melacha Prohibited Dates
    print("📅 [2/5] Melacha Prohibited Dates...")
    melacha = load_melacha_dates()
    results["melacha"] = await client.upsert("melacha_prohibited_dates", melacha)
    print(f"   Total: {len(melacha)} dates\n")
    
    # 3. יום שני של גלויות
    print("🕎 [3/5] יום שני של גלויות...")
    yom_sheni = load_yom_sheni_galuyot()
    results["yom_sheni"] = await client.upsert("yom_sheni_galuyot", yom_sheni)
    print(f"   Total: {len(yom_sheni)} dates\n")
    
    # 4. D1 Schools
    print("🏫 [4/5] D1 Target Schools...")
    schools = load_d1_schools()
    results["schools"] = await client.upsert("d1_target_schools", schools)
    print(f"   Total: {len(schools)} schools\n")
    
    # 5. Meet Schedule
    print("🏊 [5/5] Meet Schedule...")
    meets = get_meet_schedule()
    results["meets"] = await client.upsert("michael_meet_schedule", meets)
    print(f"   Total: {len(meets)} meets\n")
    
    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    for name, success in results.items():
        status = "✅" if success else "❌"
        print(f"  {status} {name}")
    
    total_success = sum(1 for s in results.values() if s)
    print(f"\nResult: {total_success}/{len(results)} successful")
    
    if total_success == len(results):
        print("\n🎉 ALL DATA PUSHED TO SUPABASE SUCCESSFULLY!")
    else:
        print("\n⚠️ Some tables failed. Check errors above.")


if __name__ == "__main__":
    asyncio.run(main())
