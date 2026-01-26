# 🕎 Chabad Jewish Calendar MCP Server

Model Context Protocol (MCP) server for comprehensive Jewish calendar data, specifically designed for Orthodox/Chabad observance including **יום שני של גלויות** (second day of diaspora holidays).

## 🎯 Purpose

This MCP server provides AI assistants with accurate Jewish calendar data for:

1. **Shabbat Scheduling** - Candle lighting and havdalah times
2. **Holiday Tracking** - All Yom Tov with diaspora second days
3. **Swim Meet Conflicts** - Check Michael's D1 meets against Shabbat/Yom Tov
4. **Fast Days** - All minor and major fasts
5. **Date Conversion** - Hebrew ↔ Gregorian

## 📋 Features

### יום שני של גלויות (Second Day of Diaspora Holidays)

In the diaspora, we observe an extra day for these holidays:

| Holiday | Hebrew | Days |
|---------|--------|------|
| Rosh Hashana | ראש השנה | 2 days |
| Sukkot | סוכות | 2 days |
| Simchat Torah | שמחת תורה | Separate from Shmini Atzeret |
| Pesach | פסח | 2 days at beginning, 2 at end |
| Shavuot | שבועות | 2 days |

**Melacha is prohibited on all יום שני של גלויות days.**

### Complete Event Categories

- **Shabbatot** - Weekly Shabbat with parsha
- **Yom Tov** - Major holidays (melacha prohibited)
- **יום שני של גלויות** - Diaspora second days
- **Chol HaMoed** - Intermediate days
- **Fast Days** - All fasts including minor
- **Rosh Chodesh** - New months
- **Special Shabbatot** - Shabbat Hagadol, Zachor, etc.
- **Omer** - 49 days of counting
- **Yizkor Dates** - Memorial prayer days
- **Modern Holidays** - Yom HaShoah, Yom HaAtzma'ut

## 🛠️ MCP Tools

### `get_jewish_calendar`
Get complete calendar for a year with all events.

### `get_shabbat_times`
Get candle lighting and havdalah for a specific date.

### `get_melacha_prohibited_dates`
Get ALL dates where work is forbidden (Shabbat + Yom Tov + יום שני של גלויות).

### `check_swim_meet_conflicts`
Check meet dates against religious calendar - identifies which days Michael cannot compete.

### `get_yom_sheni_galuyot`
Get specifically the יום שני של גלויות dates for a year.

### `get_yizkor_dates`
Get Yizkor memorial prayer dates.

### `get_fast_days`
Get all fast days for a year.

### `convert_hebrew_date`
Convert between Gregorian and Hebrew dates.

### `is_melacha_prohibited_now`
Check if work is currently prohibited at a specific time/location.

## 📍 Location Configuration

Default location: **Satellite Beach, FL** (28.1761, -80.5900)

Candle lighting: **18 minutes** before sunset (Chabad standard)
Havdalah: **50 minutes** after sunset (machmir)

## 🚀 Usage

### As MCP Server

```bash
# Install dependencies
pip install mcp httpx

# Run server
python mcp/chabad_calendar_mcp.py
```

### MCP Configuration

Add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "chabad-calendar": {
      "command": "python",
      "args": ["/path/to/mcp/chabad_calendar_mcp.py"]
    }
  }
}
```

### Standalone Database Generation

```bash
# Generate database for 2025-2027
python scripts/sync_calendar.py --years 2025 2026 2027

# Check Michael's meet schedule
python scripts/sync_calendar.py --check-meets
```

## 📁 Generated Data

### `data/jewish_calendar_database.json`

Complete database structure:

```json
{
  "metadata": {
    "location": "Satellite Beach, FL",
    "diaspora": true,
    "includes_yom_sheni_galuyot": true
  },
  "years": {
    "2026": {
      "events": {
        "shabbatot": [...],
        "yom_tov": [...],
        "yom_sheni_galuyot": [...],
        "fast_days": [...],
        "all_melacha_prohibited": [...]
      }
    }
  }
}
```

## 🏊 Michael D1 Integration

The primary use case is checking Michael's swim meet schedule against Shabbat/Yom Tov:

```python
from sync_calendar import check_meet_conflicts

# Michael's 2026 meets
meets = ["2026-02-14", "2026-03-14", "2026-07-18"]

# Check for conflicts
conflicts = check_meet_conflicts(database, meets)
# Returns dates he CANNOT swim due to Shabbat/Yom Tov
```

## 📚 API Source

Data from [Hebcal API](https://www.hebcal.com/home/developer-apis):
- Free & open source
- Creative Commons license
- Accurate halachic calculations

Hebcal also has its own MCP server at: `https://www.hebcal.com/mcp`

## ✡️ Halachic Notes

1. **Melacha Prohibition** starts at candle lighting and ends at havdalah
2. **יום שני של גלויות** has the same restrictions as the first day
3. **Chol HaMoed** has partial restrictions (work permitted)
4. **Fast Days** - eating prohibited (work permitted except Yom Kippur/Tisha B'Av)
5. **Yizkor** recited on Yom Kippur, Shmini Atzeret, last day Pesach, Shavuot

## 📄 License

MIT License - Data from Hebcal (CC BY 4.0)

---

**Contact:** Ariel Shapira | everest.ariel@gmail.com
