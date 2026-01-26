#!/usr/bin/env python3
"""
Chabad Jewish Calendar MCP Server

A comprehensive MCP (Model Context Protocol) server for Jewish calendar data
including Shabbat times, holidays, יום שני של גלויות (second day of diaspora holidays),
fast days, and integration with swim meet scheduling for Michael's D1 pathway.

Integrates with Hebcal API: https://www.hebcal.com/home/developer-apis

Author: BreverdBidder / Everest Capital
"""

import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from enum import Enum
import httpx

# MCP Server imports
try:
    from mcp.server import Server
    from mcp.types import Tool, TextContent
except ImportError:
    # Fallback for standalone testing
    Server = None
    Tool = None
    TextContent = None

# ============================================================================
# CONFIGURATION
# ============================================================================

HEBCAL_BASE_URL = "https://www.hebcal.com"
DEFAULT_LOCATION = {
    "name": "Satellite Beach, FL",
    "latitude": 28.1761,
    "longitude": -80.5900,
    "timezone": "America/New_York",
    "zip": "32937"
}

# Candle lighting minutes before sunset (Chabad standard)
CANDLE_LIGHTING_MINUTES = 18

# Havdalah minutes after sunset (when 3 small stars visible)
HAVDALAH_MINUTES = 50  # More machmir for Shabbat

# ============================================================================
# DATA MODELS
# ============================================================================

class HolidayCategory(Enum):
    """Categories of Jewish holidays/events"""
    SHABBAT = "shabbat"
    YOM_TOV = "yomtov"  # Major holidays (work forbidden)
    YOM_TOV_SHENI = "yomtov_sheni"  # יום שני של גלויות
    CHOL_HAMOED = "cholhamoed"  # Intermediate days
    FAST = "fast"  # Fast days
    MINOR = "minor"  # Minor holidays (Chanukah, Purim)
    MODERN = "modern"  # Yom HaShoah, Yom HaAtzma'ut
    ROSH_CHODESH = "roshchodesh"
    SPECIAL_SHABBAT = "special_shabbat"
    OMER = "omer"


@dataclass
class JewishEvent:
    """Represents a Jewish calendar event"""
    title: str
    title_hebrew: str
    date: str  # ISO format
    hebrew_date: str
    category: str
    subcategory: Optional[str] = None
    candle_lighting: Optional[str] = None
    havdalah: Optional[str] = None
    yizkor: bool = False
    melacha_prohibited: bool = False  # Work forbidden (Shabbat/Yom Tov)
    yom_tov_sheni: bool = False  # Second day of diaspora
    memo: Optional[str] = None
    leyning: Optional[Dict] = None
    
    def to_dict(self) -> Dict:
        return {
            "title": self.title,
            "title_hebrew": self.title_hebrew,
            "date": self.date,
            "hebrew_date": self.hebrew_date,
            "category": self.category,
            "subcategory": self.subcategory,
            "candle_lighting": self.candle_lighting,
            "havdalah": self.havdalah,
            "yizkor": self.yizkor,
            "melacha_prohibited": self.melacha_prohibited,
            "yom_tov_sheni": self.yom_tov_sheni,
            "memo": self.memo,
            "leyning": self.leyning
        }


# ============================================================================
# HEBCAL API CLIENT
# ============================================================================

