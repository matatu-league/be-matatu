import fs from 'fs';
import path from 'path';

const TAGS = [
  'defs',
  'feBlend',
  'feColorMatrix',
  'feComposite',
  'feFlood',
  'feGaussianBlur',
  'feOffset',
  'filter',
  'linearGradient',
  'radialGradient',
  'path',
  'rect',
  'g',
  'stop',
  'svg',
  'tspan',
  'text',
  'image'
];

const FONT_FAMILY_REPLACEMENTS = {
  'Racing Sans One': 'RacingSansOne-Regular',
  Timmana: 'Timmana-Regular',
  'Russo One': 'RussoOne-Regular',
};

const capitalizeTag = (tag) =>
  tag === 'tspan' ? 'TSpan' : tag[0].toUpperCase() + tag.slice(1);

const sanitizeAttributes = (content) => {
  Object.entries(FONT_FAMILY_REPLACEMENTS).forEach(
    ([original, replacement]) => {
      const fontFamilyRegex = new RegExp(
        `font-family=["']${original}["']`,
        'gi',
      );
      content = content.replace(fontFamilyRegex, `fontFamily="${replacement}"`);
    },
  );

  return content
    .replace(/\s+xml:space="preserve"/gi, '')
    .replace(/\bfont-family=/gi, 'fontFamily=')
    .replace(/\bletter-spacing=/gi, 'letterSpacing=')
    .replace(/\bstop-color=/gi, 'stopColor=')
    .replace(/\bstop-opacity=/gi, 'stopOpacity=')
    .replace(/\bflood-opacity=/gi, 'floodOpacity=')
    .replace(/\bcolor-interpolation-filters=/gi, 'colorInterpolationFilters=')
    .replace(/\bfont-size=/gi, 'fontSize=')
    .replace(/\bfill-opacity=/gi, 'fillOpacity=')
    .replace(/\bstroke-width=/gi, 'strokeWidth=')
    .replace(/\bstroke-linecap=/gi, 'strokeLinecap=')
    .replace(/\bstroke-linejoin=/gi, 'strokeLinejoin=')
    .replace(/\bfill-rule=/gi, 'fillRule=')
    .replace(/\bclip-path=/gi, 'clipPath=')
    .replace(/\bclip-rule=/gi, 'clipRule=')
    .replace(/\s+style="[^"]*"/gi, '');
};

const convertSvgToComponent = (svgContent, componentName) => {
  // Capitalize tags
  TAGS.forEach((tag) => {
    const capitalized = capitalizeTag(tag);
    const regex = new RegExp(`(<\\/?)${tag}\\b`, 'gi');
    svgContent = svgContent.replace(regex, `$1${capitalized}`);
  });

  svgContent = sanitizeAttributes(svgContent);

  // Remove XML headers
  svgContent = svgContent
    .replace(/<\?xml.*?\?>/g, '')
    .replace(/<!DOCTYPE.*?>/g, '');

  return `
  import React from "react";
  import Svg, { ${TAGS.map(capitalizeTag)
    .filter((t) => t !== 'Svg')
    .join(', ')} } from "react-native-svg";
  
  const ${componentName} = () => (
    ${svgContent.replace(/\r?\n/g, '\n  ')}
  );
  
  export default ${componentName};
  `.trim();
};

// Entry point
const inputFile = process.argv[2];
if (!inputFile) {
  console.error('❌ Please provide an SVG file path.');
  process.exit(1);
}

const svgPath = path.resolve(inputFile);
const componentName = path
  .basename(svgPath, '.svg')
  .replace(/(^\w)/, (m) => m.toUpperCase());
const outputPath = path.join(path.dirname(svgPath), `${componentName}.js`);

const svgContent = fs.readFileSync(svgPath, 'utf8');
const componentCode = convertSvgToComponent(svgContent, componentName);
fs.writeFileSync(outputPath, componentCode);

console.log(`✅ Converted to: ${outputPath}`);
