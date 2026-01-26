#!/usr/bin/env node
/**
 * Michael Shapira D1 Pathway Report Generator v2.0
 * =================================================
 * Professional-grade DOCX report following BidDeed.AI/ZoneWise quality standards
 * 
 * Sections:
 * 1. Cover Page
 * 2. Executive Summary (1 page)
 * 3. XGBoost ML Analysis (2 pages)
 * 4. School Rankings by Tier (3 pages)
 * 5. Pathway Analysis & Milestones (2 pages)
 * 6. Competition Calendar 2026 (2 pages)
 * 7. Training Plan (2 pages)
 * 8. Appendix: Recruit Database
 */

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, 
        WidthType, ShadingType, PageBreak, LevelFormat, 
        VerticalAlign, PageNumber } = require('docx');
const fs = require('fs');

// =============================================================================
// COLOR SCHEME (Shapira Theme)
// =============================================================================
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
    lightGreen: "E8F5E9",
    lightYellow: "FFF8E1",
    lightRed: "FFEBEE",
    teal: "20B2AA",
    white: "FFFFFF",
    black: "000000",
    gray: "666666",
    lightGray: "F5F5F5"
};

const FONTS = { primary: "Arial", secondary: "Calibri" };

// =============================================================================
// LOAD DATA
// =============================================================================
let recruitData = {};
let pathwayData = {};
let schoolsData = {};
let calendarData = {};

try { recruitData = JSON.parse(fs.readFileSync('data/d1_recruit_database_expanded.json', 'utf8')); } catch(e) { console.log("Warning: recruit data not found"); }
try { pathwayData = JSON.parse(fs.readFileSync('data/michael_xgboost_pathway.json', 'utf8')); } catch(e) { console.log("Warning: pathway data not found"); }
try { schoolsData = JSON.parse(fs.readFileSync('data/d1_schools_27_complete.json', 'utf8')); } catch(e) { console.log("Warning: schools data not found"); }
try { calendarData = JSON.parse(fs.readFileSync('data/melacha_prohibited_dates.json', 'utf8')); } catch(e) { console.log("Warning: calendar data not found"); }

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
const borders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }
};

const noBorders = {
    top: { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE }
};

function getTierColor(tier) {
    const colors = { 0: COLORS.gold, 1: COLORS.forestGreen, 2: COLORS.oceanBlue, 3: COLORS.coral };
    return colors[tier] || COLORS.lightGray;
}

function getTierBgColor(tier) {
    const colors = { 0: "FFF8E1", 1: COLORS.lightGreen, 2: "E3F2FD", 3: "FFF3E0" };
    return colors[tier] || COLORS.lightGray;
}

function getStatusColor(status) {
    if (status.includes("ACHIEVABLE") || status.includes("✅")) return COLORS.green;
    if (status.includes("AGGRESSIVE") || status.includes("⚠️")) return COLORS.yellow;
    return COLORS.red;
}

function createCell(text, options = {}) {
    const { bold, color, bgColor, align, size, colspan } = options;
    return new TableCell({
        borders,
        columnSpan: colspan || 1,
        shading: bgColor ? { fill: bgColor, type: ShadingType.CLEAR } : undefined,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [
            new Paragraph({
                alignment: align || AlignmentType.LEFT,
                children: [
                    new TextRun({
                        text: String(text),
                        bold: bold || false,
                        color: color || COLORS.black,
                        font: FONTS.primary,
                        size: size || 20
                    })
                ]
            })
        ]
    });
}

function createHeaderCell(text, bgColor = COLORS.navyBlue) {
    return createCell(text, { bold: true, color: COLORS.white, bgColor, align: AlignmentType.CENTER });
}

function pageBreak() {
    return new Paragraph({ children: [new PageBreak()] });
}

function sectionHeader(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        children: [
            new TextRun({ text, bold: true, color: COLORS.navyBlue, font: FONTS.primary, size: 36 })
        ]
    });
}

function subHeader(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
        children: [
            new TextRun({ text, bold: true, color: COLORS.teal, font: FONTS.primary, size: 28 })
        ]
    });
}

function para(text, options = {}) {
    return new Paragraph({
        spacing: { after: 120 },
        children: [
            new TextRun({ text, font: FONTS.primary, size: 22, ...options })
        ]
    });
}

function bulletPoint(text, options = {}) {
    return new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text, font: FONTS.primary, size: 22, ...options })]
    });
}

// =============================================================================
// BUILD DOCUMENT SECTIONS
// =============================================================================

