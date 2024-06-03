import * as p from "@clack/prompts";
import slugify from "@sindresorhus/slugify";
import color from "picocolors";
import { execa } from "execa";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { msg } from "./lib/messages.js";

const currentDir = process.cwd();

const filename = fileURLToPath(import.meta.url);
const rootDir = path.dirname(filename);

export async function main() {
  try {
    console.log("\n");
    p.intro(color.bgCyan(color.black(" cpr-cli ")));
    p.note(color.reset(color.cyan(`Welcome to CPR. Let's create a project!`)));

    const group = await p.group(
      {
        template: () =>
          p.select({
            message: color.bold(`Pick a template.`),
            maxItems: 1,
            options: [
              { value: "nextjs", label: "Nextjs" },
              { value: "astro", label: "Astro" },
            ],
          }),
        projectName: () =>
          p.text({
            initialValue: "test",
            message: color.bold(`Enter the project name.`),
            placeholder: "my-project",
            validate(value) {
              if (value.length === 0) return `Project name is required!`;

              const projectDir = path.join(currentDir, value);

              if (fs.existsSync(projectDir)) {
                p.log.error(msg.projectDirExists({ projectDir }));
                p.log.error(" ");
                process.exit(0);
              }
            },
          }),
        siteTitle: () =>
          p.text({
            initialValue: "test",
            message: color.bold(`Enter the site title.`),
            placeholder: "My website",
            validate(value) {
              if (value.length === 0) return `Site title is required!`;
            },
          }),
        siteDescription: () =>
          p.text({
            initialValue: "test",
            message: color.bold(`Enter the site description.`),
            placeholder: "The coolest site ever.",
            validate(value) {
              if (value.length === 0) return `Site description is required!`;
            },
          }),
        installDeps: () => p.confirm({ message: color.bold(`Install dependencies?`), initialValue: true }),
      },
      {
        onCancel: () => {
          process.exit(0);
        },
      }
    );

    group.projectName = slugify(group.projectName);

    createProject({ group });
  } catch (err) {
    p.log.error(`${err}\n`);
    process.exit(0);
  }
}

async function createProject({ group }) {
  const { template, projectName, siteTitle, siteDescription, installDeps } = group;
  const spinner = p.spinner();

  try {
    const projectDir = path.join(currentDir, projectName);
    const templateDir = path.join(rootDir, "templates", template);

    const filterFunc = (src, dest) => {
      const ignorePatterns = ["node_modules", "dist", ".astro", ".next", ".build"];
      return !ignorePatterns.some((pattern) => src.includes(pattern));
    };

    await fs.copy(templateDir, projectDir, { filter: filterFunc });

    updateProjectFiles({ projectDir, siteTitle, siteDescription });

    if (installDeps) {
      spinner.start("Installing dependencies");

      const installProcess = execa("pnpm", ["i"], { cwd: projectDir });
      installProcess.stdout.pipe(process.stdout);

      await installProcess;

      spinner.stop("Installed dependencies");
    }
  } catch (err) {
    p.log.error(`${err}\n`);
    process.exit(0);
  } finally {
    p.note(msg.success({ group }));
  }
}

async function updateProjectFiles({ projectDir, siteTitle, siteDescription }) {
  try {
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
      const { stdout } = await execa`openssl rand -base64 33`;

      const secret = stdout.trim();
      const envContent = `AUTH_SECRET=${secret}`;

      fs.writeFileSync(envFilePath, envContent);
    }
  } catch (err) {
    p.log.error(`${err}\n`);
    process.exit(0);
  }
}
