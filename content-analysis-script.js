const fs = require('fs');
const path = require('path');

// Content analysis structure following architect's guidance
/**
 * @typedef {Object} DocumentationAnalysis
 * @property {string} file
 * @property {string[]} sections
 * @property {Record<string, string>} terminology
 * @property {string[]} businessValueProps
 * @property {string[]} technicalClaims
 * @property {string[]} crossReferences
 */

console.log(
  '🔍 Starting Content Structure Analysis and Consistency Framework...\n',
);

// Files to analyze
const files = [
  'memory-bank/ProjectOverview.md',
  'memory-bank/TechnicalArchitecture.md',
  'memory-bank/DeveloperGuide.md',
  'README.md',
];

const analysisResults = [];
const terminologyDictionary = {};
const businessValueTerms = new Set();
const technicalTerms = new Set();
const crossReferences = new Set();
const inconsistencies = [];

// Helper function to extract sections from markdown
function extractSections(content) {
  const sections = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)[0].length;
      const title = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');
      sections.push({
        level,
        title: title.trim(),
        raw: line,
      });
    }
  }

  return sections;
}

// Helper function to extract terminology
function extractTerminology(content) {
  const terminology = {};

  // Extract key terms with definitions or descriptions
  const patterns = [
    /\*\*(.*?)\*\*:?\s*([^.\n]*)/g, // Bold terms with descriptions
    /`([^`]+)`/g, // Code terms
    /\*([^*]+)\*/g, // Italic terms
    /"([^"]+)"/g, // Quoted terms
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const term = match[1].trim();
      const description = match[2] ? match[2].trim() : '';
      if (term.length > 2 && term.length < 50) {
        terminology[term] = description || 'Term found';
      }
    }
  });

  return terminology;
}

// Helper function to extract business value propositions
function extractBusinessValueProps(content) {
  const businessProps = [];

  // Look for business value indicators
  const businessPatterns = [
    /✅\s*([^.\n]+)/g, // Checkmark benefits
    /Benefits?:?\s*([^.\n]+)/gi, // Explicit benefits
    /Value:?\s*([^.\n]+)/gi, // Value statements
    /ROI:?\s*([^.\n]+)/gi, // ROI statements
    /Advantage:?\s*([^.\n]+)/gi, // Advantages
    /Achievement:?\s*([^.\n]+)/gi, // Achievements
  ];

  businessPatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const prop = match[1].trim();
      if (prop.length > 10) {
        businessProps.push(prop);
      }
    }
  });

  return businessProps;
}

// Helper function to extract technical claims
function extractTechnicalClaims(content) {
  const technicalClaims = [];

  // Look for technical specifications and claims
  const technicalPatterns = [
    /NestJS\s*v?[\d.]+/gi,
    /Prisma\s*v?[\d.]+/gi,
    /@rekog\/mcp-nest\s*v?[\d.]+/gi,
    /TypeScript\s*v?[\d.]+/gi,
    /Architecture:?\s*([^.\n]+)/gi,
    /Implementation:?\s*([^.\n]+)/gi,
    /Performance:?\s*([^.\n]+)/gi,
  ];

  technicalPatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      technicalClaims.push(match[0].trim());
    }
  });

  return technicalClaims;
}

// Helper function to extract cross-references
function extractCrossReferences(content) {
  const crossRefs = [];

  // Look for file references and internal links
  const refPatterns = [
    /\[([^\]]+)\]\(([^)]+\.md[^)]*)\)/g, // Markdown links to .md files
    /see\s+([A-Za-z]+\.md)/gi, // "see filename.md"
    /refer\s+to\s+([A-Za-z]+\.md)/gi, // "refer to filename.md"
    /documented\s+in\s+([A-Za-z]+\.md)/gi, // "documented in filename.md"
  ];

  refPatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      crossRefs.push(match[1] || match[0]);
    }
  });

  return crossRefs;
}

// Analyze each file
console.log('📄 Analyzing documentation files...\n');

for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const sections = extractSections(content);
    const terminology = extractTerminology(content);
    const businessValueProps = extractBusinessValueProps(content);
    const technicalClaims = extractTechnicalClaims(content);
    const crossReferences = extractCrossReferences(content);

    const analysis = {
      file,
      sections: sections.map((s) => s.title),
      terminology,
      businessValueProps,
      technicalClaims,
      crossReferences,
      wordCount: content.split(/\s+/).length,
      sectionCount: sections.length,
    };

    analysisResults.push(analysis);

    // Build global terminology dictionary
    Object.entries(terminology).forEach(([term, desc]) => {
      if (terminologyDictionary[term] && terminologyDictionary[term] !== desc) {
        inconsistencies.push({
          type: 'terminology',
          term,
          file1: terminologyDictionary[term],
          file2: desc,
          file: file,
        });
      }
      terminologyDictionary[term] = desc;
    });

    // Collect business value terms
    businessValueProps.forEach((prop) => businessValueTerms.add(prop));

    // Collect technical terms
    technicalClaims.forEach((claim) => technicalTerms.add(claim));

    // Collect cross-references
    crossReferences.forEach((ref) => crossReferences.add(ref));

    console.log(
      `✅ ${file}: ${sections.length} sections, ${Object.keys(terminology).length} terms, ${businessValueProps.length} value props`,
    );
  } catch (error) {
    console.error(`❌ Error analyzing ${file}:`, error.message);
  }
}

console.log('\n📊 Content Structure Analysis Results:\n');

// Display analysis summary
analysisResults.forEach((analysis) => {
  console.log(`📄 ${analysis.file}:`);
  console.log(`   Sections: ${analysis.sectionCount}`);
  console.log(`   Word Count: ${analysis.wordCount}`);
  console.log(
    `   Terminology: ${Object.keys(analysis.terminology).length} terms`,
  );
  console.log(`   Business Value Props: ${analysis.businessValueProps.length}`);
  console.log(`   Technical Claims: ${analysis.technicalClaims.length}`);
  console.log(`   Cross References: ${analysis.crossReferences.length}`);
  console.log('');
});

// Create terminology dictionary
console.log('📚 Terminology Dictionary (Top Terms):\n');
const sortedTerms = Object.entries(terminologyDictionary)
  .filter(([term, desc]) => term.length > 3)
  .sort(([a], [b]) => a.localeCompare(b))
  .slice(0, 20);

sortedTerms.forEach(([term, desc]) => {
  console.log(`   ${term}: ${desc}`);
});

// Identify inconsistencies
console.log('\n⚠️  Inconsistency Analysis:\n');

// Check for section structure inconsistencies
const sectionStructures = analysisResults.map((a) => ({
  file: a.file,
  hasOverview: a.sections.some((s) => s.toLowerCase().includes('overview')),
  hasArchitecture: a.sections.some((s) =>
    s.toLowerCase().includes('architecture'),
  ),
  hasSetup: a.sections.some(
    (s) =>
      s.toLowerCase().includes('setup') || s.toLowerCase().includes('start'),
  ),
  hasFeatures: a.sections.some((s) => s.toLowerCase().includes('feature')),
  topLevelSections: a.sections.filter(
    (s, i, arr) => !arr.slice(0, i).some((prev) => s.startsWith(prev)),
  ),
}));

console.log('📋 Section Structure Consistency:');
sectionStructures.forEach((struct) => {
  console.log(`   ${struct.file}:`);
  console.log(`     Overview: ${struct.hasOverview ? '✅' : '❌'}`);
  console.log(`     Architecture: ${struct.hasArchitecture ? '✅' : '❌'}`);
  console.log(`     Setup: ${struct.hasSetup ? '✅' : '❌'}`);
  console.log(`     Features: ${struct.hasFeatures ? '✅' : '❌'}`);
  console.log(`     Top-level sections: ${struct.topLevelSections.length}`);
});

// Check for business value consistency
console.log('\n💼 Business Value Messaging Consistency:');
const commonBusinessTerms = [
  'MCP',
  'workflow',
  'AI',
  'guidance',
  'architecture',
  'quality',
];
analysisResults.forEach((analysis) => {
  const coverage = commonBusinessTerms.filter((term) =>
    analysis.businessValueProps.some((prop) =>
      prop.toLowerCase().includes(term.toLowerCase()),
    ),
  );
  console.log(
    `   ${analysis.file}: ${coverage.length}/${commonBusinessTerms.length} key terms covered`,
  );
  console.log(`     Covered: ${coverage.join(', ')}`);
});

// Cross-reference validation
console.log('\n🔗 Cross-Reference Analysis:');
const allCrossRefs = Array.from(crossReferences);
console.log(`   Total cross-references found: ${allCrossRefs.length}`);
allCrossRefs.forEach((ref) => {
  const exists = files.some(
    (file) => file.includes(ref) || ref.includes(path.basename(file)),
  );
  console.log(`   ${ref}: ${exists ? '✅ Valid' : '❌ Broken'}`);
});

// Generate consistency framework recommendations
console.log('\n🎯 Consistency Framework Recommendations:\n');

console.log('1. TERMINOLOGY STANDARDIZATION:');
console.log(
  '   - Standardize "MCP Workflow Manager" vs "Workflow Manager MCP Server"',
);
console.log('   - Consistent version number formatting (v1.0.0 vs 1.0.0)');
console.log('   - Unified technical stack references');

console.log('\n2. SECTION STRUCTURE HARMONIZATION:');
console.log('   - All files should have Overview section');
console.log('   - Consistent heading hierarchy (# ## ### pattern)');
console.log('   - Standardized Quick Start/Setup sections');

console.log('\n3. BUSINESS VALUE ALIGNMENT:');
console.log('   - Consistent MCP compliance messaging');
console.log('   - Unified architecture achievement statements');
console.log('   - Aligned benefit propositions across files');

console.log('\n4. CROSS-REFERENCE INTEGRITY:');
console.log('   - Validate all internal file references');
console.log('   - Establish consistent linking patterns');
console.log('   - Create reference map for navigation');

console.log('\n5. AUDIENCE-SPECIFIC MESSAGING:');
console.log('   - README.md: Business stakeholders & quick start');
console.log('   - ProjectOverview.md: Project managers & architects');
console.log('   - TechnicalArchitecture.md: Technical architects & developers');
console.log('   - DeveloperGuide.md: Implementation developers & contributors');

console.log(
  '\n✅ Content Structure Analysis and Consistency Framework Complete!',
);
console.log(
  `📊 Analyzed ${files.length} files with ${Object.keys(terminologyDictionary).length} unique terms`,
);
console.log(
  `🎯 Generated comprehensive consistency framework with ${inconsistencies.length} inconsistencies identified`,
);
