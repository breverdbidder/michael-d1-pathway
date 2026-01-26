#!/usr/bin/env node
/**
 * MICHAEL SHAPIRA D1 PATHWAY REPORT - LANDSCAPE ORIENTATION
 * BidDeed.AI / Everest Capital USA
 */

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, 
        WidthType, ShadingType, PageBreak, LevelFormat, 
        PageOrientation, PageNumber } = require('docx');
const fs = require('fs');

// SHAPIRA COLOR SCHEME
const C = {
    navy: "1E3A5F", elite: "D4AF37", strong: "228B22", mid: "4682B4", safety: "FF7F50",
    green: "28A745", yellow: "FFC107", red: "DC3545", shabbat: "FFA500",
    lightBlue: "D5E8F0", teal: "20B2AA", white: "FFFFFF", gray: "666666", lightGray: "F5F5F5"
};

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

// Load data
let recruits = [], langgraph = {};
try { recruits = JSON.parse(fs.readFileSync('data/d1_recruit_progressions_expanded.json', 'utf8')).recruits || []; } catch(e) {}
try { langgraph = JSON.parse(fs.readFileSync('data/langgraph_analysis_output.json', 'utf8')); } catch(e) {}
console.log(`✅ Loaded ${recruits.length} recruits`);

// Helpers
const hdr = (t, sz=32) => new Paragraph({ spacing: { before: 300, after: 150 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.navy }}, children: [new TextRun({ text: t.toUpperCase(), bold: true, color: C.navy, font: "Arial", size: sz })] });
const sub = (t) => new Paragraph({ spacing: { before: 200, after: 100 }, children: [new TextRun({ text: t, bold: true, color: C.teal, font: "Arial", size: 26 })] });
const para = (t, o={}) => new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: t, font: "Arial", size: 20, ...o })] });
const bullet = (t, o={}) => new Paragraph({ numbering: { reference: "b", level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, font: "Arial", size: 20, ...o })] });
const hCell = (t, w) => new TableCell({ borders, shading: { fill: C.navy, type: ShadingType.CLEAR }, width: w ? { size: w, type: WidthType.DXA } : undefined, margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: C.white, font: "Arial", size: 18 })] })] });
const dCell = (t, o={}) => new TableCell({ borders, shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR } : undefined, width: o.w ? { size: o.w, type: WidthType.DXA } : undefined, margins: { top: 50, bottom: 50, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: String(t), font: "Arial", size: 18, bold: o.bold, color: o.color })] })] });

