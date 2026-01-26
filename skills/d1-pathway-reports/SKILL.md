---
name: d1-pathway-reports
description: "Generate professional D1 swimming recruitment pathway reports for Michael Shapira with XGBoost analysis, roster progressions, competition calendar, and training recommendations"
version: 2.0.0
author: BidDeed.AI / Everest Capital USA
---

# D1 Pathway Reports Skill

## Overview

This skill generates professional DOCX reports for Michael Shapira's D1 swimming recruitment pathway, incorporating:
- XGBoost ML predictions based on actual D1 roster progressions
- School-by-school analysis with recruiting probability
- Competition calendar filtered for Shabbat observance
- Training recommendations with kosher keto nutrition
- Monthly time progression targets

## Color Scheme (Shapira Theme)

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Primary Header | Navy Blue | #1E3A5F | Main headers, titles |
| Elite Tier | Gold | #D4AF37 | Tier 1 schools (Top 10 NCAA) |
| Strong D1 | Forest Green | #228B22 | Tier 2 schools (11-25 NCAA) |
| Mid D1 | Ocean Blue | #4682B4 | Tier 3 schools (26-50 NCAA) |
| Safety Schools | Coral | #FF7F50 | Tier 4 schools (51+ NCAA) |
| Shabbat Conflict | Orange | #FFA500 | Calendar conflicts |
| Achievable Target | Green | #28A745 | Realistic goals |
| Aggressive Target | Yellow | #FFC107 | Challenging but possible |
| Very Hard Target | Red | #DC3545 | Stretch goals |
| Table Header | Light Blue | #D5E8F0 | Table backgrounds |
| Accent | Teal | #20B2AA | Highlights, emphasis |

## Report Structure

### 1. Executive Summary (1 page)
- Michael's current status (times, height, class year)
- XGBoost tier prediction
- Top 3 target schools with match scores
- Key dates and deadlines

### 2. XGBoost Analysis (2 pages)
- Model accuracy and methodology
- Tier probability distribution
- Feature importance (times, height, improvement trajectory)
- Comparable recruits from training data

### 3. School Rankings (3-4 pages)
- All 29 schools ranked by XGBoost match score
- For each school: times needed, coach info, engineering/RE minor, Chabad
- Color-coded by tier

### 4. Pathway Analysis (2 pages)
- Monthly progression targets (50 Free, 100 Free)
- Gap analysis for each tier
- Achievability ratings
- Comparable recruit progressions

### 5. Competition Calendar (2 pages)
- 2026 meet schedule with target times
- Shabbat conflict indicators
- Priority ratings (CRITICAL, HIGH, MEDIUM)
- D1 recruiting exposure opportunities

### 6. Training Plan (2 pages)
- Weekly structure (Shabbat-compliant)
- Monthly targets table
- Kosher keto nutrition protocol
- Key focus areas for 50/100 Free

### 7. Appendix
- Full recruit progression database
- Israeli Olympic swimmer pipeline
- Engineering program rankings

## JavaScript Template

```javascript
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, 
        WidthType, ShadingType, PageBreak } = require('docx');

// Shapira Theme Colors
const COLORS = {
  navyBlue: "1E3A5F",
  gold: "D4AF37",
  forestGreen: "228B22",
  oceanBlue: "4682B4",
  coral: "FF7F50",
  orange: "FFA500",
  green: "28A745",
  yellow: "FFC107",
  red: "DC3545",
  lightBlue: "D5E8F0",
  teal: "20B2AA",
  white: "FFFFFF",
  black: "000000"
};

// Standard table borders
const borders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }
};

// Tier color mapping
function getTierColor(tier) {
  switch(tier) {
    case 0: case "elite": return COLORS.gold;
    case 1: case "strong": return COLORS.forestGreen;
    case 2: case "mid": return COLORS.oceanBlue;
    case 3: case "safety": return COLORS.coral;
    default: return COLORS.lightBlue;
  }
}

// Achievability color
function getAchievabilityColor(status) {
  if (status.includes("ACHIEVABLE")) return COLORS.green;
  if (status.includes("AGGRESSIVE")) return COLORS.yellow;
  return COLORS.red;
}
```

## Data Sources

1. `data/michael_xgboost_pathway.json` - XGBoost analysis results
2. `data/d1_schools_27_complete.json` - Comprehensive school data
3. `data/d1_roster_progression_analysis.json` - Recruit progressions
4. `data/melacha_prohibited_dates.json` - Shabbat/Yom Tov dates
5. `data/kosher_keto_nutrition.json` - Nutrition protocol

## Usage

```bash
node scripts/generate_d1_pathway_report.js
```

Output: `reports/michael_d1_pathway_report_YYYY-MM-DD.docx`
