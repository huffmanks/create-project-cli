"use strict";

import { exec } from "child_process";
import yosay from "yosay";
import pkg from "enquirer";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const { Select, Form } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const selectTemplatePrompt = new Select({
  name: "template",
  header: yosay("Welcome to the project generator!"),
  message: "Pick a template",
  choices: ["nextjs", "astrojs"],
});

const projectMetaPrompt = new Form({
  name: "project",
  message: "Please provide the following information:",
  choices: [
    {
      name: "name",
      message: "Enter the project name",
      initial: "my-project",
      validate: (value) => {
        if (!value) {
          return "Project name is required.";
        }
        return /^[a-zA-Z0-9-_]+$/.test(value) ? true : "Project name must not contain special characters or spaces.";
      },
    },
    {
      name: "title",
      message: "Enter the site title",
      initial: "My website",
      validate: (value) => {
        return value ? true : "Site title is required.";
      },
    },
    {
      name: "description",
      message: "Enter the site description",
      initial: "The coolest site ever.",
      validate: (value) => {
        return value ? true : "Site description is required.";
      },
    },
  ],
});

async function runPrompts() {
  try {
    const template = await selectTemplatePrompt.run();
    const projectMeta = await projectMetaPrompt.run();

    console.log("Template:", template);
    console.log("Project name:", projectMeta.name);
    console.log("Title:", projectMeta.title);
    console.log("Description:", projectMeta.description);

    createProject({ template, projectName: projectMeta.name, title: projectMeta.title, description: projectMeta.description });
  } catch (error) {
    console.error(error);
  }
}

function createProject({ template, projectName, title, description }) {
  const templateDir = path.join(__dirname, "templates", template);
  const projectDir = path.join(__dirname, projectName);

  const filterFunc = (src, dest) => {
    const ignorePatterns = ["node_modules", "dist", ".astro", ".next", ".build"];
    return !ignorePatterns.some((pattern) => src.includes(pattern));
  };

  fs.copy(templateDir, projectDir, { filter: filterFunc })
    .then(() => {
      console.log(`Project ${projectName} created successfully!`);
      updateProjectFiles(projectDir, title, description);
    })
    .catch((err) => console.error(err));
}

function updateProjectFiles(projectDir, title, description) {
  const siteConfigFilePath = path.join(projectDir, "src", "config", "site.ts");
  const envFilePath = path.join(projectDir, ".env.local");

  if (fs.existsSync(siteConfigFilePath)) {
    const newConfigContent = `
export const SITE_TITLE = "${title}";
export const SITE_DESCRIPTION = "${description}";
`;

    fs.writeFileSync(siteConfigFilePath, newConfigContent);
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