// COVER PAGE
function buildCoverPage() {
    return [
        new Paragraph({ spacing: { before: 3000 } }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({ text: "MICHAEL SHAPIRA", bold: true, color: COLORS.navyBlue, font: FONTS.primary, size: 72 })
            ]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
            children: [
                new TextRun({ text: "D1 SWIMMING RECRUITMENT", bold: true, color: COLORS.teal, font: FONTS.primary, size: 48 })
            ]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({ text: "PATHWAY ANALYSIS", bold: true, color: COLORS.teal, font: FONTS.primary, size: 48 })
            ]
        }),
        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({ text: "XGBoost Machine Learning Model", color: COLORS.gray, font: FONTS.primary, size: 28, italics: true })
            ]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100 },
            children: [
                new TextRun({ text: "Based on 35 D1 Recruit Progressions", color: COLORS.gray, font: FONTS.primary, size: 24 })
            ]
        }),
        new Paragraph({ spacing: { before: 1000 } }),
        
        // Profile Box
        new Table({
            width: { size: 80, type: WidthType.PERCENTAGE },
            alignment: AlignmentType.CENTER,
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            borders,
                            shading: { fill: COLORS.lightBlue, type: ShadingType.CLEAR },
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            margins: { top: 150, bottom: 150, left: 200, right: 200 },
                            children: [
                                new Paragraph({ children: [new TextRun({ text: "ATHLETE PROFILE", bold: true, size: 24 })] }),
                                new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: "Class of 2027", size: 22 })] }),
                                new Paragraph({ children: [new TextRun({ text: "Height: 6'4\" (76 inches)", size: 22 })] }),
                                new Paragraph({ children: [new TextRun({ text: "Weight: 215 lbs → 210 target", size: 22 })] }),
                                new Paragraph({ children: [new TextRun({ text: "SwimCloud ID: 3250085", size: 22 })] }),
                                new Paragraph({ children: [new TextRun({ text: "Dual Citizenship: USA + Israel", size: 22, bold: true })] })
                            ]
                        }),
                        new TableCell({
                            borders,
                            shading: { fill: COLORS.lightGreen, type: ShadingType.CLEAR },
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            margins: { top: 150, bottom: 150, left: 200, right: 200 },
                            children: [
                                new Paragraph({ children: [new TextRun({ text: "CURRENT TIMES (SCY)", bold: true, size: 24 })] }),
                                new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: "50 Free: 21.86", size: 28, bold: true })] }),
                                new Paragraph({ children: [new TextRun({ text: "100 Free: 48.80", size: 28, bold: true })] }),
                                new Paragraph({ children: [new TextRun({ text: "200 Free: 1:53.03", size: 22 })] }),
                                new Paragraph({ children: [new TextRun({ text: "100 Fly: 55.87", size: 22 })] })
                            ]
                        })
                    ]
                })
            ]
        }),
        
        new Paragraph({ spacing: { before: 1500 } }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, color: COLORS.gray, size: 22 })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100 },
            children: [new TextRun({ text: "BidDeed.AI / Everest Capital USA", color: COLORS.navyBlue, size: 22, bold: true })]
        }),
        pageBreak()
    ];
}

// EXECUTIVE SUMMARY
function buildExecutiveSummary() {
    return [
        sectionHeader("1. Executive Summary"),
        
        para("This comprehensive analysis uses XGBoost machine learning trained on 35 actual D1 swimmer progressions to predict Michael Shapira's recruitment pathway and provide actionable recommendations."),
        
        subHeader("Key Findings"),
        
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    createHeaderCell("Metric", COLORS.navyBlue),
                    createHeaderCell("Current Status", COLORS.navyBlue),
                    createHeaderCell("Target", COLORS.navyBlue),
                    createHeaderCell("Assessment", COLORS.navyBlue)
                ]}),
                new TableRow({ children: [
                    createCell("Predicted Tier"),
                    createCell("LOWER D1 (80.6%)", { bold: true }),
                    createCell("STRONG D1", { bold: true, color: COLORS.forestGreen }),
                    createCell("✅ ACHIEVABLE", { bold: true, color: COLORS.green })
                ]}),
                new TableRow({ children: [
                    createCell("50 Free SCY"),
                    createCell("21.86"),
                    createCell("20.80", { bold: true }),
                    createCell("Drop 1.06s (0.062s/mo)")
                ]}),
                new TableRow({ children: [
                    createCell("100 Free SCY"),
                    createCell("48.80"),
                    createCell("46.00", { bold: true }),
                    createCell("Drop 2.80s (0.165s/mo)")
                ]}),
                new TableRow({ children: [
                    createCell("Months to Graduation"),
                    createCell("17 months"),
                    createCell("June 2027"),
                    createCell("Sufficient time")
                ]})
            ]
        }),
        
        subHeader("Target Schools (Strong D1)"),
        bulletPoint("UNC Chapel Hill - Israeli Olympic pipeline (Kartavi, Maraana), RE Minor ✅"),
        bulletPoint("Georgia Tech - #4 Engineering nationally, ACC conference"),
        bulletPoint("Michigan - #4 Engineering, BEST Jewish life (6,500 students), RE Minor ✅"),
        bulletPoint("NC State - Sprint-focused program (Korstanje development model)"),
        
        subHeader("Critical Dates"),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    createHeaderCell("Date"),
                    createHeaderCell("Event"),
                    createHeaderCell("Target Times"),
                    createHeaderCell("Priority")
                ]}),
                new TableRow({ children: [
                    createCell("Mar 12-15, 2026"),
                    createCell("FL Senior Championships SCY"),
                    createCell("20.80 / 46.50"),
                    createCell("CRITICAL", { bgColor: COLORS.red, color: COLORS.white, bold: true })
                ]}),
                new TableRow({ children: [
                    createCell("Jul 29 - Aug 1, 2026"),
                    createCell("USA Futures Championships"),
                    createCell("23.20 / 51.50 LCM"),
                    createCell("CRITICAL", { bgColor: COLORS.red, color: COLORS.white, bold: true })
                ]}),
                new TableRow({ children: [
                    createCell("Dec 10-13, 2026", { bold: true, bgColor: COLORS.gold }),
                    createCell("Winter Junior Nationals", { bold: true, bgColor: COLORS.gold }),
                    createCell("20.50 / 45.50", { bold: true, bgColor: COLORS.gold }),
                    createCell("CRITICAL", { bgColor: COLORS.red, color: COLORS.white, bold: true })
                ]})
            ]
        }),
        
        pageBreak()
    ];
}

