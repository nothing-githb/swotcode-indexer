import { exec, execSync, spawn } from 'child_process';
import * as vscode from 'vscode';
import { logChannel } from "./extension";

interface Entry {
    uri: string;
    lineNumber: number;
	type: vscode.FileType;
}

let value: string = "";
// Get the first workspace folder
const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

// Get the path of the workspace folder
const workspaceFolderPath = workspaceFolder?.uri.fsPath;

export class MyReferenceProvider implements vscode.TreeDataProvider<Entry> {
    // Define the `onDidChangeTreeData` event emitter.
    private _onDidChangeTreeData = new vscode.EventEmitter<Entry | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private executeCmd: string;
    private fileCmd: string;
    
    constructor(fileCommand: string, executeCommand: string) {
        this.executeCmd = executeCommand;
        this.fileCmd = fileCommand;
		vscode.commands.registerCommand(fileCommand, (resource, elem) => this.openResource(resource, elem));
	}

    private async openResource(resource: vscode.Uri, elem: Entry): Promise<void> {
        const document = await vscode.workspace.openTextDocument(resource);
        await vscode.window.showTextDocument(document, { preserveFocus: true, selection: new vscode.Range(elem.lineNumber, 0, elem.lineNumber, 0) });
    }
    
    getTreeItem(elem: Entry): vscode.TreeItem {
        return getTreeItemFromEntry(elem, this.fileCmd);
    }

    async getChildren(element?: Entry): Promise<Entry[]> {
        return runCommandAndReturnEntryList(value, this.executeCmd);
    }
      
    // Define the `refresh` method to trigger a refresh of the tree view.
    refresh(input: string): void {
        value = input;
        this._onDidChangeTreeData.fire(undefined);
    }

    regenGtags(): void {

        vscode.window.showInformationMessage("GTAGS is generating please wait.");

        logChannel(`Command: Generate GTAGS --> cd ${workspaceFolderPath} && gtags`);

        exec(`cd ${workspaceFolderPath} && gtags`, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showInformationMessage(`Error executing command: ${error}`);
                logChannel(`Error executing command: ${error}`);
                return;
            }
            vscode.window.showInformationMessage("GTAGS successfully generated.");
            logChannel(`GTAGS successfully generated.`);
          });
    }
}

export function getWordAtCursor() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const document = editor.document;
      const position = editor.selection.active;
      const range = document.getWordRangeAtPosition(position);
      if (range) {
        const word = document.getText(range);
        return word;
      }
    }
}
  
function getTreeItemFromEntry(entry: Entry, command: string): vscode.TreeItem {
    
    let treeItem = new vscode.TreeItem(vscode.Uri.file(workspaceFolderPath + '/' + entry.uri), vscode.TreeItemCollapsibleState.None);

    treeItem.command = { command: command, title: "Open File", arguments: [treeItem.resourceUri, entry], };
    treeItem.contextValue = 'file';
    treeItem.description = entry.uri.toString();

    return treeItem;
}

function runCommandAndReturnEntryList(value: string, command: string, element?: Entry): Entry[] {
    // Return the children of the root node.
    let word;

    if (value === "") {
        word = getWordAtCursor();
    }
    else {
        word = value;
    }

    let entryList: Entry[] = [];

    if (word)
    {
        logChannel(`Command: Run -> cd ${workspaceFolderPath} && ${command} ${word}`);
        
        const out = execSync(`cd ${workspaceFolderPath} && ${command} ${word}`).toString();

        const lines = out.split('\n');

        for (const line of lines) {

            let entry1: Entry;

            if (line) {
                console.log(line);

                const lineSplit = line.split(/\s+/).filter(str => str !== "");

                entry1 = {
                    uri: lineSplit[2],
                    lineNumber: Number(lineSplit[1]),
                    type: vscode.FileType.File
                };

                entryList.push(entry1);

                console.log(lineSplit); 
            }
            
        }
    }
    else
    {
        // vscode.window.showInformationMessage("There is no selected word.");
        console.log(`There is no selected word.`);
    }

    return entryList;
}