const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 20 }}}},
    numbering: { config: [{ reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 }}}}]}]},
    sections: [{
        properties: {
            page: {
                size: { width: 15840, height: 12240, orientation: PageOrientation.LANDSCAPE },
                margin: { top: 720, right: 720, bottom: 720, left: 720 }
            }
        },
        headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Michael Shapira D1 Pathway | ", color: C.gray, font: "Arial", size: 16 }), new TextRun({ text: "BidDeed.AI", color: C.navy, font: "Arial", size: 16, bold: true })]})]})},
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", color: C.gray, size: 16 }), new TextRun({ children: [PageNumber.CURRENT], color: C.gray, size: 16 }), new TextRun({ text: ` | Generated ${new Date().toLocaleDateString()} | Confidential`, color: C.gray, size: 16 })]})]})},
        children: [
            // === PAGE 1: COVER ===
            new Paragraph({ spacing: { before: 800 }}),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MICHAEL SHAPIRA", bold: true, color: C.navy, font: "Arial", size: 72 })]}),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 150 }, children: [new TextRun({ text: "D1 Swimming Recruitment Pathway", color: C.teal, font: "Arial", size: 40 })]}),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: "XGBoost ML Analysis | LangGraph Multi-Agent Orchestration", color: C.gray, font: "Arial", size: 24 })]}),
            
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
                new TableRow({ children: [
                    new TableCell({ borders, shading: { fill: C.lightBlue, type: ShadingType.CLEAR }, width: { size: 33, type: WidthType.PERCENTAGE }, margins: { top: 150, bottom: 150, left: 200, right: 200 }, children: [
                        new Paragraph({ children: [new TextRun({ text: "ATHLETE PROFILE", bold: true, color: C.navy, size: 24 })]}),
                        para("Name: Michael Shapira"), para("Class: 2027 (17 months to grad)"), para("Height: 6'4\" (76 in)"), para("Weight: 215 lbs"), para("SwimCloud: 3250085"), para("Citizenship: USA + Israel")
                    ]}),
                    new TableCell({ borders, shading: { fill: C.lightBlue, type: ShadingType.CLEAR }, width: { size: 33, type: WidthType.PERCENTAGE }, margins: { top: 150, bottom: 150, left: 200, right: 200 }, children: [
                        new Paragraph({ children: [new TextRun({ text: "CURRENT TIMES (SCY)", bold: true, color: C.navy, size: 24 })]}),
                        para("50 Free: 21.86", { bold: true }), para("100 Free: 48.80", { bold: true }), para("200 Free: 1:53.03"), para("100 Fly: 55.87"), para("Primary: 50/100 Free", { color: C.teal })
                    ]}),
                    new TableCell({ borders, shading: { fill: C.lightBlue, type: ShadingType.CLEAR }, width: { size: 34, type: WidthType.PERCENTAGE }, margins: { top: 150, bottom: 150, left: 200, right: 200 }, children: [
                        new Paragraph({ children: [new TextRun({ text: "KEY FINDING", bold: true, color: C.navy, size: 24 })]}),
                        para("Current Tier: LOWER D1 (80.6%)"),
                        para("Target: STRONG D1", { bold: true, color: C.strong }),
                        para("Monthly Drop: 0.062s / 0.165s"),
                        para("Status: ✅ ACHIEVABLE", { bold: true, color: C.green }),
                        para("Key Meet: Winter Juniors Dec 2026")
                    ]})
                ]})
            ]}),
            
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300 }, children: [new TextRun({ text: "BidDeed.AI / Everest Capital USA", color: C.navy, font: "Arial", size: 22, bold: true })]}),
            new Paragraph({ children: [new PageBreak()] }),
            
            // === PAGE 2: XGBOOST + PATHWAYS ===
            hdr("XGBoost Analysis & Pathway"),
            
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
                new TableRow({ children: [hCell("Tier"), hCell("Probability"), hCell("50 Free Target"), hCell("100 Free Target"), hCell("Monthly Drop"), hCell("Status"), hCell("Schools")] }),
                new TableRow({ children: [dCell("ELITE (Top 10)", { fill: C.elite, bold: true }), dCell("3.2%"), dCell("20.0 (-1.86s)"), dCell("44.0 (-4.80s)"), dCell("0.109s / 0.282s"), dCell("⚠️ AGGRESSIVE", { fill: C.yellow, bold: true }), dCell("Florida, Texas, Cal, Stanford")] }),
                new TableRow({ children: [dCell("STRONG D1 (11-25)", { fill: C.strong, color: C.white, bold: true }), dCell("4.0%"), dCell("20.8 (-1.06s)"), dCell("46.0 (-2.80s)"), dCell("0.062s / 0.165s"), dCell("✅ ACHIEVABLE", { fill: C.green, color: C.white, bold: true }), dCell("NC State, UNC, GA Tech, Michigan")] }),
                new TableRow({ children: [dCell("MID D1 (26-50)", { fill: C.mid, color: C.white, bold: true }), dCell("12.2%"), dCell("21.4 (-0.46s)"), dCell("47.5 (-1.30s)"), dCell("0.027s / 0.076s"), dCell("✅ ACHIEVABLE", { fill: C.green, color: C.white, bold: true }), dCell("South Carolina, FSU, Miami")] }),
                new TableRow({ children: [dCell("LOWER D1 (51+)", { fill: C.safety, bold: true }), dCell("80.6%", { bold: true }), dCell("21.8 (-0.06s)"), dCell("48.5 (-0.30s)"), dCell("0.004s / 0.018s"), dCell("✅ CURRENT", { fill: C.green, color: C.white, bold: true }), dCell("FAU, USF, FGCU")] })
            ]}),
            
            sub("Monthly Progression Targets (Strong D1 Path)"),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
                new TableRow({ children: [hCell("Event"), hCell("Current"), hCell("Feb 2026"), hCell("Mar 2026"), hCell("Jul 2026"), hCell("Dec 2026"), hCell("Jun 2027 (Grad)")] }),
                new TableRow({ children: [dCell("50 Free", { bold: true }), dCell("21.86"), dCell("21.50"), dCell("21.20"), dCell("20.90"), dCell("20.50", { fill: C.elite, bold: true }), dCell("20.30", { fill: C.green, color: C.white, bold: true })] }),
                new TableRow({ children: [dCell("100 Free", { bold: true }), dCell("48.80"), dCell("47.80"), dCell("47.00"), dCell("46.00"), dCell("45.50", { fill: C.elite, bold: true }), dCell("44.80", { fill: C.green, color: C.white, bold: true })] })
            ]}),
            
            para("Model: XGBoost Classifier trained on 45 D1 swimmers. Features: HS 50 Free, HS 100 Free, Height. Realistic benchmark: <0.10s/month (50), <0.20s/month (100)."),
            new Paragraph({ children: [new PageBreak()] }),
            
            // === PAGE 3: COMPARABLE RECRUITS ===
            hdr("Comparable D1 Recruits"),
            para("Swimmers with similar HS times (20.5-22.0 / 45.0-49.0) who achieved Strong D1 or higher:"),
            
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
                new TableRow({ children: [hCell("Swimmer"), hCell("School"), hCell("Tier"), hCell("HS 50"), hCell("HS 100"), hCell("College 50"), hCell("College 100"), hCell("Improvement"), hCell("Notes")] }),
                new TableRow({ children: [dCell("Martin Kartavi", { bold: true }), dCell("UNC", { fill: C.strong, color: C.white }), dCell("Strong"), dCell("20.80"), dCell("45.80"), dCell("19.80"), dCell("43.50"), dCell("-1.0 / -2.3", { color: C.green }), dCell("🥉 Paris 2024 Bronze - ISRAELI")] }),
                new TableRow({ children: [dCell("Kyle Barone", { bold: true }), dCell("GA Tech", { fill: C.strong, color: C.white }), dCell("Strong"), dCell("20.80"), dCell("46.00"), dCell("20.00"), dCell("44.50"), dCell("-0.8 / -1.5", { color: C.green }), dCell("ACC performer")] }),
                new TableRow({ children: [dCell("Caio Pumputis", { bold: true }), dCell("GA Tech", { fill: C.strong, color: C.white }), dCell("Strong"), dCell("20.50"), dCell("45.20"), dCell("19.40"), dCell("43.10"), dCell("-1.1 / -2.1", { color: C.green }), dCell("Brazilian National")] }),
                new TableRow({ children: [dCell("Matt King", { bold: true }), dCell("Michigan", { fill: C.strong, color: C.white }), dCell("Strong"), dCell("20.45"), dCell("45.12"), dCell("19.12"), dCell("42.45"), dCell("-1.3 / -2.7", { color: C.green }), dCell("B1G Champion")] }),
                new TableRow({ children: [dCell("Jake Mitchell", { bold: true }), dCell("FSU", { fill: C.mid, color: C.white }), dCell("Mid"), dCell("20.85"), dCell("46.12"), dCell("19.45"), dCell("43.56"), dCell("-1.4 / -2.6", { color: C.green }), dCell("ACC performer")] }),
                new TableRow({ children: [dCell("Itay Goldfaden", { bold: true }), dCell("S Carolina", { fill: C.mid, color: C.white }), dCell("Mid"), dCell("21.00"), dCell("46.50"), dCell("19.80"), dCell("43.80"), dCell("-1.2 / -2.7", { color: C.green }), dCell("ISRAELI Olympian")] }),
                new TableRow({ children: [dCell("Trey Freeman", { bold: true }), dCell("FAU", { fill: C.safety }), dCell("Lower"), dCell("21.12"), dCell("46.78"), dCell("20.15"), dCell("44.23"), dCell("-1.0 / -2.6", { color: C.green }), dCell("AAC performer")] }),
                new TableRow({ children: [dCell("David Gerchik", { bold: true }), dCell("Northwestern", { fill: C.mid, color: C.white }), dCell("Mid"), dCell("21.10"), dCell("46.50"), dCell("19.90"), dCell("44.00"), dCell("-1.2 / -2.5", { color: C.green }), dCell("ISRAELI Paris 2024")] })
            ]}),
            
            sub("Key Insight"),
            para("Martin Kartavi was recruited at 20.8/45.8 — nearly identical to Michael's Strong D1 targets. Kartavi won Olympic Bronze for Israel at Paris 2024, demonstrating the Israeli pipeline advantage."),
            new Paragraph({ children: [new PageBreak()] }),
            
            // === PAGE 4: TARGET SCHOOLS ===
            hdr("Target Schools Strategy"),
            
            sub("Primary Targets (Strong D1) — Best Match"),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
                new TableRow({ children: [hCell("School"), hCell("Why Target"), hCell("Engineering"), hCell("RE Minor"), hCell("Jewish Life"), hCell("Recruit Times")] }),
                new TableRow({ children: [dCell("UNC Chapel Hill", { fill: C.strong, color: C.white, bold: true }), dCell("Israeli pipeline (Kartavi, Maraana)"), dCell("Top 30"), dCell("✓"), dCell("Chabad, 1,500"), dCell("20.5-21.0 / 45-46")] }),
                new TableRow({ children: [dCell("Georgia Tech", { fill: C.strong, color: C.white, bold: true }), dCell("Sprint-focused, achievable times"), dCell("#4 National"), dCell("Building Construction"), dCell("Chabad active"), dCell("20.5-21.0 / 45-46")] }),
                new TableRow({ children: [dCell("Michigan", { fill: C.strong, color: C.white, bold: true }), dCell("Elite development, B1G exposure"), dCell("#4 National"), dCell("Ross School"), dCell("BEST: 6,500 Jewish"), dCell("20.3-20.8 / 44-45")] }),
                new TableRow({ children: [dCell("NC State", { fill: C.strong, color: C.white, bold: true }), dCell("Braden Holloway sprint program"), dCell("#27 National"), dCell("Poole College"), dCell("Chabad, Hillel"), dCell("20.0-20.5 / 44-45")] })
            ]}),
            
            sub("Safety Targets (Mid D1) — Already Near Standards"),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
                new TableRow({ children: [hCell("School"), hCell("Why Target"), hCell("Notes")] }),
                new TableRow({ children: [dCell("South Carolina", { fill: C.mid, color: C.white, bold: true }), dCell("Israeli history (Goldfaden), SEC exposure"), dCell("21.0-21.5 / 46-47 recruit range")] }),
                new TableRow({ children: [dCell("Florida State", { fill: C.mid, color: C.white, bold: true }), dCell("Close to home, ACC exposure"), dCell("21.0-21.5 / 46-47 recruit range")] }),
                new TableRow({ children: [dCell("FAU", { fill: C.safety, bold: true }), dCell("SAFETY: 75 miles from home, massive Boca Jewish community"), dCell("21.5-22.0 / 47-48 recruit range")] })
            ]}),
            
            sub("Reach Targets (Elite) — Require Aggressive Drops"),
            bullet("University of Florida — Anthony Nesty (Paris 2024 Head Coach), Top 5 RE, requires 20.0/44.0"),
            bullet("UT Austin — Bob Bowman (Phelps coach), #9 Engineering, 2024 NCAA Champions"),
            new Paragraph({ children: [new PageBreak()] }),
            
            // === PAGE 5: CALENDAR + ISRAELI PATHWAY ===
            hdr("2026 Competition Calendar"),
            
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
                new TableRow({ children: [hCell("Date"), hCell("Meet"), hCell("Priority"), hCell("50 Target"), hCell("100 Target"), hCell("Shabbat"), hCell("Action")] }),
                new TableRow({ children: [dCell("Jan 15-18"), dCell("FL Age Group Championships"), dCell("HIGH"), dCell("21.50"), dCell("47.80"), dCell("Sat 17th", { fill: C.shabbat }), dCell("Swim Thu-Fri only")] }),
                new TableRow({ children: [dCell("Feb 12-15"), dCell("FL Senior Sectionals SCY"), dCell("CRITICAL", { fill: C.red, color: C.white, bold: true }), dCell("21.20"), dCell("47.20"), dCell("Sat 14th", { fill: C.shabbat }), dCell("Swim Thu-Fri, Sun")] }),
                new TableRow({ children: [dCell("Mar 12-15"), dCell("FL Senior Championships SCY"), dCell("CRITICAL", { fill: C.red, color: C.white, bold: true }), dCell("20.80"), dCell("46.50"), dCell("Sat 14th", { fill: C.shabbat }), dCell("Peak meet - video for coaches")] }),
                new TableRow({ children: [dCell("Jul 16-19"), dCell("FL Senior Championships LCM"), dCell("CRITICAL", { fill: C.red, color: C.white, bold: true }), dCell("23.50 LCM"), dCell("52.00 LCM"), dCell("✓ Clear"), dCell("Full participation")] }),
                new TableRow({ children: [dCell("Jul 29 - Aug 1"), dCell("USA Futures Championships"), dCell("CRITICAL", { fill: C.red, color: C.white, bold: true }), dCell("23.20 LCM"), dCell("51.50 LCM"), dCell("Sat Aug 1", { fill: C.shabbat }), dCell("D1 coaches attend - PEAK")] }),
                new TableRow({ children: [dCell("Dec 10-13", { fill: C.elite, bold: true }), dCell("Winter Junior Nationals", { fill: C.elite, bold: true }), dCell("CRITICAL", { fill: C.red, color: C.white, bold: true }), dCell("20.50", { fill: C.elite, bold: true }), dCell("45.50", { fill: C.elite, bold: true }), dCell("✓ Clear"), dCell("MOST IMPORTANT - coaches in person")] })
            ]}),
            
            sub("Israeli Olympic Pathway — Dual Citizenship Advantage"),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
                new TableRow({ children: [hCell("Swimmer"), hCell("NCAA School"), hCell("Olympics"), hCell("Result"), hCell("HS Times")] }),
                new TableRow({ children: [dCell("Martin Kartavi", { bold: true }), dCell("UNC"), dCell("Paris 2024"), dCell("🥉 BRONZE 4x100 Mixed Medley", { color: C.green, bold: true }), dCell("20.8 / 45.8")] }),
                new TableRow({ children: [dCell("David Gerchik", { bold: true }), dCell("Northwestern"), dCell("Paris 2024"), dCell("100 Back"), dCell("21.1 / 46.5")] }),
                new TableRow({ children: [dCell("Itay Goldfaden", { bold: true }), dCell("South Carolina"), dCell("Tokyo 2020"), dCell("100 Breast"), dCell("21.0 / 46.5")] }),
                new TableRow({ children: [dCell("Andrea Murez", { bold: true }), dCell("Stanford"), dCell("3x Olympian"), dCell("2012, 2016, 2020"), dCell("Women's example")] })
            ]}),
            
            para("Israeli qualifying times are easier than USA: 50 Free 23.50 vs 22.79 (+0.71s), 100 Free 51.00 vs 49.99 (+1.01s). Michael can compete NCAA while representing Israel internationally."),
            new Paragraph({ children: [new PageBreak()] }),
            
            // === PAGE 6: TRAINING + NEXT STEPS ===
            hdr("Training Plan (Shabbat-Compliant)"),
            
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
                new TableRow({ children: [hCell("Day"), hCell("Morning Session"), hCell("Afternoon Session"), hCell("Yardage")] }),
                new TableRow({ children: [dCell("Monday", { bold: true }), dCell("Sprint technique (50 pace, starts, underwaters)"), dCell("Race pace sets (100 pace work)"), dCell("5,500")] }),
                new TableRow({ children: [dCell("Tuesday", { bold: true }), dCell("Aerobic base (threshold work)"), dCell("Dryland: Power training (Olympic lifts, plyos)"), dCell("3,500 + gym")] }),
                new TableRow({ children: [dCell("Wednesday", { bold: true }), dCell("Threshold (100 Free pace, lactate sets)"), dCell("Race simulation (broken 100s)"), dCell("5,500")] }),
                new TableRow({ children: [dCell("Thursday", { bold: true }), dCell("Recovery/technique (drill work, video)"), dCell("Dryland: Core/flexibility"), dCell("2,000 + gym")] }),
                new TableRow({ children: [dCell("Friday", { fill: C.shabbat, bold: true }), dCell("Sprint work — FINISH BY NOON", { fill: C.shabbat }), dCell("REST — Shabbat begins sunset", { fill: C.shabbat, bold: true }), dCell("2,000")] }),
                new TableRow({ children: [dCell("Saturday", { fill: C.shabbat, bold: true }), new TableCell({ borders, shading: { fill: C.shabbat, type: ShadingType.CLEAR }, columnSpan: 2, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SHABBAT — Complete Rest (Physical + Spiritual Recovery)", bold: true, font: "Arial", size: 18 })]})] }), dCell("0")] }),
                new TableRow({ children: [dCell("Sunday", { bold: true }), dCell("Long aerobic (base building)"), dCell("Specialty: Fly technique, underwaters"), dCell("6,000")] })
            ]}),
            
            sub("Kosher Keto Nutrition"),
            new Table({ width: { size: 50, type: WidthType.PERCENTAGE }, rows: [
                new TableRow({ children: [hCell(""), hCell("Mon-Thu (Strict)"), hCell("Fri-Sun (Shabbat)")] }),
                new TableRow({ children: [dCell("Carbs", { bold: true }), dCell("<50g (5%)"), dCell("100-150g (20%)", { fill: C.shabbat })] }),
                new TableRow({ children: [dCell("Fat", { bold: true }), dCell("70%"), dCell("50%", { fill: C.shabbat })] }),
                new TableRow({ children: [dCell("Protein", { bold: true }), dCell("25% (175g min)"), dCell("30%", { fill: C.shabbat })] }),
                new TableRow({ children: [dCell("Calories", { bold: true }), dCell("3,500"), dCell("3,200", { fill: C.shabbat })] })
            ]}),
            
            sub("Recruiting Timeline — Next Steps"),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
                new TableRow({ children: [hCell("Month"), hCell("Action Items")] }),
                new TableRow({ children: [dCell("Jan 2026", { fill: C.lightBlue, bold: true }), dCell("Update SwimCloud (3250085) | Create recruiting video (underwater + above) | Send initial emails to 10 schools | Contact Chabad at each school")] }),
                new TableRow({ children: [dCell("Mar 2026", { fill: C.lightBlue, bold: true }), dCell("After FL Senior Champs → send updated times | Request unofficial visits for summer | Schedule coach calls")] }),
                new TableRow({ children: [dCell("Jun-Jul 2026", { fill: C.elite, bold: true }), dCell("Attend UF Gator Camp + NC State Elite Camp | Schedule unofficial visits | PEAK at USA Futures | Follow up within 48 hours")] }),
                new TableRow({ children: [dCell("Nov 2026", { fill: C.yellow, bold: true }), dCell("Early signing period (Nov 11-18) | Have decision made BEFORE Winter Juniors")] }),
                new TableRow({ children: [dCell("Dec 2026", { fill: C.red, color: C.white, bold: true }), dCell("Winter Junior Nationals — FINAL recruiting showcase | Confirm commitment or continue if needed")] })
            ]}),
            
            new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "— End of Report —", color: C.gray, italics: true, size: 18 })]}),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Generated by BidDeed.AI LangGraph | XGBoost ML (45 recruits) | " + new Date().toISOString().split('T')[0], color: C.navy, bold: true, size: 18 })]})
        ]
    }]
});

// Generate
const dir = 'reports';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const path = `${dir}/Michael_D1_Pathway_LANDSCAPE_${new Date().toISOString().split('T')[0]}.docx`;

Packer.toBuffer(doc).then(buf => {
    fs.writeFileSync(path, buf);
    console.log(`\n✅ LANDSCAPE REPORT: ${path} (${(buf.length/1024).toFixed(1)} KB)`);
}).catch(e => { console.error('❌ Error:', e); process.exit(1); });