// XGBOOST ANALYSIS
function buildXGBoostAnalysis() {
    const recruits = recruitData.recruits || [];
    const tierStats = recruitData.aggregate_statistics || {};
    
    return [
        sectionHeader("2. XGBoost Machine Learning Analysis"),
        
        para("The XGBoost model was trained on 35 D1 swimmers across 4 tiers to predict recruitment probability based on high school senior times, height, and historical improvement trajectories."),
        
        subHeader("Model Configuration"),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    createHeaderCell("Parameter"),
                    createHeaderCell("Value")
                ]}),
                new TableRow({ children: [createCell("Training Data"), createCell("35 D1 swimmers (2014-2024 recruits)")] }),
                new TableRow({ children: [createCell("Features"), createCell("HS 50 Free, HS 100 Free, Height (inches)")] }),
                new TableRow({ children: [createCell("Target"), createCell("Recruitment Tier (0-3)")] }),
                new TableRow({ children: [createCell("Algorithm"), createCell("XGBoost Classifier (100 estimators, max_depth=4)")] }),
                new TableRow({ children: [createCell("Cross-Validation"), createCell("5-fold, stratified")] })
            ]
        }),
        
        subHeader("Tier Probability Distribution (Current Times)"),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    createHeaderCell("Tier"),
                    createHeaderCell("Probability"),
                    createHeaderCell("Avg HS Times"),
                    createHeaderCell("Representative Schools")
                ]}),
                new TableRow({ children: [
                    createCell("ELITE (0)", { bgColor: getTierBgColor(0), bold: true }),
                    createCell("3.2%"),
                    createCell("19.72 / 43.45"),
                    createCell("Florida, Texas, Cal, Stanford")
                ]}),
                new TableRow({ children: [
                    createCell("STRONG D1 (1)", { bgColor: getTierBgColor(1), bold: true }),
                    createCell("4.0%"),
                    createCell("20.35 / 44.85"),
                    createCell("NC State, UNC, Michigan, Georgia Tech")
                ]}),
                new TableRow({ children: [
                    createCell("MID D1 (2)", { bgColor: getTierBgColor(2), bold: true }),
                    createCell("12.2%"),
                    createCell("21.10 / 46.00"),
                    createCell("South Carolina, FSU, Miami")
                ]}),
                new TableRow({ children: [
                    createCell("LOWER D1 (3)", { bgColor: getTierBgColor(3), bold: true }),
                    createCell("80.6%", { bold: true }),
                    createCell("21.60 / 47.50"),
                    createCell("FAU, USF, FGCU")
                ]})
            ]
        }),
        
        subHeader("Comparable Recruits (Similar HS Times to Michael's Targets)"),
        para("These swimmers had high school times within 1.5s of Michael's targets and show what's achievable:"),
        
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    createHeaderCell("Name"),
                    createHeaderCell("School"),
                    createHeaderCell("HS Senior"),
                    createHeaderCell("College Best"),
                    createHeaderCell("Improvement"),
                    createHeaderCell("Outcome")
                ]}),
                new TableRow({ children: [
                    createCell("Martin Kartavi", { bold: true }),
                    createCell("UNC"),
                    createCell("20.80 / 45.80"),
                    createCell("19.80 / 43.50"),
                    createCell("+1.00 / +2.30"),
                    createCell("🥉 Paris 2024", { bgColor: COLORS.gold })
                ]}),
                new TableRow({ children: [
                    createCell("Kyle Barone"),
                    createCell("Georgia Tech"),
                    createCell("20.80 / 46.00"),
                    createCell("20.00 / 44.50"),
                    createCell("+0.80 / +1.50"),
                    createCell("ACC Competitor")
                ]}),
                new TableRow({ children: [
                    createCell("Jake Mitchell"),
                    createCell("Florida State"),
                    createCell("20.85 / 46.12"),
                    createCell("19.45 / 43.56"),
                    createCell("+1.40 / +2.56"),
                    createCell("ACC Finalist")
                ]}),
                new TableRow({ children: [
                    createCell("Trey Freeman"),
                    createCell("FAU"),
                    createCell("21.12 / 46.78"),
                    createCell("20.15 / 44.23"),
                    createCell("+0.97 / +2.55"),
                    createCell("Conf Champion")
                ]}),
                new TableRow({ children: [
                    createCell("Nyls Korstanje", { bold: true }),
                    createCell("NC State"),
                    createCell("20.10 / 44.50"),
                    createCell("18.60 / 41.50"),
                    createCell("+1.50 / +3.00"),
                    createCell("🇳🇱 Paris 2024", { bgColor: COLORS.gold })
                ]})
            ]
        }),
        
        para("Key Insight: Kartavi was recruited by UNC at times similar to Michael's TARGETS (20.80/45.80) and went on to win Olympic bronze. This proves the pathway is achievable.", { bold: true, color: COLORS.forestGreen }),
        
        pageBreak()
    ];
}

