#!/usr/bin/env node

import fs from "fs-extra";
import validFilename from "valid-filename";
import Listr from "listr";
import execa from "execa";
import inquirer from "inquirer";
import path from "path";
import chalk from "chalk";
import consola, { Consola } from "consola";

const dependencies = ["tailwindcss", "autoprefixer"];
const logger: Consola = consola;

const tasks = new Listr([
  {
    title: "Create directory structure",
    task: ({ root, type }: { root: string; type: string }) => {
      if (fs.existsSync(root)) {
        Promise.reject(`Project directory "${root}" already exists!`);
      }

      fs.mkdirSync(root);
    },
  },
  {
    title: "Create dirs and files",
    task: ({ root, type }: { root: string; type: string }) => {
      if (type === "HTML/CSS/JS") {
        fs.copy(
          path.join(__dirname, "templates", "htmlcssjs"),
          path.join(process.cwd(), root)
        ).catch((err) => Promise.reject(err));
      }
    },
  },
  {
    title: "Set up dependencies",
    task: () => {
      return new Listr([
        {
          title: "Install dependencies with Yarn",
          task: async (context, task) => {
            const root = context.root;
            const params = ["add", "-D"];

            process.chdir(root);

            await execa("yarn", [...params, ...dependencies]).catch(() => {
              context.yarn = false;
              task.skip("Yarn not available.");
            });
          },
        },
        {
          title: "Install dependencies with npm",
          enabled: (context) => context.yarn === false,
          task: async () => {
            const params = ["install", "--save-dev"];

            await execa("npm", [...params, ...dependencies]);
          },
        },
      ]);
    },
  },
  {
    title: "Generate TailwindCSS styles",
    task: () => {
      return new Listr([
        {
          title: "Use yarn",
          task: async () => {
            const params = ["build:css"];

            await execa("yarn", [...params]);
          },
        },
        {
          title: "Use npm",
          enabled: (context) => context.yarn === false,
          task: async () => {
            const params = ["run", "build:css"];

            await execa("npm", [...params]);
          },
        },
      ]);
    },
  },
]);

inquirer
  .prompt([
    {
      type: "input",
      name: "root",
      message: "Please name your awesome project:",
      validate: (value) =>
        validFilename(value.trim()) ? true : "Please enter a valid name.",
    },
    {
      type: "list",
      name: "type",
      message: "Please select your project type:",
      choices: ["HTML/CSS/JS"],
    },
  ])
  .then(async (response) => {
    await tasks.run(response);
    logger.success(`Successfully created tailwindcss app - "${response.root}"`);
    logger.info(
      `Start by navigating into the folder - ${chalk.bold(
        `cd ${response.root}`
      )}`
    );
    logger.info("Happy coding :)");
  });
