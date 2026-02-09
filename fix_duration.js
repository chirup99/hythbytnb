const fs = require('fs');
const path = 'client/src/pages/home.tsx';
let content = fs.readFileSync(path, 'utf8');

const parseTime = (t) => {
  if (!t) return 'new Date(0)';
  return `(() => { 
    const t = "${t}"; 
    let timeStr = t; 
    if (t.includes("AM") || t.includes("PM")) { 
      const [timePart, modifier] = t.split(" "); 
      let [hours, minutes, seconds] = timePart.split(":"); 
      if (hours === "12") hours = "00"; 
      if (modifier === "PM") hours = (parseInt(hours) + 12).toString(); 
      timeStr = \`\${hours.padStart(2, "0")}:\${minutes}:\${seconds}\`; 
    } else if (t.includes(" ")) {
      timeStr = t.split(" ")[1];
    }
    return new Date(\`1970-01-01 \${timeStr}\`); 
  })()`;
};

// Target the entryTime block
content = content.replace(/const entryTime = new Date\(\s*`1970-01-01 \${positions\[symbol\]\.firstTradeTime}`,\s*\);/g, 
  `const entryTime = (() => { const t = positions[symbol].firstTradeTime; if (!t) return new Date(0); let timeStr = t; if (t.includes("AM") || t.includes("PM")) { const [timePart, modifier] = t.split(" "); let [hours, minutes, seconds] = timePart.split(":"); if (hours === "12") hours = "00"; if (modifier === "PM") hours = (parseInt(hours) + 12).toString(); timeStr = \`\${hours.padStart(2, "0")}:\${minutes}:\${seconds}\`; } else if (t.includes(" ")) { timeStr = t.split(" ")[1]; } return new Date(\`1970-01-01 \${timeStr}\`); })();`);

// Target the exitTime block (handle the messy one I created earlier)
content = content.replace(/const exitTime = \(\(\) => \{ const t = trade\.time; if \(t\.includes\("AM"\) \|\| t\.includes\("PM"\)\) \{ const d = new Date\(`1970-01-01 \${t}`\); return d; \} return new Date\(`1970-01-01 \${t}`\); \}\)\(\);/g,
  `const exitTime = (() => { const t = trade.time; if (!t) return new Date(0); let timeStr = t; if (t.includes("AM") || t.includes("PM")) { const [timePart, modifier] = t.split(" "); let [hours, minutes, seconds] = timePart.split(":"); if (hours === "12") hours = "00"; if (modifier === "PM") hours = (parseInt(hours) + 12).toString(); timeStr = \`\${hours.padStart(2, "0")}:\${minutes}:\${seconds}\`; } else if (t.includes(" ")) { timeStr = t.split(" ")[1]; } return new Date(\`1970-01-01 \${timeStr}\`); })();`);

// Also handle the original exitTime block just in case
content = content.replace(/const exitTime = new Date\(`1970-01-01 \${trade\.time}`\);/g,
  `const exitTime = (() => { const t = trade.time; if (!t) return new Date(0); let timeStr = t; if (t.includes("AM") || t.includes("PM")) { const [timePart, modifier] = t.split(" "); let [hours, minutes, seconds] = timePart.split(":"); if (hours === "12") hours = "00"; if (modifier === "PM") hours = (parseInt(hours) + 12).toString(); timeStr = \`\${hours.padStart(2, "0")}:\${minutes}:\${seconds}\`; } else if (t.includes(" ")) { timeStr = t.split(" ")[1]; } return new Date(\`1970-01-01 \${timeStr}\`); })();`);

fs.writeFileSync(path, content);