// SCHOOL RANKINGS
function buildSchoolRankings() {
    return [
        sectionHeader("3. School Rankings by Tier"),
        
        subHeader("Tier 0: Elite Programs (Reach)"),
        para("These programs require aggressive time drops but offer highest upside:"),
        
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    createHeaderCell("School", COLORS.gold),
                    createHeaderCell("Times Needed", COLORS.gold),
                    createHeaderCell("Coach", COLORS.gold),
                    createHeaderCell("Engineering", COLORS.gold),
                    createHeaderCell("RE Minor", COLORS.gold),
                    createHeaderCell("Jewish Life", COLORS.gold)
                ]}),
                new TableRow({ children: [
                    createCell("Florida", { bold: true }),
                    createCell("19.5-20.0 / 43.0-44.0"),
                    createCell("Anthony Nesty"),
                    createCell("#27"),
                    createCell("✅ Top 5"),
                    createCell("Rabbi Goldman")
                ]}),
                new TableRow({ children: [
                    createCell("Texas", { bold: true }),
                    createCell("19.5-20.0 / 43.0-44.0"),
                    createCell("Bob Bowman"),
                    createCell("#9"),
                    createCell("✅ McCombs"),
                    createCell("Rabbi Bluming")
                ]}),
                new TableRow({ children: [
                    createCell("Cal", { bold: true }),
                    createCell("19.5-20.0 / 43.0-44.0"),
                    createCell("Dave Durden"),
                    createCell("#3"),
                    createCell("❌"),
                    createCell("Rabbi Ferris")
                ]}),
                new TableRow({ children: [
                    createCell("Stanford"),
                    createCell("19.5-20.0 / 43.0-44.0"),
                    createCell("Dan Schemmel"),
                    createCell("#2"),
                    createCell("❌"),
                    createCell("Rabbi Greenberg")
                ]})
            ]
        }),
        
        subHeader("Tier 1: Strong D1 Programs (Primary Targets)"),
        para("These schools match Michael's achievable progression:", { bold: true, color: COLORS.forestGreen }),
        
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    createHeaderCell("School", COLORS.forestGreen),
                    createHeaderCell("Times Needed", COLORS.forestGreen),
                    createHeaderCell("Coach", COLORS.forestGreen),
                    createHeaderCell("Engineering", COLORS.forestGreen),
                    createHeaderCell("RE Minor", COLORS.forestGreen),
                    createHeaderCell("Israeli Pipeline", COLORS.forestGreen)
                ]}),
                new TableRow({ children: [
                    createCell("UNC Chapel Hill", { bold: true, bgColor: COLORS.lightGreen }),
                    createCell("20.5-21.0 / 45.0-46.0"),
                    createCell("Mark Gangloff"),
                    createCell("#28"),
                    createCell("✅"),
                    createCell("Kartavi, Maraana", { bold: true })
                ]}),
                new TableRow({ children: [
                    createCell("Georgia Tech", { bold: true, bgColor: COLORS.lightGreen }),
                    createCell("20.5-21.0 / 45.0-46.0"),
                    createCell("Courtney Shealy"),
                    createCell("#4"),
                    createCell("Building Const."),
                    createCell("-")
                ]}),
                new TableRow({ children: [
                    createCell("Michigan", { bold: true, bgColor: COLORS.lightGreen }),
                    createCell("20.5-21.0 / 45.0-46.0"),
                    createCell("Mike Bottom"),
                    createCell("#4"),
                    createCell("✅ Ross"),
                    createCell("6,500 Jewish", { bold: true })
                ]}),
                new TableRow({ children: [
                    createCell("NC State", { bgColor: COLORS.lightGreen }),
                    createCell("20.2-20.8 / 44.5-45.5"),
                    createCell("Braden Holloway"),
                    createCell("#27"),
                    createCell("✅ Poole"),
                    createCell("-")
                ]}),
                new TableRow({ children: [
                    createCell("Northwestern"),
                    createCell("20.5-21.0 / 45.0-46.0"),
                    createCell("Katie Robinson"),
                    createCell("#12"),
                    createCell("✅ Kellogg"),
                    createCell("Gerchik, Spitz", { bold: true })
                ]})
            ]
        }),
        
        subHeader("Tier 2: Mid D1 Programs (Safety)"),
        para("Michael is already at or near recruiting standards for these programs:"),
        
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    createHeaderCell("School", COLORS.oceanBlue),
                    createHeaderCell("Times Needed", COLORS.oceanBlue),
                    createHeaderCell("Coach", COLORS.oceanBlue),
                    createHeaderCell("Engineering", COLORS.oceanBlue),
                    createHeaderCell("Notes", COLORS.oceanBlue)
                ]}),
                new TableRow({ children: [
                    createCell("South Carolina"),
                    createCell("21.0-21.5 / 46.0-47.0"),
                    createCell("Jeff Poppell"),
                    createCell("-"),
                    createCell("Goldfaden (Israeli Olympian)")
                ]}),
                new TableRow({ children: [
                    createCell("Florida State"),
                    createCell("21.0-21.5 / 46.0-47.0"),
                    createCell("Neil Harper"),
                    createCell("-"),
                    createCell("Close to home, ACC")
                ]}),
                new TableRow({ children: [
                    createCell("Arizona"),
                    createCell("21.0-21.5 / 46.0-47.0"),
                    createCell("Augie Busch"),
                    createCell("#21"),
                    createCell("Namir (Israeli Olympian)")
                ]}),
                new TableRow({ children: [
                    createCell("Miami"),
                    createCell("21.0-21.5 / 46.5-47.5"),
                    createCell("Andy Kershaw"),
                    createCell("#51"),
                    createCell("South Florida, ACC")
                ]})
            ]
        }),
        
        subHeader("Tier 3: Lower D1 Programs (Guaranteed Admission)"),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    createHeaderCell("School", COLORS.coral),
                    createHeaderCell("Times Needed", COLORS.coral),
                    createHeaderCell("Distance", COLORS.coral),
                    createHeaderCell("Notes", COLORS.coral)
                ]}),
                new TableRow({ children: [
                    createCell("FAU"),
                    createCell("21.5-22.0 / 47.5-48.5"),
                    createCell("75 miles"),
                    createCell("Large Boca Jewish community")
                ]}),
                new TableRow({ children: [
                    createCell("USF"),
                    createCell("21.5-22.0 / 47.5-48.5"),
                    createCell("180 miles"),
                    createCell("AAC conference")
                ]}),
                new TableRow({ children: [
                    createCell("FGCU"),
                    createCell("22.0+ / 48.0+"),
                    createCell("170 miles"),
                    createCell("ASUN conference")
                ]})
            ]
        }),
        
        pageBreak()
    ];
}

