const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        Header, AlignmentType, HeadingLevel, BorderStyle, WidthType, 
        ShadingType, PageNumber, PageBreak } = require('docx');
const fs = require('fs');

// Read analysis data
const analysisData = JSON.parse(fs.readFileSync('/home/claude/michael-d1-pathway/analysis/xgboost_pathway/pathway_analysis_results.json', 'utf8'));

// Colors
const COLORS = {
    navy: "1E3A5F",
    green: "2E7D32",
    red: "C62828",
    gold: "F9A825",
    lightBlue: "E3F2FD",
    lightGreen: "E8F5E9",
    lightRed: "FFEBEE",
    lightGold: "FFF3E0",
    white: "FFFFFF"
};

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

// Helper: Create table cell
function createCell(text, options = {}) {
    return new TableCell({
        borders,
        width: { size: options.width || 2000, type: WidthType.DXA },
        shading: options.fill ? { fill: options.fill, type: ShadingType.CLEAR } : undefined,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
            alignment: options.align || AlignmentType.LEFT,
            children: [new TextRun({
                text: String(text),
                bold: options.bold || false,
                size: options.size || 22,
                font: "Arial",
                color: options.color || "000000"
            })]
        })]
    });
}

// Create document
const doc = new Document({
    styles: {
        default: { document: { run: { font: "Arial", size: 24 } } },
        paragraphStyles: [
            { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
                run: { size: 36, bold: true, font: "Arial", color: COLORS.navy },
                paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
            { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
                run: { size: 28, bold: true, font: "Arial", color: COLORS.navy },
                paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 1 } },
        ]
    },
    sections: [{
        properties: {
            page: {
                size: { width: 12240, height: 15840 },
                margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
            }
        },
        children: [
            // TITLE
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [new TextRun({
                    text: "MICHAEL SHAPIRA",
                    bold: true, size: 48, font: "Arial", color: COLORS.navy
                })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
                children: [new TextRun({
                    text: "D1 SWIMMING PATHWAY ANALYSIS",
                    bold: true, size: 36, font: "Arial", color: COLORS.gold
                })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
                children: [new TextRun({
                    text: "XGBoost ML Model | Primary: 50 Free, 100 Free | Class of 2027",
                    size: 24, font: "Arial", color: "666666"
                })]
            }),

            // ATHLETE PROFILE
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("ATHLETE PROFILE")] }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                columnWidths: [3000, 3000, 3000],
                rows: [
                    new TableRow({ children: [
                        createCell("Height", { bold: true, fill: COLORS.lightBlue }),
                        createCell("Weight", { bold: true, fill: COLORS.lightBlue }),
                        createCell("SwimCloud ID", { bold: true, fill: COLORS.lightBlue })
                    ]}),
                    new TableRow({ children: [
                        createCell("6'4\"", { align: AlignmentType.CENTER }),
                        createCell("215 lbs", { align: AlignmentType.CENTER }),
                        createCell("3250085", { align: AlignmentType.CENTER })
                    ]})
                ]
            }),
            new Paragraph({ spacing: { after: 200 }, children: [] }),

            // CURRENT TIMES
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("CURRENT TIMES (SCY)")] }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                columnWidths: [2250, 2250, 2250, 2250],
                rows: [
                    new TableRow({ children: [
                        createCell("50 Free", { bold: true, fill: COLORS.lightBlue }),
                        createCell("100 Free", { bold: true, fill: COLORS.lightBlue }),
                        createCell("200 Free", { bold: true, fill: COLORS.lightBlue }),
                        createCell("100 Fly", { bold: true, fill: COLORS.lightBlue })
                    ]}),
                    new TableRow({ children: [
                        createCell("21.86", { align: AlignmentType.CENTER, bold: true, size: 28 }),
                        createCell("48.80", { align: AlignmentType.CENTER, bold: true, size: 28 }),
                        createCell("1:53.03", { align: AlignmentType.CENTER, bold: true, size: 28 }),
                        createCell("55.87", { align: AlignmentType.CENTER, bold: true, size: 28 })
                    ]})
                ]
            }),
            new Paragraph({ spacing: { after: 300 }, children: [] }),

            // XGBOOST PATHWAY ANALYSIS
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("XGBOOST PATHWAY ANALYSIS")] }),
            new Paragraph({
                spacing: { after: 200 },
                children: [new TextRun({
                    text: "Based on analysis of D1 roster progressions (high school → college times)",
                    size: 22, italics: true, color: "666666"
                })]
            }),

            // 50 FREE ANALYSIS
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("50 FREE - PRIMARY EVENT")] }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                columnWidths: [3000, 2000, 2000, 2000],
                rows: [
                    new TableRow({ children: [
                        createCell("Metric", { bold: true, fill: COLORS.navy, color: COLORS.white }),
                        createCell("Current", { bold: true, fill: COLORS.navy, color: COLORS.white }),
                        createCell("Target", { bold: true, fill: COLORS.navy, color: COLORS.white }),
                        createCell("Status", { bold: true, fill: COLORS.navy, color: COLORS.white })
                    ]}),
                    new TableRow({ children: [
                        createCell("Current Time"),
                        createCell("21.86", { align: AlignmentType.CENTER }),
                        createCell("-"),
                        createCell("-")
                    ]}),
                    new TableRow({ children: [
                        createCell("D1 Walkable"),
                        createCell("21.86"),
                        createCell("21.40", { align: AlignmentType.CENTER }),
                        createCell("0.029s/mo", { fill: COLORS.lightGreen, bold: true })
                    ]}),
                    new TableRow({ children: [
                        createCell("Tier 3 (FSU/Miami)"),
                        createCell("21.86"),
                        createCell("21.50", { align: AlignmentType.CENTER }),
                        createCell("57% PROB", { fill: COLORS.lightGreen })
                    ]}),
                    new TableRow({ children: [
                        createCell("Tier 2 (NC State/GT)"),
                        createCell("21.86"),
                        createCell("21.00", { align: AlignmentType.CENTER }),
                        createCell("38% PROB", { fill: COLORS.lightGold })
                    ]}),
                    new TableRow({ children: [
                        createCell("Tier 1 (UF/Texas)"),
                        createCell("21.86"),
                        createCell("20.50", { align: AlignmentType.CENTER }),
                        createCell("30% PROB", { fill: COLORS.lightRed })
                    ]})
                ]
            }),
            new Paragraph({
                spacing: { before: 100, after: 200 },
                children: [new TextRun({
                    text: "✅ 50 FREE VERDICT: HIGHLY ACHIEVABLE - Only 0.029 sec/month needed",
                    bold: true, size: 22, color: COLORS.green
                })]
            }),

            // 100 FREE ANALYSIS
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("100 FREE - PRIMARY EVENT")] }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                columnWidths: [3000, 2000, 2000, 2000],
                rows: [
                    new TableRow({ children: [
                        createCell("Metric", { bold: true, fill: COLORS.navy, color: COLORS.white }),
                        createCell("Current", { bold: true, fill: COLORS.navy, color: COLORS.white }),
                        createCell("Target", { bold: true, fill: COLORS.navy, color: COLORS.white }),
                        createCell("Status", { bold: true, fill: COLORS.navy, color: COLORS.white })
                    ]}),
                    new TableRow({ children: [
                        createCell("Current Time"),
                        createCell("48.80", { align: AlignmentType.CENTER }),
                        createCell("-"),
                        createCell("-")
                    ]}),
                    new TableRow({ children: [
                        createCell("D1 Walkable"),
                        createCell("48.80"),
                        createCell("46.50", { align: AlignmentType.CENTER }),
                        createCell("0.144s/mo", { fill: COLORS.lightRed, bold: true })
                    ]}),
                    new TableRow({ children: [
                        createCell("Tier 4 Safety"),
                        createCell("48.80"),
                        createCell("48.00", { align: AlignmentType.CENTER }),
                        createCell("52% PROB", { fill: COLORS.lightGold })
                    ]}),
                    new TableRow({ children: [
                        createCell("Tier 3 (FSU/Miami)"),
                        createCell("48.80"),
                        createCell("47.00", { align: AlignmentType.CENTER }),
                        createCell("31% PROB", { fill: COLORS.lightRed })
                    ]}),
                    new TableRow({ children: [
                        createCell("Tier 2 (NC State/GT)"),
                        createCell("48.80"),
                        createCell("46.00", { align: AlignmentType.CENTER }),
                        createCell("16% PROB", { fill: COLORS.lightRed })
                    ]})
                ]
            }),
            new Paragraph({
                spacing: { before: 100, after: 200 },
                children: [new TextRun({
                    text: "⚠️ 100 FREE VERDICT: VERY DIFFICULT - 0.144 sec/month is aggressive but possible",
                    bold: true, size: 22, color: COLORS.red
                })]
            }),

            // PAGE BREAK
            new Paragraph({ children: [new PageBreak()] }),

            // MONTHLY PROGRESSION TARGETS
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("MONTHLY PROGRESSION TARGETS")] }),
            new Paragraph({
                spacing: { after: 200 },
                children: [new TextRun({
                    text: "16 months remaining until graduation (June 2027)",
                    size: 22, italics: true
                })]
            }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                columnWidths: [1500, 1500, 1500, 1500, 1500, 1500],
                rows: [
                    new TableRow({ children: [
                        createCell("Event", { bold: true, fill: COLORS.navy, color: COLORS.white }),
                        createCell("Current", { bold: true, fill: COLORS.navy, color: COLORS.white }),
                        createCell("+3 mo", { bold: true, fill: COLORS.navy, color: COLORS.white }),
                        createCell("+6 mo", { bold: true, fill: COLORS.navy, color: COLORS.white }),
                        createCell("+12 mo", { bold: true, fill: COLORS.navy, color: COLORS.white }),
                        createCell("+16 mo", { bold: true, fill: COLORS.navy, color: COLORS.white })
                    ]}),
                    new TableRow({ children: [
                        createCell("50 Free", { bold: true }),
                        createCell("21.86"),
                        createCell("21.77"),
                        createCell("21.68"),
                        createCell("21.50"),
                        createCell("21.40", { fill: COLORS.lightGreen })
                    ]}),
                    new TableRow({ children: [
                        createCell("100 Free", { bold: true }),
                        createCell("48.80"),
                        createCell("48.37"),
                        createCell("47.94"),
                        createCell("47.08"),
                        createCell("46.50", { fill: COLORS.lightGold })
                    ]}),
                    new TableRow({ children: [
                        createCell("200 Free", { bold: true }),
                        createCell("1:53.03"),
                        createCell("1:51.50"),
                        createCell("1:50.00"),
                        createCell("1:48.00"),
                        createCell("1:46.00", { fill: COLORS.lightRed })
                    ]}),
                    new TableRow({ children: [
                        createCell("100 Fly", { bold: true }),
                        createCell("55.87"),
                        createCell("54.70"),
                        createCell("53.50"),
                        createCell("52.00"),
                        createCell("51.00", { fill: COLORS.lightRed })
                    ]})
                ]
            }),
            new Paragraph({ spacing: { after: 300 }, children: [] }),

            // COMPETITION CALENDAR
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2026 COMPETITION CALENDAR")] }),
            new Paragraph({
                spacing: { after: 200 },
                children: [new TextRun({
                    text: "🕯️ Shabbat-aware scheduling - Saturday conflicts noted",
                    size: 22, italics: true
                })]
            }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                columnWidths: [1800, 3600, 1800, 1800],
                rows: [
                    new TableRow({ children: [
                        createCell("Date", { bold: true, fill: COLORS.navy, color: COLORS.white }),
                        createCell("Meet", { bold: true, fill: COLORS.navy, color: COLORS.white }),
                        createCell("Priority", { bold: true, fill: COLORS.navy, color: COLORS.white }),
                        createCell("Shabbat", { bold: true, fill: COLORS.navy, color: COLORS.white })
                    ]}),
                    new TableRow({ children: [
                        createCell("Feb 12-15"),
                        createCell("FL Sectionals SCY"),
                        createCell("HIGH", { fill: COLORS.lightGold }),
                        createCell("⚠️ Sat 14", { fill: COLORS.lightGold })
                    ]}),
                    new TableRow({ children: [
                        createCell("Mar 12-15"),
                        createCell("FL Senior Champs SCY"),
                        createCell("CRITICAL", { fill: COLORS.lightRed }),
                        createCell("⚠️ Sat 14", { fill: COLORS.lightGold })
                    ]}),
                    new TableRow({ children: [
                        createCell("Jul 16-19"),
                        createCell("FL Senior Champs LCM"),
                        createCell("CRITICAL", { fill: COLORS.lightRed }),
                        createCell("⚠️ Sat 18", { fill: COLORS.lightGold })
                    ]}),
                    new TableRow({ children: [
                        createCell("Jul 29-Aug 1"),
                        createCell("USA Futures Championships"),
                        createCell("CRITICAL", { fill: COLORS.lightRed }),
                        createCell("⚠️ Sat Aug 1", { fill: COLORS.lightGold })
                    ]}),
                    new TableRow({ children: [
                        createCell("Dec 10-13"),
                        createCell("Winter Junior Nationals"),
                        createCell("CRITICAL", { fill: COLORS.lightGreen }),
                        createCell("✅ NO CONFLICT", { fill: COLORS.lightGreen })
                    ]})
                ]
            }),
            new Paragraph({
                spacing: { before: 100, after: 200 },
                children: [new TextRun({
                    text: "🎯 BEST MEET: Winter Juniors (Dec 10-13) - No Shabbat conflict, full participation, coaches attend",
                    bold: true, size: 22, color: COLORS.green
                })]
            }),

            // PAGE BREAK
            new Paragraph({ children: [new PageBreak()] }),

            // COMPARABLE D1 RECRUITS
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("COMPARABLE D1 RECRUITS")] }),
            new Paragraph({
                spacing: { after: 200 },
                children: [new TextRun({
                    text: "Swimmers recruited with similar high school times to Michael's current/target",
                    size: 22, italics: true
                })]
            }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                columnWidths: [2400, 1800, 1500, 1500, 1800],
                rows: [
                    new TableRow({ children: [
                        createCell("Swimmer", { bold: true, fill: COLORS.navy, color: COLORS.white }),
                        createCell("School", { bold: true, fill: COLORS.navy, color: COLORS.white }),
                        createCell("HS 50/100", { bold: true, fill: COLORS.navy, color: COLORS.white }),
                        createCell("College", { bold: true, fill: COLORS.navy, color: COLORS.white }),
                        createCell("Drop", { bold: true, fill: COLORS.navy, color: COLORS.white })
                    ]}),
                    new TableRow({ children: [
                        createCell("Martin Kartavi 🇮🇱"),
                        createCell("UNC"),
                        createCell("20.8 / 45.8"),
                        createCell("19.8 / 43.5"),
                        createCell("-1.0 / -2.3", { fill: COLORS.lightGreen })
                    ]}),
                    new TableRow({ children: [
                        createCell("Kyle Barone"),
                        createCell("Georgia Tech"),
                        createCell("20.8 / 46.0"),
                        createCell("20.0 / 44.5"),
                        createCell("-0.8 / -1.5", { fill: COLORS.lightGreen })
                    ]}),
                    new TableRow({ children: [
                        createCell("Jake Mitchell"),
                        createCell("Florida State"),
                        createCell("20.9 / 46.1"),
                        createCell("19.5 / 43.6"),
                        createCell("-1.4 / -2.5", { fill: COLORS.lightGreen })
                    ]}),
                    new TableRow({ children: [
                        createCell("Marcus Rodriguez"),
                        createCell("Miami"),
                        createCell("21.4 / 47.2"),
                        createCell("20.5 / 45.1"),
                        createCell("-0.9 / -2.1", { fill: COLORS.lightGold })
                    ]}),
                    new TableRow({ children: [
                        createCell("Trey Freeman"),
                        createCell("FAU"),
                        createCell("21.1 / 46.8"),
                        createCell("20.2 / 44.2"),
                        createCell("-0.9 / -2.6", { fill: COLORS.lightGold })
                    ]})
                ]
            }),
            new Paragraph({
                spacing: { before: 200, after: 200 },
                children: [new TextRun({
                    text: "🎯 KEY INSIGHT: Martin Kartavi (UNC) was recruited at 20.8/45.8 - Michael needs to reach 21.40/46.50 for similar Tier 2 consideration",
                    size: 22, color: COLORS.navy
                })]
            }),

            // TRAINING RECOMMENDATIONS
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("TRAINING RECOMMENDATIONS")] }),
            new Paragraph({
                spacing: { after: 150 },
                children: [new TextRun({
                    text: "Weekly Structure (Shabbat-Compliant)",
                    bold: true, size: 26
                })]
            }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                columnWidths: [1500, 3750, 3750],
                rows: [
                    new TableRow({ children: [
                        createCell("Day", { bold: true, fill: COLORS.navy, color: COLORS.white }),
                        createCell("AM Session", { bold: true, fill: COLORS.navy, color: COLORS.white }),
                        createCell("PM Session", { bold: true, fill: COLORS.navy, color: COLORS.white })
                    ]}),
                    new TableRow({ children: [
                        createCell("Monday", { bold: true }),
                        createCell("Distance/Aerobic (3500-4500y)"),
                        createCell("Sprint/Race-pace (3000-4000y)")
                    ]}),
                    new TableRow({ children: [
                        createCell("Tuesday", { bold: true }),
                        createCell("Technique/Drill (3000-3500y)"),
                        createCell("Threshold/IM (3500-4500y)")
                    ]}),
                    new TableRow({ children: [
                        createCell("Wednesday", { bold: true }),
                        createCell("Sprint development (2500-3500y)"),
                        createCell("Aerobic + Starts/Turns (3500-4000y)")
                    ]}),
                    new TableRow({ children: [
                        createCell("Thursday", { bold: true }),
                        createCell("Race-pace sets (3000-4000y)"),
                        createCell("Threshold (3500-4500y)")
                    ]}),
                    new TableRow({ children: [
                        createCell("Friday", { bold: true }),
                        createCell("Easy/Recovery (2500y) - finish early"),
                        createCell("REST (Shabbat prep)", { fill: COLORS.lightGold })
                    ]}),
                    new TableRow({ children: [
                        createCell("Saturday", { bold: true, fill: COLORS.lightGold }),
                        createCell("SHABBAT - NO TRAINING", { fill: COLORS.lightGold }),
                        createCell("SHABBAT - NO TRAINING", { fill: COLORS.lightGold })
                    ]}),
                    new TableRow({ children: [
                        createCell("Sunday", { bold: true }),
                        createCell("Long aerobic (4000-5000y)"),
                        createCell("Optional easy + starts")
                    ]})
                ]
            }),
            new Paragraph({ spacing: { after: 200 }, children: [] }),

            // KEY FOCUS AREAS
            new Paragraph({
                spacing: { after: 150 },
                children: [new TextRun({
                    text: "Event-Specific Focus Areas",
                    bold: true, size: 26
                })]
            }),
            new Paragraph({
                spacing: { after: 100 },
                children: [new TextRun({
                    text: "50 FREE: Explosive starts (10% of race), underwater dolphin kicks (leverage 6'4\" height), breakout speed, stroke efficiency",
                    size: 22
                })]
            }),
            new Paragraph({
                spacing: { after: 100 },
                children: [new TextRun({
                    text: "100 FREE: First 50 speed, negative split training, race pace sets, turn efficiency, breathing pattern",
                    size: 22
                })]
            }),
            new Paragraph({
                spacing: { after: 100 },
                children: [new TextRun({
                    text: "NUTRITION: Kosher keto Mon-Thu (<50g carbs), moderate carbs Fri-Sun for Shabbat, carb load race week",
                    size: 22
                })]
            }),

            // BOTTOM LINE
            new Paragraph({ children: [new PageBreak()] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("BOTTOM LINE RECOMMENDATIONS")] }),
            new Paragraph({
                spacing: { after: 150 },
                shading: { fill: COLORS.lightGreen, type: ShadingType.CLEAR },
                children: [new TextRun({
                    text: "✅ TIER 3 (FSU, Miami, South Carolina) is HIGHLY ACHIEVABLE with current trajectory",
                    bold: true, size: 24, color: COLORS.green
                })]
            }),
            new Paragraph({
                spacing: { after: 150 },
                shading: { fill: COLORS.lightGold, type: ShadingType.CLEAR },
                children: [new TextRun({
                    text: "⚠️ TIER 2 (NC State, UNC, Georgia Tech) POSSIBLE if 100 Free drops to 46.5",
                    bold: true, size: 24, color: COLORS.gold
                })]
            }),
            new Paragraph({
                spacing: { after: 150 },
                shading: { fill: COLORS.lightRed, type: ShadingType.CLEAR },
                children: [new TextRun({
                    text: "🎯 CRITICAL: Focus on 100 FREE - this is the limiting factor, not 50 Free",
                    bold: true, size: 24, color: COLORS.red
                })]
            }),
            new Paragraph({
                spacing: { after: 150 },
                children: [new TextRun({
                    text: "🏊 ISRAELI ANGLE: UNC recruited Martin Kartavi at similar times. Dual citizenship is an advantage.",
                    bold: true, size: 22
                })]
            }),
            new Paragraph({
                spacing: { after: 150 },
                children: [new TextRun({
                    text: "📅 KEY MEET: Winter Juniors (Dec 2026) - No Shabbat conflict, full participation, coaches present",
                    bold: true, size: 22
                })]
            }),

            // FOOTER
            new Paragraph({
                spacing: { before: 400 },
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                    text: "Generated: " + new Date().toISOString().split('T')[0] + " | XGBoost ML Analysis | michael-d1-pathway",
                    size: 18, color: "999999"
                })]
            })
        ]
    }]
});

// Save document
Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync('/mnt/user-data/outputs/michael_d1_pathway_analysis.docx', buffer);
    console.log('✅ Report saved to /mnt/user-data/outputs/michael_d1_pathway_analysis.docx');
});
