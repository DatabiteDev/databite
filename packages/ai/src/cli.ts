#!/usr/bin/env node
import { Command } from "commander";
import { generateConnector } from "./generator";
import chalk from "chalk";

const program = new Command();

program
  .name("databite-ai")
  .description("AI-powered connector generator for Databite")
  .version("1.0.0");

program
  .command("generate")
  .description("Generate a connector from API documentation")
  .requiredOption("-u, --url <url>", "Documentation URL")
  .requiredOption("-o, --output <path>", "Output directory path")
  .option("-n, --name <name>", "Connector name (auto-detected if not provided)")
  .option("-d, --depth <number>", "Crawl depth for documentation links", "2")
  .option("--no-actions", "Skip generating actions")
  .option("--no-syncs", "Skip generating syncs")
  .option("-a, --ai-provider <provider>", "AI provider", "openai")
  .option("-m, --model <model>", "AI model", "gpt-4o")
  .action(async (options) => {
    try {
      console.log(
        chalk.blue("🤖 Starting Databite AI Connector Generator...\n")
      );

      await generateConnector({
        url: options.url,
        outputPath: options.output,
        connectorName: options.name,
        crawlDepth: parseInt(options.depth),
        generateActions: options.actions !== false,
        generateSyncs: options.syncs !== false,
        aiProvider: options.aiProvider,
        aiModel: options.model,
      });

      console.log(chalk.green("\n✅ Connector generated successfully!"));
    } catch (error) {
      console.error(chalk.red("\n❌ Error generating connector:"), error);
      process.exit(1);
    }
  });

program.parse();