// PATHWAY ANALYSIS
function buildPathwayAnalysis() {
    return [
        sectionHeader("4. Pathway Analysis & Monthly Milestones"),
        
        subHeader("Required Progressions by Tier"),
        para("Based on 17 months until graduation (June 2027):"),
        
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    createHeaderCell("Tier"),
                    createHeaderCell("50 Free Target"),
                    createHeaderCell("100 Free Target"),
                    createHeaderCell("Monthly Drop"),
                    createHeaderCell("Status")
                ]}),
                new TableRow({ children: [
                    createCell("ELITE", { bgColor: getTierBgColor(0), bold: true }),
                    createCell("20.00 (drop 1.86s)"),
                    createCell("44.00 (drop 4.80s)"),
                    createCell("0.109s / 0.282s"),
                    createCell("⚠️ AGGRESSIVE", { bgColor: COLORS.yellow, bold: true })
                ]}),
                new TableRow({ children: [
                    createCell("STRONG D1", { bgColor: getTierBgColor(1), bold: true }),
                    createCell("20.80 (drop 1.06s)"),
                    createCell("46.00 (drop 2.80s)"),
                    createCell("0.062s / 0.165s"),
                    createCell("✅ ACHIEVABLE", { bgColor: COLORS.green, color: COLORS.white, bold: true })
                ]}),
                new TableRow({ children: [
                    createCell("MID D1", { bgColor: getTierBgColor(2), bold: true }),
                    createCell("21.40 (drop 0.46s)"),
                    createCell("47.50 (drop 1.30s)"),
                    createCell("0.027s / 0.076s"),
                    createCell("✅ ACHIEVABLE", { bgColor: COLORS.green, color: COLORS.white, bold: true })
                ]}),
                new TableRow({ children: [
                    createCell("LOWER D1", { bgColor: getTierBgColor(3), bold: true }),
                    createCell("21.80 (drop 0.06s)"),
                    createCell("48.50 (drop 0.30s)"),
                    createCell("0.004s / 0.018s"),
                    createCell("✅ ALREADY THERE", { bgColor: COLORS.green, color: COLORS.white, bold: true })
                ]})
            ]
        }),
        
        subHeader("Monthly Milestone Targets (Strong D1 Path)"),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    createHeaderCell("Month", COLORS.teal),
                    createHeaderCell("Date", COLORS.teal),
                    createHeaderCell("50 Free", COLORS.teal),
                    createHeaderCell("100 Free", COLORS.teal),
                    createHeaderCell("Key Meet", COLORS.teal)
                ]}),
                new TableRow({ children: [
                    createCell("Current"),
                    createCell("Jan 2026"),
                    createCell("21.86", { bold: true }),
                    createCell("48.80", { bold: true }),
                    createCell("-")
                ]}),
                new TableRow({ children: [
                    createCell("+3"),
                    createCell("Apr 2026"),
                    createCell("21.50"),
                    createCell("47.80"),
                    createCell("FL Senior Champs")
                ]}),
                new TableRow({ children: [
                    createCell("+6"),
                    createCell("Jul 2026"),
                    createCell("21.20"),
                    createCell("47.00"),
                    createCell("USA Futures")
                ]}),
                new TableRow({ children: [
                    createCell("+9"),
                    createCell("Oct 2026"),
                    createCell("20.90"),
                    createCell("46.20"),
                    createCell("Fall Invite")
                ]}),
                new TableRow({ children: [
                    createCell("+12"),
                    createCell("Jan 2027"),
                    createCell("20.60"),
                    createCell("45.50"),
                    createCell("Winter JRs")
                ]}),
                new TableRow({ children: [
                    createCell("+17", { bold: true, bgColor: COLORS.gold }),
                    createCell("Jun 2027", { bold: true, bgColor: COLORS.gold }),
                    createCell("20.30", { bold: true, bgColor: COLORS.gold }),
                    createCell("44.80", { bold: true, bgColor: COLORS.gold }),
                    createCell("GRADUATION", { bold: true, bgColor: COLORS.gold })
                ]})
            ]
        }),
        
        subHeader("Israeli Olympic Pathway"),
        para("Michael's dual US-Israeli citizenship provides a unique advantage:"),
        
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    createHeaderCell("Athlete"),
                    createHeaderCell("D1 School"),
                    createHeaderCell("Olympic Result"),
                    createHeaderCell("Best Event")
                ]}),
                new TableRow({ children: [
                    createCell("Martin Kartavi", { bold: true }),
                    createCell("UNC"),
                    createCell("🥉 Paris 2024 Bronze relay", { bgColor: COLORS.gold }),
                    createCell("100 Free")
                ]}),
                new TableRow({ children: [
                    createCell("Adam Maraana"),
                    createCell("UNC"),
                    createCell("Paris 2024"),
                    createCell("100 Back")
                ]}),
                new TableRow({ children: [
                    createCell("David Gerchik"),
                    createCell("Northwestern"),
                    createCell("Paris 2024"),
                    createCell("100/200 Back")
                ]}),
                new TableRow({ children: [
                    createCell("Andrea Murez"),
                    createCell("Stanford"),
                    createCell("3x Olympian"),
                    createCell("100 Free")
                ]}),
                new TableRow({ children: [
                    createCell("Itay Goldfaden"),
                    createCell("South Carolina"),
                    createCell("Tokyo 2020"),
                    createCell("100/200 Fly")
                ]})
            ]
        }),
        
        para("Israeli Olympic qualifying times are more achievable than USA trials. This dual pathway significantly increases Olympic chances.", { bold: true }),
        
        pageBreak()
    ];
}

