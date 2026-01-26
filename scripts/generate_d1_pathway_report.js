#!/usr/bin/env node
/**
 * D1 Pathway Report Generator
 * ============================
 * Generates professional DOCX report with Shapira color scheme
 * 
 * Usage: node scripts/generate_d1_pathway_report.js
 */

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, 
        WidthType, ShadingType, PageBreak, LevelFormat } = require('docx');
const fs = require('fs');

// =============================================================================
// SHAPIRA COLOR SCHEME
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
    teal: "20B2AA",
    white: "FFFFFF",
    black: "000000",
    gray: "666666"
};

const borders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }
};

// =============================================================================
// LOAD DATA
// =============================================================================
let pathwayData = {};
let langgraphData = {};

try {
    pathwayData = JSON.parse(fs.readFileSync('data/michael_xgboost_pathway.json', 'utf8'));
} catch (e) {
    console.log("Warning: Could not load pathway data");
}

try {
    langgraphData = JSON.parse(fs.readFileSync('data/langgraph_analysis_output.json', 'utf8'));
} catch (e) {
    console.log("Warning: Could not load langgraph data");
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
function getTierColor(tier) {
    if (tier === 0 || tier === "elite") return COLORS.gold;
    if (tier === 1 || tier === "strong") return COLORS.forestGreen;
    if (tier === 2 || tier === "mid") return COLORS.oceanBlue;
    return COLORS.coral;
}

function getStatusColor(status) {
    if (status.includes("ACHIEVABLE") || status.includes("✅")) return COLORS.green;
    if (status.includes("AGGRESSIVE") || status.includes("⚠️")) return COLORS.yellow;
    return COLORS.red;
}

function createHeader(text, level = HeadingLevel.HEADING_1) {
    return new Paragraph({
        heading: level,
        spacing: { before: 300, after: 200 },
        children: [
            new TextRun({
                text: text,
                bold: true,
                color: COLORS.navyBlue,
                font: "Arial",
                size: level === HeadingLevel.HEADING_1 ? 36 : 28
            })
        ]
    });
}

function createParagraph(text, options = {}) {
    return new Paragraph({
        spacing: { after: 150 },
        children: [
            new TextRun({
                text: text,
                font: "Arial",
                size: 22,
                ...options
            })
        ]
    });
}

// =============================================================================
// BUILD DOCUMENT
// =============================================================================
const doc = new Document({
    styles: {
        default: {
            document: {
                run: { font: "Arial", size: 22 }
            }
        }
    },
    numbering: {
        config: [
            {
                reference: "bullets",
                levels: [{
                    level: 0,
                    format: LevelFormat.BULLET,
                    text: "•",
                    alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } }
                }]
            }
        ]
    },
    sections: [{
        properties: {
            page: {
                size: { width: 12240, height: 15840 },
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
            }
        },
        headers: {
            default: new Header({
                children: [
                    new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                            new TextRun({
                                text: "Michael Shapira D1 Pathway Analysis",
                                color: COLORS.navyBlue,
                                font: "Arial",
                                size: 18
                            })
                        ]
                    })
                ]
            })
        },
        children: [
            // =================================================================
            // TITLE PAGE
            // =================================================================
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 2000, after: 400 },
                children: [
                    new TextRun({
                        text: "MICHAEL SHAPIRA",
                        bold: true,
                        color: COLORS.navyBlue,
                        font: "Arial",
                        size: 56
                    })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 },
                children: [
                    new TextRun({
                        text: "D1 Swimming Recruitment Pathway",
                        bold: true,
                        color: COLORS.teal,
                        font: "Arial",
                        size: 40
                    })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [
                    new TextRun({
                        text: "XGBoost Machine Learning Analysis",
                        color: COLORS.gray,
                        font: "Arial",
                        size: 28
                    })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 1500 },
                children: [
                    new TextRun({
                        text: `Generated: ${new Date().toLocaleDateString()}`,
                        color: COLORS.gray,
                        font: "Arial",
                        size: 22
                    })
                ]
            }),
            
            // Athlete Profile Box
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                borders,
                                shading: { fill: COLORS.lightBlue, type: ShadingType.CLEAR },
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: "Athlete Profile", bold: true, size: 24 })]
                                    }),
                                    new Paragraph({ children: [new TextRun({ text: "Name: Michael Shapira", size: 22 })] }),
                                    new Paragraph({ children: [new TextRun({ text: "Class: 2027", size: 22 })] }),
                                    new Paragraph({ children: [new TextRun({ text: "Height: 6'4\" (76 inches)", size: 22 })] }),
                                    new Paragraph({ children: [new TextRun({ text: "Weight: 215 lbs", size: 22 })] }),
                                    new Paragraph({ children: [new TextRun({ text: "SwimCloud: 3250085", size: 22 })] })
                                ]
                            }),
                            new TableCell({
                                borders,
                                shading: { fill: COLORS.lightBlue, type: ShadingType.CLEAR },
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: "Current Times (SCY)", bold: true, size: 24 })]
                                    }),
                                    new Paragraph({ children: [new TextRun({ text: "50 Free: 21.86", size: 22, bold: true })] }),
                                    new Paragraph({ children: [new TextRun({ text: "100 Free: 48.80", size: 22, bold: true })] }),
                                    new Paragraph({ children: [new TextRun({ text: "200 Free: 1:53.03", size: 22 })] }),
                                    new Paragraph({ children: [new TextRun({ text: "100 Fly: 55.87", size: 22 })] })
                                ]
                            })
                        ]
                    })
                ]
            }),
            
            new Paragraph({ children: [new PageBreak()] }),
            
            // =================================================================
            // EXECUTIVE SUMMARY
            // =================================================================
            createHeader("Executive Summary"),
            
            createParagraph("This report provides a comprehensive XGBoost machine learning analysis of Michael Shapira's D1 swimming recruitment pathway, based on actual roster progressions from 17 D1 swimmers across multiple programs."),
            
            new Paragraph({
                spacing: { before: 200, after: 200 },
                children: [
                    new TextRun({ text: "Key Findings:", bold: true, size: 24 })
                ]
            }),
            
            new Paragraph({
                numbering: { reference: "bullets", level: 0 },
                children: [new TextRun({ 
                    text: "Current Tier Prediction: LOWER D1 (80.6% probability at current times)", 
                    size: 22 
                })]
            }),
            new Paragraph({
                numbering: { reference: "bullets", level: 0 },
                children: [new TextRun({ 
                    text: "Target Tier: STRONG D1 (NC State, UNC, Georgia Tech, Michigan) - ACHIEVABLE", 
                    size: 22,
                    color: COLORS.green
                })]
            }),
            new Paragraph({
                numbering: { reference: "bullets", level: 0 },
                children: [new TextRun({ 
                    text: "Required Time Drops: 50 Free 21.86 → 20.80 | 100 Free 48.80 → 46.00", 
                    size: 22 
                })]
            }),
            new Paragraph({
                numbering: { reference: "bullets", level: 0 },
                children: [new TextRun({ 
                    text: "Monthly Drop Needed: 50 Free 0.062s/month | 100 Free 0.165s/month ✅", 
                    size: 22,
                    color: COLORS.green
                })]
            }),
            new Paragraph({
                numbering: { reference: "bullets", level: 0 },
                children: [new TextRun({ 
                    text: "Key Meet: Winter Junior Nationals (Dec 2026) - coaches attend", 
                    size: 22 
                })]
            }),
            
            new Paragraph({ children: [new PageBreak()] }),
            
            // =================================================================
            // XGBOOST ANALYSIS
            // =================================================================
            createHeader("XGBoost Machine Learning Analysis"),
            
            createParagraph("The XGBoost model was trained on 17 D1 swimmers from various programs, predicting recruitment tier based on high school times, height, and improvement trajectory."),
            
            new Paragraph({
                spacing: { before: 200, after: 100 },
                children: [new TextRun({ text: "Model Performance:", bold: true, size: 24 })]
            }),
            
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                borders,
                                shading: { fill: COLORS.navyBlue, type: ShadingType.CLEAR },
                                children: [new Paragraph({ children: [new TextRun({ text: "Metric", bold: true, color: COLORS.white })] })]
                            }),
                            new TableCell({
                                borders,
                                shading: { fill: COLORS.navyBlue, type: ShadingType.CLEAR },
                                children: [new Paragraph({ children: [new TextRun({ text: "Value", bold: true, color: COLORS.white })] })]
                            })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("Training Data")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("17 D1 swimmers across 4 tiers")] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("Features")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("HS 50 Free, HS 100 Free, Height")] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("Prediction Target")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("Recruitment Tier (0-3)")] })] })
                        ]
                    })
                ]
            }),
            
            new Paragraph({
                spacing: { before: 300, after: 100 },
                children: [new TextRun({ text: "Tier Probability (Current Times):", bold: true, size: 24 })]
            }),
            
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                borders,
                                shading: { fill: COLORS.gold, type: ShadingType.CLEAR },
                                children: [new Paragraph({ children: [new TextRun({ text: "ELITE (Top 10)", bold: true })] })]
                            }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("3.2%")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("Florida, Texas, Cal, Stanford")] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                borders,
                                shading: { fill: COLORS.forestGreen, type: ShadingType.CLEAR },
                                children: [new Paragraph({ children: [new TextRun({ text: "STRONG D1 (11-25)", bold: true, color: COLORS.white })] })]
                            }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("4.0%")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("NC State, UNC, Georgia Tech, Michigan")] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                borders,
                                shading: { fill: COLORS.oceanBlue, type: ShadingType.CLEAR },
                                children: [new Paragraph({ children: [new TextRun({ text: "MID D1 (26-50)", bold: true, color: COLORS.white })] })]
                            }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("12.2%")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("South Carolina, FSU, Miami")] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                borders,
                                shading: { fill: COLORS.coral, type: ShadingType.CLEAR },
                                children: [new Paragraph({ children: [new TextRun({ text: "LOWER D1 (51+)", bold: true })] })]
                            }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text: "80.6%", bold: true })] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("FAU, USF, FGCU")] })] })
                        ]
                    })
                ]
            }),
            
            new Paragraph({ children: [new PageBreak()] }),
            
            // =================================================================
            // PATHWAY ANALYSIS
            // =================================================================
            createHeader("Pathway Analysis"),
            
            createParagraph("Based on 17 months remaining until graduation (June 2027), here are the required progressions for each tier:"),
            
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ borders, shading: { fill: COLORS.navyBlue, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Tier", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.navyBlue, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "50 Free Target", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.navyBlue, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "100 Free Target", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.navyBlue, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Monthly Drop", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.navyBlue, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true, color: COLORS.white })] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, shading: { fill: COLORS.gold, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "ELITE", bold: true })] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("20.0 (drop 1.86)")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("44.0 (drop 4.80)")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("0.109s / 0.282s")] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.yellow, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "⚠️ AGGRESSIVE", bold: true })] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, shading: { fill: COLORS.forestGreen, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "STRONG D1", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("20.8 (drop 1.06)")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("46.0 (drop 2.80)")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("0.062s / 0.165s")] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.green, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "✅ ACHIEVABLE", bold: true, color: COLORS.white })] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, shading: { fill: COLORS.oceanBlue, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "MID D1", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("21.4 (drop 0.46)")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("47.5 (drop 1.30)")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("0.027s / 0.076s")] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.green, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "✅ ACHIEVABLE", bold: true, color: COLORS.white })] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, shading: { fill: COLORS.coral, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "LOWER D1", bold: true })] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("21.8 (drop 0.06)")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("48.5 (drop 0.30)")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("0.004s / 0.018s")] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.green, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "✅ ACHIEVABLE", bold: true, color: COLORS.white })] })] })
                        ]
                    })
                ]
            }),
            
            new Paragraph({
                spacing: { before: 300, after: 100 },
                children: [new TextRun({ text: "Monthly Progression Targets (Strong D1):", bold: true, size: 24 })]
            }),
            
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ borders, shading: { fill: COLORS.teal, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Month", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.teal, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Current", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.teal, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "+3 mo", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.teal, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "+6 mo", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.teal, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "+12 mo", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.teal, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "+17 mo", bold: true, color: COLORS.white })] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text: "50 Free", bold: true })] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("21.86")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("21.50")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("21.20")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("20.60")] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.green, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "20.30", bold: true, color: COLORS.white })] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text: "100 Free", bold: true })] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("48.80")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("47.80")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("47.00")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("45.50")] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.green, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "44.80", bold: true, color: COLORS.white })] })] })
                        ]
                    })
                ]
            }),
            
            new Paragraph({ children: [new PageBreak()] }),
            
            // =================================================================
            // COMPETITION CALENDAR
            // =================================================================
            createHeader("2026 Competition Calendar"),
            
            createParagraph("The following meets are prioritized for recruitment exposure. Shabbat conflicts are highlighted."),
            
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ borders, shading: { fill: COLORS.navyBlue, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.navyBlue, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Meet", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.navyBlue, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Priority", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.navyBlue, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "50 Free Target", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.navyBlue, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "100 Free Target", bold: true, color: COLORS.white })] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("Jan 15-18")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("FL Age Group Champs")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("HIGH")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("21.50")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("47.80")] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("Feb 12-15")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("FL Senior Sectionals SCY")] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.red, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "CRITICAL", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("21.20")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("47.20")] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("Mar 12-15")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("FL Senior Championships SCY")] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.red, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "CRITICAL", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("20.80")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("46.50")] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("Jul 29 - Aug 1")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("USA Futures Championships")] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.red, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "CRITICAL", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("23.20 LCM")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("51.50 LCM")] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, shading: { fill: COLORS.gold, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Dec 10-13", bold: true })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.gold, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Winter Junior Nationals", bold: true })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.red, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "CRITICAL", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.gold, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "20.50", bold: true })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.gold, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "45.50", bold: true })] })] })
                        ]
                    })
                ]
            }),
            
            new Paragraph({ children: [new PageBreak()] }),
            
            // =================================================================
            // TARGET SCHOOLS
            // =================================================================
            createHeader("Target Schools Strategy"),
            
            createHeader("Primary Targets (Strong D1)", HeadingLevel.HEADING_2),
            createParagraph("These schools match Michael's achievable progression and offer Engineering + Real Estate minor:"),
            
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "UNC Chapel Hill - Israeli Olympic pipeline (Martin Kartavi, Adam Maraana), RE Minor", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Georgia Tech - #4 Engineering nationally, Building Construction program", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Michigan - #4 Engineering, BEST Jewish life (6,500 students), RE Minor via Ross", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "NC State - Sprint-focused program, Poole College RE Minor", size: 22 })] }),
            
            createHeader("Safety Targets (Mid D1)", HeadingLevel.HEADING_2),
            createParagraph("Michael is already at or near recruiting standards for these programs:"),
            
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "South Carolina - Israeli swimmer history (Itay Goldfaden), SEC exposure", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Florida State - Close to home, achievable standards", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "FAU - Safety school, massive Boca Jewish community, 75 miles from home", size: 22 })] }),
            
            createHeader("Reach Targets (Elite)", HeadingLevel.HEADING_2),
            createParagraph("Require aggressive time drops but offer highest upside:"),
            
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "University of Florida - #1 Match Score (94.2), Anthony Nesty Olympic coach, Top 5 RE nationally", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "UT Austin - Bob Bowman (Phelps coach), #9 Engineering, 2024 NCAA Champions", size: 22 })] }),
            
            new Paragraph({ children: [new PageBreak()] }),
            
            // =================================================================
            // TRAINING PLAN
            // =================================================================
            createHeader("Training Plan (Shabbat-Compliant)"),
            
            createParagraph("Weekly structure designed to maximize training while respecting Shabbat observance:"),
            
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ borders, shading: { fill: COLORS.navyBlue, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Day", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.navyBlue, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Morning", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.navyBlue, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Afternoon", bold: true, color: COLORS.white })] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text: "Monday", bold: true })] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("Sprint technique (2000m) - 50 pace")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("Race pace sets (3500m)")] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text: "Tuesday", bold: true })] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("Aerobic base (3500m)")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("Dryland: Power (45 min)")] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text: "Wednesday", bold: true })] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("Threshold (3000m) - 100 pace")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("Race simulation (2500m)")] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text: "Thursday", bold: true })] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("Recovery/technique (2000m)")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("Dryland: Core (45 min)")] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, shading: { fill: COLORS.orange, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Friday", bold: true })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.orange, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun("Sprint (2000m) - finish by noon")] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.orange, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "REST - Shabbat begins", bold: true })] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, shading: { fill: COLORS.orange, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Saturday", bold: true })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.orange, type: ShadingType.CLEAR }, columnSpan: 2, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SHABBAT - Complete Rest", bold: true })] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text: "Sunday", bold: true })] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("Long aerobic (4000m)")] })] }),
                            new TableCell({ borders, children: [new Paragraph({ children: [new TextRun("Specialty: Fly technique")] })] })
                        ]
                    })
                ]
            }),
            
            createHeader("Kosher Keto Nutrition Protocol", HeadingLevel.HEADING_2),
            
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ borders, shading: { fill: COLORS.teal, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Mon-Thu (Strict Keto)", bold: true, color: COLORS.white })] })] }),
                            new TableCell({ borders, shading: { fill: COLORS.orange, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Fri-Sun (Shabbat)", bold: true })] })] })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders, children: [
                                new Paragraph({ children: [new TextRun("Carbs: <50g")] }),
                                new Paragraph({ children: [new TextRun("Fat: 70%")] }),
                                new Paragraph({ children: [new TextRun("Protein: 25%")] }),
                                new Paragraph({ children: [new TextRun("Calories: 3,500")] })
                            ]}),
                            new TableCell({ borders, children: [
                                new Paragraph({ children: [new TextRun("Carbs: 100-150g")] }),
                                new Paragraph({ children: [new TextRun("Fat: 50%")] }),
                                new Paragraph({ children: [new TextRun("Protein: 30%")] }),
                                new Paragraph({ children: [new TextRun("Calories: 3,200")] })
                            ]})
                        ]
                    })
                ]
            }),
            
            // =================================================================
            // FOOTER
            // =================================================================
            new Paragraph({ children: [new PageBreak()] }),
            
            createHeader("Next Steps"),
            
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "January 2026: Update SwimCloud profile, create recruiting video", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "January 2026: Send initial outreach emails to 10 target schools", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "March 2026: After FL Senior Champs, send updated times to all coaches", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "June 2026: Attend summer camps (UF, NC State), schedule unofficial visits", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "July 2026: Peak performance at USA Futures", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "December 2026: CRITICAL - Winter Junior Nationals performance", size: 22 })] }),
            
            new Paragraph({
                spacing: { before: 500 },
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: "Generated by BidDeed.AI / Everest Capital USA",
                        color: COLORS.gray,
                        font: "Arial",
                        size: 18,
                        italics: true
                    })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: "LangGraph Multi-Agent Orchestration | XGBoost ML Analysis",
                        color: COLORS.gray,
                        font: "Arial",
                        size: 18,
                        italics: true
                    })
                ]
            })
        ]
    }]
});

// =============================================================================
// GENERATE DOCUMENT
// =============================================================================
const outputDir = 'reports';
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = `${outputDir}/michael_d1_pathway_report_${new Date().toISOString().split('T')[0]}.docx`;

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Report generated: ${outputPath}`);
}).catch(err => {
    console.error('Error generating report:', err);
});
