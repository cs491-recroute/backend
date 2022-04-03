import path from "path";
import fs from "fs-extra";

export async function readHtml(fileName: string): Promise<string> {
    const infoHtmlPath = path.join(__dirname, `../constants/mail_templates/${fileName}.html`);
    var html = await fs.readFile(infoHtmlPath, 'utf8');
    if (!html) {
        throw new Error("File cannot be read!");
    }
    return html;
} 