class HebcalClient:
    """Client for Hebcal REST API"""
    
    def __init__(self, location: Dict = None):
        self.location = location or DEFAULT_LOCATION
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def close(self):
        await self.client.aclose()
    
    async def get_calendar(
        self,
        year: int,
        month: Optional[int] = None,
        diaspora: bool = True,  # Include יום שני של גלויות
        include_all: bool = True
    ) -> Dict:
        """
        Fetch full Jewish calendar data from Hebcal API
        
        Args:
            year: Gregorian year
            month: Optional specific month (1-12)
            diaspora: If True, include second day of holidays (יום שני של גלויות)
            include_all: If True, include all event types
        """
        params = {
            "cfg": "json",
            "v": "1",
            "year": year,
            # Location for candle lighting/havdalah times
            "zip": self.location.get("zip", "32937"),
            "b": CANDLE_LIGHTING_MINUTES,  # Candle lighting minutes
            "m": HAVDALAH_MINUTES,  # Havdalah minutes
            "M": "on",  # Calculate Havdalah (tzeit)
            # Event types
            "maj": "on",  # Major holidays
            "min": "on",  # Minor holidays
            "mod": "on",  # Modern holidays
            "nx": "on",  # Rosh Chodesh
            "mf": "on",  # Minor fasts
            "ss": "on",  # Special Shabbatot
            "s": "on",   # Parashat HaShavua
            "c": "on",   # Candle lighting
            "o": "on",   # Omer
            "d": "on",   # Hebrew dates
            "yzkr": "on",  # Yizkor
            "lg": "he",  # Hebrew language for titles
            "hdp": "1",  # Include Hebrew date parts
        }
        
        # Diaspora setting - includes יום שני של גלויות
        if not diaspora:
            params["i"] = "on"  # Israel mode (no second day)
        
        if month:
            params["month"] = month
        
        url = f"{HEBCAL_BASE_URL}/hebcal"
        response = await self.client.get(url, params=params)
        response.raise_for_status()
        return response.json()
    
    async def get_shabbat_times(
        self,
        date: Optional[str] = None
    ) -> Dict:
        """Get Shabbat times for a specific date"""
        params = {
            "cfg": "json",
            "zip": self.location.get("zip", "32937"),
            "b": CANDLE_LIGHTING_MINUTES,
            "m": HAVDALAH_MINUTES,
            "M": "on",
            "lg": "he",
        }
        
        if date:
            params["dt"] = date
        
        url = f"{HEBCAL_BASE_URL}/shabbat"
        response = await self.client.get(url, params=params)
        response.raise_for_status()
        return response.json()
    
    async def get_zmanim(
        self,
        date: str
    ) -> Dict:
        """Get zmanim (halachic times) for a specific date"""
        params = {
            "cfg": "json",
            "lat": self.location["latitude"],
            "lon": self.location["longitude"],
            "tzid": self.location["timezone"],
            "date": date
        }
        
        url = f"{HEBCAL_BASE_URL}/zmanim"
        response = await self.client.get(url, params=params)
        response.raise_for_status()
        return response.json()
    
    async def is_melacha_prohibited(
        self,
        datetime_str: str
    ) -> Dict:
        """
        Check if melacha (work) is prohibited at a given time
        Useful for checking Shabbat/Yom Tov status
        """
        params = {
            "cfg": "json",
            "lat": self.location["latitude"],
            "lon": self.location["longitude"],
            "tzid": self.location["timezone"],
            "dt": datetime_str
        }
        
        url = f"{HEBCAL_BASE_URL}/shabbat/isAssurBemlacha"
        response = await self.client.get(url, params=params)
        response.raise_for_status()
        return response.json()
    
    async def convert_date(
        self,
        gregorian_date: str = None,
        hebrew_date: str = None
    ) -> Dict:
        """Convert between Gregorian and Hebrew dates"""
        params = {"cfg": "json"}
        
        if gregorian_date:
            # Format: YYYY-MM-DD
            parts = gregorian_date.split("-")
            params["gy"] = parts[0]
            params["gm"] = parts[1]
            params["gd"] = parts[2]
            params["g2h"] = "1"
        elif hebrew_date:
            # Format: 5786-7-15 (year-month-day)
            parts = hebrew_date.split("-")
            params["hy"] = parts[0]
            params["hm"] = parts[1]
            params["hd"] = parts[2]
            params["h2g"] = "1"
        
        url = f"{HEBCAL_BASE_URL}/converter"
        response = await self.client.get(url, params=params)
        response.raise_for_status()
        return response.json()


# ============================================================================
# CALENDAR DATA PROCESSOR
# ============================================================================

