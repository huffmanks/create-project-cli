#!/usr/bin/env node

import { exec } from "child_process";
import yosay from "yosay";
import pkg from "enquirer";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const { Confirm, Select, Input } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const selectTemplatePrompt = new Select({
  name: "template",
  header: yosay("Welcome to the project generator!"),
  message: "Pick a template",
  choices: ["nextjs", "astrojs"],
});

const projectNamePrompt = new Input({
  name: "projectName",
  message: "Enter the project name",
  hint: "my-project",
  required: true,
  validate: (value) => {
    if (!value.trim()) {
      return "Project name is required.";
    }
    if (/\s/.test(value)) {
      return "Project name must not contain spaces.";
    }
    if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
      return "Project name must not contain special characters.";
    }
    return true;
  },
});

const siteTitlePrompt = new Input({
  name: "title",
  message: "Enter the site title",
  hint: "My website",
  required: true,
  validate: (value) => {
    if (!value.trim()) {
      return "Site title is required.";
    }
    return true;
  },
});

const siteDescriptionPrompt = new Input({
  name: "description",
  message: "Enter the site description",
  hint: "The coolest site ever.",
  required: true,
  validate: (value) => {
    if (!value.trim()) {
      return "Site description is required.";
    }
    return true;
  },
});

const installDepsPrompt = new Confirm({
  name: "installDeps",
  message: "Install dependencies?",
  initial: true,
});

async function runPrompts() {
  try {
    const template = await selectTemplatePrompt.run();
    const projectName = await projectNamePrompt.run();
    const siteTitle = await siteTitlePrompt.run();
    const siteDescription = await siteDescriptionPrompt.run();
    const installDeps = await installDepsPrompt.run();

    console.log("Template:", template);
    console.log("Project name:", projectName);
    console.log("Site title:", siteTitle);
    console.log("Site description:", siteDescription);
    console.log("Install dependencies?", installDeps);

    createProject({ template, projectName, siteTitle, siteDescription, installDeps });
  } catch (error) {
    console.error(error);
  }
}

function createProject({ template, projectName, siteTitle, siteDescription, installDeps }) {
  const templateDir = path.join(__dirname, "templates", template);
  const projectDir = path.join(__dirname, projectName);

  const filterFunc = (src, dest) => {
    const ignorePatterns = ["node_modules", "dist", ".astro", ".next", ".build"];
    return !ignorePatterns.some((pattern) => src.includes(pattern));
  };

  fs.copy(templateDir, projectDir, { filter: filterFunc })
    .then(() => {
      console.log(`Project ${projectName} created successfully!`);
      updateProjectFiles(projectDir, siteTitle, siteDescription);

      if (installDeps) {
        exec(`cd ${projectDir} && pnpm i`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error: ${error.message}`);
            return;
          }
          if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
          }
          console.log("Dependencies installed successfully.");
        });
      }
    })
    .catch((err) => console.error(err));
}

function updateProjectFiles(projectDir, siteTitle, siteDescription) {
  const siteConfigFilePath = path.join(projectDir, "src", "config", "site.ts");
  const envFilePath = path.join(projectDir, ".env.local");

  if (fs.existsSync(siteConfigFilePath)) {
    let configContent = fs.readFileSync(siteConfigFilePath, "utf-8");

    configContent = configContent
      .replace(/export const SITE_TITLE = "";/, `export const SITE_TITLE = "${siteTitle}";`)
      .replace(/export const SITE_DESCRIPTION = "";/, `export const SITE_DESCRIPTION = "${siteDescription}";`);

    fs.writeFileSync(siteConfigFilePath, configContent);
  }

  if (fs.existsSync(envFilePath)) {
    exec("openssl rand -base64 33", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }

      if (stderr) {
        console.error(`Stderr: ${stderr}`);
        return;
      }

      const secret = stdout.trim();
      const envContent = `AUTH_SECRET=${secret}`;

      fs.writeFileSync(envFilePath, envContent);
    });
  }
}

runPrompts();
