const fs = require('fs');
const path = require('path');

// Chapter data
const chapters = [
    {id: 0, title: "导论", file: "chapter_0.svg", color: "#E53935"},
    {id: 1, title: "第一章 世界的物质性及其发展规律", file: "chapter_1.svg", color: "#D81B60"},
    {id: 2, title: "第二章 认识世界和改造世界", file: "chapter_2.svg", color: "#8E24AA"},
    {id: 3, title: "第三章 人类社会及其发展规律", file: "chapter_3.svg", color: "#5E35B1"},
    {id: 4, title: "第四章 资本主义的形成及其本质", file: "chapter_4.svg", color: "#3949AB"},
    {id: 5, title: "第五章 资本主义发展的历史进程", file: "chapter_5.svg", color: "#1E88E5"},
    {id: 6, title: "第六章 社会主义社会及其发展", file: "chapter_6.svg", color: "#039BE5"},
    {id: 7, title: "第七章 共产主义是人类最崇高的社会理想", file: "chapter_7.svg", color: "#00ACC1"},
    {id: 8, title: "新增：导论与唯物辩证法", file: "chapter_8.svg", color: "#00897B"},
    {id: 9, title: "新增：认识论与唯物史观", file: "chapter_9.svg", color: "#43A047"},
];

const outputDir = path.join('public', 'images', 'covers');

if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir, { recursive: true });
}

function generateSvg(title, color) {
    let lines = [];
    if (title.includes(" ")) {
        lines = title.split(" ");
        if (lines.length > 2) {
             // Rejoin if split into too many
             lines = [lines[0], lines.slice(1).join(" ")];
        }
    } else if (title.includes("：")) {
         lines = title.split("：");
         lines[0] += "：";
    } else {
        lines = [title];
    }
        
    let textElements = "";
    let yStart = 50;
    if (lines.length > 1) {
        yStart = 45;
    }
        
    lines.forEach((line, i) => {
        let y = yStart + (i * 10); // slightly tighter spacing
        textElements += `<text x="50%" y="${y}%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="bold" font-size="36">${line}</text>`;
    });

    const svgContent = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${color}"/>
  <circle cx="50%" cy="50%" r="40%" fill="white" fill-opacity="0.1"/>
  <rect x="10%" y="10%" width="80%" height="80%" fill="none" stroke="white" stroke-width="5" stroke-opacity="0.3"/>
  ${textElements}
</svg>`;
    return svgContent;
}

chapters.forEach(chapter => {
    const svg = generateSvg(chapter.title, chapter.color);
    const filePath = path.join(outputDir, chapter.file);
    fs.writeFileSync(filePath, svg, 'utf8');
    console.log(`Generated ${filePath}`);
});

console.log("All covers generated.");