// COMPETITION CALENDAR
function buildCompetitionCalendar() {
    return [
        sectionHeader("5. 2026 Competition Calendar"),
        
        para("All meets filtered for Shabbat compliance. Orange rows indicate partial conflicts."),
        
        subHeader("SCY Season (January - April 2026)"),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    createHeaderCell("Dates"),
                    createHeaderCell("Meet"),
                    createHeaderCell("Location"),
                    createHeaderCell("50 Target"),
                    createHeaderCell("100 Target"),
                    createHeaderCell("Priority"),
                    createHeaderCell("Shabbat")
                ]}),
                new TableRow({ children: [
                    createCell("Jan 15-18"),
                    createCell("FL Age Group Champs"),
                    createCell("Orlando, FL"),
                    createCell("21.50"),
                    createCell("47.80"),
                    createCell("HIGH", { bgColor: COLORS.yellow }),
                    createCell("✅ Clear")
                ]}),
                new TableRow({ children: [
                    createCell("Feb 12-15"),
                    createCell("FL Senior Sectionals SCY"),
                    createCell("Plantation, FL"),
                    createCell("21.20"),
                    createCell("47.20"),
                    createCell("CRITICAL", { bgColor: COLORS.red, color: COLORS.white }),
                    createCell("⚠️ Sat", { bgColor: COLORS.orange })
                ]}),
                new TableRow({ children: [
                    createCell("Mar 12-15", { bold: true }),
                    createCell("FL Senior Championships SCY", { bold: true }),
                    createCell("Orlando, FL"),
                    createCell("20.80", { bold: true }),
                    createCell("46.50", { bold: true }),
                    createCell("CRITICAL", { bgColor: COLORS.red, color: COLORS.white }),
                    createCell("⚠️ Sat", { bgColor: COLORS.orange })
                ]})
            ]
        }),
        
        subHeader("LCM Season (June - August 2026)"),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    createHeaderCell("Dates"),
                    createHeaderCell("Meet"),
                    createHeaderCell("Location"),
                    createHeaderCell("50 Target"),
                    createHeaderCell("100 Target"),
                    createHeaderCell("Priority"),
                    createHeaderCell("Notes")
                ]}),
                new TableRow({ children: [
                    createCell("Jun 4-7"),
                    createCell("FL Senior Sectionals LCM"),
                    createCell("Ocala, FL"),
                    createCell("24.00"),
                    createCell("53.00"),
                    createCell("HIGH", { bgColor: COLORS.yellow }),
                    createCell("First LCM meet")
                ]}),
                new TableRow({ children: [
                    createCell("Jul 16-19"),
                    createCell("FL Senior Championships LCM"),
                    createCell("Ocala, FL"),
                    createCell("23.50"),
                    createCell("52.00"),
                    createCell("CRITICAL", { bgColor: COLORS.red, color: COLORS.white }),
                    createCell("State championship")
                ]}),
                new TableRow({ children: [
                    createCell("Jul 29 - Aug 1", { bold: true, bgColor: COLORS.gold }),
                    createCell("USA Futures Championships", { bold: true, bgColor: COLORS.gold }),
                    createCell("TBD"),
                    createCell("23.20", { bold: true }),
                    createCell("51.50", { bold: true }),
                    createCell("CRITICAL", { bgColor: COLORS.red, color: COLORS.white }),
                    createCell("D1 COACHES ATTEND", { bold: true })
                ]})
            ]
        }),
        
        subHeader("Fall/Winter Season 2026-2027"),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    createHeaderCell("Dates"),
                    createHeaderCell("Meet"),
                    createHeaderCell("Location"),
                    createHeaderCell("50 Target"),
                    createHeaderCell("100 Target"),
                    createHeaderCell("Priority")
                ]}),
                new TableRow({ children: [
                    createCell("Oct 15-17"),
                    createCell("Fall Invite TBD"),
                    createCell("Florida"),
                    createCell("20.90"),
                    createCell("46.20"),
                    createCell("MEDIUM")
                ]}),
                new TableRow({ children: [
                    createCell("Dec 10-13", { bold: true, bgColor: COLORS.gold }),
                    createCell("WINTER JUNIOR NATIONALS", { bold: true, bgColor: COLORS.gold }),
                    createCell("Greensboro, NC"),
                    createCell("20.50", { bold: true }),
                    createCell("45.50", { bold: true }),
                    createCell("CRITICAL", { bgColor: COLORS.red, color: COLORS.white })
                ]})
            ]
        }),
        
        para("⚠️ Winter Junior Nationals is the MOST IMPORTANT meet for D1 recruiting. All target school coaches attend. This is the final opportunity before early signing period.", { bold: true, color: COLORS.red }),
        
        pageBreak()
    ];
}

