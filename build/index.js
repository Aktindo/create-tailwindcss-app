#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const valid_filename_1 = __importDefault(require("valid-filename"));
const listr_1 = __importDefault(require("listr"));
const execa_1 = __importDefault(require("execa"));
const inquirer_1 = __importDefault(require("inquirer"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const consola_1 = __importDefault(require("consola"));
const dependencies = ["tailwindcss", "autoprefixer"];
const logger = consola_1.default;
const tasks = new listr_1.default([
    {
        title: "Create directory structure",
        task: ({ root, type }) => {
            if (fs_extra_1.default.existsSync(root)) {
                Promise.reject(`Project directory "${root}" already exists!`);
            }
            fs_extra_1.default.mkdirSync(root);
        },
    },
    {
        title: "Create dirs and files",
        task: ({ root, type }) => {
            if (type === "HTML/CSS/JS") {
                fs_extra_1.default.copy(path_1.default.join(__dirname, "templates", "htmlcssjs"), path_1.default.join(process.cwd(), root)).catch((err) => Promise.reject(err));
            }
        },
    },
    {
        title: "Set up dependencies",
        task: () => {
            return new listr_1.default([
                {
                    title: "Install dependencies with Yarn",
                    task: async (context, task) => {
                        const root = context.root;
                        const params = ["add", "-D"];
                        process.chdir(root);
                        await execa_1.default("yarn", [...params, ...dependencies]).catch(() => {
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
                        await execa_1.default("npm", [...params, ...dependencies]);
                    },
                },
            ]);
        },
    },
    {
        title: "Generate TailwindCSS styles",
        task: () => {
            return new listr_1.default([
                {
                    title: "Use yarn",
                    task: async () => {
                        const params = ["build:css"];
                        await execa_1.default("yarn", [...params]);
                    },
                },
                {
                    title: "Use npm",
                    enabled: (context) => context.yarn === false,
                    task: async () => {
                        const params = ["run", "build:css"];
                        await execa_1.default("npm", [...params]);
                    },
                },
            ]);
        },
    },
]);
inquirer_1.default
    .prompt([
    {
        type: "input",
        name: "root",
        message: "Please name your awesome project:",
        validate: (value) => valid_filename_1.default(value.trim()) ? true : "Please enter a valid name.",
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
    logger.info(`Start by navigating into the folder - ${chalk_1.default.bold(`cd ${response.root}`)}`);
    logger.info("Happy coding :)");
});