class JewishCalendarProcessor:
    """Process and categorize Jewish calendar events"""
    
    # Events where melacha is prohibited (Shabbat-like restrictions)
    MELACHA_PROHIBITED_EVENTS = {
        "Rosh Hashana",
        "Rosh Hashana I",
        "Rosh Hashana II",  # יום שני של גלויות
        "Yom Kippur",
        "Sukkot I",
        "Sukkot II",  # יום שני של גלויות
        "Shmini Atzeret",
        "Simchat Torah",  # יום שני של גלויות in diaspora
        "Pesach I",
        "Pesach II",  # יום שני של גלויות
        "Pesach VII",
        "Pesach VIII",  # יום שני של גלויות
        "Shavuot I",
        "Shavuot II",  # יום שני של גלויות
    }
    
    # Second day of diaspora holidays (יום שני של גלויות)
    YOM_SHENI_GALUYOT = {
        "Rosh Hashana II": "ראש השנה ב׳",
        "Sukkot II": "סוכות ב׳",
        "Simchat Torah": "שמחת תורה",  # In diaspora, Shmini Atzeret is separate
        "Pesach II": "פסח ב׳",
        "Pesach VIII": "פסח ח׳",
        "Shavuot II": "שבועות ב׳"
    }
    
    # Yizkor dates
    YIZKOR_HOLIDAYS = {
        "Yom Kippur",
        "Shmini Atzeret",
        "Pesach VII",
        "Pesach VIII",
        "Shavuot I",
        "Shavuot II"
    }
    
    # Fast days
    FAST_DAYS = {
        "Tzom Gedaliah": "צום גדליה",
        "Yom Kippur": "יום כיפור",
        "Asara B'Tevet": "עשרה בטבת",
        "Ta'anit Esther": "תענית אסתר",
        "Ta'anit Bechorot": "תענית בכורות",
        "Tisha B'Av": "תשעה באב",
        "Tzom Tammuz": "צום תמוז"
    }
    
    @classmethod
    def process_events(cls, hebcal_data: Dict) -> List[JewishEvent]:
        """Process Hebcal API response into structured events"""
        events = []
        
        for item in hebcal_data.get("items", []):
            event = cls._process_single_event(item)
            if event:
                events.append(event)
        
        return events
    
    @classmethod
    def _process_single_event(cls, item: Dict) -> Optional[JewishEvent]:
        """Process a single Hebcal event item"""
        title = item.get("title", "")
        category = item.get("category", "")
        
        # Determine if melacha prohibited
        melacha_prohibited = (
            category == "candles" or
            title in cls.MELACHA_PROHIBITED_EVENTS or
            "Shabbat" in title
        )
        
        # Determine if יום שני של גלויות
        yom_tov_sheni = title in cls.YOM_SHENI_GALUYOT
        
        # Determine if Yizkor
        yizkor = any(yiz in title for yiz in cls.YIZKOR_HOLIDAYS)
        
        # Get subcategory
        subcategory = None
        if yom_tov_sheni:
            subcategory = "yom_sheni_galuyot"
        elif title in cls.FAST_DAYS:
            subcategory = "fast"
        
        return JewishEvent(
            title=title,
            title_hebrew=item.get("hebrew", ""),
            date=item.get("date", ""),
            hebrew_date=item.get("hdate", ""),
            category=category,
            subcategory=subcategory,
            candle_lighting=item.get("date") if category == "candles" else None,
            havdalah=item.get("date") if category == "havdalah" else None,
            yizkor=yizkor,
            melacha_prohibited=melacha_prohibited,
            yom_tov_sheni=yom_tov_sheni,
            memo=item.get("memo"),
            leyning=item.get("leyning")
        )
    
    @classmethod
    def get_swim_meet_conflicts(
        cls,
        events: List[JewishEvent],
        meet_dates: List[str]
    ) -> List[Dict]:
        """
        Check swim meet dates for Shabbat/Yom Tov conflicts
        
        Args:
            events: List of Jewish calendar events
            meet_dates: List of meet dates in YYYY-MM-DD format
        
        Returns:
            List of conflicts with details
        """
        conflicts = []
        
        # Create lookup of dates with melacha prohibition
        prohibited_dates = {}
        for event in events:
            if event.melacha_prohibited:
                date = event.date.split("T")[0] if "T" in event.date else event.date
                prohibited_dates[date] = event
        
        for meet_date in meet_dates:
            if meet_date in prohibited_dates:
                event = prohibited_dates[meet_date]
                conflicts.append({
                    "meet_date": meet_date,
                    "conflict": event.title,
                    "hebrew": event.title_hebrew,
                    "yom_tov_sheni": event.yom_tov_sheni,
                    "can_swim": False,
                    "reason": "מלאכה אסורה - Work prohibited"
                })
        
        return conflicts


# ============================================================================
# DATABASE BUILDER
# ============================================================================