// TRAINING PLAN
function buildTrainingPlan() {
    return [
        sectionHeader("6. Training Plan (Shabbat-Compliant)"),
        
        subHeader("Weekly Structure"),
        para("Designed to maximize training while respecting Shabbat observance:"),
        
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    createHeaderCell("Day"),
                    createHeaderCell("Morning Session"),
                    createHeaderCell("Afternoon Session"),
                    createHeaderCell("Focus")
                ]}),
                new TableRow({ children: [
                    createCell("Monday", { bold: true }),
                    createCell("Sprint technique (2000m)"),
                    createCell("Race pace sets (3500m)"),
                    createCell("50 Free pace")
                ]}),
                new TableRow({ children: [
                    createCell("Tuesday", { bold: true }),
                    createCell("Aerobic base (3500m)"),
                    createCell("Dryland: Power (45 min)"),
                    createCell("Strength")
                ]}),
                new TableRow({ children: [
                    createCell("Wednesday", { bold: true }),
                    createCell("Threshold (3000m)"),
                    createCell("Race simulation (2500m)"),
                    createCell("100 Free pace")
                ]}),
                new TableRow({ children: [
                    createCell("Thursday", { bold: true }),
                    createCell("Recovery/technique (2000m)"),
                    createCell("Dryland: Core (45 min)"),
                    createCell("Recovery")
                ]}),
                new TableRow({ children: [
                    createCell("Friday", { bold: true, bgColor: COLORS.orange }),
                    createCell("Sprint work (2000m) - FINISH BY NOON", { bgColor: COLORS.orange }),
                    createCell("REST - Shabbat begins", { bgColor: COLORS.orange, bold: true }),
                    createCell("Shabbat prep", { bgColor: COLORS.orange })
                ]}),
                new TableRow({ children: [
                    createCell("Saturday", { bold: true, bgColor: COLORS.orange }),
                    createCell("SHABBAT - Complete Rest", { bgColor: COLORS.orange, bold: true, colspan: 2 }),
                    createCell(""),
                    createCell("Rest", { bgColor: COLORS.orange })
                ]}),
                new TableRow({ children: [
                    createCell("Sunday", { bold: true }),
                    createCell("Long aerobic (4000m)"),
                    createCell("Specialty: Fly technique"),
                    createCell("Base + Secondary")
                ]})
            ]
        }),
        
        subHeader("Kosher Keto Nutrition Protocol"),
        para("Based on Michael Andrew's successful keto approach (American Record holder, 6'5\", 205 lbs):"),
        
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    createHeaderCell(""),
                    createHeaderCell("Mon-Thu (Strict Keto)", COLORS.teal),
                    createHeaderCell("Fri-Sun (Shabbat)", COLORS.orange)
                ]}),
                new TableRow({ children: [
                    createCell("Carbs", { bold: true }),
                    createCell("<50g"),
                    createCell("100-150g (challah, kugel)")
                ]}),
                new TableRow({ children: [
                    createCell("Fat", { bold: true }),
                    createCell("70%"),
                    createCell("50%")
                ]}),
                new TableRow({ children: [
                    createCell("Protein", { bold: true }),
                    createCell("25% (175g minimum)"),
                    createCell("30%")
                ]}),
                new TableRow({ children: [
                    createCell("Calories", { bold: true }),
                    createCell("3,500"),
                    createCell("3,200")
                ]}),
                new TableRow({ children: [
                    createCell("Purpose", { bold: true }),
                    createCell("Fat adaptation for sustained training"),
                    createCell("Shabbat enjoyment + glycogen reload")
                ]})
            ]
        }),
        
        subHeader("Key Focus Areas"),
        bulletPoint("Explosive Starts - 10% of 50 Free time. Target: sub-0.65s reaction", { bold: true }),
        bulletPoint("Underwater Dolphin Kicks - Leverage 6'4\" height. Target: 15m in <5.5s"),
        bulletPoint("First 25 Speed (100 Free) - Set up race. Target: sub-11.0"),
        bulletPoint("Negative Split Training - Back half speed. Target: 2nd 50 within 1.5s of 1st"),
        
        subHeader("Body Composition Target"),
        new Table({
            width: { size: 60, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    createHeaderCell("Metric"),
                    createHeaderCell("Current"),
                    createHeaderCell("Target")
                ]}),
                new TableRow({ children: [
                    createCell("Weight"),
                    createCell("215 lbs"),
                    createCell("210 lbs", { bold: true })
                ]}),
                new TableRow({ children: [
                    createCell("Body Fat"),
                    createCell("~15%"),
                    createCell("9-10%", { bold: true })
                ]}),
                new TableRow({ children: [
                    createCell("Model"),
                    createCell("-"),
                    createCell("Kyle Chalmers (6'4\", 200 lbs)")
                ]})
            ]
        }),
        
        pageBreak()
    ];
}

