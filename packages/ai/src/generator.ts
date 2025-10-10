import { crawlDocumentation } from './crawler';
import { analyzeDocumentation } from './analyzer';
import { generateConnectorFiles } from './file-generator';
import ora from 'ora';

export interface GeneratorOptions {
  url: string;
  outputPath: string;
  connectorName?: string;
  crawlDepth: number;
  generateActions: boolean;
  generateSyncs: boolean;
  aiProvider: 'anthropic' | 'openai' | 'google';
  aiModel?: string;
}

export async function generateConnector(options: GeneratorOptions) {
  // Step 1: Crawl documentation
  const crawlSpinner = ora('Crawling documentation...').start();
  const docs = await crawlDocumentation(options.url, options.crawlDepth);
  crawlSpinner.succeed(`Crawled ${docs.pages.length} documentation pages`);

  // Step 2: Analyze documentation with AI
  const analyzeSpinner = ora('Analyzing documentation with AI...').start();
  const analysis = await analyzeDocumentation(docs, {
    connectorName: options.connectorName,
    generateActions: options.generateActions,
    generateSyncs: options.generateSyncs,
    aiProvider: options.aiProvider,
    aiModel: options.aiModel,
  });
  analyzeSpinner.succeed('Documentation analysis complete');

  // Step 3: Generate connector files
  const generateSpinner = ora('Generating connector files...').start();
  await generateConnectorFiles(analysis, options.outputPath);
  generateSpinner.succeed(`Connector files written to ${options.outputPath}`);

  return analysis;
}