class JewishCalendarDatabase:
    """Build and maintain comprehensive Jewish calendar database"""
    
    def __init__(self, location: Dict = None):
        self.client = HebcalClient(location)
        self.processor = JewishCalendarProcessor()
    
    async def build_year_database(
        self,
        year: int,
        include_diaspora: bool = True
    ) -> Dict:
        """
        Build complete calendar database for a year
        
        Includes:
        - All Shabbatot with candle lighting/havdalah
        - Major holidays (Yom Tov)
        - יום שני של גלויות (second day of diaspora)
        - Fast days
        - Rosh Chodesh
        - Special Shabbatot
        - Omer counting
        - Yizkor dates
        """
        data = await self.client.get_calendar(
            year=year,
            diaspora=include_diaspora,
            include_all=True
        )
        
        events = self.processor.process_events(data)
        
        # Organize by category
        database = {
            "metadata": {
                "year": year,
                "diaspora": include_diaspora,
                "location": self.client.location,
                "generated_at": datetime.now().isoformat(),
                "includes_yom_sheni_galuyot": include_diaspora
            },
            "events": {
                "shabbatot": [],
                "yom_tov": [],
                "yom_tov_sheni": [],  # יום שני של גלויות
                "chol_hamoed": [],
                "fast_days": [],
                "rosh_chodesh": [],
                "special_shabbatot": [],
                "omer": [],
                "minor_holidays": [],
                "modern_holidays": [],
                "yizkor_dates": []
            },
            "all_events": [e.to_dict() for e in events]
        }
        
        # Categorize events
        for event in events:
            event_dict = event.to_dict()
            
            if event.yizkor:
                database["events"]["yizkor_dates"].append(event_dict)
            
            if event.yom_tov_sheni:
                database["events"]["yom_tov_sheni"].append(event_dict)
            elif event.category == "holiday" and event.melacha_prohibited:
                database["events"]["yom_tov"].append(event_dict)
            elif event.category == "candles" or event.category == "havdalah":
                database["events"]["shabbatot"].append(event_dict)
            elif event.category == "parashat":
                database["events"]["shabbatot"].append(event_dict)
            elif event.category == "roshchodesh":
                database["events"]["rosh_chodesh"].append(event_dict)
            elif event.category == "omer":
                database["events"]["omer"].append(event_dict)
            elif "Shabbat" in event.title and event.category == "holiday":
                database["events"]["special_shabbatot"].append(event_dict)
            elif event.subcategory == "fast":
                database["events"]["fast_days"].append(event_dict)
        
        return database
    
    async def get_melacha_prohibited_dates(
        self,
        year: int,
        include_diaspora: bool = True
    ) -> List[Dict]:
        """
        Get all dates where melacha (work) is prohibited
        
        This is the key function for Michael's swim meet scheduling -
        identifies all Shabbatot and Yom Tov days when he cannot compete.
        """
        data = await self.client.get_calendar(year=year, diaspora=include_diaspora)
        events = self.processor.process_events(data)
        
        prohibited = []
        for event in events:
            if event.melacha_prohibited:
                prohibited.append({
                    "date": event.date,
                    "title": event.title,
                    "hebrew": event.title_hebrew,
                    "yom_tov_sheni": event.yom_tov_sheni,
                    "candle_lighting": event.candle_lighting,
                    "havdalah": event.havdalah
                })
        
        return prohibited
    
    async def check_meet_dates(
        self,
        meet_dates: List[str],
        year: int = None
    ) -> Dict:
        """
        Check swim meet dates against Shabbat/Yom Tov calendar
        
        Args:
            meet_dates: List of dates in YYYY-MM-DD format
            year: Year to check (defaults to dates' year)
        
        Returns:
            Dict with conflicts and safe dates
        """
        if not year and meet_dates:
            year = int(meet_dates[0].split("-")[0])
        
        data = await self.client.get_calendar(year=year, diaspora=True)
        events = self.processor.process_events(data)
        
        conflicts = self.processor.get_swim_meet_conflicts(events, meet_dates)
        
        conflict_dates = {c["meet_date"] for c in conflicts}
        safe_dates = [d for d in meet_dates if d not in conflict_dates]
        
        return {
            "total_dates": len(meet_dates),
            "conflicts": conflicts,
            "conflict_count": len(conflicts),
            "safe_dates": safe_dates,
            "safe_count": len(safe_dates)
        }
    
    async def close(self):
        await self.client.close()


# ============================================================================
# MCP SERVER
# ============================================================================

