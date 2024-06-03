import color from "picocolors";

function success({ group }) {
  const { template, projectName, siteTitle, siteDescription, installDeps } = group;

  const lines = [
    {
      label: color.reset(color.green(`Project created successfully!`)) + "\n",
    },
    {
      label: color.reset("Template:"),
      value: color.reset(color.cyan(template)) + "\n",
    },
    {
      label: color.reset("Project name:"),
      value: color.reset(color.cyan(projectName)) + "\n",
    },
    {
      label: color.reset("Site title:"),
      value: color.reset(color.cyan(siteTitle)) + "\n",
    },
    {
      label: color.reset("Site description:"),
      value: color.reset(color.cyan(siteDescription)) + "\n",
    },
    {
      label: color.reset("Install deps?"),
      value: color.reset(color.cyan(installDeps)),
    },
  ];

  return lines
    .map((line, index) => {
      if (index === 0) {
        return `${line.label}`;
      } else {
        return `${line.label} ${line.value}`;
      }
    })
    .join("");
}

function projectDirExists({ projectDir }) {
  const lines = [
    {
      label: `\n\n`,
    },
    {
      label: `${color.reset("Error: directory already exists!")}\n`,
    },
    {
      label: `${color.reset(color.red(color.underline(projectDir)))}`,
    },
  ];

  return lines.map((line) => `${line.label}`).join("");
}

export const msg = { success, projectDirExists };