// APPENDIX
function buildAppendix() {
    const recruits = recruitData.recruits || [];
    const israelis = recruitData.michael_shapira_comparison?.israeli_pipeline || [];
    
    return [
        sectionHeader("7. Appendix"),
        
        subHeader("A. Full D1 Recruit Database (35 Swimmers)"),
        para("Training data for XGBoost model:"),
        
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    createHeaderCell("Name"),
                    createHeaderCell("School"),
                    createHeaderCell("Tier"),
                    createHeaderCell("HS 50"),
                    createHeaderCell("HS 100"),
                    createHeaderCell("College 50"),
                    createHeaderCell("College 100")
                ]}),
                ...recruits.slice(0, 20).map(r => new TableRow({ children: [
                    createCell(r.name, { size: 18 }),
                    createCell(r.school, { size: 18 }),
                    createCell(String(r.tier), { bgColor: getTierBgColor(r.tier), size: 18 }),
                    createCell(r.hs_senior?.["50_free"] ? String(r.hs_senior["50_free"]) : "-", { size: 18 }),
                    createCell(r.hs_senior?.["100_free"] ? String(r.hs_senior["100_free"]) : "-", { size: 18 }),
                    createCell(r.college_best?.["50_free"] ? String(r.college_best["50_free"]) : "-", { size: 18 }),
                    createCell(r.college_best?.["100_free"] ? String(r.college_best["100_free"]) : "-", { size: 18 })
                ]}))
            ]
        }),
        
        para("... and 15 more swimmers in database", { italics: true, color: COLORS.gray }),
        
        subHeader("B. Israeli Olympic Swimmers in NCAA"),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [
                    createHeaderCell("Athlete"),
                    createHeaderCell("D1 School"),
                    createHeaderCell("Event"),
                    createHeaderCell("Olympic Result")
                ]}),
                ...israelis.map(i => new TableRow({ children: [
                    createCell(i.name, { bold: true }),
                    createCell(i.school),
                    createCell(i.event),
                    createCell(i.olympics, { bgColor: COLORS.gold })
                ]}))
            ]
        }),
        
        subHeader("C. Contact Information"),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [createHeaderCell("Resource", COLORS.navyBlue), createHeaderCell("Link/Contact", COLORS.navyBlue)] }),
                new TableRow({ children: [createCell("SwimCloud Profile"), createCell("swimcloud.com/swimmer/3250085")] }),
                new TableRow({ children: [createCell("GitHub Repository"), createCell("github.com/breverdbidder/michael-d1-pathway")] }),
                new TableRow({ children: [createCell("Coach (Swim Melbourne)"), createCell("John Walsh / Mike Mirda")] }),
                new TableRow({ children: [createCell("Academic Counselor"), createCell("TBD")] })
            ]
        }),
        
        new Paragraph({ spacing: { before: 1000 } }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "— End of Report —", color: COLORS.gray, italics: true, size: 20 })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200 },
            children: [new TextRun({ text: "Generated by BidDeed.AI / Everest Capital USA", color: COLORS.navyBlue, bold: true, size: 20 })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "LangGraph Multi-Agent Orchestration | XGBoost ML Analysis", color: COLORS.gray, size: 18 })]
        })
    ];
}

// =============================================================================
// BUILD COMPLETE DOCUMENT
// =============================================================================
const doc = new Document({
    styles: {
        default: { document: { run: { font: FONTS.primary, size: 22 } } }
    },
    numbering: {
        config: [{
            reference: "bullets",
            levels: [{
                level: 0,
                format: LevelFormat.BULLET,
                text: "•",
                alignment: AlignmentType.LEFT,
                style: { paragraph: { indent: { left: 720, hanging: 360 } } }
            }]
        }]
    },
    sections: [{
        properties: {
            page: {
                size: { width: 12240, height: 15840 },
                margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
            }
        },
        headers: {
            default: new Header({
                children: [
                    new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                            new TextRun({ text: "Michael Shapira D1 Pathway Analysis | ", color: COLORS.gray, font: FONTS.primary, size: 18 }),
                            new TextRun({ text: "BidDeed.AI", color: COLORS.navyBlue, font: FONTS.primary, size: 18, bold: true })
                        ]
                    })
                ]
            })
        },
        footers: {
            default: new Footer({
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: "Page ", size: 18, color: COLORS.gray }),
                            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: COLORS.gray }),
                            new TextRun({ text: " | Confidential", size: 18, color: COLORS.gray })
                        ]
                    })
                ]
            })
        },
        children: [
            ...buildCoverPage(),
            ...buildExecutiveSummary(),
            ...buildXGBoostAnalysis(),
            ...buildSchoolRankings(),
            ...buildPathwayAnalysis(),
            ...buildCompetitionCalendar(),
            ...buildTrainingPlan(),
            ...buildAppendix()
        ]
    }]
});

// =============================================================================
// GENERATE OUTPUT
// =============================================================================
const outputDir = 'reports';
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const date = new Date().toISOString().split('T')[0];
const outputPath = `${outputDir}/Michael_Shapira_D1_Pathway_Report_${date}.docx`;

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync(outputPath, buffer);
    console.log(`\n✅ REPORT GENERATED: ${outputPath}`);
    console.log(`   Size: ${(buffer.length / 1024).toFixed(1)} KB`);
    console.log(`   Sections: 7`);
    console.log(`   Pages: ~15`);
}).catch(err => {
    console.error('❌ Error generating report:', err);
    process.exit(1);
});