def create_mcp_server():
    """Create the MCP server with all tools"""
    
    if Server is None:
        print("MCP SDK not installed. Run: pip install mcp")
        return None
    
    server = Server("chabad-jewish-calendar")
    db = JewishCalendarDatabase()
    
    @server.tool()
    async def get_jewish_calendar(
        year: int,
        include_diaspora: bool = True
    ) -> str:
        """
        Get complete Jewish calendar for a year including:
        - Shabbatot with candle lighting and havdalah times
        - Major holidays (Yom Tov)
        - יום שני של גלויות (Yom Sheni Shel Galuyot - second day of diaspora holidays)
        - Fast days
        - Rosh Chodesh
        - Omer counting
        - Yizkor dates
        
        Args:
            year: Gregorian year (e.g., 2026)
            include_diaspora: Include second day of holidays for diaspora (default True)
        """
        data = await db.build_year_database(year, include_diaspora)
        return json.dumps(data, indent=2, ensure_ascii=False)
    
    @server.tool()
    async def get_shabbat_times(
        date: str = None,
        zip_code: str = "32937"
    ) -> str:
        """
        Get Shabbat candle lighting and havdalah times
        
        Args:
            date: Date in YYYY-MM-DD format (defaults to this week)
            zip_code: US ZIP code for location (default: Satellite Beach, FL)
        """
        db.client.location["zip"] = zip_code
        data = await db.client.get_shabbat_times(date)
        return json.dumps(data, indent=2, ensure_ascii=False)
    
    @server.tool()
    async def get_melacha_prohibited_dates(
        year: int,
        include_diaspora: bool = True
    ) -> str:
        """
        Get all dates where melacha (work) is prohibited
        Includes Shabbat and Yom Tov (with יום שני של גלויות for diaspora)
        
        Useful for scheduling events that cannot conflict with Shabbat/Yom Tov.
        
        Args:
            year: Gregorian year
            include_diaspora: Include diaspora second day of holidays
        """
        dates = await db.get_melacha_prohibited_dates(year, include_diaspora)
        return json.dumps(dates, indent=2, ensure_ascii=False)
    
    @server.tool()
    async def check_swim_meet_conflicts(
        meet_dates: List[str]
    ) -> str:
        """
        Check swim meet dates for Shabbat/Yom Tov conflicts
        
        For Michael Shapira's D1 pathway - identifies which meet dates
        conflict with religious observance (Shabbat, Yom Tov, יום שני של גלויות)
        
        Args:
            meet_dates: List of dates in YYYY-MM-DD format
        
        Returns:
            Conflicts and safe dates with details
        """
        result = await db.check_meet_dates(meet_dates)
        return json.dumps(result, indent=2, ensure_ascii=False)
    
    @server.tool()
    async def get_yom_sheni_galuyot(
        year: int
    ) -> str:
        """
        Get all יום שני של גלויות (second day of diaspora holidays) for a year
        
        In the diaspora, an extra day is added to:
        - Rosh Hashana II
        - Sukkot II  
        - Simchat Torah (separate from Shmini Atzeret)
        - Pesach II and VIII
        - Shavuot II
        
        Melacha is prohibited on these days just like the first day.
        
        Args:
            year: Gregorian year
        """
        data = await db.build_year_database(year, include_diaspora=True)
        yom_sheni = data["events"]["yom_tov_sheni"]
        return json.dumps({
            "year": year,
            "explanation": "יום שני של גלויות - Second day of holidays observed in diaspora",
            "count": len(yom_sheni),
            "dates": yom_sheni
        }, indent=2, ensure_ascii=False)
    
    @server.tool()
    async def get_yizkor_dates(
        year: int
    ) -> str:
        """
        Get Yizkor dates for a year
        
        Yizkor is recited on:
        - Yom Kippur
        - Shmini Atzeret
        - Last day of Pesach
        - Shavuot (second day in diaspora)
        
        Args:
            year: Gregorian year
        """
        data = await db.build_year_database(year, include_diaspora=True)
        return json.dumps({
            "year": year,
            "dates": data["events"]["yizkor_dates"]
        }, indent=2, ensure_ascii=False)
    
    @server.tool()
    async def convert_hebrew_date(
        gregorian_date: str = None,
        hebrew_date: str = None
    ) -> str:
        """
        Convert between Gregorian and Hebrew dates
        
        Args:
            gregorian_date: Date in YYYY-MM-DD format (to convert to Hebrew)
            hebrew_date: Date in YEAR-MONTH-DAY format like 5786-7-15 (to convert to Gregorian)
        
        Provide one or the other, not both.
        """
        result = await db.client.convert_date(gregorian_date, hebrew_date)
        return json.dumps(result, indent=2, ensure_ascii=False)
    
    @server.tool()
    async def get_fast_days(
        year: int
    ) -> str:
        """
        Get all fast days for a year
        
        Includes:
        - Tzom Gedaliah (after Rosh Hashana)
        - Yom Kippur (most stringent)
        - Asara B'Tevet (10th of Tevet)
        - Ta'anit Esther (before Purim)
        - Ta'anit Bechorot (before Pesach, firstborn fast)
        - Tzom Tammuz (17th of Tammuz)
        - Tisha B'Av (9th of Av)
        
        Args:
            year: Gregorian year
        """
        data = await db.build_year_database(year, include_diaspora=True)
        return json.dumps({
            "year": year,
            "fast_days": data["events"]["fast_days"]
        }, indent=2, ensure_ascii=False)
    
    @server.tool()
    async def is_melacha_prohibited_now(
        datetime_str: str,
        zip_code: str = "32937"
    ) -> str:
        """
        Check if melacha (work) is currently prohibited
        
        Args:
            datetime_str: ISO datetime (e.g., 2026-03-14T19:30:00)
            zip_code: US ZIP code for location
        """
        db.client.location["zip"] = zip_code
        result = await db.client.is_melacha_prohibited(datetime_str)
        return json.dumps(result, indent=2, ensure_ascii=False)
    
    return server


# ============================================================================
# STANDALONE FUNCTIONS (for non-MCP usage)
# ============================================================================

async def generate_michael_calendar_database(
    years: List[int] = None,
    output_path: str = "data/jewish_calendar_database.json"
) -> Dict:
    """
    Generate comprehensive Jewish calendar database for Michael's D1 pathway
    
    Args:
        years: List of years to include (default: 2025-2027)
        output_path: Path to save JSON database
    """
    if years is None:
        years = [2025, 2026, 2027]
    
    db = JewishCalendarDatabase()
    
    try:
        all_data = {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "location": DEFAULT_LOCATION,
                "years": years,
                "includes_yom_sheni_galuyot": True,
                "description": "Complete Jewish calendar for Michael Shapira D1 pathway swim scheduling"
            },
            "years": {}
        }
        
        for year in years:
            print(f"Fetching calendar data for {year}...")
            year_data = await db.build_year_database(year, include_diaspora=True)
            all_data["years"][str(year)] = year_data
        
        # Save to file
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(all_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Database saved to {output_path}")
        return all_data
    
    finally:
        await db.close()


async def check_michael_meet_schedule() -> Dict:
    """
    Check Michael's 2026 meet schedule against Jewish calendar
    """
    meet_dates = [
        # Rats Invite
        "2026-02-06", "2026-02-07", "2026-02-08",
        # Sectionals
        "2026-02-12", "2026-02-13", "2026-02-14", "2026-02-15",
        # Area 6 Champs
        "2026-02-27", "2026-02-28", "2026-03-01",
        # Senior Champs
        "2026-03-12", "2026-03-13", "2026-03-14", "2026-03-15",
        # Sectionals LCM
        "2026-06-04", "2026-06-05", "2026-06-06", "2026-06-07",
        # Senior Champs LCM
        "2026-07-16", "2026-07-17", "2026-07-18", "2026-07-19",
        # Futures
        "2026-07-29", "2026-07-30", "2026-07-31", "2026-08-01"
    ]
    
    db = JewishCalendarDatabase()
    
    try:
        result = await db.check_meet_dates(meet_dates, 2026)
        return result
    finally:
        await db.close()


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

def main():
    """Main entry point for MCP server"""
    import sys
    
    if "--generate-db" in sys.argv:
        # Generate database
        asyncio.run(generate_michael_calendar_database())
    elif "--check-meets" in sys.argv:
        # Check meet conflicts
        result = asyncio.run(check_michael_meet_schedule())
        print(json.dumps(result, indent=2))
    else:
        # Run MCP server
        server = create_mcp_server()
        if server:
            server.run()
        else:
            print("Run: pip install mcp httpx")
            print("Or use --generate-db to create calendar database")
            print("Or use --check-meets to check meet conflicts")


if __name__ == "__main__":
    main()
